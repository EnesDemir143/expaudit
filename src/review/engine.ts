import { lstat, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { runStaticChecks } from './checks.js';
import { emptyContract } from './contract.js';
import { compareContract } from './comparator.js';
import { discoverRepository } from './discovery.js';
import { evidencePayload, evidenceRunId, writeEvidence } from './evidence.js';
import { requiredChecksFor } from './policy.js';
import { renderChat, renderComparisonMarkdown, renderJson, renderReviewMarkdown, renderSarif, type ReviewReport, writeGeneratedReport } from './report.js';
import { resolveRequest } from './request-resolver.js';
import { parseManifest } from './manifest.js';
import { extractObserved } from './observed.js';
import { resolveManifestScope } from './scope-resolver.js';
import type { AdapterResult, ExperimentContract, Finding, ReviewRequest } from './types.js';
import { deriveVerdict } from './verdict.js';
import { confinedPath } from '../security/paths.js';
import { trackingAdapters } from '../tools/tracking.js';
import { pytorchProbe } from '../tools/pytorch-probe.js';
import { selectedAdapters } from '../tools/adapters.js';
import type { ToolAdapter, ToolContext } from '../tools/types.js';
import { createFinding } from './findings.js';

export interface ReviewExecution { report: ReviewReport; output: string; outputPath?: string; comparisonReports?: ReviewReport[]; }
const experimentName = (path?: string) => path ? basename(path, extname(path)).replace(/\.review$/, '') : 'chat-review';

function invalidManifestFinding(errors: string[], evidence: ReturnType<typeof emptyContract>['identity']['evidence']): Finding {
  return createFinding({ id: 'manifest-invalid', category: 'manifest', severity: 'high', status: 'not-executable', confidence: 'high', scope: 'experiment.md', summary: `Strict manifest validation failed: ${errors.join('; ')}`, evidence, impact: 'The experiment contract is not verified and no inferred substitute is permitted.', recommendation: 'Correct experiment.md against the bundled versioned schema.', verification: 'Re-run ExpAudit after validation succeeds.' });
}

async function runAdapter(adapter: ToolAdapter, context: ToolContext): Promise<AdapterResult> {
  if (!await adapter.supports(context)) return { adapter: adapter.name, requested: [], completed: [], unavailable: [], findings: [], evidence: [], reason: 'not selected or not available' };
  const missing = adapter.plan(context).requires.filter((capability) => !context.capabilities.includes(capability));
  if (missing.length) return { adapter: adapter.name, requested: [adapter.name], completed: [], unavailable: [adapter.name], findings: [], evidence: [], reason: `Explicit capability required: ${missing.join(', ')}.` };
  return adapter.run(context);
}

const mergeObserved = (values: Partial<ExperimentContract>[]): Partial<ExperimentContract> => Object.assign({}, ...values);

async function reviewManifest(path: string, request: ReviewRequest, root: string): Promise<ReviewReport> {
  const scope = resolveRequest({ ...request, paths: [path] });
  const discovery = await discoverRepository(root);
  let content: string;
  try {
    const manifestPath = confinedPath(root, path);
    if ((await lstat(manifestPath)).isSymbolicLink()) throw new Error(`Refusing symbolic-link manifest path: ${path}`);
    content = await readFile(manifestPath, 'utf8');
  } catch (error: unknown) {
    const contract = emptyContract();
    const findings = [invalidManifestFinding([(error as Error).message], [{ kind: 'file', path }])];
    return { scope, contract, findings, adapters: [], verdict: deriveVerdict(findings, { required: ['manifest'], completed: [], unavailable: ['manifest'] }) };
  }
  const parsed = await parseManifest(content, path);
  if (!parsed.manifest) {
    const findings = [invalidManifestFinding(parsed.errors, parsed.evidence)];
    return { scope, contract: parsed.contract, findings, adapters: [], verdict: deriveVerdict(findings, { required: ['manifest'], completed: [], unavailable: ['manifest'] }) };
  }
  const manifest = parsed.manifest;
  const resolutions = resolveManifestScope(root, discovery, manifest);
  scope.resolutions = resolutions;
  const staticFindings = runStaticChecks(discovery, manifest, resolutions);
  const scopeUnavailable = resolutions.filter((item) => item.state === 'ambiguous' || (['entrypoint', 'config', 'data-manifest'].includes(item.kind) && item.declared !== 'null' && item.state === 'missing'));
  const baseRequired = await requiredChecksFor(scope.stage);
  const required = [...new Set([...baseRequired, ...manifest.audit.required])];
  const staticUnavailable = staticFindings.filter((finding) => finding.status === 'not-executable').map((finding) => finding.id);
  const staticCompleted = baseRequired.filter((check) => (check === 'manifest' ? !scopeUnavailable.length : check !== 'artifacts' && !staticUnavailable.some((id) => id.startsWith(check.replace('data-quality', 'data-')))));
  const staticAdapter: AdapterResult = { adapter: 'static-read-only', requested: baseRequired, completed: staticCompleted, unavailable: scopeUnavailable.length ? ['manifest'] : staticUnavailable.filter((id) => required.includes(id)), findings: staticFindings, evidence: [] };
  const context: ToolContext = { root, manifest, discovery, resolutions, capabilities: request.capabilities ?? [] };
  const adapters: AdapterResult[] = [staticAdapter];
  if (manifest.artifacts.metrics) {
    const metricAvailable = resolutions.some((item) => item.kind === 'metrics' && ['exact', 'inferred'].includes(item.state));
    adapters.push({ adapter: 'artifact-metrics', requested: ['artifact-metrics', 'artifacts'], completed: metricAvailable ? ['artifact-metrics', 'artifacts'] : [], unavailable: metricAvailable ? [] : ['artifact-metrics', 'artifacts'], findings: [], evidence: resolutions.find((item) => item.kind === 'metrics')?.evidence ?? [], reason: metricAvailable ? undefined : 'Declared metrics artifact is unavailable.' });
  }
  if (manifest.artifacts.tracker && manifest.artifacts.tracker !== 'none') {
    const tracker = trackingAdapters.find((adapter) => adapter.name.startsWith(manifest.artifacts.tracker!));
    if (tracker) adapters.push(await runAdapter(tracker, context));
  }
  for (const adapter of selectedAdapters(context)) {
    const result = await runAdapter(adapter, context);
    // Required unavailable adapters block through coverage; optional ones remain informational.
    if (!result.requested.length && manifest.audit.required.includes(adapter.name)) result.unavailable.push(adapter.name);
    adapters.push(result);
  }
  if (manifest.runtime.enabled) adapters.push(await runAdapter(pytorchProbe, context));
  const observed = extractObserved(discovery, manifest, resolutions);
  const adapterObserved = mergeObserved(adapters.flatMap((adapter) => adapter.observed ? [adapter.observed] : []));
  const findings = [...staticFindings, ...adapters.flatMap((adapter) => adapter.findings), ...observed.findings, ...compareContract(parsed.contract, { ...observed.contract, ...adapterObserved })];
  const completed = [...new Set(adapters.flatMap((adapter) => adapter.completed))];
  const unavailable = [...new Set(adapters.flatMap((adapter) => adapter.unavailable))];
  for (const missing of required.filter((check) => !completed.includes(check))) if (!unavailable.includes(missing)) unavailable.push(missing);
  const verdict = deriveVerdict(findings, { required, completed: required.filter((check) => completed.includes(check)), unavailable });
  let evidencePath: string | undefined;
  if (scope.writes) evidencePath = await writeEvidence(root, manifest.id, evidenceRunId(discovery.gitCommit ?? 'nogit'), evidencePayload(findings));
  return { scope, contract: parsed.contract, findings, adapters, observed: { ...observed.contract, ...adapterObserved }, verdict, evidencePath };
}

export async function executeReview(request: ReviewRequest, root = process.cwd()): Promise<ReviewExecution> {
  const scope = resolveRequest(request);
  const paths = scope.paths;
  if (scope.stage === 'comparison' && paths.length > 1) {
    const reports = await Promise.all(paths.slice(0, 2).map((path) => reviewManifest(path, { ...request, stage: 'comparison' }, root)));
    const report = reports[0];
    const output = renderComparisonMarkdown(reports);
    const outputPath = scope.writes ? resolve(root, request.output ?? `${experimentName(paths[0])}-vs-${experimentName(paths[1])}.comparison.md`) : undefined;
    if (outputPath) await writeGeneratedReport(confinedPath(root, outputPath), output);
    return { report, output, outputPath, comparisonReports: reports };
  }
  const report = await reviewManifest(paths[0], request, root);
  const output = scope.target === 'chat' ? renderChat(report) : scope.target === 'json' ? renderJson(report) : scope.target === 'sarif' ? renderSarif(report) : renderReviewMarkdown(report);
  const outputPath = scope.writes ? resolve(root, request.output ?? join(dirname(paths[0] ?? ''), `${experimentName(paths[0])}.review.md`)) : undefined;
  if (outputPath) await writeGeneratedReport(confinedPath(root, outputPath), output);
  return { report, output, outputPath };
}
