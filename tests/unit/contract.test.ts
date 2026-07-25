import { describe, expect, it } from 'vitest';
import { parseManifest } from '../../src/review/manifest.js';
import { missingFields } from '../../src/review/contract.js';

const manifest = (extra = '') => `---
schemaVersion: 1
id: E12
status: planned
task: image-segmentation
entrypoint: src/train.py
config: null
data: { manifest: data/manifest.json, splitPolicy: patient_disjoint, version: null, groupColumn: patient_id }
evaluation: { primaryMetric: recall, selectionPolicy: validation_recall, testPolicy: final_once }
artifacts: { metrics: null, checkpoint: null, tracker: none }
serving: null
baseline: null
reproducibility: { seed: 42, commit: null, environment: null }
runtime: { enabled: false, module: null, factory: null, sampleInput: null, dependencies: null, timeoutSeconds: null, memoryMb: null, useGpu: false }
audit: { required: [], optional: [] }
${extra}---
`;

describe('strict manifest parsing', () => {
  it('creates an evidence-carrying contract from a valid manifest', async () => {
    const result = await parseManifest(manifest(), 'experiment.md');
    const contract = result.contract;
    expect(contract.identity.value?.id).toBe('E12');
    expect(contract.evaluation.value?.primaryMetric).toBe('recall');
    expect(contract.baseline.state).toBe('missing');
    expect(missingFields(contract)).toContain('baseline');
  });

  it('rejects unsupported language-model tasks', async () => {
    const result = await parseManifest(manifest().replace('task: image-segmentation', 'task: rag'), 'experiment.md');
    expect(result.manifest).toBeUndefined();
    expect(result.errors.join(' ')).toContain('must be equal to one of the allowed values');
  });

  it('requires completed experiments to declare metrics and checkpoint artifacts', async () => {
    const result = await parseManifest(manifest().replace('status: planned', 'status: completed'), 'experiment.md');
    expect(result.manifest).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
