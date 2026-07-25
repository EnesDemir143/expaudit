import type { Coverage, Finding, ReviewVerdict } from './types.js';

export function deriveVerdict(findings: Finding[], coverage: Coverage): ReviewVerdict {
  const critical = findings.some((finding) => finding.severity === 'critical' && finding.status === 'confirmed');
  if (critical) return { value: 'not-reliable-yet', rationale: 'A confirmed critical finding invalidates the reported outcome.', coverage };
  if (coverage.required.some((check) => !coverage.completed.includes(check))) return { value: 'blocked-insufficient-evidence', rationale: 'Required review coverage is incomplete.', coverage };
  if (findings.some((finding) => ['high', 'critical'].includes(finding.severity) || ['review-required', 'not-executable'].includes(finding.status))) return { value: 'reliable-with-caveats', rationale: 'No confirmed critical finding, but material risks or coverage limits remain.', coverage };
  return { value: 'reliable-enough', rationale: 'Required checks completed without critical or high-severity findings.', coverage };
}
