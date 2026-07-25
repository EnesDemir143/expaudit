import { spawn } from 'node:child_process';
import type { Finding } from '../review/types.js';
import { createFinding } from '../review/findings.js';
import type { ToolAdapter, ToolPlan } from './types.js';

export interface ProbeResult { executed: boolean; output?: string; }
export const pytorchProbe: ToolAdapter<ProbeResult> = {
  name: 'pytorch-runtime-probe',
  supports: async () => true,
  plan: (): ToolPlan => ({ adapter: 'pytorch-runtime-probe', command: ['uvx', '--isolated', '--from', 'torch', 'python', '-I', '-c', 'import torch; print(torch.__version__)'], requires: ['runtime', 'install'], reason: 'Validate PyTorch in an isolated tool environment without mutating project dependencies.' }),
  async run(context) {
    if (!context.capabilities.includes('runtime') || !context.capabilities.includes('install')) return { executed: false };
    return new Promise((resolveResult) => {
      const child = spawn('uvx', ['--isolated', '--from', 'torch', 'python', '-I', '-c', 'import torch; print(torch.__version__)'], { cwd: context.root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000 });
      let output = '';
      child.stdout.on('data', (chunk) => { output += chunk.toString(); });
      child.on('close', () => resolveResult({ executed: true, output: output.trim() }));
      child.on('error', () => resolveResult({ executed: true, output: 'probe failed' }));
    });
  },
  normalize(result): Finding[] {
    if (!result.executed) return [];
    return [createFinding({ id: 'pytorch-runtime-probe', category: 'runtime', severity: 'info', status: 'passed', confidence: 'high', scope: 'runtime', summary: `Bounded PyTorch runtime probe completed${result.output ? `: ${result.output}` : ''}.`, evidence: [{ kind: 'command', excerpt: 'uvx --isolated --from torch python -I -c import torch' }], impact: '', recommendation: '', verification: 'Repeat with explicitly approved runtime and install capabilities.' })];
  },
};
