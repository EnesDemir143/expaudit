import type { Discovery } from '../discovery.js';
import type { Finding } from '../types.js';
import { pythonFiles, pythonIsParsable, pythonSource, staticFinding } from './common.js';

export function tensorChecks(discovery: Discovery): Finding[] {
  const findings: Finding[] = [];
  for (const file of pythonFiles(discovery)) {
    if (!pythonIsParsable(file)) continue;
    const text = pythonSource(file);
    const bce = /(?:torch\.nn\.)?BCEWithLogitsLoss\s*\(/.test(text);
    const bceCall = text.match(/(?:criterion|loss_fn)\s*\(\s*(?:torch\.)?sigmoid\([^\n]+/)?.[0];
    if (bce && bceCall) findings.push(staticFinding('loss-bce-sigmoid', 'tensor-training', 'high', 'high-confidence', 'Sigmoid appears on the path into BCEWithLogitsLoss.', file, bceCall, 'Pass raw logits to BCEWithLogitsLoss; apply sigmoid only for metrics or inference.'));
    const crossEntropy = /(?:torch\.nn\.)?CrossEntropyLoss\s*\(/.test(text);
    const ceCall = text.match(/(?:criterion|loss_fn)\s*\(\s*(?:torch\.)?(?:nn\.functional\.)?softmax\([^\n]+/)?.[0];
    if (crossEntropy && ceCall) findings.push(staticFinding('loss-crossentropy-softmax', 'tensor-training', 'high', 'high-confidence', 'Softmax appears on the path into CrossEntropyLoss.', file, ceCall, 'Pass raw logits to CrossEntropyLoss; apply softmax only after loss computation.'));
    const optimizer = text.match(/(?:torch\.optim\.)?\w+\s*\(\s*(?!model\.parameters\(\)|\[[^\]]*model\.parameters\(\))[^\n]{0,200}/)?.[0];
    if (optimizer && /optimizer/i.test(optimizer)) findings.push(staticFinding('optimizer-parameters', 'tensor-training', 'medium', 'review-required', 'Optimizer construction may omit model parameters.', file, optimizer, 'Verify every trainable parameter is intentionally passed to the optimizer.'));
  }
  return findings;
}
