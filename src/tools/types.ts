import type { Capability, EvidenceRef, Finding } from '../review/types.js';

export interface ToolPlan { adapter: string; command?: string[]; requires: Capability[]; reason: string; }
export interface ToolAdapter<T = unknown> {
  name: string;
  supports(context: { root: string }): boolean | Promise<boolean>;
  plan(context: { root: string }): ToolPlan;
  run(context: { root: string; capabilities: Capability[] }): Promise<T>;
  normalize(result: T): Finding[];
}
export interface ResearchSource { title: string; url: string; kind: 'official' | 'primary'; evidence: EvidenceRef; }
