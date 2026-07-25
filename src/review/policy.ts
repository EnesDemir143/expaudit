import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { ReviewStage } from './types.js';

const fallback: Record<ReviewStage, string[]> = {
  pre_run: ['contract-completeness', 'code-config', 'leakage-split', 'tensor-training', 'evaluation', 'robustness', 'literature'],
  post_run: ['contract-completeness', 'code-config', 'leakage-split', 'tensor-training', 'evaluation', 'results-statistics', 'robustness', 'literature'],
  comparison: ['contract-completeness', 'code-config', 'leakage-split', 'tensor-training', 'evaluation', 'results-statistics'],
  repository_health: ['contract-completeness', 'code-config', 'leakage-split', 'tensor-training', 'evaluation'],
};

export async function requiredChecksFor(stage: ReviewStage): Promise<string[]> {
  try {
    const policyPath = fileURLToPath(new URL('../../review-policy.yaml', import.meta.url));
    const policy = parseYaml(await readFile(policyPath, 'utf8')) as { requiredChecks?: Partial<Record<ReviewStage, string[]>> };
    return policy.requiredChecks?.[stage] ?? fallback[stage];
  } catch { return fallback[stage]; }
}
