export type ReviewSource =
  | 'experiment_md'
  | 'chat_description'
  | 'repository_inference'
  | 'multiple_experiments';
export type ReviewStage = 'pre_run' | 'post_run' | 'comparison' | 'repository_health';
export type ReviewTarget = 'chat' | 'review_md' | 'comparison_md' | 'json' | 'sarif';
export type ReviewDepth = 'quick' | 'standard' | 'deep' | 'ci';
export type ContractSource =
  | 'experiment-md'
  | 'chat-declared'
  | 'repository-inferred'
  | 'run-artifact'
  | 'mixed';
export type ContractState = 'declared' | 'observed' | 'inferred' | 'missing' | 'conflicting';
export type Confidence = 'high' | 'medium' | 'low';
export type FindingStatus =
  | 'confirmed'
  | 'high-confidence'
  | 'review-required'
  | 'not-executable'
  | 'not-applicable'
  | 'passed';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Verdict =
  | 'not-reliable-yet'
  | 'reliable-with-caveats'
  | 'reliable-enough'
  | 'blocked-insufficient-evidence';

export interface EvidenceRef {
  kind: 'file' | 'chat' | 'artifact' | 'command' | 'web';
  path?: string;
  line?: number;
  excerpt?: string;
  hash?: string;
  redacted?: boolean;
}

export interface ContractField<T> {
  value?: T;
  state: ContractState;
  source: ContractSource;
  confidence: Confidence;
  evidence: EvidenceRef[];
}

export interface ExperimentIdentity { id?: string; name?: string; status?: string; }
export interface DataContract { version?: string; splitPolicy?: string; groupColumn?: string; manifest?: string; }
export interface EvaluationContract { primaryMetric?: string; selectionPolicy?: string; testPolicy?: string; }
export interface AcceptanceContract { criteria?: string; guardrails?: string[]; }
export interface ImplementationContract { entrypoint?: string; config?: string; checkpoint?: string; }
export interface ReproducibilityContract { seed?: string | number; commit?: string; environment?: string; }

export interface ExperimentContract {
  identity: ContractField<ExperimentIdentity>;
  hypothesis: ContractField<string>;
  baseline: ContractField<string>;
  intendedChange: ContractField<string[]>;
  data: ContractField<DataContract>;
  evaluation: ContractField<EvaluationContract>;
  acceptance: ContractField<AcceptanceContract>;
  implementation: ContractField<ImplementationContract>;
  reproducibility: ContractField<ReproducibilityContract>;
}

export interface ReviewRequest {
  prompt?: string;
  paths: string[];
  source?: ReviewSource;
  stage?: ReviewStage;
  target?: ReviewTarget;
  depth?: ReviewDepth;
  output?: string;
  write?: boolean;
  capabilities?: Capability[];
}

export interface ReviewScope {
  source: ReviewSource;
  stage: ReviewStage;
  target: ReviewTarget;
  depth: ReviewDepth;
  paths: string[];
  output?: string;
  writes: boolean;
}

export interface Finding {
  id: string;
  category: string;
  severity: Severity;
  status: FindingStatus;
  confidence: Confidence;
  scope: string;
  summary: string;
  declared?: unknown;
  observed?: unknown;
  locations: EvidenceRef[];
  evidence: EvidenceRef[];
  impact: string;
  recommendation: string;
  verification: string;
  sources: EvidenceRef[];
}

export interface Coverage { required: string[]; completed: string[]; unavailable: string[]; }
export interface ReviewVerdict { value: Verdict; rationale: string; coverage: Coverage; }
export type Capability = 'write' | 'network' | 'runtime' | 'install' | 'gpu';
