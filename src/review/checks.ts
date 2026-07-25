import type { Discovery, DiscoveredFile } from './discovery.js';
import { lineEvidence } from './discovery.js';
import { createFinding } from './findings.js';
import type { Finding } from './types.js';

const pythonFiles = (discovery: Discovery) => discovery.files.filter((file) => /\.py$/i.test(file.path) && file.text);
const occurrence = (file: DiscoveredFile, expression: RegExp): string | undefined => file.text?.match(expression)?.[0];
const finding = (id: string, category: string, severity: Finding['severity'], status: Finding['status'], summary: string, file: DiscoveredFile, snippet: string, recommendation: string): Finding => createFinding({
  id, category, severity, status, confidence: status === 'confirmed' ? 'high' : 'medium', scope: 'repository-static', summary,
  evidence: [lineEvidence(file, snippet)], impact: summary, recommendation, verification: 'Inspect the referenced source location and rerun this review.',
});

export function runStaticChecks(discovery: Discovery): Finding[] {
  const results: Finding[] = [];
  for (const file of pythonFiles(discovery)) {
    const text = file.text!;
    const bce = occurrence(file, /(?:torch\.nn\.)?BCEWithLogitsLoss\s*\(/);
    const sigmoid = occurrence(file, /(?:torch\.)?sigmoid\s*\([^\n]{0,200}(?:BCEWithLogitsLoss|criterion)|(?:BCEWithLogitsLoss|criterion)[^\n]{0,200}(?:torch\.)?sigmoid/i);
    if (bce && sigmoid) results.push(finding('loss-bce-sigmoid', 'tensor-training', 'high', 'high-confidence', 'Sigmoid appears on the path into BCEWithLogitsLoss.', file, sigmoid, 'Pass raw logits to BCEWithLogitsLoss; apply sigmoid only for metrics or inference.'));
    const crossEntropy = occurrence(file, /(?:torch\.nn\.)?CrossEntropyLoss\s*\(/);
    const softmax = occurrence(file, /(?:torch\.)?(?:nn\.functional\.)?softmax\s*\([^\n]{0,200}(?:CrossEntropyLoss|criterion)|(?:CrossEntropyLoss|criterion)[^\n]{0,200}(?:torch\.)?(?:nn\.functional\.)?softmax/i);
    if (crossEntropy && softmax) results.push(finding('loss-crossentropy-softmax', 'tensor-training', 'high', 'high-confidence', 'Softmax appears on the path into CrossEntropyLoss.', file, softmax, 'Pass raw logits to CrossEntropyLoss; apply softmax only after loss computation.'));
    const evalFunction = occurrence(file, /def\s+(?:validate|evaluate|inference|predict)\s*\([^)]*\):[\s\S]{0,700}/);
    if (evalFunction && !/\.eval\s*\(/.test(evalFunction)) results.push(finding('evaluation-missing-eval', 'evaluation', 'medium', 'review-required', 'Evaluation-like function does not call model.eval().', file, evalFunction, 'Call model.eval() before validation or inference.'));
    if (evalFunction && !/(?:torch\.)?no_grad\s*\(|inference_mode\s*\(/.test(evalFunction)) results.push(finding('evaluation-grad-enabled', 'evaluation', 'medium', 'review-required', 'Evaluation-like function has no visible no_grad or inference_mode context.', file, evalFunction, 'Use torch.no_grad() or torch.inference_mode() around evaluation.'));
    const optimizer = occurrence(file, /(?:torch\.optim\.)?\w+\s*\(\s*(?!model\.parameters\(\)|\[[^\]]*model\.parameters\(\))[^\n]{0,200}/);
    if (optimizer && /optimizer/i.test(optimizer)) results.push(finding('optimizer-parameters', 'tensor-training', 'medium', 'review-required', 'Optimizer construction may omit model parameters.', file, optimizer, 'Verify every trainable parameter is intentionally passed to the optimizer.'));
    const scalerIndex = text.search(/(?:StandardScaler|MinMaxScaler|RobustScaler|OneHotEncoder)\s*\([^\n]*\)[\s\S]{0,120}\.fit(?:_transform)?\s*\(/);
    const splitIndex = text.search(/train_test_split\s*\(/);
    if (scalerIndex >= 0 && splitIndex >= 0 && scalerIndex < splitIndex) results.push(finding('split-scaler-before-split', 'data-leakage', 'critical', 'confirmed', 'A scaler or encoder is fit before train_test_split.', file, text.slice(scalerIndex, Math.min(scalerIndex + 220, text.length)), 'Split first, then fit preprocessing only on the training partition.'));
    const threshold = occurrence(file, /(?:best_)?threshold\s*=\s*[^\n]*test/i);
    if (threshold) results.push(finding('evaluation-test-threshold-reuse', 'evaluation', 'critical', 'confirmed', 'Test data appears to be used for threshold selection.', file, threshold, 'Select thresholds on validation data and use the test set once for final reporting.'));
    const duplicate = occurrence(file, /(?:merge|isin)\([^\n]{0,200}(?:train|test)[^\n]{0,200}/i);
    if (duplicate && /duplicat|overlap/i.test(text)) results.push(finding('data-duplicate-overlap', 'data-leakage', 'high', 'confirmed', 'Source explicitly indicates train/test duplicate or overlap handling.', file, duplicate, 'Ensure exact duplicates are removed across train, validation, and test partitions.'));
    const group = occurrence(file, /(?:GroupKFold|group(?:_column|_id|_ids)?)[^\n]{0,200}/i);
    if (group && /overlap/i.test(text)) results.push(finding('data-group-overlap', 'data-leakage', 'critical', 'confirmed', 'Source reports a group overlap condition.', file, group, 'Keep patient, user, or group identifiers disjoint across splits.'));
    const setOverlap = occurrence(file, /set\([^\n]*(?:train|val)[^\n]*\)\s*&\s*set\([^\n]*test[^\n]*\)/i);
    if (setOverlap) results.push(finding('data-group-overlap', 'data-leakage', 'critical', 'confirmed', 'A group identifier intersection between partitions is computed.', file, setOverlap, 'Require the intersection to be empty and fail the run if it is not.'));
    const broadcast = occurrence(file, /(?:criterion|loss_fn)\s*\([^,\n]+,\s*[^\n]*(?:unsqueeze|squeeze|reshape|view)\s*\(/i);
    if (broadcast) results.push(finding('loss-shape-broadcasting', 'tensor-training', 'medium', 'review-required', 'Loss inputs are reshaped inline and require shape/axis verification.', file, broadcast, 'Assert exact logits/target shapes before loss computation.'));
    const labels = occurrence(file, /labels\s*=\s*input_ids\.clone\s*\(\)/);
    if (labels && !/labels\s*\[[^\]]*(?:prompt|attention_mask|instruction)/.test(text)) results.push(finding('llm-prompt-loss-mask', 'llm-training', 'high', 'review-required', 'Labels clone input ids without a visible prompt-token masking operation.', file, labels, 'Mask prompt tokens with -100 so loss is computed only for completion tokens.'));
    const tokenizerRevision = occurrence(file, /AutoTokenizer\.from_pretrained\([^\n]+/);
    const modelRevision = occurrence(file, /AutoModel(?:For\w+)?\.from_pretrained\([^\n]+/);
    if (tokenizerRevision && modelRevision && /revision=/.test(tokenizerRevision) !== /revision=/.test(modelRevision)) results.push(finding('hf-tokenizer-model-revision', 'llm-training', 'medium', 'high-confidence', 'Tokenizer and model loading specify revision inconsistently.', file, tokenizerRevision, 'Pin the same compatible tokenizer and model revision.'));
    const normalize = occurrence(file, /(?:Normalize|normaliz(?:e|ation))\([^\n]+/i);
    if (normalize && /inference/i.test(text) && /train/i.test(text) && /mean\s*=|std\s*=/.test(text)) results.push(finding('train-serving-normalization', 'train-serving', 'medium', 'review-required', 'Training and inference normalization definitions require parity verification.', file, normalize, 'Centralize preprocessing and test identical train/inference normalization.'));
  }
  return results;
}
