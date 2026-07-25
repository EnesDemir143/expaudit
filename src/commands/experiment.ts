import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const tasks = new Set(['tabular-classification', 'tabular-regression', 'image-classification', 'object-detection', 'image-segmentation', 'time-series', 'other-python-ml']);
export function experimentTemplate(id: string, task: string): string {
  if (!tasks.has(task)) throw new Error(`Unsupported Python ML task: ${task}.`);
  return `---
schemaVersion: 1
id: ${id}
status: planned
task: ${task}
entrypoint: src/train.py
config: null
data:
  manifest: data/manifest.json
  splitPolicy: explicit_train_validation_test
  version: null
  groupColumn: null
evaluation:
  primaryMetric: accuracy
  selectionPolicy: validation_accuracy
  testPolicy: final_once
artifacts:
  metrics: null
  checkpoint: null
  tracker: none
serving: null
baseline: null
reproducibility:
  seed: null
  commit: null
  environment: null
runtime:
  enabled: false
  module: null
  factory: null
  sampleInput: null
  dependencies: null
  timeoutSeconds: null
  memoryMb: null
  useGpu: false
audit:
  required: []
  optional: [ruff, pyright, semgrep, dependency-advisories]
---

# Experiment Notes

Record the scientific rationale here. This body is descriptive only; ExpAudit verifies the versioned YAML manifest above.
`; }
export async function initExperiment(directory: string, id: string, task: string, force = false): Promise<void> {
  const target = resolve(directory, 'experiment.md');
  try { await stat(target); if (!force) throw new Error(`Refusing to overwrite ${target}; use --force for an intentional replacement.`); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  await mkdir(dirname(target), { recursive: true }); await writeFile(target, experimentTemplate(id, task), 'utf8');
}
