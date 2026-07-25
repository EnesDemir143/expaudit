import { describe, expect, it } from 'vitest';
import { requiredChecksFor } from '../../src/review/policy.js';
describe('review policy', () => {
  it('loads stage-specific requirements from the policy asset', async () => {
    expect(await requiredChecksFor('pre_run')).not.toContain('results-statistics');
    expect(await requiredChecksFor('post_run')).toContain('results-statistics');
  });
});
