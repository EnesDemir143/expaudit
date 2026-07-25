import { describe, expect, it } from 'vitest';
import { resolveRequest } from '../../src/review/request-resolver.js';

describe('resolveRequest', () => {
  it.each([
    [{ paths: ['experiments/E12.md'] }, ['experiment_md', 'post_run', 'review_md', true]],
    [{ prompt: 'YOLO ile SegFormer maskelerini birleştirdim', paths: [] }, ['chat_description', 'post_run', 'chat', false]],
    [{ paths: [] }, ['repository_inference', 'repository_health', 'chat', false]],
    [{ paths: ['E12.md', 'E13.md'] }, ['multiple_experiments', 'comparison', 'comparison_md', false]],
    [{ prompt: 'planını denetle', paths: [] }, ['chat_description', 'pre_run', 'chat', false]],
  ] as const)('resolves defaults for %#', (request, expected) => {
    const scope = resolveRequest(request);
    expect([scope.source, scope.stage, scope.target, scope.writes]).toEqual(expected);
  });

  it('honors explicit values over defaults', () => {
    const scope = resolveRequest({ paths: ['E12.md'], source: 'chat_description', stage: 'pre_run', target: 'json', depth: 'deep' });
    expect(scope).toMatchObject({ source: 'chat_description', stage: 'pre_run', target: 'json', depth: 'deep', writes: false });
  });

  it('writes a requested output for chat review', () => {
    const scope = resolveRequest({ prompt: 'review this', paths: [], output: 'out.md' });
    expect(scope).toMatchObject({ target: 'review_md', writes: true });
  });
});
