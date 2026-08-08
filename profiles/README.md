# Public Assessment Profile Reference

**Author:** Richard Krasso

## Purpose

Each YAML file is a transparent contract between an assignment and VeriWhy Check. Profiles identify
how to locate a project and which observable evidence the student-facing checker may evaluate. They
contain no official grade points, private tests, instructor credentials, or reference solutions.

## Top-Level Properties

- `id` is the stable `COURSE/assignment` value entered at the command line.
- `course` is the human-readable catalog name displayed in reports.
- `assignment` is the published assignment title.
- `version` identifies changes to this assessment contract independently from the application
  release number.
- `project` describes deterministic project discovery and preparation.
- `requirements` is the ordered list of student-visible functional outcomes.

Unknown properties are rejected. Strict validation ensures that a misspelled property cannot
silently remove an assessment requirement.

## Project Properties

Three project kinds are supported:

- `static-web` uses an `entry` page and optional `locate` fallback filenames;
- `node` uses an `entry` JavaScript file and an `install` policy; and
- `npm` uses one or more `markers` and an `install` policy.

`install` is either `none` or `npm-ci`. A locked `npm ci` preparation occurs only in the disposable
project copy, never in the student's original folder.

## Requirement Properties

Each requirement has:

- a stable lowercase `id`;
- a plain-language `label` copied into the report; and
- one or more `rules` joined with logical AND.

One failing rule makes the requirement need attention. If executable behavior is explicitly skipped,
the requirement is reported as not checked. A complete pass cannot contain a failed or skipped
requirement.

## Rule Kinds

- `files` requires every listed relative path.
- `file-groups` accepts one filename from each group, supporting documented textbook rename
  fallbacks.
- `source` checks disclosed implementation evidence under approved roots.
- `test-source` checks only student-authored test files.
- `test-count` requires a disclosed minimum number of student-authored tests.
- `hygiene` rejects generated folders that should not be submitted.
- `browser` runs one named public browser case.
- `node-test` runs one named public Node.js case.
- `command` runs an allowlisted npm command with explicit arguments.

Profile paths must remain inside the selected project. General command rules allow only npm;
profiles cannot contain shell command strings.

## Assessment Boundary

Profiles measure whether required behavior and disclosed evidence are present. They do not score
indentation, line spacing, identifier preferences, comment quantity, or subjective organization.
Those topics may be coached separately, but they are not hidden functional grading criteria.

## Validation

After editing a profile, run:

```bash
nvm use
npm run format
npm run lint:yaml
npm run check
```

The YAML validator loads all public profiles through the production parser.
