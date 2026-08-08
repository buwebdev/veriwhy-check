# Version 1 Release Checklist

**Author:** Richard Krasso

This checklist separates a locally verified release candidate from a public
student release. Publication is not complete until every item is checked.

## Code and Assessment Quality

- [x] Compile with NVM Node.js 24.18.0.
- [x] Run unit and integration tests.
- [x] Enforce line, function, and branch coverage gates.
- [x] Validate all 24 public YAML profiles.
- [x] Lint all Markdown documentation.
- [x] Verify all 24 known-good course solutions pass.
- [x] Keep generated validation artifacts beneath ignored `tmp` directories.

## Installer Quality

- [x] Bundle a private Node.js runtime.
- [x] Bundle private npm and use it without a system Node.js installation.
- [x] Bundle only the isolated Playwright headless browser and media helper.
- [x] Reject macOS `.app` bundles during packaging and release validation.
- [x] Publish and verify SHA-256 digests.
- [x] Install releases into versioned folders before activation.
- [x] Test custom-path installation in an ignored sandbox.
- [x] Test Version 1 in the normal macOS installation locations.
- [x] Test a known-good WEB 425 Angular project using only the bundled runtime.
- [x] Test Version 1 installation and checking on a clean Windows x64 runner.
- [x] Document the Windows delayed-uninstall issue and workaround.

## Publication

- [x] Confirm the legal copyright holder and add the approved license notice.
- [x] Review privacy, security, support, and student guides.
- [x] Create the approved GitHub Version 1 release.
- [ ] Validate Intel macOS installation, checking, and uninstallation.
- [ ] Upload all three supported platform archives and matching digests.
- [x] Test the public installer link without GitHub authentication.
- [x] Test a public update from Version 1.0.0 to Version 1.0.1.

Linux and Windows ARM64 are outside the Version 1 supported-platform scope.
The Windows delayed-uninstall limitation and resolved macOS notification issue
are documented separately.
