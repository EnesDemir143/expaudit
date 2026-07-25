#!/usr/bin/env node
import { executeReview } from './review/engine.js';
import type { Capability, ReviewDepth, ReviewStage, ReviewTarget } from './review/types.js';

interface RunnerInput { manifestPath: string; repositoryRoot?: string; target?: ReviewTarget; stage?: ReviewStage; depth?: ReviewDepth; output?: string; write?: boolean; capabilities?: Capability[]; }

async function stdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function main(): Promise<void> {
  const input = JSON.parse(await stdin()) as RunnerInput;
  if (!input.manifestPath) throw new Error('manifestPath is required.');
  const result = await executeReview({ paths: [input.manifestPath], target: input.target, stage: input.stage, depth: input.depth, output: input.output, write: input.write, capabilities: input.capabilities }, input.repositoryRoot ?? process.cwd());
  process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
}

main().catch((error: Error) => { process.stderr.write(`ExpAudit runner error: ${error.message}\n`); process.exitCode = 1; });
