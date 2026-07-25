import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeReview } from '../../src/review/engine.js';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'expaudit-engine-'));
  await writeFile(join(root, 'E12.md'), '---\nid: E12\nhypothesis: improve recall\n---\n# Experiment');
  await writeFile(join(root, 'train.py'), 'criterion = BCEWithLogitsLoss()\nloss = criterion(logits, labels)');
  return root;
}

describe('review execution', () => {
  it('writes a sibling review and evidence for an experiment Markdown', async () => {
    const root = await setup();
    const result = await executeReview({ paths: ['E12.md'] }, root);
    expect(result.outputPath).toBe(join(root, 'E12.review.md'));
    expect(await readFile(result.outputPath!, 'utf8')).toContain('<!-- expaudit:generated:start -->');
    expect(result.report.evidencePath).toContain('/.expaudit/evidence/E12/');
  });

  it('does not write files for chat-only review', async () => {
    const root = await setup();
    const result = await executeReview({ prompt: 'YOLO with SegFormer improved recall', paths: [] }, root);
    expect(result.outputPath).toBeUndefined();
    expect(result.report.evidencePath).toBeUndefined();
    expect(result.output).toContain('target=chat');
    expect(result.output).toContain('inferred (chat-declared); confidence: medium');
  });

  it('preserves user content outside generated blocks', async () => {
    const root = await setup();
    const result = await executeReview({ paths: ['E12.md'] }, root);
    await writeFile(result.outputPath!, `${await readFile(result.outputPath!, 'utf8')}\nUser-owned notes\n`);
    await executeReview({ paths: ['E12.md'] }, root);
    expect(await readFile(result.outputPath!, 'utf8')).toContain('User-owned notes');
  });

  it('blocks comparison attribution when parity differs', async () => {
    const root = await setup();
    await writeFile(join(root, 'E13.md'), '---\nid: E13\ndataVersion: v2\n---\n# Experiment');
    const result = await executeReview({ paths: ['E12.md', 'E13.md'], write: true }, root);
    expect(result.output).toContain('blocked-insufficient-evidence');
    expect(result.outputPath).toContain('.comparison.md');
  });
});
