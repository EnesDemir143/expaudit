import type { ContractField, ExperimentContract, Finding } from './types.js';
import { createFinding } from './findings.js';

const comparable = ['identity', 'data', 'evaluation', 'implementation', 'reproducibility'] as const;
const canonical = (value: unknown): string => typeof value === 'string' ? value.replace(/\\/g, '/').replace(/^\.\//, '').trim().toLowerCase() : JSON.stringify(value);
export function compareContract(contract: ExperimentContract, observed: Partial<ExperimentContract>): Finding[] {
  const findings: Finding[] = [];
  for (const key of comparable) {
    const declared = contract[key] as ContractField<unknown>;
    const actual = observed[key] as ContractField<unknown> | undefined;
    if (!actual?.value || !declared.value) continue;
    const declaredEntries = Object.entries(declared.value as Record<string, unknown>);
    const observedEntries = new Map(Object.entries(actual.value as Record<string, unknown>));
    for (const [field, declaredValue] of declaredEntries) {
      const observedValue = observedEntries.get(field);
      if (declaredValue === undefined || observedValue === undefined || canonical(declaredValue) === canonical(observedValue)) continue;
      const evidence = [...declared.evidence, ...actual.evidence];
      findings.push(createFinding({ id: `contract-${key}-${field}-mismatch`, category: 'declared-observed', severity: key === 'data' || key === 'evaluation' ? 'high' : 'medium', status: evidence.length ? 'confirmed' : 'review-required', confidence: 'high', scope: `${key}.${field}`, summary: `Declared and observed ${key}.${field} differ.`, declared: declaredValue, observed: observedValue, evidence, impact: 'The result may not represent the stated experiment.', recommendation: 'Reconcile the manifest, configuration, and artifacts before interpreting results.', verification: 'Compare both cited declaration and observed evidence.' }));
    }
  }
  return findings;
}
