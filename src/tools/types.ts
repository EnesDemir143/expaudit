import type { AdapterResult, Capability, ExperimentManifest, PathResolution } from '../review/types.js';
import type { Discovery } from '../review/discovery.js';

export interface ToolPlan { adapter: string; command?: string[]; requires: Capability[]; reason: string; }
export interface ToolContext { root: string; manifest: ExperimentManifest; discovery: Discovery; resolutions: PathResolution[]; capabilities: Capability[]; }
export interface ToolAdapter<T = unknown> {
  name: string;
  supports(context: ToolContext): boolean | Promise<boolean>;
  plan(context: ToolContext): ToolPlan;
  run(context: ToolContext): Promise<AdapterResult>;
}
