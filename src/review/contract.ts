import type { Confidence, ContractField, ContractSource, EvidenceRef, ExperimentContract } from './types.js';

const isMissingValue = (value: unknown): boolean => value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(isMissingValue));
export const field = <T>(value: T | undefined, source: ContractSource, confidence: Confidence, evidence: EvidenceRef[], state?: ContractField<T>['state']): ContractField<T> => ({
  value, state: state ?? (isMissingValue(value) ? 'missing' : 'declared'), source, confidence: isMissingValue(value) ? 'low' : confidence, evidence,
});

export function emptyContract(source: ContractSource = 'experiment-manifest', evidence: EvidenceRef[] = []): ExperimentContract {
  const missing = <T>() => field<T>(undefined, source, 'low', evidence);
  return { identity: missing(), hypothesis: missing(), baseline: missing(), intendedChange: missing(), data: missing(), evaluation: missing(), acceptance: missing(), implementation: missing(), reproducibility: missing() };
}

export function missingFields(contract: ExperimentContract): string[] {
  return Object.entries(contract).filter(([, value]) => value.state === 'missing' || value.value === undefined).map(([key]) => key);
}
