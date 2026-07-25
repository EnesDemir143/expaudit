import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { Finding } from '../review/types.js';
import type { ToolAdapter, ToolPlan } from './types.js';

function adapter(name: string, path: string): ToolAdapter<{ present: boolean }> {
  return {
    name,
    async supports(context) { try { await access(join(context.root, path)); return true; } catch { return false; } },
    plan: (): ToolPlan => ({ adapter: name, requires: [], reason: `Read metadata from ${path}; no write operation is permitted.` }),
    async run(context) { return { present: await this.supports(context) }; },
    normalize(): Finding[] { return []; },
  };
}
export const trackingAdapters = [adapter('mlflow-read-only', 'mlruns'), adapter('dvc-read-only', '.dvc'), adapter('wandb-read-only', 'wandb')];
