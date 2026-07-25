import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { getPlatform, type PlatformName } from '../platforms/registry.js';

interface OwnedFile { path: string; hash: string; }
interface InstallManifest { version: 1; platform: PlatformName; files: OwnedFile[]; }
const manifestName = '.expaudit-install.json';
const hash = (content: Buffer | string) => createHash('sha256').update(content).digest('hex');
async function exists(path: string): Promise<boolean> { try { await stat(path); return true; } catch { return false; } }
async function filesAt(root: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const result: string[] = [];
  async function walk(directory: string): Promise<void> { for (const entry of await readdir(directory, { withFileTypes: true })) { const path = join(directory, entry.name); if (entry.isDirectory()) await walk(path); else if (entry.isFile()) result.push(path); } }
  await walk(root); return result;
}
async function readManifest(path: string): Promise<InstallManifest | undefined> { try { return JSON.parse(await readFile(path, 'utf8')) as InstallManifest; } catch { return undefined; } }

export async function installSkill(options: { packageRoot: string; root: string; platform: PlatformName; global?: boolean; force?: boolean }): Promise<string> {
  const platform = getPlatform(options.platform);
  const destinationBase = options.global ? platform.globalPath : resolve(options.root, platform.projectPath);
  const destination = join(destinationBase, 'ml-experiment-review');
  const manifestRoot = options.global ? dirname(destinationBase) : options.root;
  const manifestPath = join(manifestRoot, manifestName);
  const source = join(options.packageRoot, 'skill', 'ml-experiment-review');
  const prior = await readManifest(manifestPath);
  if (await exists(destination)) {
    const owned = prior?.files.some((file) => file.path.startsWith(relative(manifestRoot, destination)));
    if (!owned && !options.force) throw new Error(`Refusing to overwrite existing ${destination}; use --force only for an intentional replacement.`);
    if (owned && !options.force) for (const file of prior!.files) {
      const absolute = resolve(manifestRoot, file.path);
      if (await exists(absolute) && hash(await readFile(absolute)) !== file.hash) throw new Error(`Refusing to overwrite modified managed file: ${absolute}. Use --force to replace it.`);
    }
  }
  await mkdir(destinationBase, { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
  const files = await filesAt(destination);
  const manifest: InstallManifest = { version: 1, platform: options.platform, files: await Promise.all(files.map(async (path) => ({ path: relative(manifestRoot, path), hash: hash(await readFile(path)) }))) };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return destination;
}

export async function uninstallSkill(options: { root: string; platform: PlatformName; global?: boolean; force?: boolean }): Promise<string[]> {
  const platform = getPlatform(options.platform);
  const destinationBase = options.global ? platform.globalPath : resolve(options.root, platform.projectPath);
  const manifestRoot = options.global ? dirname(destinationBase) : options.root;
  const manifestPath = join(manifestRoot, manifestName);
  const manifest = await readManifest(manifestPath);
  if (!manifest) throw new Error(`No ExpAudit ownership manifest at ${manifestPath}.`);
  const removed: string[] = [];
  for (const file of manifest.files) {
    const absolute = resolve(manifestRoot, file.path);
    if (await exists(absolute) && (options.force || hash(await readFile(absolute)) === file.hash)) { await rm(absolute); removed.push(absolute); }
  }
  await rm(join(destinationBase, 'ml-experiment-review'), { recursive: true, force: true });
  await rm(manifestPath, { force: true });
  return removed;
}
