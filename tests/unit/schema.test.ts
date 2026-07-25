import { describe, expect, it } from 'vitest';
import Ajv from 'ajv/dist/2020.js';
import schema from '../../skill/ml-experiment-review/schemas/experiment-manifest.schema.json' with { type: 'json' };
describe('experiment manifest schema', () => {
  it('requires the explicit strict manifest sections', () => {
    const validate = new (Ajv as unknown as new (options: object) => { compile: (value: object) => (input: unknown) => boolean })({ strict: false }).compile(schema);
    expect(validate({ schemaVersion: 1, id: 'E12' })).toBe(false);
  });
});
