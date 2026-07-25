import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { confinedPath, redactSecrets } from '../security/paths.js';
import type { EvidenceRef } from './types.js';

const IGNORED = new Set(['.git', 'node_modules', 'dist', '.expaudit', '__pycache__', '.venv', 'venv']);
const TEXT_EXTENSIONS = new Set(['.py', '.ts', '.js', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.toml', '.csv', '.txt', '.md']);
export interface DiscoveredFile { path: string; absolutePath: string; size: number; hash: string; text?: string; }
export interface Discovery { root: string; gitCommit?: string; files: DiscoveredFile[]; evidence: EvidenceRef[]; }

async function walk(root: string, directory: string, files: DiscoveredFile[]): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (IGNORED.has(entry.name) || entry.isSymbolicLink()) continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(root, absolutePath, files);
    if (!entry.isFile()) continue;
    const info = await stat(absolutePath);
    const content = await readFile(absolutePath);
    const path = relative(root, absolutePath);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
    const extension = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
    const text = info.size <= 1_000_000 && TEXT_EXTENSIONS.has(extension) ? redactSecrets(content.toString('utf8')) : undefined;
    files.push({ path, absolutePath, size: info.size, hash, text });
  }
}

export async function discoverRepository(root: string): Promise<Discovery> {
  const safeRoot = confinedPath(root, '.');
  const files: DiscoveredFile[] = [];
  await walk(safeRoot, safeRoot, files);
  let gitCommit: string | undefined;
  try {
    const head = (await readFile(resolve(safeRoot, '.git', 'HEAD'), 'utf8')).trim();
    gitCommit = head.startsWith('ref: ') ? (await readFile(resolve(safeRoot, '.git', head.slice(5)), 'utf8')).trim() : head;
  } catch { /* A repository or commit may not exist yet. */ }
  return {
    root: safeRoot,
    gitCommit,
    files,
    evidence: files.map((file) => ({ kind: 'file', path: file.path, hash: file.hash, excerpt: file.text === undefined ? `metadata: ${file.size} bytes` : undefined })),
  };
}

export function lineEvidence(file: DiscoveredFile, text: string, kind: EvidenceRef['kind'] = 'file'): EvidenceRef {
  const index = file.text?.indexOf(text) ?? -1;
  const line = index >= 0 ? (file.text!.slice(0, index).match(/\n/g)?.length ?? 0) + 1 : undefined;
  return { kind, path: file.path, line, excerpt: redactSecrets(text).slice(0, 240), hash: file.hash };
}

export function findNamedFiles(discovery: Discovery, pattern: RegExp): DiscoveredFile[] {
  return discovery.files.filter((file) => pattern.test(basename(file.path)));
}
