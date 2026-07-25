# Planning and Issue Workflow

## Lifecycle

1. **Plan**: write or update `docs/issues/NNN-slug.md` with scope, constraints, alternatives, acceptance criteria, and tests.
2. **Open**: create the matching GitHub issue and link the plan path in its body.
3. **Review**: the maintainer reviews the plan. No production implementation occurs in this state.
4. **Implement**: only after an explicit instruction such as “reconsider and implement issue NNN”. Re-read the plan and issue before changing code.
5. **Verify**: run targeted fixtures plus `npm test`, `npm run lint`, `npm run build`, and `npm run validate-skill`.
6. **Close**: update the issue with implementation links, validation output, caveats, and any deferred work; then close it.

## Plan Requirements

Every issue plan must state:

- User value and version milestone.
- In-scope and explicitly excluded behavior.
- File/module touch points and public contract changes.
- Consent, privacy, path-confinement, and environment-isolation rules.
- Test fixtures and acceptance criteria.
- Dependencies, rollout order, and unresolved decisions.

## Parallel Research Rule

Independent analysis tasks may run in parallel, but only one synthesizer produces the final report and plan. Subagents return structured evidence and recommendations; they do not make conflicting edits or execute target code unless the parent workflow has granted the required capability.
