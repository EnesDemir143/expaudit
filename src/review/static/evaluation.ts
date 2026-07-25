import type { Discovery } from '../discovery.js';
import type { Finding } from '../types.js';
import { functionBody, pythonFiles, pythonIsParsable, pythonSource, staticFinding } from './common.js';

export function evaluationChecks(discovery: Discovery): Finding[] {
  const findings: Finding[] = [];
  for (const file of pythonFiles(discovery)) {
    if (!pythonIsParsable(file)) continue;
    const text = pythonSource(file);
    for (const name of ['validate', 'evaluate', 'inference', 'predict']) {
      const body = functionBody(text, name);
      if (!body) continue;
      if (!/\.eval\s*\(/.test(body)) findings.push(staticFinding('evaluation-missing-eval', 'evaluation', 'medium', 'review-required', `Evaluation-like function ${name} does not call model.eval().`, file, body, 'Call model.eval() before validation or inference.'));
      if (!/(?:torch\.)?no_grad\s*\(|inference_mode\s*\(/.test(body)) findings.push(staticFinding('evaluation-grad-enabled', 'evaluation', 'medium', 'review-required', `Evaluation-like function ${name} has no visible no_grad or inference_mode context.`, file, body, 'Use torch.no_grad() or torch.inference_mode() around evaluation.'));
    }
  }
  return findings;
}
