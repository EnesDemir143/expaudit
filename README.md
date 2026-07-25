# ExpAudit

Evidence-backed ML experiment review for ML, DL, CV, LLM, and RAG workflows.

ExpAudit provides the installable Agent Skill [`ml-experiment-review`](skill/ml-experiment-review/SKILL.md) and the `expaudit-cli` command-line package. It turns an experiment Markdown file, chat description, repository scope, or comparison request into one contract, evidence, finding, coverage, and verdict model.

## Agent Skill

The canonical skill lives at [`skill/ml-experiment-review/`](skill/ml-experiment-review/). Its `SKILL.md` has standard YAML frontmatter with the stable name `ml-experiment-review` and a concise English description for Agent Skills crawlers.

### Installation

```bash
npx expaudit-cli init --platform kilo
```

Supported targets are Claude, OpenCode, Antigravity, Kilo, and generic Agent Skills folders. For a project-local Kilo install, the command writes to `.kilo/skills/ml-experiment-review/`.

## Review Modes

```bash
# Persistent sibling review plus evidence
expaudit review experiments/E12_binary_or.md

# Read-only chat review; no report or evidence is written
expaudit review --prompt "YOLO11n and SegFormer masks were combined with Binary OR."

# Persistent comparison
expaudit review experiments/E12.md experiments/E13.md --write
```

Experiment Markdown reviews produce `<experiment>.review.md` and persistent evidence under `.expaudit/evidence/`. Chat-only reviews are read-only by default.

## SkillsMP Discovery

SkillsMP aggregates public GitHub repositories containing standard `SKILL.md` packages; it does not provide a manual submission endpoint or require a SkillsMP-specific manifest. To become eligible for discovery:

1. Create a public GitHub repository named `expaudit`.
2. Commit this repository, including `skill/ml-experiment-review/SKILL.md` and the MIT license.
3. Push the default branch to GitHub and allow the marketplace's normal GitHub crawl to discover it.

The repository should be searchable on SkillsMP by `ml-experiment-review` after its crawler has processed the public GitHub source. Discovery timing and catalog ranking are controlled by SkillsMP.

## Development

```bash
npm install
npm test
npm run lint
npm run build
npm run validate-skill
```

## License

[MIT](LICENSE)
