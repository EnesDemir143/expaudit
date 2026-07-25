import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { runStaticChecks } from './checks.js';
import { extractChatContract, extractMarkdownContract, inferRepositoryContract } from './contract.js';
import { discoverRepository } from './discovery.js';
import { evidencePayload, evidenceRunId, writeEvidence } from './evidence.js';
import { planChecks } from './planner.js';
import { requiredChecksFor } from './policy.js';
import { renderChat, renderComparisonMarkdown, renderJson, renderReviewMarkdown, renderSarif, type ReviewReport, writeGeneratedReport } from './report.js';
import { resolveRequest } from './request-resolver.js';
import type { ExperimentContract, ReviewRequest } from './types.js';
import { deriveVerdict } from './verdict.js';
import { confinedPath } from '../security/paths.js';

export interface ReviewExecution { report: ReviewReport; output: string; outputPath?: string; comparisonReports?: ReviewReport[]; }
const experimentName = (path?: string) => path ? basename(path, extname(path)).replace(/\.review$/, '') : 'chat-review';

async function contractFor(request: ReviewRequest, root: string, path?: string): Promise<ExperimentContract> {
  if (path && /\.md$/i.test(path)) return extractMarkdownContract(await readFile(confinedPath(root, path), 'utf8'), path);
  if (request.prompt) return extractChatContract(request.prompt, request.paths);
  return inferRepositoryContract((await discoverRepository(root)).files.map((file) => file.path));
}

export async function executeReview(request: ReviewRequest, root = process.cwd()): Promise<ReviewExecution> {
  const scope = resolveRequest(request);
  const discovery = await discoverRepository(root);
  const paths = scope.paths.filter((path) => /\.md$/i.test(path) && !/\.review\.md$/i.test(path));
  const contract = await contractFor(request, root, paths[0]);
  const plan = planChecks(scope, await requiredChecksFor(scope.stage));
  const findings = [...runStaticChecks(discovery), ...plan.unavailable];
  const coverage = { required: plan.required, completed: plan.required.filter((check) => check !== 'literature'), unavailable: [...plan.unavailable.map((finding) => finding.id), 'literature'] };
  const verdict = deriveVerdict(findings, coverage);
  let evidencePath: string | undefined;
  if (scope.writes) evidencePath = await writeEvidence(root, experimentName(paths[0]), evidenceRunId('nogit'), evidencePayload(findings));
  const report: ReviewReport = { scope, contract, findings, verdict, evidencePath };
  if (scope.stage === 'comparison' && paths.length > 1) {
    const reports = await Promise.all(paths.slice(0, 2).map(async (path) => ({ ...report, contract: await contractFor(request, root, path), scope: { ...scope, paths: [path] } })));
    const output = renderComparisonMarkdown(reports);
    const outputPath = scope.writes ? resolve(root, request.output ?? `${experimentName(paths[0])}-vs-${experimentName(paths[1])}.comparison.md`) : undefined;
    if (outputPath) await writeGeneratedReport(confinedPath(root, outputPath), output);
    return { report, output, outputPath, comparisonReports: reports };
  }
  const output = scope.target === 'chat' ? renderChat(report) : scope.target === 'json' ? renderJson(report) : scope.target === 'sarif' ? renderSarif(report) : renderReviewMarkdown(report);
  const outputPath = scope.writes ? resolve(root, request.output ?? join(dirname(paths[0] ?? ''), `${experimentName(paths[0])}.review.md`)) : undefined;
  if (outputPath) await writeGeneratedReport(confinedPath(root, outputPath), output);
  return { report, output, outputPath };
}
