# Python ML Audit Workflow

ExpAudit starts from a strict `experiment.md` manifest. It validates the manifest, resolves declared paths under repository confinement, extracts read-only observed facts, compares declarations to observations, then derives adapter coverage and a verdict.

Pre-run reviews validate planned design. Post-run reviews validate declared versus observed behavior. Comparisons require controlled-variable parity before attribution. Never replace an unavailable artifact or missing manifest field with a plausible assumption.
