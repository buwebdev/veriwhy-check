# Contributing to VeriWhy Check

Author and maintainer: Richard Krasso

Thank you for helping improve student feedback. Contributions should preserve
the project's deterministic, local-first, and beginner-friendly design.

## Before You Begin

- Read the [assessment boundary](docs/ASSESSMENT-BOUNDARY.md).
- Do not add grade points, hidden scoring, telemetry, cloud AI, or arbitrary
  command execution.
- Do not include student work, credentials, instructor solutions, or reports.
- Open an issue before making a large behavioral or profile change.

## Development Environment

```text
nvm use
npm install
npm run check
```

Node.js 24.18.0 is selected by `.nvmrc`. Dependencies belong in this project,
not in the global Node.js installation.

## Required Quality Checks

Every behavior change requires tests. Before submitting a pull request, run:

```text
npm run check
npm run lint:yaml
npm run lint:md
```

Source and test files must retain a file header that identifies Richard Krasso
as the project author. Add comments that explain security boundaries and
non-obvious decisions; avoid comments that merely repeat the next line.

## Assessment Profiles

Public profiles describe visible, functional requirements. They must not
contain grade weights or stylistic judgments. Profile changes require:

1. A matching assignment instruction.
2. A passing known-good fixture.
3. A failing fixture for each important requirement.
4. A regression test for textbook `_txt` filename alternatives when relevant.

## Pull Requests

Keep each pull request focused. Explain what changed, why students benefit, how
privacy is preserved, and which commands verified the change.
