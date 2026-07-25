import type { Discovery } from '../discovery.js';
import { createFinding } from '../findings.js';
import type { ExperimentManifest, Finding, PathResolution } from '../types.js';

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 10_000;
export function dataQualityChecks(discovery: Discovery, manifest?: ExperimentManifest, resolutions: PathResolution[] = []): Finding[] {
  if (!manifest) return [];
  const resolved = resolutions.find((item) => item.kind === 'data-manifest');
  const file = discovery.files.find((item) => item.path === resolved?.path);
  if (!file) return [createFinding({ id: 'data-manifest-unavailable', category: 'data-quality', severity: 'info', status: 'not-executable', confidence: 'low', scope: 'data.manifest', summary: `Declared data manifest ${manifest.data.manifest} is unavailable.`, evidence: resolved?.evidence ?? [], impact: 'Data split and schema checks could not run.', recommendation: 'Provide an exact, readable repository-relative data manifest.', verification: 'Re-run after resolving the manifest path.' })];
  if (file.size > MAX_BYTES || !file.text) return [createFinding({ id: 'data-manifest-bounded', category: 'data-quality', severity: 'info', status: 'not-executable', confidence: 'low', scope: 'data.manifest', summary: `Data manifest exceeds the ${MAX_BYTES} byte read-only limit.`, evidence: resolved?.evidence ?? [], impact: 'Data quality is not treated as clean.', recommendation: 'Provide a bounded manifest or explicit summary artifact.', verification: 'Re-run with a small manifest.' })];
  if (!/\.csv$/i.test(file.path)) return [];
  const rows = file.text.split('\n').filter(Boolean).slice(0, MAX_ROWS);
  if (rows.length < 2) return [];
  const seen = new Set<string>();
  const duplicate = rows.slice(1).find((row) => seen.has(row) || !seen.add(row));
  if (!duplicate) return [];
  return [createFinding({ id: 'data-duplicate-rows', category: 'data-quality', severity: 'high', status: 'confirmed', confidence: 'high', scope: 'data.manifest', summary: `Duplicate CSV row found within the first ${MAX_ROWS} rows.`, evidence: [{ kind: 'file', path: file.path, hash: file.hash, excerpt: duplicate.slice(0, 240) }], impact: 'Duplicate records can leak across partitions or bias metrics.', recommendation: 'Deduplicate before splitting and verify partition overlap.', verification: 'Re-run the bounded data summary.' })];
}
