# Manifest Contract

`experiment.md` begins with versioned YAML frontmatter validated by `schemas/experiment-manifest.schema.json`.

Every top-level section is required. Use `null` or `false` for an inapplicable value rather than omitting it. Supported tasks are tabular classification/regression, image classification, object detection, image segmentation, time series, and other Python ML. Other workload types are out of scope.

Paths are repository-root-relative. Exact paths win. A unique, high-confidence renamed candidate can be labeled `inferred`; tied candidates are never executed.
