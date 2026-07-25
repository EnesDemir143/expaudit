#!/usr/bin/env node
import { Command } from 'commander';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import packageJson from '../package.json' with { type: 'json' };
import { platforms } from './platforms/registry.js';
import { installSkill, uninstallSkill } from './installer/installer.js';
import { initExperiment } from './commands/experiment.js';
import { validateSkill } from './commands/skill.js';
import { capabilityRegistry } from './tools/capabilities.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const program = new Command().name('expaudit').description('ExpAudit evidence-backed ML experiment review').version(packageJson.version);
const rootOption = (command: Command) => command.option('--root <path>', 'repository root', process.cwd());
for (const commandName of ['init', 'update'] as const) {
  rootOption(program.command(commandName)).option('--platform <platform>', 'target platform', 'kilo').option('--global', 'install globally').option('--force', 'replace managed or existing files').action(async (options) => {
    const destination = await installSkill({ packageRoot, root: resolve(options.root), platform: options.platform, global: options.global, force: options.force });
    console.log(`${commandName === 'init' ? 'Installed' : 'Updated'} ml-experiment-review at ${destination}`);
  });
}
rootOption(program.command('uninstall')).option('--platform <platform>', 'target platform', 'kilo').option('--global', 'uninstall globally').option('--force', 'remove modified managed files').action(async (options) => {
  const removed = await uninstallSkill({ root: resolve(options.root), platform: options.platform, global: options.global, force: options.force });
  console.log(`Removed ${removed.length} managed files.`);
});
program.command('platforms').action(() => console.log(platforms.map((platform) => `${platform.name}: project=${platform.projectPath}`).join('\n')));
rootOption(program.command('doctor')).action(async (options) => {
  const legacy = resolve(options.root, '.kilocode'); let legacyMessage = 'not present';
  try { await access(legacy); legacyMessage = 'present; Kilo target is .kilo/skills, migrate deliberately.'; } catch { /* absent */ }
  const tools = ['uv', 'micromamba', 'mamba', 'conda', 'ruff', 'pyright', 'semgrep', 'pip-audit', 'osv-scanner', 'mlflow', 'wandb', 'dvc'];
  const availability = tools.map((tool) => `${tool}: ${spawnSync(tool, ['--version'], { stdio: 'ignore' }).status === 0 ? 'available' : 'not detected'}`).join('\n');
  console.log(`ExpAudit doctor\nNode: ${process.version}\nLegacy .kilocode: ${legacyMessage}\n${availability}`);
});
const experiment = program.command('experiment');
experiment.command('init <directory>').requiredOption('--id <id>', 'experiment ID').requiredOption('--task <task>', 'Python ML task').option('--force', 'overwrite experiment.md').action(async (directory, options) => { await initExperiment(directory, options.id, options.task, options.force); console.log(`Created ${resolve(directory, 'experiment.md')}`); });
program.command('validate-skill').action(async () => { const result = await validateSkill(resolve(packageRoot, 'skill/ml-experiment-review')); console.log(result.valid ? 'Skill valid.' : result.errors.join('\n')); if (!result.valid) process.exitCode = 1; });
const tools = program.command('tools');
tools.command('list').action(() => console.log(Object.entries(capabilityRegistry).map(([name, value]) => `${name}: ${value.description}`).join('\n')));
tools.command('doctor').action(() => console.log(['uv', 'micromamba', 'mamba', 'conda', 'ruff', 'pyright', 'semgrep', 'pip-audit', 'mlflow', 'wandb', 'dvc'].map((tool) => `${tool}: ${spawnSync(tool, ['--version'], { stdio: 'ignore' }).status === 0 ? 'available' : 'not detected'}`).join('\n')));
program.parseAsync().catch((error: Error) => { console.error(`ExpAudit error: ${error.message}`); process.exitCode = 1; });
