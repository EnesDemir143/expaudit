import { spawn } from 'node:child_process';
import type { ToolAdapter, ToolPlan } from './types.js';

export const pytorchProbe: ToolAdapter = {
  name: 'pytorch-runtime-probe',
  supports: async (context) => context.manifest.runtime.enabled,
  plan: (context): ToolPlan => ({ adapter: 'pytorch-runtime-probe', command: ['uv', 'run', '--isolated', '--no-project'], requires: context.manifest.runtime.useGpu ? ['runtime', 'install', 'gpu'] : ['runtime', 'install'], reason: 'Run the manifest-allowlisted factory in an isolated external environment; this is user-authorized execution, not a security sandbox.' }),
  async run(context) {
    const runtime = context.manifest.runtime;
    const plan = this.plan(context);
    const missing = plan.requires.filter((capability) => !context.capabilities.includes(capability));
    if (missing.length) return { adapter: this.name, requested: ['runtime'], completed: [], unavailable: ['runtime'], findings: [], evidence: [], reason: `Explicit capability required: ${missing.join(', ')}.` };
    const source = context.discovery.files.find((file) => file.path === runtime.sampleInput);
    if (!runtime.module || !runtime.factory || !source) return { adapter: this.name, requested: ['runtime'], completed: [], unavailable: ['runtime'], findings: [], evidence: source ? [{ kind: 'file', path: source.path, hash: source.hash }] : [], reason: 'Runtime manifest is missing an allowlisted module, factory, or sample input.' };
    const timeout = Math.min((runtime.timeoutSeconds ?? 30) * 1000, 300_000);
    return new Promise((resolveResult) => {
      const script = `import importlib, json\nm=importlib.import_module(${JSON.stringify(runtime.module)})\nf=getattr(m, ${JSON.stringify(runtime.factory)})\nx=json.load(open(${JSON.stringify(source.absolutePath)}))\ny=f(x)\nprint(json.dumps({'type': type(y).__name__, 'shape': list(getattr(y, 'shape', [])), 'dtype': str(getattr(y, 'dtype', ''))}))`;
      const child = spawn('uv', ['run', '--isolated', '--no-project', ...(runtime.dependencies ? ['--with-requirements', runtime.dependencies] : []), 'python', '-I', '-c', script], { cwd: context.root, stdio: ['ignore', 'pipe', 'pipe'], timeout, env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', CUDA_VISIBLE_DEVICES: runtime.useGpu ? (process.env.CUDA_VISIBLE_DEVICES ?? '') : '' } });
      let output = '';
      child.stdout.on('data', (chunk) => { if (output.length < 8192) output += chunk.toString(); });
      child.on('close', (code) => resolveResult({ adapter: 'pytorch-runtime-probe', requested: ['runtime'], completed: code === 0 ? ['runtime'] : [], unavailable: code === 0 ? [] : ['runtime'], findings: [], evidence: [{ kind: 'command', excerpt: `uv run --isolated --no-project python -I; output: ${output.trim().slice(0, 512)}` }], reason: code === 0 ? undefined : `Runtime probe exited with code ${code}.` }));
      child.on('error', () => resolveResult({ adapter: 'pytorch-runtime-probe', requested: ['runtime'], completed: [], unavailable: ['runtime'], findings: [], evidence: [], reason: 'uv is unavailable for the isolated runtime probe.' }));
    });
  },
};
