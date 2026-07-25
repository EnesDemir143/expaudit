import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
export async function validateSkill(skillRoot: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  try {
    const content = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    if (!content.startsWith('---\n')) errors.push('SKILL.md lacks YAML frontmatter.');
    if (!/name:\s*ml-experiment-review/.test(content)) errors.push('Skill name must be ml-experiment-review.');
    if (content.split('\n').length > 500) errors.push('SKILL.md exceeds 500 lines.');
    if (content.trim().split(/\s+/).length > 5000) errors.push('SKILL.md exceeds 5000 words.');
    for (const reference of ['workflow.md', 'manifest.md', 'evidence-policy.md', 'adapters.md', 'environment-isolation.md']) await stat(join(skillRoot, 'references', reference));
    await stat(join(skillRoot, 'schemas', 'experiment-manifest.schema.json'));
  } catch (error: unknown) { errors.push((error as Error).message); }
  return { valid: errors.length === 0, errors };
}
