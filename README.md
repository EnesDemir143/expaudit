# ExpAudit

Evidence-backed audit platform for Python machine-learning, deep-learning, data-science, and computer-vision experiments.

ExpAudit installs the [`ml-experiment-review`](skill/ml-experiment-review/SKILL.md) Agent Skill. The agent invokes its bundled internal runner against a strict, versioned `experiment.md` manifest; users do not need a separate review CLI workflow.

## Features

- **Strict manifests**: every audit starts from a schema-validated `experiment.md`, never chat or repository intent inference.
- **Declared versus observed**: verifies manifest declarations against read-only configs, Python source, data manifests, metrics, artifacts, and local tracker metadata.
- **Evidence-backed findings**: confirmed findings always carry a verifiable, redacted source reference.
- **Safe by default**: static checks do not execute project code, install packages, mutate project environments, or use the network.
- **Python ML coverage**: tabular ML, image classification, detection, segmentation, time series, and other Python ML workloads.
- **Portable Agent Skill**: the canonical skill includes its internal runtime and works with supported Agent Skills directories.

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

## Manifest

Create a strict manifest before asking the installed agent to audit it:

```bash
npx expaudit-cli experiment init experiments/E12 --id E12 --task image-segmentation
```

The command writes `experiments/E12/experiment.md`. Fill every field or explicitly use `null`/`false` when it does not apply. Completed experiments must declare metrics and checkpoint artifacts; planned experiments explicitly mark those artifacts absent.

The agent validates the manifest, resolves only repository-confined paths, collects bounded read-only evidence, runs selected adapters, compares declarations with observations, and emits Markdown/chat/JSON/SARIF reports with coverage and a verdict.

Read the [workflow](skill/ml-experiment-review/references/workflow.md), [manifest contract](skill/ml-experiment-review/references/manifest.md), [evidence policy](skill/ml-experiment-review/references/evidence-policy.md), and [adapter policy](skill/ml-experiment-review/references/adapters.md).

## Agent Skill

The canonical source is [`skill/ml-experiment-review/`](skill/ml-experiment-review/). Its `SKILL.md` uses standard YAML frontmatter, has the stable name `ml-experiment-review`, and keeps detailed workflows in `references/` for progressive loading.

## Safety and Requirements

- Node.js 20 or later is required.
- Static review and installation do not require Python, network access, GPU access, or project dependency changes.
- Runtime probes, isolated tool-environment setup, network access, GPU use, and persistent writes are separate opt-in capabilities.
- Runtime probing requires an explicit manifest module/factory/sample allowlist plus runtime and install consent. It is user-authorized execution, not a full security sandbox.
- Review discovery is path-confined, symlink-safe, bounded, and redacts secrets from evidence.

## Optional Integrations

None of these tools is installed by `init`; the audit still works without them. `expaudit doctor` and `expaudit tools doctor` report local availability. ExpAudit does not modify Kilo MCP configuration.

| Integration | Use |
| --- | --- |
| Context7 | Optional documentation research outside the audit engine |
| Semgrep | Static rule scan normalization |
| Ruff | Python lint findings |
| Pyright | Python type findings |
| Pandera / Great Expectations | Data-quality validation |
| Deepchecks | ML data/model checks |
| pip-audit / OSV | Dependency advisories |
| MLflow / W&B / DVC | Local experiment metadata |
| `uv` | Preferred isolated runtime environment |
| Conda / Mamba | Prefix-isolated runtime fallback |

## Development

```bash
npm install
npm test
npm run lint
npm run build
npm run validate-skill
```

## Project Planning

Future work is planned before implementation. The [roadmap](docs/ROADMAP.md) groups work by intended version, and every planned GitHub issue has a reviewable solution plan under [`docs/issues/`](docs/issues/). See the [issue workflow](docs/ISSUE_WORKFLOW.md) for the plan, implementation, verification, and closure lifecycle.

## Contributing and Security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing or implementing changes. Community expectations are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md); security-sensitive reports belong in the private process described by [SECURITY.md](SECURITY.md).

## Troubleshooting

### `Unsupported platform`

Run `npx expaudit-cli platforms` and select one of the listed values. For another Agent Skills-compatible tool, use `--platform generic` when it reads `.agents/skills/`, or copy the canonical `skill/ml-experiment-review/` directory to that tool's documented skills location.

### An installation will not update

ExpAudit protects files recorded in `.expaudit-install.json`. If a managed skill file was edited locally, inspect the change and use `--force` only when replacing it is intentional.

## License

[MIT](LICENSE)
