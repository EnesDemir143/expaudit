# Security Policy

## Supported Versions

Security fixes are applied to the latest `main` branch and the latest published package release.

## Reporting a Vulnerability

Do not file public issues for vulnerabilities involving path traversal, symlink escapes, arbitrary code execution, secret disclosure, unsafe environment mutation, package-install behavior, or report/evidence leakage.

Use GitHub's private security advisory flow for this repository. Include a minimal reproduction, affected version or commit, impact, and any suggested mitigation. Do not include real credentials or sensitive dataset content.

## Security Boundaries

ExpAudit static analysis treats repositories as data. Runtime probes are separately consented, manifest allowlisted, isolated from target environments, and are not a full sandbox.
