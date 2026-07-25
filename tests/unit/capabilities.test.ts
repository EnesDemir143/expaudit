import { describe, expect, it, vi } from 'vitest';
import { requiresConsent } from '../../src/tools/capabilities.js';

describe('capability policy', () => {
  it('reports missing explicit capability without executing an adapter', () => {
    expect(requiresConsent({ adapter: 'runtime', requires: ['runtime', 'install'], reason: 'test' }, [])).toMatchObject({ status: 'not-executable' });
    expect(requiresConsent({ adapter: 'runtime', requires: ['runtime'], reason: 'test' }, ['runtime'])).toBeUndefined();
  });
});
