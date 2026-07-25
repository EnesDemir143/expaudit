import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
export function experimentTemplate(id: string, type = 'generic'): string { return `---\nid: ${id}\ntype: ${type}\nstatus: planned\n---\n\n# Hypothesis\n\n# Baseline\n\n# Intended Change\n\n# Data\n- Split policy:\n- Data version:\n\n# Evaluation\n- Primary metric:\n- Selection policy:\n- Final test policy:\n\n# Reproducibility\n- Seed:\n- Entrypoint:\n- Config:\n`; }
export async function initExperiment(path: string, id: string, type: string, force = false): Promise<void> {
  const target = resolve(path);
  try { await stat(target); if (!force) throw new Error(`Refusing to overwrite ${target}; use --force for an intentional replacement.`); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, experimentTemplate(id, type), 'utf8');
}
