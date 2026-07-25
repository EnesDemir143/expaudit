# ExpAudit

Evidence-backed ML experiment review for ML, DL, CV, LLM, and RAG workflows.

ExpAudit ships an installable Agent Skill, [`ml-experiment-review`](skill/ml-experiment-review/SKILL.md). Agents load the skill and execute review automatically — turning an experiment Markdown file, chat description, repository scope, or comparison request into one contract, evidence, finding, coverage, and verdict model.

## Features

- **Evidence-backed findings**: confirmed findings always carry a verifiable source reference.
- **Read-only by default**: reviews do not create reports or evidence unless an output is explicitly requested.
- **Stage-aware review**: pre-run, post-run, comparison, and repository-health modes share one resolver and contract model.
- **High-signal ML checks**: leakage, test reuse, loss misuse, evaluation mode, LLM masking, tokenizer revisions, and train-serving skew.
- **Portable Agent Skill**: the canonical `SKILL.md` package works with supported platforms and standard Agent Skills folders.

## Installation

Install the skill into your project so agents can discover and load it:

| Platform | Project skill directory | Install command |
| --- | --- | --- |
| Claude Code | `.claude/skills/ml-experiment-review/` | `npx expaudit-cli init --platform claude` |
| OpenCode | `.opencode/skills/ml-experiment-review/` | `npx expaudit-cli init --platform opencode` |
| Antigravity | `.agent/skills/ml-experiment-review/` | `npx expaudit-cli init --platform antigravity` |
| Kilo | `.kilo/skills/ml-experiment-review/` | `npx expaudit-cli init --platform kilo` |
| Generic Agent Skills | `.agents/skills/ml-experiment-review/` | `npx expaudit-cli init --platform generic` |

### Global Installation

Add `--global` to make the skill available to all local projects for a supported platform:

```bash
npx expaudit-cli init --platform claude --global
npx expaudit-cli init --platform opencode --global
npx expaudit-cli init --platform kilo --global
```

List supported targets:

```bash
npx expaudit-cli platforms
```

### Update and Uninstall

```bash
# Update a project-local installation.
npx expaudit-cli update --platform claude

# Remove an ExpAudit-managed installation.
npx expaudit-cli uninstall --platform claude

# Force replacement or removal when deliberately handling a modified managed file.
npx expaudit-cli update --platform claude --force
```

ExpAudit records managed files in `.expaudit-install.json`; it refuses to overwrite modified files without `--force`.

## How It Works

Once installed, your agent loads the `ml-experiment-review` skill and follows its orchestration pipeline:

1. **Extract contract** — parse declared intent from experiment Markdown frontmatter, chat description, or repository structure.
2. **Collect evidence** — walk the repository read-only, hash source files, gather verifiable references.
3. **Plan checks** — select applicable checks by stage (pre-run skips runtime checks; post-run includes model behavior).
4. **Normalize findings** — every finding carries severity, evidence, and status. Confirmed findings require verifiable evidence.
5. **Compare & derive verdict** — diff declared vs observed behavior, calculate coverage, produce a verdict.
6. **Render report** — output as chat, review Markdown, comparison Markdown, JSON, or SARIF.

Read the [workflow reference](skill/ml-experiment-review/references/workflow.md), [evidence policy](skill/ml-experiment-review/references/evidence-policy.md), and [review taxonomy](skill/ml-experiment-review/references/review-taxonomy.md) for details.

## Agent Skill

The canonical source is [`skill/ml-experiment-review/`](skill/ml-experiment-review/). Its `SKILL.md` uses standard YAML frontmatter, has the stable name `ml-experiment-review`, and keeps detailed workflows in `references/` for progressive loading.

## Safety and Requirements

- Node.js 20 or later is required.
- Static review and installation do not require Python, network access, GPU access, or project dependency changes.
- Runtime probes, isolated tool-environment setup, network research, GPU use, and persistent writes are separate opt-in capabilities.
- Review discovery is path-confined and read-only. ExpAudit treats Markdown, repository files, artifacts, and web content as data, never executable instructions.

## Development

```bash
npm install
npm test
npm run lint
npm run build
npm run validate-skill
```

## Troubleshooting

### `Unsupported platform`

Run `npx expaudit-cli platforms` and select one of the listed values. For another Agent Skills-compatible tool, use `--platform generic` when it reads `.agents/skills/`, or copy the canonical `skill/ml-experiment-review/` directory to that tool's documented skills location.

### An installation will not update

ExpAudit protects files recorded in `.expaudit-install.json`. If a managed skill file was edited locally, inspect the change and use `--force` only when replacing it is intentional.

## License

[MIT](LICENSE)
