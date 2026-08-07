# VeriWhy-check Privacy Statement

**Author:** Richard Krasso  
**Status:** Version 1 development policy

## Summary

VeriWhy-check evaluates coursework locally. Student source code and generated
reports remain on the student's computer unless the student chooses to share
them. The application does not contain analytics, advertising, telemetry, or
cloud artificial intelligence.

## Data the application reads

VeriWhy-check reads only the project selected by the student and the public
assessment profile selected on the command line. Depending on the assignment,
it may read authored HTML, CSS, JavaScript, JSON, or TypeScript files and the
project's package metadata.

The application does not read unrelated repositories, documents, photographs,
messages, browser profiles, browser history, cookies, bookmarks, extensions,
saved passwords, or operating-system credentials.

## Temporary project copy

Checks run against a temporary copy so the student's original project is not
rewritten by the checker. Generated dependency, build, and test files remain
inside that temporary copy. VeriWhy-check removes the copy when grading ends,
including when a check fails. An unexpected operating-system termination may
leave a temporary directory, which the `doctor` command will identify and the
student can remove.

## Managed browser

Static web checks use an application-managed Chromium browser supplied by
Playwright. It is separate from installed Chrome, Edge, Firefox, and Safari
profiles. External page requests are blocked during assessment. Assignment
pages are served only through a temporary loopback address on `127.0.0.1`.

## Network activity

Normal checks make no request to a VeriWhy-check server. Network access is used
only to install or update the application, obtain the managed browser, or
install dependencies declared by an npm project when a temporary build
requires them. The application does not upload student source or reports.

## Reports

Reports contain the selected course and assignment, local project path,
requirement results, and public evidence. Reports are written beneath the
current user's VeriWhy-check data directory. The `veriwhy-check paths` command
shows the exact location. Students control whether a report is shared.

## Artificial intelligence

VeriWhy-check does not include an LLM and does not send student work to an AI
service. Feedback comes from deterministic public requirements and observed
behavior.

## Questions

Students should contact their instructor before installation when local
institutional policy requires software approval or when any privacy boundary
is unclear.
