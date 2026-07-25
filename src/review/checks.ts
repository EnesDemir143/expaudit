import type { Discovery } from './discovery.js';
import type { ExperimentManifest, Finding, PathResolution } from './types.js';
import { dataQualityChecks } from './static/data-quality.js';
import { dependencyChecks } from './static/dependencies.js';
import { evaluationChecks } from './static/evaluation.js';
import { leakageChecks } from './static/leakage.js';
import { servingChecks } from './static/serving.js';
import { tensorChecks } from './static/tensor.js';
import { trainingChecks } from './static/training.js';

export function runStaticChecks(discovery: Discovery, manifest?: ExperimentManifest, resolutions: PathResolution[] = []): Finding[] {
  return [...dataQualityChecks(discovery, manifest, resolutions), ...leakageChecks(discovery), ...trainingChecks(discovery), ...tensorChecks(discovery), ...evaluationChecks(discovery), ...servingChecks(discovery), ...dependencyChecks(discovery, manifest)];
}
