import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { installSkill } from '../../src/installer/installer.js';
import { validateSkill } from '../../src/commands/skill.js';
const packageRoot = resolve(process.cwd());
describe('CLI support services', () => {
  it('installs the canonical skill to the Kilo project target with ownership manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'expaudit-install-')); const target = await installSkill({ packageRoot, root, platform: 'kilo' });
    await stat(join(target, 'SKILL.md')); expect(JSON.parse(await readFile(join(root, '.expaudit-install.json'), 'utf8')).files).not.toHaveLength(0);
  });
  it('validates the canonical skill', async () => expect(await validateSkill(join(packageRoot, 'skill/ml-experiment-review'))).toEqual({ valid: true, errors: [] }));
});
