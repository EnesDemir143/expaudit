import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Finding } from './types.js';
import { confinedPath } from '../security/paths.js';

export function evidenceRunId(commit = 'nogit', now = new Date()): string {
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', '-');
  return `${timestamp}-${commit.slice(0, 7)}`;
}

export async function writeEvidence(root: string, experiment: string, runId: string, payload: unknown): Promise<string> {
  const relativePath = join('.expaudit', 'evidence', experiment.replace(/[^A-Za-z0-9._-]/g, '_'), runId);
  const destination = confinedPath(root, relativePath);
  await mkdir(destination, { recursive: true });
  const file = join(destination, 'findings.json');
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return file;
}

export function evidencePayload(findings: Finding[]): object { return { generatedBy: 'ExpAudit', findings }; }
