import type { ToolAdapter, ToolPlan } from './types.js';
import { field } from '../review/contract.js';

function adapter(name: string, path: string, tracker: 'mlflow' | 'wandb' | 'dvc'): ToolAdapter {
  return {
    name,
    async supports(context) { return context.discovery.files.some((file) => file.path === path || file.path.startsWith(`${path}/`)); },
    plan: (): ToolPlan => ({ adapter: name, requires: [], reason: `Read metadata from ${path}; no write operation is permitted.` }),
    async run(context) {
      const files = context.discovery.files.filter((file) => file.path === path || file.path.startsWith(`${path}/`));
      if (!files.length) return { adapter: name, requested: ['tracker'], completed: [], unavailable: ['tracker'], findings: [], evidence: [], reason: `${path} was not found locally.` };
      const evidence = files.slice(0, 5).map((file) => ({ kind: 'artifact' as const, path: file.path, hash: file.hash, excerpt: `local ${tracker} metadata` }));
      return { adapter: name, requested: ['tracker'], completed: ['tracker'], unavailable: [], findings: [], observed: { implementation: field({ checkpoint: undefined }, 'local-tracker', 'high', evidence, 'observed') }, evidence };
    },
  };
}
export const trackingAdapters = [adapter('mlflow-read-only', 'mlruns', 'mlflow'), adapter('dvc-read-only', '.dvc', 'dvc'), adapter('wandb-read-only', 'wandb', 'wandb')];
