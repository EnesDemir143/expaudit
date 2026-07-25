import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AdapterResult, ExperimentContract, Finding, ReviewScope, ReviewVerdict } from './types.js';
import { missingFields } from './contract.js';

export interface ReviewReport { scope: ReviewScope; contract: ExperimentContract; findings: Finding[]; adapters: AdapterResult[]; observed?: Partial<ExperimentContract>; verdict: ReviewVerdict; evidencePath?: string; }
const generatedStart = '<!-- expaudit:generated:start -->';
const generatedEnd = '<!-- expaudit:generated:end -->';
const priority = (finding: Finding): number => ({ critical: 0, high: 1, medium: 2, low: 3, info: 4 })[finding.severity];
const formatFinding = (finding: Finding) => `- **${finding.severity}/${finding.status}** ${finding.id}: ${finding.summary}${finding.locations[0]?.path ? ` (${finding.locations[0].path}${finding.locations[0].line ? `:${finding.locations[0].line}` : ''})` : ''}`;

export function renderChat(report: ReviewReport): string {
  const missing = missingFields(report.contract);
  const findings = [...report.findings].sort((a, b) => priority(a) - priority(b)).slice(0, 7);
  return [
    `ExpAudit scope: source=${report.scope.source}, stage=${report.scope.stage}, target=chat, depth=${report.scope.depth}.`,
    `Manifest contract: ${report.contract.identity.state} (${report.contract.identity.source}); confidence: ${report.contract.identity.confidence}.`,
    missing.length ? `Missing contract fields: ${missing.join(', ')}.` : 'Missing contract fields: none.',
    findings.length ? `Findings:\n${findings.map(formatFinding).join('\n')}` : 'Findings: no issues detected by completed checks.',
    `Verdict: **${report.verdict.value}**. ${report.verdict.rationale}`,
    `Coverage: completed ${report.verdict.coverage.completed.length}/${report.verdict.coverage.required.length}; unavailable: ${report.verdict.coverage.unavailable.join(', ') || 'none'}.`,
    'Lowest-cost next step: resolve unavailable required manifest paths and address ordered critical/high findings.',
  ].join('\n\n');
}

export function renderReviewMarkdown(report: ReviewReport): string {
  const missing = missingFields(report.contract);
  const findingGroups = ['critical', 'high', 'medium', 'low', 'info'].map((severity) => {
    const values = report.findings.filter((finding) => finding.severity === severity);
    return values.length ? `### ${severity[0].toUpperCase()}${severity.slice(1)} Findings\n${values.map(formatFinding).join('\n')}` : '';
  }).filter(Boolean).join('\n\n');
  const generated = [
    generatedStart,
    '# ExpAudit Review',
    `## Executive Summary\nVerdict: **${report.verdict.value}**. ${report.verdict.rationale}`,
    `## Resolved Scope\n- Source: \`${report.scope.source}\`\n- Stage: \`${report.scope.stage}\`\n- Target: \`${report.scope.target}\`\n- Depth: \`${report.scope.depth}\`\n${(report.scope.resolutions ?? []).map((item) => `- ${item.kind}: \`${item.declared}\` -> \`${item.path ?? item.state}\` (${item.state}${item.score ? `, score ${item.score}` : ''})`).join('\n') || '- Paths: not resolved'}`,
    `## Contract\n- State/source: \`${report.contract.identity.state}/${report.contract.identity.source}\`\n- Confidence: \`${report.contract.identity.confidence}\`\n- Missing: ${missing.length ? missing.join(', ') : 'none'}`,
    `## Experiment Understood\n- Hypothesis: ${report.contract.hypothesis.value ?? 'missing'}\n- Baseline: ${report.contract.baseline.value ?? 'missing'}\n- Intended change: ${report.contract.intendedChange.value?.join('; ') ?? 'missing'}`,
    `## Declared vs Observed\n| Field | Declared | Observed |\n| --- | --- | --- |\n${['data', 'evaluation', 'implementation', 'reproducibility'].map((key) => `| ${key} | ${JSON.stringify((report.contract[key as keyof ExperimentContract] as { value?: unknown }).value) ?? 'missing'} | ${JSON.stringify((report.observed?.[key as keyof ExperimentContract] as { value?: unknown } | undefined)?.value) ?? 'not observed'} |`).join('\n')}`,
    `## Adapter Coverage\n${report.adapters.map((adapter) => `- ${adapter.adapter}: completed ${adapter.completed.join(', ') || 'none'}; unavailable ${adapter.unavailable.join(', ') || 'none'}${adapter.reason ? ` (${adapter.reason})` : ''}`).join('\n') || 'No adapters executed.'}\n- Required completed: ${report.verdict.coverage.completed.join(', ') || 'none'}\n- Required unavailable: ${report.verdict.coverage.unavailable.join(', ') || 'none'}\n- Evidence store: ${report.evidencePath ?? 'not persisted'}`,
    `## Findings\n${findingGroups || 'No findings emitted.'}`,
    `## Data, Training, Evaluation, and Serving\nStatic checks cover data leakage, tensor/training behavior, evaluation misuse, and train-serving parity where applicable.`,
    `## Recommended Next Action\nResolve required unavailable adapters, then address critical/high findings before interpreting results.`,
    `## Evidence Paths\n${report.evidencePath ?? 'No persistent evidence for this target.'}`,
    generatedEnd,
  ].join('\n\n');
  return `${generated}\n`;
}

export function renderComparisonMarkdown(reports: ReviewReport[]): string {
  const [left, right] = reports;
  const rows = ['data', 'evaluation', 'reproducibility', 'implementation'].map((key) => {
    const a = left.contract[key as keyof ExperimentContract] as { value?: unknown };
    const b = right.contract[key as keyof ExperimentContract] as { value?: unknown };
    const parity = JSON.stringify(a.value) === JSON.stringify(b.value) ? 'matched' : 'different or missing';
    return `| ${key} | ${JSON.stringify(a.value) ?? 'missing'} | ${JSON.stringify(b.value) ?? 'missing'} | ${parity} |`;
  });
  const attributionBlocked = rows.some((row) => row.includes('different or missing'));
  return [generatedStart, '# ExpAudit Comparison', `## Scope\nCompared ${left.scope.paths.join(', ')} with ${right.scope.paths.join(', ')}.`, `## Controlled-Variable Parity\n| Field | Left | Right | Parity |\n| --- | --- | --- | --- |\n${rows.join('\n')}`, `## Attribution Verdict\n**${attributionBlocked ? 'blocked-insufficient-evidence' : 'reliable-with-caveats'}**: ${attributionBlocked ? 'Data, evaluation, reproducibility, or implementation parity differs or is missing; ExpAudit does not declare a winner.' : 'Controlled fields match at contract level; inspect metrics and artifacts before attribution.'}`, `## Decision-Changing Findings\n${reports.flatMap((report) => report.findings.filter((finding) => ['critical', 'high'].includes(finding.severity)).map(formatFinding)).join('\n') || 'No critical/high findings.'}`, `## Clean Follow-up\nRun the same split, seed policy, preprocessing, checkpoint selection policy, and primary metric with exactly one intended change.`, generatedEnd, ''].join('\n\n');
}

export function renderJson(report: ReviewReport): string { return `${JSON.stringify(report, null, 2)}\n`; }
export function renderSarif(report: ReviewReport): string {
  return `${JSON.stringify({ version: '2.1.0', runs: [{ tool: { driver: { name: 'ExpAudit' } }, results: report.findings.map((finding) => ({ ruleId: finding.id, level: finding.severity === 'critical' ? 'error' : finding.severity === 'high' ? 'warning' : 'note', message: { text: finding.summary }, locations: finding.locations[0]?.path ? [{ physicalLocation: { artifactLocation: { uri: finding.locations[0].path }, region: { startLine: finding.locations[0].line ?? 1 } } }] : [] })) }] }, null, 2)}\n`;
}

export async function writeGeneratedReport(path: string, generated: string): Promise<void> {
  let existing = '';
  try { existing = await readFile(path, 'utf8'); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const start = existing.indexOf(generatedStart);
  const end = existing.indexOf(generatedEnd);
  const output = start >= 0 && end >= start ? `${existing.slice(0, start)}${generated}${existing.slice(end + generatedEnd.length)}` : existing ? `${existing.trimEnd()}\n\n${generated}` : generated;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, output, 'utf8');
}
