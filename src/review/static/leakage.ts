import type { Discovery, DiscoveredFile } from '../discovery.js';
import type { Finding } from '../types.js';
import { pythonFiles, pythonIsParsable, pythonSource, staticFinding } from './common.js';

export function leakageChecks(discovery: Discovery): Finding[] {
  const findings: Finding[] = [];
  for (const file of pythonFiles(discovery)) {
    if (!pythonIsParsable(file)) continue;
    const text = pythonSource(file);
    const scaler = text.match(/(?:StandardScaler|MinMaxScaler|RobustScaler|OneHotEncoder)\s*\([^\n]*\)[\s\S]{0,180}\.fit(?:_transform)?\s*\(/)?.[0];
    const split = text.search(/\b(?:train_test_split|GroupKFold|StratifiedKFold)\s*\(/);
    if (scaler && split >= 0 && text.indexOf(scaler) < split) findings.push(staticFinding('split-scaler-before-split', 'data-leakage', 'critical', 'confirmed', 'A preprocessing transformer is fit before the declared split operation.', file, scaler, 'Split first, then fit preprocessing only on training data.'));
    const threshold = text.match(/(?:best_)?threshold\s*=\s*[^\n]*\btest\b/i)?.[0];
    if (threshold) findings.push(staticFinding('evaluation-test-threshold-reuse', 'evaluation', 'critical', 'confirmed', 'Test data appears to be used for threshold selection.', file, threshold, 'Select thresholds using validation data and use the test set once.'));
    const intersection = text.match(/set\([^\n]*(?:train|val)[^\n]*\)\s*&\s*set\([^\n]*test[^\n]*\)/i)?.[0];
    if (intersection) findings.push(staticFinding('data-group-overlap', 'data-leakage', 'critical', 'confirmed', 'A group identifier intersection between partitions is computed.', file, intersection, 'Require the intersection to be empty and fail the run otherwise.'));
  }
  return findings;
}
