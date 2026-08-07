# VeriWhy-check Security Model

**Author:** Richard Krasso  
**Status:** Version 1 development policy

## Installation integrity

Release installers will download versioned archives from the official
`buwebdev/veriwhy-check` repository and verify a published SHA-256 checksum
before extraction. Development builds must be installed only from a locally
created release archive.

## Project isolation

VeriWhy-check copies the selected project into an operating-system temporary
directory. Public checks run there, and cleanup removes the complete copy. The
application never intentionally edits the selected repository.

## Command execution

Profiles cannot contain arbitrary shell strings. Executable checks use an
allowlist and pass arguments directly to the operating system without a shell.
Profile paths must be relative, cannot contain `..`, and cannot escape the
temporary project.

## Browser isolation

Playwright controls a dedicated headless Chromium installation. Checks use a
new browser context without a persistent user profile. External requests are
blocked, and the local page server binds to `127.0.0.1` on a temporary port.

## Public checks

Student-facing checks are intentionally public and enforce only disclosed
requirements. They do not contain instructor credentials, private services,
official protected checks, reference solutions, or access to the course LMS.

## Reporting a security concern

Do not publish a suspected vulnerability in a public issue while the project
is private or while a report may expose student information. Contact the
repository owner through the private security-reporting method configured for
the GitHub repository.
