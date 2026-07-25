import type { Discovery } from '../discovery.js';
import type { Finding } from '../types.js';
import { pythonFiles, pythonIsParsable, pythonSource, staticFinding } from './common.js';

export function servingChecks(discovery: Discovery): Finding[] {
  const findings: Finding[] = [];
  for (const file of pythonFiles(discovery)) {
    if (!pythonIsParsable(file)) continue;
    const text = pythonSource(file);
    const match = text.match(/(?:Normalize|normaliz(?:e|ation))\([^\n]+/i)?.[0];
    if (match && /\b(?:serve|inference|predict)\b/i.test(text) && /\b(?:train|fit)\b/i.test(text)) findings.push(staticFinding('train-serving-normalization', 'train-serving', 'medium', 'review-required', 'Training and serving normalization definitions require parity verification.', file, match, 'Centralize preprocessing and compare feature vectors using a declared golden input.'));
  }
  return findings;
}
