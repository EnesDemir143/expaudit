import type { ContractField, ExperimentContract, Finding } from './types.js';
import { createFinding } from './findings.js';

const comparable = ['identity', 'data', 'evaluation', 'implementation', 'reproducibility'] as const;
export function compareContract(contract: ExperimentContract, observed: Partial<ExperimentContract>): Finding[] {
  const findings: Finding[] = [];
  for (const key of comparable) {
    const declared = contract[key] as ContractField<unknown>;
    const actual = observed[key] as ContractField<unknown> | undefined;
    if (!actual?.value || !declared.value || JSON.stringify(declared.value) === JSON.stringify(actual.value)) continue;
    const evidence = [...declared.evidence, ...actual.evidence];
    findings.push(createFinding({ id: `contract-${key}-mismatch`, category: 'declared-observed', severity: key === 'data' || key === 'evaluation' ? 'high' : 'medium', status: evidence.length ? 'confirmed' : 'review-required', confidence: 'high', scope: key, summary: `Declared and observed ${key} differ.`, declared: declared.value, observed: actual.value, evidence, impact: 'The result may not represent the stated experiment.', recommendation: 'Reconcile documentation, configuration, and artifacts before interpreting results.', verification: 'Compare the cited declarations and observed artifacts.' }));
  }
  return findings;
}
