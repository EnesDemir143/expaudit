import type { ReviewDepth, ReviewRequest, ReviewScope, ReviewSource, ReviewStage, ReviewTarget } from './types.js';

const MD = /\.md$/i;
const explicit = <T>(value: T | undefined, fallback: T): T => value ?? fallback;

export function resolveRequest(request: ReviewRequest): ReviewScope {
  const markdownPaths = request.paths.filter((path) => MD.test(path) && !/\.review\.md$/i.test(path));
  const source: ReviewSource = explicit(request.source,
    markdownPaths.length > 1 ? 'multiple_experiments' : markdownPaths.length === 1 ? 'experiment_md' :
    request.prompt ? 'chat_description' : 'repository_inference');
  const stage: ReviewStage = explicit(request.stage,
    source === 'multiple_experiments' ? 'comparison' :
    source === 'repository_inference' ? 'repository_health' :
    /\b(plan|planning|before run|pre[- ]run|düşünüyorum)\b/i.test(request.prompt ?? '') ? 'pre_run' : 'post_run');
  const target: ReviewTarget = explicit(request.target,
    request.output ? stage === 'comparison' ? 'comparison_md' : 'review_md' :
    source === 'multiple_experiments' ? 'comparison_md' :
    source === 'experiment_md' ? 'review_md' : 'chat');
  const depth: ReviewDepth = explicit(request.depth, target === 'sarif' || target === 'json' ? 'ci' : 'standard');
  const writes = target !== 'chat' && (request.write === true || source === 'experiment_md' || Boolean(request.output));
  return { source, stage, target, depth, paths: request.paths, output: request.output, writes };
}
