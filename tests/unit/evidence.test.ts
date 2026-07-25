import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evidenceRunId, writeEvidence } from '../../src/review/evidence.js';

describe('evidence store', () => {
  it('uses a UTC timestamp and short commit in its run id', () => {
    expect(evidenceRunId('abcdef123', new Date('2026-01-02T03:04:05Z'))).toBe('20260102-030405-abcdef1');
  });
  it('writes only under the ExpAudit evidence directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'expaudit-evidence-'));
    const path = await writeEvidence(root, 'E12', 'run', { safe: true });
    expect(path).toContain('/.expaudit/evidence/E12/run/findings.json');
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ safe: true });
  });
});
