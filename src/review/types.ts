export type ReviewSource = 'experiment_manifest' | 'multiple_manifests';
export type ReviewStage = 'pre_run' | 'post_run' | 'comparison';
export type ReviewTarget = 'chat' | 'review_md' | 'comparison_md' | 'json' | 'sarif';
export type ReviewDepth = 'quick' | 'standard' | 'deep' | 'ci';
export type ContractSource = 'experiment-manifest' | 'run-artifact' | 'local-tracker' | 'mixed';
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

export type ExperimentStatus = 'planned' | 'completed';
export type ExperimentTask = 'tabular-classification' | 'tabular-regression' | 'image-classification' | 'object-detection' | 'image-segmentation' | 'time-series' | 'other-python-ml';
export interface ExperimentIdentity { id?: string; status?: ExperimentStatus; task?: ExperimentTask; }
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

export interface ExperimentManifest {
  schemaVersion: 1;
  id: string;
  status: ExperimentStatus;
  task: ExperimentTask;
  entrypoint: string;
  config: string | null;
  data: { manifest: string; splitPolicy: string; version: string | null; groupColumn: string | null; };
  evaluation: { primaryMetric: string; selectionPolicy: string; testPolicy: string; };
  artifacts: { metrics: string | null; checkpoint: string | null; tracker: 'mlflow' | 'wandb' | 'dvc' | 'none' | null; };
  serving: { entrypoint: string; config: string | null; } | null;
  baseline: string | null;
  reproducibility: { seed: number | null; commit: string | null; environment: string | null; };
  runtime: { enabled: boolean; module: string | null; factory: string | null; sampleInput: string | null; dependencies: string | null; timeoutSeconds: number | null; memoryMb: number | null; useGpu: boolean; };
  audit: { required: string[]; optional: string[]; };
}

export interface PathResolution {
  declared: string;
  kind: 'entrypoint' | 'config' | 'data-manifest' | 'metrics' | 'checkpoint' | 'serving-entrypoint' | 'serving-config' | 'baseline' | 'environment' | 'runtime-sample';
  state: 'exact' | 'inferred' | 'missing' | 'ambiguous';
  path?: string;
  score?: number;
  evidence: EvidenceRef[];
  reason?: 'path-resolution-ambiguous' | 'not-executable';
}

export interface ObservedExperiment {
  contract: Partial<ExperimentContract>;
  findings: Finding[];
  evidence: EvidenceRef[];
}

export interface ReviewRequest {
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
  resolutions?: PathResolution[];
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

export interface AdapterResult {
  adapter: string;
  requested: string[];
  completed: string[];
  unavailable: string[];
  findings: Finding[];
  observed?: Partial<ExperimentContract>;
  evidence: EvidenceRef[];
  reason?: string;
}
