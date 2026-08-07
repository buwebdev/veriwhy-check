/**
 * @file Shared public contracts for profiles, checks, and student reports.
 * @author Richard Krasso
 *
 * Keeping the application contracts in one module makes every evaluator and
 * report renderer agree on the same small, auditable data model. The student
 * checker deliberately reports requirement outcomes rather than grade points.
 */

/** A deterministic rule declared by a public YAML assessment profile. */
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
  id: string;
  label: string;
  rules: Rule[];
}

/** A complete, versioned public assignment contract. */
export interface Profile {
  id: string;
  course: string;
  assignment: string;
  version: string;
  project: ProjectConfig;
  requirements: Requirement[];
}

/** The observable result of one published requirement. */
export interface RequirementResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'skipped';
  detail: string;
}

/** Privacy-conscious report written after one local check run. */
export interface CheckReport {
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
