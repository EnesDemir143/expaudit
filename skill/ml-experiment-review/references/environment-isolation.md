# Environment Isolation

Runtime and tool environments live outside the target repository in the ExpAudit user cache. Manager precedence is `uv`, `micromamba`, `mamba`, `conda`, then an external `venv`.

ExpAudit never activates, reuses, mutates, or deletes a project `.venv`, named Conda environment, lockfile, or dependency declaration. Runtime execution is explicitly authorized but is not a full security sandbox.
