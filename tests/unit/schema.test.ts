import { describe, expect, it } from 'vitest';
import Ajv from 'ajv/dist/2020.js';
import schema from '../../skill/ml-experiment-review/schemas/experiment-contract.schema.json' with { type: 'json' };
import { emptyContract } from '../../src/review/contract.js';
describe('experiment contract schema', () => {
  it.each(['declared', 'observed', 'inferred', 'missing', 'conflicting'] as const)('accepts %s contract state', (state) => {
    const contract = emptyContract(); contract.hypothesis.state = state;
    expect(new Ajv({ strict: false }).compile(schema)(contract)).toBe(true);
  });
});
