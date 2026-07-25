import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { installSkill } from '../../src/installer/installer.js';
import { validateSkill } from '../../src/commands/skill.js';
const packageRoot = resolve(process.cwd());
const execFileAsync = promisify(execFile);
describe('CLI support services', () => {
  it('installs the canonical skill to the Kilo project target with ownership manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'expaudit-install-')); const target = await installSkill({ packageRoot, root, platform: 'kilo' });
    await stat(join(target, 'SKILL.md')); await stat(join(target, 'runtime', 'agent-runner.js')); await stat(join(target, 'schemas', 'experiment-manifest.schema.json')); expect(JSON.parse(await readFile(join(root, '.expaudit-install.json'), 'utf8')).files).not.toHaveLength(0);
  });
  it('validates the canonical skill', async () => expect(await validateSkill(join(packageRoot, 'skill/ml-experiment-review'))).toEqual({ valid: true, errors: [] }));
  it('reports the installed package version', async () => {
    const { stdout } = await execFileAsync(process.execPath, ['--import', 'tsx', 'src/cli.ts', '--version'], { cwd: packageRoot });
    expect(stdout.trim()).toBe(JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')).version);
  });
});
