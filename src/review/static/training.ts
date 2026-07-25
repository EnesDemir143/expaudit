import type { Discovery } from '../discovery.js';
import type { Finding } from '../types.js';
import { pythonFiles, pythonIsParsable, pythonSource, staticFinding } from './common.js';

export function trainingChecks(discovery: Discovery): Finding[] {
  const findings: Finding[] = [];
  for (const file of pythonFiles(discovery)) {
    if (!pythonIsParsable(file)) continue;
    const dead = pythonSource(file).match(/^\s*return\b[^\n]*\n(?:\s+[^#\s][^\n]*)/m)?.[0];
    if (dead) findings.push(staticFinding('training-unreachable-code', 'training', 'medium', 'high-confidence', 'A statement follows an unconditional return in the same block.', file, dead, 'Move the statement before return or remove unreachable code.'));
  }
  return findings;
}
