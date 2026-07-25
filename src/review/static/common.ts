import { parser } from '@lezer/python';
import { lineEvidence, type DiscoveredFile, type Discovery } from '../discovery.js';
import { createFinding } from '../findings.js';
import type { Finding } from '../types.js';

export const pythonFiles = (discovery: Discovery) => discovery.files.filter((file) => /\.py$/i.test(file.path) && file.text);

// Static rules inspect parsed source text only; comments must never become findings.
export const pythonSource = (file: DiscoveredFile): string => (file.text ?? '').split('\n').map((line) => line.replace(/\s*#.*$/, '')).join('\n');

export function pythonIsParsable(file: DiscoveredFile): boolean {
  const tree = parser.parse(file.text ?? '');
  let valid = true;
  tree.iterate({ enter: (node) => { if (node.type.isError) valid = false; } });
  return valid;
}

export function staticFinding(id: string, category: string, severity: Finding['severity'], status: Finding['status'], summary: string, file: DiscoveredFile, snippet: string, recommendation: string): Finding {
  return createFinding({ id, category, severity, status, confidence: status === 'confirmed' ? 'high' : 'medium', scope: 'repository-static', summary, evidence: [lineEvidence(file, snippet)], impact: summary, recommendation, verification: 'Inspect the referenced source location and rerun the read-only audit.' });
}

export function functionBody(text: string, name: string): string | undefined {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => new RegExp(`^\\s*def\\s+${name}\\s*\\(`).test(line));
  if (start < 0) return undefined;
  const indent = lines[start].match(/^\s*/)?.[0].length ?? 0;
  const body: string[] = [lines[start]];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && (line.match(/^\s*/)?.[0].length ?? 0) <= indent) break;
    body.push(line);
  }
  return body.join('\n');
}
