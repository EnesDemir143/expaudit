import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeReview } from '../../src/review/engine.js';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'expaudit-engine-'));
  await writeFile(join(root, 'experiment.md'), `---
schemaVersion: 1
id: E12
status: completed
task: image-segmentation
entrypoint: train.py
config: config.yaml
data: { manifest: data.json, splitPolicy: patient_disjoint, version: v1, groupColumn: patient_id }
evaluation: { primaryMetric: recall, selectionPolicy: validation_recall, testPolicy: final_once }
artifacts: { metrics: metrics.json, checkpoint: best.pt, tracker: none }
serving: null
baseline: null
reproducibility: { seed: 42, commit: abc1234, environment: requirements.lock }
runtime: { enabled: false, module: null, factory: null, sampleInput: null, dependencies: null, timeoutSeconds: null, memoryMb: null, useGpu: false }
audit: { required: [], optional: [] }
---
`);
  await writeFile(join(root, 'train.py'), 'criterion = BCEWithLogitsLoss()\nloss = criterion(logits, labels)');
  await writeFile(join(root, 'config.yaml'), 'evaluation:\n  primaryMetric: recall\nseed: 42\n');
  await writeFile(join(root, 'data.json'), '{"split": "patient_disjoint"}');
  await writeFile(join(root, 'metrics.json'), '{"recall": 0.9}');
  await writeFile(join(root, 'best.pt'), 'metadata only');
  await writeFile(join(root, 'requirements.lock'), 'torch==2.0');
  return root;
}

describe('review execution', () => {
  it('writes a report and evidence only when explicitly requested', async () => {
    const root = await setup();
    const result = await executeReview({ paths: ['experiment.md'], target: 'review_md', write: true }, root);
    expect(result.outputPath).toBe(join(root, 'experiment.review.md'));
    expect(await readFile(result.outputPath!, 'utf8')).toContain('<!-- expaudit:generated:start -->');
    expect(result.report.evidencePath).toContain('/.expaudit/evidence/E12/');
  });

  it('returns a blocked report for an invalid manifest without writing files', async () => {
    const root = await setup();
    await writeFile(join(root, 'experiment.md'), '---\nid: E12\n---\n');
    const result = await executeReview({ paths: ['experiment.md'] }, root);
    expect(result.outputPath).toBeUndefined();
    expect(result.report.evidencePath).toBeUndefined();
    expect(result.output).toContain('manifest-invalid');
    expect(result.report.verdict.value).toBe('blocked-insufficient-evidence');
  });

  it('preserves user content outside generated blocks', async () => {
    const root = await setup();
    const result = await executeReview({ paths: ['experiment.md'], target: 'review_md', write: true }, root);
    await writeFile(result.outputPath!, `${await readFile(result.outputPath!, 'utf8')}\nUser-owned notes\n`);
    await executeReview({ paths: ['experiment.md'], target: 'review_md', write: true }, root);
    expect(await readFile(result.outputPath!, 'utf8')).toContain('User-owned notes');
  });

  it('blocks comparison attribution when parity differs', async () => {
    const root = await setup();
    await mkdir(join(root, 'E13'));
    await writeFile(join(root, 'E13', 'experiment.md'), (await readFile(join(root, 'experiment.md'), 'utf8')).replace('data.json', 'other-data.json').replace('id: E12', 'id: E13'));
    const result = await executeReview({ paths: ['experiment.md', 'E13/experiment.md'], target: 'comparison_md', write: true }, root);
    expect(result.output).toContain('blocked-insufficient-evidence');
    expect(result.outputPath).toContain('.comparison.md');
  });
});
