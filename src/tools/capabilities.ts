import type { Capability, Finding } from '../review/types.js';
import { statusFinding } from '../review/findings.js';
import type { ToolPlan } from './types.js';

export function requiresConsent(plan: ToolPlan, granted: Capability[]): Finding | undefined {
  const missing = plan.requires.filter((capability) => !granted.includes(capability));
  return missing.length ? statusFinding(`capability-${plan.adapter}`, 'capability', 'not-executable', `${plan.adapter} requires explicit capability: ${missing.join(', ')}.`, 'info') : undefined;
}

export const capabilityRegistry: Record<Capability, { mutation: boolean; description: string }> = {
  write: { mutation: true, description: 'Create persistent reports or evidence.' },
  network: { mutation: false, description: 'Access remote dependency advisories or tracker services.' },
  runtime: { mutation: false, description: 'Run bounded isolated runtime probes.' },
  install: { mutation: true, description: 'Create an isolated tool environment; never mutate project dependencies.' },
  gpu: { mutation: false, description: 'Use GPU for an explicitly approved runtime probe.' },
};
