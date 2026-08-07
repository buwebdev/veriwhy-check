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
- [x] Bundle the isolated Playwright browser.
- [x] Publish and verify SHA-256 digests.
- [x] Install releases into versioned folders before activation.
- [x] Test custom-path installation in an ignored sandbox.
- [x] Test Version 1 in the normal macOS installation locations.
- [ ] Test Version 1 on a clean Windows x64 computer.

## Publication

- [ ] Confirm the legal copyright holder and add the approved license notice.
- [ ] Review privacy, security, support, and student guides.
- [ ] Create the signed or approved GitHub Version 1 release.
- [ ] Upload every platform archive and matching digest.
- [ ] Test the public installer link from a non-developer account.
- [ ] Test `veriwhy-check update` against a newer prerelease in a controlled
  release channel before depending on it for a student update.
