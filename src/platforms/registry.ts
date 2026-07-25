import { homedir } from 'node:os';
import { join } from 'node:path';

export type PlatformName = 'claude' | 'opencode' | 'antigravity' | 'kilo' | 'generic';
export interface Platform { name: PlatformName; projectPath: string; globalPath: string; }
export const platforms: Platform[] = [
  { name: 'claude', projectPath: '.claude/skills', globalPath: join(homedir(), '.claude/skills') },
  { name: 'opencode', projectPath: '.opencode/skills', globalPath: join(homedir(), '.opencode/skills') },
  { name: 'antigravity', projectPath: '.agent/skills', globalPath: join(homedir(), '.agent/skills') },
  { name: 'kilo', projectPath: '.kilo/skills', globalPath: join(homedir(), '.kilo/skills') },
  { name: 'generic', projectPath: '.agents/skills', globalPath: join(homedir(), '.agents/skills') },
];
export function getPlatform(name: string): Platform {
  const platform = platforms.find((item) => item.name === name);
  if (!platform) throw new Error(`Unsupported platform: ${name}`);
  return platform;
}
