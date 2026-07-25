import Ajv2020Import from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { field, emptyContract } from './contract.js';
import type { AcceptanceContract, EvidenceRef, ExperimentContract, ExperimentManifest } from './types.js';

export interface ManifestParseResult { manifest?: ExperimentManifest; contract: ExperimentContract; errors: string[]; evidence: EvidenceRef[]; }

const schemaPaths = () => {
  const here = dirname(fileURLToPath(import.meta.url));
  return [resolve(here, '..', '..', 'schemas', 'experiment-manifest.schema.json'), resolve(here, '..', '..', 'skill', 'ml-experiment-review', 'schemas', 'experiment-manifest.schema.json')];
};

async function schema(): Promise<object> {
  for (const path of schemaPaths()) {
    try { return JSON.parse(await readFile(path, 'utf8')) as object; } catch { /* Try package layout fallback. */ }
  }
  throw new Error('ExpAudit manifest schema asset is unavailable.');
}

function frontmatter(content: string): { yaml?: string; start: number } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  return { yaml: match?.[1], start: 2 };
}

const nullable = <T>(value: T | null): T | undefined => value === null ? undefined : value;

export async function parseManifest(content: string, path: string): Promise<ManifestParseResult> {
  const parsed = frontmatter(content);
  const document = parsed.yaml === undefined ? undefined : parseDocument(parsed.yaml, { prettyErrors: false });
  const value = document?.toJSON() as unknown;
  const evidence: EvidenceRef[] = [{ kind: 'file', path, line: 1 }];
  const errors: string[] = [];
  if (!document || document.errors.length || !value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(document?.errors.map((error) => error.message).join('; ') || 'experiment.md must begin with YAML frontmatter.');
  } else {
    const Ajv2020 = Ajv2020Import as unknown as new (options: object) => { compile: (source: object) => { (value: unknown): boolean; errors?: Array<{ instancePath?: string; message?: string }> } };
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(await schema());
    if (!validate(value)) errors.push(...(validate.errors ?? []).map((error: { instancePath?: string; message?: string }) => `${error.instancePath || 'manifest'} ${error.message ?? 'is invalid'}`));
  }
  if (errors.length) {
    const line = document?.errors[0]?.linePos?.[0]?.line;
    if (line) evidence[0] = { ...evidence[0], line: line + parsed.start - 1, excerpt: errors[0] };
    return { contract: emptyContract('experiment-manifest', evidence), errors, evidence };
  }
  const manifest = value as ExperimentManifest;
  const declared = <T>(item: T | undefined) => field(item, 'experiment-manifest', 'high', evidence);
  return {
    manifest,
    errors: [],
    evidence,
    contract: {
      identity: declared({ id: manifest.id, status: manifest.status, task: manifest.task }),
      hypothesis: field<string>(undefined, 'experiment-manifest', 'low', evidence),
      baseline: declared(nullable(manifest.baseline)),
      intendedChange: field<string[]>(undefined, 'experiment-manifest', 'low', evidence),
      data: declared({ ...manifest.data, version: nullable(manifest.data.version), groupColumn: nullable(manifest.data.groupColumn) }),
      evaluation: declared(manifest.evaluation),
      acceptance: field<AcceptanceContract>(undefined, 'experiment-manifest', 'low', evidence),
      implementation: declared({ entrypoint: manifest.entrypoint, config: nullable(manifest.config), checkpoint: nullable(manifest.artifacts.checkpoint) }),
      reproducibility: declared({ ...manifest.reproducibility, seed: nullable(manifest.reproducibility.seed), commit: nullable(manifest.reproducibility.commit), environment: nullable(manifest.reproducibility.environment) }),
    },
  };
}
