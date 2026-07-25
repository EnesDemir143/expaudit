import { describe, expect, it } from 'vitest';
import { extractChatContract, extractMarkdownContract, inferRepositoryContract, missingFields } from '../../src/review/contract.js';

describe('contract extraction', () => {
  it('extracts structured frontmatter without inventing missing values', () => {
    const contract = extractMarkdownContract('---\nid: E12\nhypothesis: improve recall\nseed: 42\n---\n# Experiment', 'E12.md');
    expect(contract.identity.value?.id).toBe('E12');
    expect(contract.hypothesis.state).toBe('declared');
    expect(contract.baseline.state).toBe('missing');
    expect(missingFields(contract)).toContain('baseline');
  });

  it('marks chat declarations with explicit source and confidence', () => {
    const contract = extractChatContract('Recall improved with YOLO.', []);
    expect(contract.evaluation.source).toBe('chat-declared');
    expect(contract.evaluation.confidence).toBe('medium');
  });

  it('keeps repository inference inferred and non-high confidence', () => {
    const contract = inferRepositoryContract(['train.py']);
    expect(contract.identity.state).toBe('inferred');
    expect(contract.identity.confidence).toBe('low');
  });
});
