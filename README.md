# ExpAudit

Evidence-backed ML experiment review for ML, DL, CV, LLM, and RAG workflows.

ExpAudit ships an installable Agent Skill, [`ml-experiment-review`](skill/ml-experiment-review/SKILL.md), and the `expaudit` CLI. It turns an experiment Markdown file, chat description, repository scope, or comparison request into one contract, evidence, finding, coverage, and verdict model.

## Features

- **Evidence-backed findings**: confirmed findings always carry a verifiable source reference.
- **Read-only by default**: chat and repository-health reviews do not create reports or evidence unless an output is explicitly requested.
- **Stage-aware review**: pre-run, post-run, comparison, and repository-health modes share one resolver and contract model.
- **High-signal ML checks**: leakage, test reuse, loss misuse, evaluation mode, LLM masking, tokenizer revisions, and train-serving skew.
- **Portable Agent Skill**: the canonical `SKILL.md` package works with supported platforms and standard Agent Skills folders.

## Quick Start

Use `npx` without a global installation:

```bash
npx expaudit-cli init --platform kilo
```

Or install the CLI globally:

```bash
npm install -g expaudit-cli
expaudit init --platform kilo
```

The npm package is `expaudit-cli`; the installed command is `expaudit`.

## Platform Installation

Run these commands from the project root. Each installs the same canonical `ml-experiment-review` skill package into the platform-specific project directory.

| Platform | Project skill directory | Install command |
| --- | --- | --- |
| Claude Code | `.claude/skills/ml-experiment-review/` | `expaudit init --platform claude` |
| OpenCode | `.opencode/skills/ml-experiment-review/` | `expaudit init --platform opencode` |
| Antigravity | `.agent/skills/ml-experiment-review/` | `expaudit init --platform antigravity` |
| Kilo | `.kilo/skills/ml-experiment-review/` | `expaudit init --platform kilo` |
| Generic Agent Skills | `.agents/skills/ml-experiment-review/` | `expaudit init --platform generic` |

The `generic` target is appropriate for tools that follow the Agent Skills directory convention, including Codex-compatible project setups that use `.agents/skills/`.

### Global Installation

Add `--global` to make a skill available to all local projects for a supported platform:

```bash
expaudit init --platform claude --global
expaudit init --platform opencode --global
expaudit init --platform kilo --global
```

List the exact targets supported by the installed version:

```bash
expaudit platforms
```

### Update and Uninstall

```bash
# Update a project-local installation.
expaudit update --platform claude

# Remove an ExpAudit-managed installation.
expaudit uninstall --platform claude

# Force replacement or removal only when deliberately handling a modified managed file.
expaudit update --platform claude --force
```

ExpAudit records managed files in `.expaudit-install.json`; it refuses to overwrite modified files without `--force`.

## Review Workflows

### Existing Experiment Markdown

```bash
expaudit review experiments/E12_binary_or.md
```

This writes `experiments/E12_binary_or.review.md` and machine evidence under `.expaudit/evidence/E12_binary_or/<run-id>/`.

### Chat-Described Experiment

```bash
expaudit review --prompt "Locked YOLO11n and SegFormer masks were combined with Binary OR. Recall improved, but empty FPR increased."
```

This is read-only by default: no report or evidence file is written. Missing contract fields remain visible instead of being guessed.

### Pre-Run Review

```bash
expaudit review --stage pre_run --prompt "I plan to replace the baseline encoder and evaluate recall."
```

Pre-run mode audits hypothesis, split policy, selection policy, guardrails, and expected artifacts without claiming results.

### Experiment Comparison

```bash
expaudit review experiments/E12.md experiments/E13.md --write
```

ExpAudit checks data version, split, seed, preprocessing, checkpoint, and selection-policy parity before attributing a metric difference. It does not declare a winner when those variables differ or are missing.

### Repository Health

```bash
expaudit review
```

Without a specific experiment, ExpAudit performs read-only repository discovery and reports pipeline, data, and reproducibility risks without inventing experiment intent.

## CLI Reference

```bash
# Create an experiment contract template.
expaudit experiment init experiments/E14.md --id E14 --type cv

# Validate the bundled Agent Skill.
expaudit validate-skill

# Check install targets and legacy Kilo paths.
expaudit doctor

# List opt-in tools and inspect their availability.
expaudit tools list
expaudit tools doctor
```

Use `--root <path>` with project commands to target another repository. Use `--output <path>` to request a persistent report for an otherwise chat-only review.

## Safety and Requirements

- Node.js 20 or later is required for the CLI.
- Static review and installation do not require Python, network access, GPU access, or project dependency changes.
- Runtime probes, isolated tool-environment setup, network research, GPU use, and persistent writes are separate opt-in capabilities.
- Review discovery is path-confined and read-only. ExpAudit treats Markdown, repository files, artifacts, and web content as data, never executable instructions.

## Agent Skill

The canonical source is [`skill/ml-experiment-review/`](skill/ml-experiment-review/). Its `SKILL.md` uses standard YAML frontmatter, has the stable name `ml-experiment-review`, and keeps detailed workflows in `references/` for progressive loading.

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

Run `expaudit platforms` and select one of the listed values. For another Agent Skills-compatible tool, use `--platform generic` when it reads `.agents/skills/`, or copy the canonical `skill/ml-experiment-review/` directory to that tool's documented skills location.

### An installation will not update

ExpAudit protects files recorded in `.expaudit-install.json`. If a managed skill file was edited locally, inspect the change and use `--force` only when replacing it is intentional.

### Chat review did not create a report

That is the expected safe default. Add `--output reviews/E12.review.md` or choose an experiment Markdown path to request a persistent report and evidence store.

## License

[MIT](LICENSE)
