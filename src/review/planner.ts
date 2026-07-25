import type { Finding, ReviewScope } from './types.js';
import { statusFinding } from './findings.js';

export function planChecks(scope: ReviewScope, required: string[]): { required: string[]; unavailable: Finding[] } {
  const unavailable: Finding[] = [];
  if (scope.stage === 'pre_run') {
    unavailable.push(statusFinding('results-statistics', 'results-statistics', 'not-applicable', 'Result statistics are not applicable before a run.'));
  }
  if (scope.stage === 'repository_health') {
    unavailable.push(statusFinding('contract-intent', 'contract', 'not-applicable', 'No explicit experiment intent was supplied; repository findings remain inferred.'));
  }
  return { required, unavailable };
}
