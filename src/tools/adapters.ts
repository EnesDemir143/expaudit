import { spawn } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { createFinding } from '../review/findings.js';
import type { AdapterResult, Finding } from '../review/types.js';
import type { ToolAdapter, ToolContext, ToolPlan } from './types.js';

interface CommandSpec { name: string; binary: string; args: string[]; }
const specs: CommandSpec[] = [
  { name: 'ruff', binary: 'ruff', args: ['check', '--output-format=json', '.'] },
  { name: 'pyright', binary: 'pyright', args: ['--outputjson'] },
  { name: 'semgrep', binary: 'semgrep', args: ['--json', '--config=auto', '.'] },
  { name: 'dependency-advisories', binary: 'pip-audit', args: ['--format=json'] },
];

function commandFinding(spec: CommandSpec, code: number | null, output: string): Finding | undefined {
  if (code === 0) return undefined;
  return createFinding({ id: `${spec.name}-reported`, category: spec.name, severity: 'medium', status: 'review-required', confidence: 'medium', scope: 'optional-adapter', summary: `${spec.name} reported findings or exited unsuccessfully.`, evidence: [{ kind: 'command', excerpt: `${spec.binary} ${spec.args.join(' ')}\n${output.slice(0, 512)}` }], impact: 'Review the native tool output before treating this as a confirmed experiment defect.', recommendation: `Run ${spec.name} locally and address its reported items.`, verification: `Inspect the normalized ${spec.name} command evidence.` });
}

function adapter(spec: CommandSpec): ToolAdapter {
  return {
    name: spec.name,
    supports: () => spawnSync(spec.binary, ['--version'], { stdio: 'ignore' }).status === 0,
    plan: (): ToolPlan => ({ adapter: spec.name, command: [spec.binary, ...spec.args], requires: spec.name === 'dependency-advisories' ? ['network'] : [], reason: 'Run an already-installed optional analysis tool without modifying the project.' }),
    run: (context: ToolContext) => new Promise<AdapterResult>((resolve) => {
      const child = spawn(spec.binary, spec.args, { cwd: context.root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 });
      let output = '';
      const collect = (chunk: Buffer) => { if (output.length < 8192) output += chunk.toString(); };
      child.stdout.on('data', collect); child.stderr.on('data', collect);
      child.on('close', (code) => resolve({ adapter: spec.name, requested: [spec.name], completed: [spec.name], unavailable: [], findings: commandFinding(spec, code, output) ? [commandFinding(spec, code, output)!] : [], evidence: [{ kind: 'command', excerpt: `${spec.binary} ${spec.args.join(' ')}` }] }));
      child.on('error', () => resolve({ adapter: spec.name, requested: [spec.name], completed: [], unavailable: [spec.name], findings: [], evidence: [], reason: `${spec.binary} could not be started.` }));
    }),
  };
}

export const optionalAdapters = specs.map(adapter);
export function selectedAdapters(context: ToolContext): ToolAdapter[] {
  const selected = new Set([...context.manifest.audit.required, ...context.manifest.audit.optional]);
  return optionalAdapters.filter((item) => selected.has(item.name));
}
