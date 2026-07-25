import type { Discovery } from '../discovery.js';
import type { Finding } from '../types.js';
import { createFinding } from '../findings.js';
import type { ExperimentManifest } from '../types.js';

export function dependencyChecks(discovery: Discovery, manifest?: ExperimentManifest): Finding[] {
  if (!manifest?.reproducibility.environment) return [];
  const environment = discovery.files.find((file) => file.path === manifest.reproducibility.environment);
  if (environment) return [];
  return [createFinding({ id: 'environment-lock-unavailable', category: 'dependencies', severity: 'medium', status: 'not-executable', confidence: 'low', scope: 'reproducibility.environment', summary: `Declared environment or lock file ${manifest.reproducibility.environment} is unavailable.`, evidence: [], impact: 'Framework and dependency versions cannot be verified.', recommendation: 'Commit a repository-relative lock or environment file.', verification: 'Re-run once the declared file is present.' })];
}
