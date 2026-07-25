import { parse as parseToml } from '@iarna/toml';
import { parse as parseYaml } from 'yaml';
import { lineEvidence, type DiscoveredFile, type Discovery } from './discovery.js';
import { field } from './contract.js';
import { createFinding } from './findings.js';
import type { EvidenceRef, ExperimentContract, ExperimentManifest, Finding, ObservedExperiment, PathResolution } from './types.js';

const byPath = (discovery: Discovery, path?: string) => path ? discovery.files.find((file) => file.path === path) : undefined;
const object = (text: string, extension: string): Record<string, unknown> | undefined => {
  try {
    const parsed = extension === '.json' ? JSON.parse(text) : extension === '.toml' ? parseToml(text) : parseYaml(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
  } catch { return undefined; }
};
const valueAt = (value: Record<string, unknown>, keys: string[]) => keys.reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, value);
const scalar = (value: unknown): string | number | undefined => typeof value === 'string' || typeof value === 'number' ? value : undefined;

function unavailable(id: string, summary: string, evidence: EvidenceRef[] = []): Finding {
  return createFinding({ id, category: 'observed', severity: 'info', status: 'not-executable', confidence: 'low', scope: 'manifest-scope', summary, evidence, impact: 'The declared value cannot be verified.', recommendation: 'Provide an exact repository-relative path or select an applicable adapter.', verification: 'Re-run after resolving the declared path.' });
}

function metricsObserved(file: DiscoveredFile): { metric?: string; evidence: EvidenceRef[] } {
  const parsed = object(file.text ?? '', '.json');
  if (!parsed) return { evidence: [lineEvidence(file, file.text?.slice(0, 120) ?? '')] };
  const metric = Object.entries(parsed).find(([, value]) => typeof value === 'number')?.[0];
  return { metric, evidence: [lineEvidence(file, metric ?? file.text?.slice(0, 120) ?? '', 'artifact')] };
}

export function extractObserved(discovery: Discovery, manifest: ExperimentManifest, resolutions: PathResolution[]): ObservedExperiment {
  const findings: Finding[] = [];
  const evidence: EvidenceRef[] = [];
  const resolution = (kind: PathResolution['kind']) => resolutions.find((item) => item.kind === kind);
  const configResolution = resolution('config');
  const configFile = byPath(discovery, configResolution?.path);
  let config: Record<string, unknown> | undefined;
  if (manifest.config) {
    if (!configFile) findings.push(unavailable('config-unavailable', `Declared config ${manifest.config} is unavailable.`, configResolution?.evidence));
    else {
      config = object(configFile.text ?? '', configFile.path.slice(configFile.path.lastIndexOf('.')));
      evidence.push(...configResolution!.evidence);
      if (!config) findings.push(unavailable('config-unreadable', `Declared config ${configFile.path} could not be parsed as YAML, JSON, or TOML.`, configResolution!.evidence));
    }
  }
  const metricResolution = resolution('metrics');
  const metricFile = byPath(discovery, metricResolution?.path);
  let metric: string | undefined;
  if (manifest.artifacts.metrics) {
    if (!metricFile) findings.push(unavailable('artifact-metrics-unavailable', `Declared metrics artifact ${manifest.artifacts.metrics} is unavailable.`, metricResolution?.evidence));
    else { const extracted = metricsObserved(metricFile); metric = extracted.metric; evidence.push(...extracted.evidence); }
  }
  for (const item of resolutions.filter((candidate) => candidate.state === 'ambiguous')) findings.push(unavailable('path-resolution-ambiguous', `Declared ${item.kind} path ${item.declared} has multiple equally likely candidates.`, item.evidence));
  const observed: Partial<ExperimentContract> = {};
  if (configFile) observed.implementation = field({ entrypoint: manifest.entrypoint, config: configFile.path, checkpoint: manifest.artifacts.checkpoint ?? undefined }, 'run-artifact', configResolution?.state === 'inferred' ? 'medium' : 'high', configResolution?.evidence ?? [], configResolution?.state === 'inferred' ? 'inferred' : 'observed');
  if (config) {
    const primaryMetric = scalar(valueAt(config, ['evaluation', 'primaryMetric'])) ?? scalar(valueAt(config, ['primary_metric'])) ?? metric;
    const seed = scalar(valueAt(config, ['seed'])) ?? scalar(valueAt(config, ['reproducibility', 'seed']));
    if (primaryMetric !== undefined) observed.evaluation = field({ primaryMetric: String(primaryMetric) }, 'run-artifact', 'high', configResolution?.evidence ?? [], 'observed');
    if (seed !== undefined) observed.reproducibility = field({ seed }, 'run-artifact', 'high', configResolution?.evidence ?? [], 'observed');
  }
  if (metric && !observed.evaluation) observed.evaluation = field({ primaryMetric: metric }, 'run-artifact', 'medium', metricResolution?.evidence ?? [], 'observed');
  return { contract: observed, findings, evidence };
}
