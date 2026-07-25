import type { ReviewDepth, ReviewRequest, ReviewScope, ReviewSource, ReviewStage, ReviewTarget } from './types.js';

const MD = /\.md$/i;
const explicit = <T>(value: T | undefined, fallback: T): T => value ?? fallback;

export function resolveRequest(request: ReviewRequest): ReviewScope {
  const markdownPaths = request.paths.filter((path) => MD.test(path) && /(?:^|\/)experiment\.md$/i.test(path));
  if (!markdownPaths.length) throw new Error('A strict experiment.md manifest path is required; chat and repository inference are not supported.');
  if (request.paths.some((path) => !markdownPaths.includes(path))) throw new Error('Only experiment.md manifest paths may be audited.');
  const source: ReviewSource = explicit(request.source,
    markdownPaths.length > 1 ? 'multiple_manifests' : 'experiment_manifest');
  const stage: ReviewStage = explicit(request.stage,
    source === 'multiple_manifests' ? 'comparison' : 'post_run');
  const target: ReviewTarget = explicit(request.target,
    request.output ? stage === 'comparison' ? 'comparison_md' : 'review_md' :
    source === 'multiple_manifests' ? 'comparison_md' : 'chat');
  const depth: ReviewDepth = explicit(request.depth, target === 'sarif' || target === 'json' ? 'ci' : 'standard');
  const writes = target !== 'chat' && (request.write === true || Boolean(request.output));
  return { source, stage, target, depth, paths: markdownPaths, output: request.output, writes };
}
