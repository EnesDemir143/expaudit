import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverRepository } from '../../src/review/discovery.js';
import { runStaticChecks } from '../../src/review/checks.js';

async function fixture(source: string) {
  const root = await mkdtemp(join(tmpdir(), 'expaudit-check-'));
  await mkdir(join(root, '.git'));
  await writeFile(join(root, 'train.py'), source);
  return runStaticChecks(await discoverRepository(root));
}

describe('static checks', () => {
  it('confirms scaler fit before splitting', async () => {
    const findings = await fixture('scaler = StandardScaler()\nscaler.fit(X)\nX_train, X_test = train_test_split(X)');
    expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'split-scaler-before-split', severity: 'critical', status: 'confirmed' })]));
  });

  it('reports BCE sigmoid misuse without claiming certainty', async () => {
    const findings = await fixture('criterion = BCEWithLogitsLoss()\nloss = criterion(torch.sigmoid(logits), labels)');
    expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'loss-bce-sigmoid', status: 'high-confidence' })]));
  });

  it('keeps a clean fixture free of critical findings', async () => {
    const findings = await fixture('X_train, X_test = train_test_split(X)\nscaler = StandardScaler()\nscaler.fit(X_train)\ncriterion = BCEWithLogitsLoss()\nloss = criterion(logits, labels)');
    expect(findings.filter((finding) => finding.severity === 'critical')).toEqual([]);
  });
});
