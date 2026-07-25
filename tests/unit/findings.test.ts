import { describe, expect, it } from 'vitest';
import { createFinding } from '../../src/review/findings.js';

describe('finding normalization', () => {
  it('rejects unevidenced confirmed findings', () => {
    expect(() => createFinding({ id: 'x', category: 'test', severity: 'critical', status: 'confirmed', confidence: 'high', scope: 'test', summary: 'x', evidence: [], impact: 'x', recommendation: 'x', verification: 'x' })).toThrow(/evidence/i);
  });
});
