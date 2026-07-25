import { basename, extname } from 'node:path';
import { confinedPath } from '../security/paths.js';
import type { DiscoveredFile, Discovery } from './discovery.js';
import type { EvidenceRef, ExperimentManifest, PathResolution } from './types.js';

interface DeclaredPath { kind: PathResolution['kind']; path: string | null; }

const declaredPaths = (manifest: ExperimentManifest): DeclaredPath[] => [
  { kind: 'entrypoint', path: manifest.entrypoint }, { kind: 'config', path: manifest.config },
  { kind: 'data-manifest', path: manifest.data.manifest }, { kind: 'metrics', path: manifest.artifacts.metrics },
  { kind: 'checkpoint', path: manifest.artifacts.checkpoint }, { kind: 'serving-entrypoint', path: manifest.serving?.entrypoint ?? null },
  { kind: 'serving-config', path: manifest.serving?.config ?? null }, { kind: 'baseline', path: manifest.baseline },
  { kind: 'environment', path: manifest.reproducibility.environment }, { kind: 'runtime-sample', path: manifest.runtime.sampleInput },
];

function scoreCandidate(file: DiscoveredFile, declared: string, experimentId: string): number {
  const wanted = basename(declared).toLowerCase();
  const fileName = basename(file.path).toLowerCase();
  let score = 0;
  if (fileName === wanted) score += 70;
  if (extname(fileName) === extname(wanted)) score += 10;
  if (file.path.toLowerCase().includes(experimentId.toLowerCase())) score += 10;
  if (file.text?.includes(wanted)) score += 5;
  return score;
}

function evidence(file: DiscoveredFile, excerpt: string): EvidenceRef { return { kind: 'file', path: file.path, hash: file.hash, excerpt }; }

function resolveOne(root: string, discovery: Discovery, manifest: ExperimentManifest, item: DeclaredPath): PathResolution {
  if (!item.path) return { declared: 'null', kind: item.kind, state: 'missing', evidence: [], reason: 'not-executable' };
  // Confine the declaration before comparing it to discovery results.
  const exact = confinedPath(root, item.path);
  const found = discovery.files.find((file) => file.absolutePath === exact);
  if (found) return { declared: item.path, kind: item.kind, state: 'exact', path: found.path, score: 100, evidence: [evidence(found, `exact manifest path: ${item.path}`)] };
  const candidates = discovery.files.map((file) => ({ file, score: scoreCandidate(file, item.path!, manifest.id) })).filter((candidate) => candidate.score >= 65).sort((a, b) => b.score - a.score);
  if (!candidates.length) return { declared: item.path, kind: item.kind, state: 'missing', evidence: [], reason: 'not-executable' };
  if (candidates.length > 1 && candidates[0].score === candidates[1].score) return { declared: item.path, kind: item.kind, state: 'ambiguous', evidence: candidates.slice(0, 3).map((candidate) => evidence(candidate.file, `candidate score ${candidate.score}`)), reason: 'path-resolution-ambiguous' };
  const selected = candidates[0];
  return { declared: item.path, kind: item.kind, state: 'inferred', path: selected.file.path, score: selected.score, evidence: [evidence(selected.file, `inferred from ${item.path}; score ${selected.score}`)] };
}

export function resolveManifestScope(root: string, discovery: Discovery, manifest: ExperimentManifest): PathResolution[] {
  return declaredPaths(manifest).map((item) => resolveOne(root, discovery, manifest, item));
}
