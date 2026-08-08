# Public Functional Check Reference

**Author:** Richard Krasso

## Purpose

Public checks provide the executable evidence selected by YAML assessment profiles. They are
readable by students on purpose: the checked behavior is the same behavior disclosed in the
assignment. These files contain no grade points, private grading logic, credentials, or instructor
reference solutions.

## Organization

- `browser/WEB-231` and `browser/WEB-330` contain browser-interaction cases for static JavaScript
  coursework.
- `node/WEB-340` contains process and service behavior cases for Node.js.
- `angular/WEB-425` contains Angular TestBed specifications copied only into the checker's
  disposable project.
- shared `helpers.mjs` files provide consistent assertions, normalization, process execution, and
  actionable error messages.

## Design Rules

Every public case should:

1. connect directly to a published requirement;
2. observe functional input, output, DOM, process, or protocol behavior;
3. include an additional input when it is needed to distinguish a generalized solution from one
   hard-coded example;
4. use stable selectors or public interfaces disclosed in the instructions;
5. return a short description of the behavior that passed; and
6. produce a bounded, actionable failure rather than an internal stack trace.

Checks must not enforce undocumented implementation details, indentation, whitespace, identifier
preferences, comment quantity, or resemblance to an instructor solution.

## Safety and Privacy

Checks execute against an operating-system temporary copy of the selected project. Browser cases use
a fresh nonpersistent context and block external requests. Node cases use bounded execution.
Assignment source and check reports are not uploaded by VeriWhy Check.

## Documentation Convention

Each file begins with a course- and assignment-specific module comment. Helper functions explain
their contract and reasoning. Complex cases use inline comments to connect setup, interaction,
assertion, and cleanup to the published behavior being measured.

## Verification

After editing a public check, run:

```bash
nvm use
npm run format
npm run format:check
npm run check
npm run lint:yaml
```

Known-good course solutions should also be regression tested before a release.
