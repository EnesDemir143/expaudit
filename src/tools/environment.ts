import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export type EnvironmentManager = 'uv' | 'micromamba' | 'mamba' | 'conda' | 'venv';
export interface IsolatedEnvironment { manager: EnvironmentManager; cachePath: string; command: string[]; }
const executable = (name: string) => spawnSync(name, ['--version'], { stdio: 'ignore' }).status === 0;

export function selectEnvironmentManager(): EnvironmentManager {
  for (const manager of ['uv', 'micromamba', 'mamba', 'conda'] as const) if (executable(manager)) return manager;
  return 'venv';
}

export async function prepareIsolatedEnvironment(input: { pythonVersion: string; dependencies: string | null; requirements: string[] }): Promise<IsolatedEnvironment> {
  const manager = selectEnvironmentManager();
  const key = createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16);
  const cachePath = join(homedir(), '.cache', 'expaudit', 'environments', key);
  await mkdir(cachePath, { recursive: true });
  await writeFile(join(cachePath, 'metadata.json'), `${JSON.stringify({ ...input, manager }, null, 2)}\n`, 'utf8');
  if (manager === 'uv') return { manager, cachePath, command: ['uv', 'run', '--isolated', '--no-project'] };
  if (manager === 'venv') return { manager, cachePath, command: ['python', '-m', 'venv', cachePath] };
  return { manager, cachePath, command: [manager, 'run', '--prefix', cachePath] };
}
