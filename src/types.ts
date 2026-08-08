/**
 * @file Shared public contracts for profiles, checks, and student reports.
 * @author Richard Krasso
 *
 * Keeping the application contracts in one module makes every evaluator and
 * report renderer agree on the same small, auditable data model. The student
 * checker deliberately reports requirement outcomes rather than grade points.
 */

/** A deterministic rule declared by a public YAML assessment profile. */
// Rules describe observable evidence only. There is intentionally no rule for
// indentation, variable naming, comment quantity, or subjective code style.
export type Rule =
  | { kind: 'files'; paths: string[] }
  | { kind: 'file-groups'; groups: string[][] }
  | { kind: 'source'; roots: string[]; all?: string[]; any?: string[] }
  | { kind: 'test-source'; roots: string[]; all?: string[]; any?: string[] }
  | { kind: 'test-count'; minimum: number }
  | { kind: 'hygiene'; forbidden: string[] }
  | { kind: 'browser'; test: string; case: string; timeoutSeconds: number }
  | { kind: 'node-test'; test: string; case: string; timeoutSeconds: number }
  | { kind: 'command'; executable: 'npm'; args: string[]; timeoutSeconds: number };

/** Project discovery and preparation behavior selected by a profile. */
export type ProjectConfig =
  | { kind: 'npm'; markers: string[]; install: 'none' | 'npm-ci' }
  | { kind: 'static-web'; entry: string; locate?: string[] }
  | { kind: 'node'; entry: string; install: 'none' | 'npm-ci' };

/** One published requirement shown directly to a student. */
export interface Requirement {
  /** Stable profile-local key used by reports and regression tests. */
  id: string;
  /** Student-facing statement derived from the published instructions. */
  label: string;
  /** Conjunctive evidence: every rule contributes to this outcome. */
  rules: Rule[];
}

/** A complete, versioned public assignment contract. */
export interface Profile {
  /** Course and assignment identifier entered at the command line. */
  id: string;
  /** Human-readable catalog label shown in reports. */
  course: string;
  /** Human-readable assignment title shown in reports. */
  assignment: string;
  /** Assessment-contract version, independent of application releases. */
  version: string;
  /** Discovery and dependency-preparation contract. */
  project: ProjectConfig;
  /** Ordered published behaviors the student can inspect before submission. */
  requirements: Requirement[];
}

/** The observable result of one published requirement. */
export interface RequirementResult {
  /** Requirement key copied from the validated profile. */
  id: string;
  /** Published label copied into the durable report. */
  label: string;
  /** Deterministic three-state outcome; no grade points are assigned. */
  status: 'pass' | 'fail' | 'skipped';
  /** Evidence or correction written in plain language. */
  detail: string;
}

/** Privacy-conscious report written after one local check run. */
export interface CheckReport {
  /** Report schema evolves separately from application and profile versions. */
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  projectName: string;
  projectPath: string;
  profile: Pick<Profile, 'id' | 'course' | 'assignment' | 'version'>;
  passed: number;
  failed: number;
  skipped: number;
  complete: boolean;
  results: RequirementResult[];
  notices: string[];
}

/** Common result returned by executable public checks. */
export interface ExecutionResult {
  passed: boolean;
  detail: string;
}
