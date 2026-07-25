import { describe, expect, it, vi } from 'vitest';
import { requiresConsent } from '../../src/tools/capabilities.js';
import { pytorchProbe } from '../../src/tools/pytorch-probe.js';
import { normalizeResearch } from '../../src/review/research.js';

describe('capability policy', () => {
  it('plans but does not execute a runtime probe without consent', async () => {
    const plan = pytorchProbe.plan({ root: '/tmp' });
    expect(requiresConsent(plan, [])).toMatchObject({ status: 'not-executable' });
    const result = await pytorchProbe.run({ root: '/tmp', capabilities: [] });
    expect(result).toEqual({ executed: false });
  });

  it('does not fabricate literature when network is unavailable', () => {
    const findings = normalizeResearch([], false);
    expect(findings).toEqual([expect.objectContaining({ status: 'not-executable', id: 'literature-network' })]);
  });
});
