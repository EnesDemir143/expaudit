import { describe, expect, it } from 'vitest';
import { resolveRequest } from '../../src/review/request-resolver.js';

describe('resolveRequest', () => {
  it.each([
    [{ paths: ['experiments/E12/experiment.md'] }, ['experiment_manifest', 'post_run', 'chat', false]],
    [{ paths: ['E12/experiment.md', 'E13/experiment.md'] }, ['multiple_manifests', 'comparison', 'comparison_md', false]],
  ] as const)('resolves strict manifest defaults for %#', (request, expected) => {
    const scope = resolveRequest(request);
    expect([scope.source, scope.stage, scope.target, scope.writes]).toEqual(expected);
  });

  it('honors explicit manifest output values', () => {
    const scope = resolveRequest({ paths: ['E12/experiment.md'], stage: 'pre_run', target: 'json', depth: 'deep' });
    expect(scope).toMatchObject({ source: 'experiment_manifest', stage: 'pre_run', target: 'json', depth: 'deep', writes: false });
  });

  it('writes a requested manifest output', () => {
    const scope = resolveRequest({ paths: ['E12/experiment.md'], output: 'out.md' });
    expect(scope).toMatchObject({ target: 'review_md', writes: true });
  });

  it('rejects arbitrary Markdown and chat contracts', () => {
    expect(() => resolveRequest({ paths: ['E12.md'] })).toThrow('strict experiment.md');
    expect(() => resolveRequest({ paths: [] })).toThrow('strict experiment.md');
  });
});
