import type { EvidenceRef, Finding, FindingStatus, Severity } from './types.js';

export function createFinding(input: Omit<Finding, 'locations' | 'sources'> & { locations?: EvidenceRef[]; sources?: EvidenceRef[] }): Finding {
  if (input.status === 'confirmed' && input.evidence.length === 0) throw new Error('Confirmed findings require verifiable evidence.');
  return { ...input, locations: input.locations ?? input.evidence, sources: input.sources ?? [] };
}

export function statusFinding(id: string, category: string, status: FindingStatus, summary: string, severity: Severity = 'info'): Finding {
  return createFinding({ id, category, status, severity, confidence: status === 'passed' ? 'high' : 'low', scope: 'review', summary, evidence: [], impact: '', recommendation: '', verification: '' });
}
