# Code Style and Documentation Standard

**Author:** Richard Krasso  
**Applies to:** Maintained VeriWhy Check source, checks, scripts, and tests

## Purpose

VeriWhy Check is an academic application whose public source should model professional TypeScript
and JavaScript practices. Readability is a functional maintenance requirement because instructors,
contributors, and students may study the implementation to understand how deterministic assessment
works.

## Automated Formatting

The repository uses the locally installed Prettier version declared in `package.json`. NVM Node.js
24.18.0 must be active before formatting.

```bash
nvm use
npm run format
npm run format:check
```

Prettier enforces two-space indentation, semicolons, single-quoted JavaScript and TypeScript
strings, consistent wrapping, and stable object and array layout. Generated files, dependencies,
temporary validation artifacts, and release archives are excluded through `.prettierignore`.

## Blank-Line Convention

Use one blank line to separate distinct ideas:

- the module comment from imports;
- imports from exported types or module constants;
- type declarations from executable functions;
- helper functions from orchestration functions;
- setup, action, validation, and cleanup phases in a larger operation; and
- separate test cases.

Do not insert blank lines between statements that form one small operation. Do not use several
consecutive blank lines. Prettier is the final authority for mechanical layout, while the author
remains responsible for semantic grouping.

## Comment Convention

Every maintained code file begins with a file-level documentation comment that states its
responsibility and design reason. Exported contracts and functions use JSDoc. Complex internal
helpers receive JSDoc when their contract is not obvious from the surrounding module.

Inline comments should explain decisions, boundaries, assumptions, and reasons. Useful comments
answer questions such as:

- Why is this validation performed before that mutation?
- Why is this implementation intentionally strict or limited?
- What privacy or safety boundary does this branch preserve?
- Why is a platform-specific alternative required?
- What student-facing behavior depends on this decision?
- What invariant must a future maintainer preserve?

Avoid comments that only repeat the syntax, such as “increment the counter.” A comment should
preserve reasoning that would otherwise be lost when the code is read months later.

## Assessment-Check Convention

Public checks evaluate observable assignment behavior. Their comments should connect an interaction
to a published functional requirement and explain why the chosen input distinguishes a working
implementation from a hard-coded example. They must not evaluate indentation, naming preference,
comment count, or undocumented implementation details.

## Test Convention

A test name states the behavior being proved. The file-level comment explains the risk covered by
the suite. Within longer tests, comments separate the arrange, action, and assertion phases and
explain safety or regression cases. Short assertions that are already clear from the test name do
not require a comment on every line.

## Required Verification

After changing maintained code or documentation, run:

```bash
nvm use
npm run format
npm run format:check
npm run check
npm run lint:yaml
npm run lint:md
```

Formatting is not a substitute for compilation, behavioral tests, coverage, profile validation, or
documentation linting. All gates must pass together.
