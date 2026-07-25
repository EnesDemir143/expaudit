import { parse as parseYaml } from 'yaml';
import type { Confidence, ContractField, ContractSource, EvidenceRef, ExperimentContract } from './types.js';

const isMissingValue = (value: unknown): boolean => value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(isMissingValue));
const field = <T>(value: T | undefined, source: ContractSource, confidence: Confidence, evidence: EvidenceRef[]): ContractField<T> => ({
  value, state: isMissingValue(value) ? 'missing' : source === 'repository-inferred' ? 'inferred' : 'declared', source, confidence: isMissingValue(value) ? 'low' : confidence, evidence,
});
const scalar = (value: unknown): string | undefined => typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
const get = (source: Record<string, unknown>, ...keys: string[]): unknown => keys.map((key) => source[key]).find((value) => value !== undefined);

export function emptyContract(source: ContractSource = 'chat-declared', evidence: EvidenceRef[] = []): ExperimentContract {
  const missing = <T>() => field<T>(undefined, source, 'low', evidence);
  return { identity: missing(), hypothesis: missing(), baseline: missing(), intendedChange: missing(), data: missing(), evaluation: missing(), acceptance: missing(), implementation: missing(), reproducibility: missing() };
}

export function extractMarkdownContract(content: string, path: string): ExperimentContract {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const data = (frontmatter ? parseYaml(frontmatter[1]) : {}) as Record<string, unknown>;
  const body = content.slice(frontmatter?.[0].length ?? 0);
  const heading = (label: string): string | undefined => body.match(new RegExp(`^#{1,3}\\s+${label}\\s*\\n+([\\s\\S]*?)(?=^#{1,3}\\s|$)`, 'im'))?.[1].trim();
  const evidence: EvidenceRef[] = [{ kind: 'file', path, line: 1 }];
  const source: ContractSource = 'experiment-md';
  const declared = <T>(value: T | undefined) => field(value, source, value === undefined ? 'low' : 'high', evidence);
  const value = (keys: string[], title: string) => scalar(get(data, ...keys)) ?? heading(title);
  const changes = get(data, 'intendedChange', 'intended_change', 'change');
  const change = Array.isArray(changes) ? changes.map(String) : value(['intendedChange', 'intended_change', 'change'], 'Intended Change');
  return {
    identity: declared({ id: value(['id', 'experimentId'], 'Experiment'), name: value(['name', 'title'], 'Title'), status: value(['status'], 'Status') }),
    hypothesis: declared(value(['hypothesis'], 'Hypothesis')),
    baseline: declared(value(['baseline'], 'Baseline')),
    intendedChange: declared(Array.isArray(change) ? change : change ? [change] : undefined),
    data: declared({ version: value(['dataVersion', 'data_version'], 'Data'), splitPolicy: value(['splitPolicy', 'split_policy'], 'Split Policy'), groupColumn: value(['groupColumn', 'group_column'], 'Group'), manifest: value(['manifest'], 'Manifest') }),
    evaluation: declared({ primaryMetric: value(['primaryMetric', 'primary_metric'], 'Primary Metric'), selectionPolicy: value(['selectionPolicy', 'selection_policy'], 'Selection Policy'), testPolicy: value(['testPolicy', 'test_policy'], 'Test Policy') }),
    acceptance: declared({ criteria: value(['acceptance', 'criteria'], 'Acceptance'), guardrails: [] }),
    implementation: declared({ entrypoint: value(['entrypoint'], 'Entrypoint'), config: value(['config'], 'Config'), checkpoint: value(['checkpoint'], 'Checkpoint') }),
    reproducibility: declared({ seed: value(['seed'], 'Seed'), commit: value(['commit'], 'Commit'), environment: value(['environment'], 'Environment') }),
  };
}

export function extractChatContract(text: string, paths: string[] = []): ExperimentContract {
  const evidence: EvidenceRef[] = [{ kind: 'chat', excerpt: text }, ...paths.map((path) => ({ kind: 'file' as const, path }))];
  const contract = emptyContract('chat-declared', evidence);
  const declared = <T>(value: T | undefined) => field(value, 'chat-declared', value ? 'medium' : 'low', evidence);
  contract.identity = { value: { name: 'Chat-described experiment' }, state: 'inferred', source: 'chat-declared', confidence: 'medium', evidence };
  contract.hypothesis = declared(text.match(/(?:hypothesis|hipotez)\s*[:=-]\s*([^\n.]+)/i)?.[1]);
  contract.intendedChange = declared(text.match(/(?:changed|değiştir(?:dim|eceğim)?|with|ile)\s+([^,.]+)/i)?.[1] ? [text] : undefined);
  contract.evaluation = declared({ primaryMetric: text.match(/\b(recall|precision|f1|auc|accuracy|loss)\b/i)?.[1], selectionPolicy: undefined, testPolicy: undefined });
  contract.implementation = declared({ entrypoint: paths.find((path) => /\.(py|ts|js)$/i.test(path)), config: paths.find((path) => /\.(ya?ml|json)$/i.test(path)) });
  return contract;
}

export function inferRepositoryContract(paths: string[]): ExperimentContract {
  const evidence = paths.map((path) => ({ kind: 'file' as const, path }));
  const contract = emptyContract('repository-inferred', evidence);
  contract.identity = field({ name: 'Repository-inferred experiment scope' }, 'repository-inferred', 'low', evidence);
  contract.implementation = field({ entrypoint: paths.find((path) => /(?:train|fit|main)\.(py|ts|js)$/i.test(path)) }, 'repository-inferred', 'medium', evidence);
  return contract;
}

export function missingFields(contract: ExperimentContract): string[] {
  return Object.entries(contract).filter(([, value]) => value.state === 'missing' || value.value === undefined).map(([key]) => key);
}
