# Support and Platform Lifecycle

**Author:** Richard Krasso  
**Applies to:** VeriWhy Check Version 1

## Supported Computers

Version 1 supports:

- macOS on Apple Silicon;
- macOS on Intel x64; and
- Windows x64.

One macOS installation command detects the processor and downloads the correct
package. A universal archive is intentionally not used because it would make
every student download two private runtimes and two browser engines.

Linux and Windows ARM64 are not currently supported.

## Intel Mac Lifecycle

New Intel Mac packages will be built and tested while GitHub's
`macos-15-intel` release runner remains available. GitHub has announced that
runner through August 2027. Before that service ends, the maintainer should
publish one final tested Intel package and record its version here.

That final Intel archive can remain downloadable after new Intel builds stop.
It is a frozen compatibility package, not a promise of indefinite updates.
Critical runtime or security requirements may require support to end sooner.
Apple Silicon and Windows x64 packages can continue receiving releases.

## Planned Release Cadence

The expected course-support releases are:

- September 2026: add WEB 200;
- November 2026: add WEB 350; and
- afterward: release when a supported course is redesigned or a functional
  assignment contract changes.

Security, dependency, runtime, installer, and confirmed high-impact defect
corrections can also justify a release. A Version 2 number is reserved for an
incompatible product change; routine profiles and fixes remain Version 1
updates.

## Reporting a Problem

Run `veriwhy-check doctor` first. If the issue remains, use the repository's
[GitHub bug-report form](https://github.com/buwebdev/veriwhy-check/issues/new?template=bug_report.yml).
Include the version, operating system, course and assignment, exact command,
expected behavior, actual behavior, and sanitized readiness-check output.

The maintainer will reproduce and evaluate the report before deciding whether
it is a VeriWhy Check defect, project setup issue, assignment question,
unsupported system, or feature request. Filing an issue does not guarantee a
change. Never post assignment source, student information, credentials,
private links, or sensitive screenshots in a public issue.
