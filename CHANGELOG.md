# Changelog

Author and maintainer: Richard Krasso

All notable changes will be documented here. Version numbers follow semantic
versioning while the public profile versions independently identify assessment
contract changes.

## [1.0.5] - 2026-08-08

### Added

- Intel macOS release packaging behind the existing automatic macOS installer.
- One-command release orchestration for Apple Silicon macOS, Intel macOS, and
  Windows x64 packages and checksums.
- Structured public bug-report guidance and platform lifecycle documentation.

### Changed

- Replaced the full Chrome for Testing application with Playwright's headless
  Chromium shell while retaining functional, responsive, screenshot, and
  Angular browser checks.
- Added release guards that reject `.app` bundles and prevent duplicate Chrome
  for Testing registrations in macOS Notifications.

## [1.0.0] - 2026-08-07

### Added

- Beginner-focused CLI with guided errors, examples, typo suggestions, and
  transparent storage paths.
- Local HTML and JSON reports without official grade points.
- Public functional profiles and checks for six assignments each in WEB 231,
  WEB 330, WEB 340, and WEB 425.
- Managed Playwright browser testing with external requests blocked.
- Temporary-copy evaluation and automatic cleanup.
- Unit, integration, profile, privacy-boundary, and CLI tests.
- Verified self-update support and versioned, rollback-safe installers.
- Plain-language student installation and usage guide.
