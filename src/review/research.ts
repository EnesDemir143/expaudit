import { statusFinding } from './findings.js';
import type { Finding } from './types.js';
import type { ResearchSource } from '../tools/types.js';

export interface ResearchRequest { claim: string; keywords: string[]; }
export function createResearchRequest(claim: string): ResearchRequest { return { claim, keywords: claim.split(/\s+/).filter((term) => term.length > 2).slice(0, 8) }; }
export function normalizeResearch(sources: ResearchSource[], networkGranted: boolean): Finding[] {
  if (!networkGranted) return [statusFinding('literature-network', 'literature', 'not-executable', 'Literature review was not executed because network capability was not granted.')];
  if (!sources.length) return [statusFinding('literature-sources', 'literature', 'not-executable', 'No primary or official sources were supplied for the research request.')];
  return sources.map((source, index) => ({ ...statusFinding(`literature-${index + 1}`, 'literature', 'passed', `Reviewed ${source.kind} source: ${source.title}.`), evidence: [source.evidence], sources: [source.evidence] }));
}
