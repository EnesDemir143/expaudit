import { describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());

describe('marketplace discovery readiness', () => {
  it('ships a standard, discoverable Agent Skill package', async () => {
    const skill = await readFile(resolve(root, 'skill/ml-experiment-review/SKILL.md'), 'utf8');
    const readme = await readFile(resolve(root, 'README.md'), 'utf8');
    expect(skill).toMatch(/^---\nname: ml-experiment-review\ndescription: .+\n---/);
    for (const platform of ['claude', 'opencode', 'antigravity', 'kilo', 'generic']) expect(readme).toContain(`--platform ${platform}`);
    await access(resolve(root, 'README.md'));
    await access(resolve(root, 'LICENSE'));
  });
});
