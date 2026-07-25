import { relative, resolve, sep } from 'node:path';

export function confinedPath(root: string, candidate: string): string {
  const resolvedRoot = resolve(root);
  const resolved = resolve(resolvedRoot, candidate);
  const rel = relative(resolvedRoot, resolved);
  if (rel.startsWith(`..${sep}`) || rel === '..' || rel === '') {
    if (rel === '') return resolved;
    throw new Error(`Path escapes repository root: ${candidate}`);
  }
  return resolved;
}

export function redactSecrets(text: string): string {
  return text
    .replace(/((?:api[_-]?key|token|password|secret)\s*[=:]\s*["']?)[^\s"']+/gi, '$1[REDACTED]')
    .replace(/\b(?:sk|ghp|hf)_[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]');
}
