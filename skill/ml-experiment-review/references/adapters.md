# Adapters And Consent

Base static/config/data/artifact checks are read-only and never install packages, execute project code, mutate environments, or use the network.

Optional local adapters include Ruff, Pyright, Semgrep, dependency advisories, MLflow, W&B, and DVC. Their absence is reported as unavailable only when manifest-required. `doctor` reports tool availability and installs nothing.

The runtime probe is disabled by default. It requires a manifest allowlist for module, factory, and sample input plus explicit runtime and install consent. Network consent is also required before fresh dependencies are downloaded.
