# VeriWhy-check

> Check your work before you submit it.

VeriWhy-check is a source-available, noncommercial command-line application that helps students
validate published functional requirements for JavaScript, Node.js, and Angular coursework. It runs
entirely on the student's computer and creates local reports. It does not assign the official course
grade.

## Version 1 status

Version 1 supports macOS on Apple Silicon, Intel-based Mac computers, and Windows x64. Linux and
Windows ARM64 packages are not currently supported. Initial course support is:

- WEB 231 Enterprise JavaScript I
- WEB 330 Enterprise JavaScript II
- WEB 340 Node.js
- WEB 425 Angular with TypeScript

## Privacy summary

VeriWhy-check does not upload source code, contact a cloud AI service, inspect browser profiles, or
collect analytics. Public checks run against a temporary copy of the selected project and the copy
is removed after the run. See the [complete privacy statement](docs/PRIVACY.md) for the precise
boundaries.

## Student installation

Students do not need to install Node.js, NVM, Docker, Python, Chrome, or an LLM. VeriWhy Check
installs its own private runtime and managed checking browser.

### macOS on Apple Silicon or Intel

Open Terminal, paste this complete command, and press Return or Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.sh | sh
```

### Windows x64

Open PowerShell, paste this complete command, and press Enter:

```powershell
irm https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.ps1 | iex
```

The macOS command automatically selects the Apple Silicon or Intel package. Linux and Windows ARM64
are not currently supported.

### Confirm the installation

Open a new Terminal or PowerShell window and enter:

```text
veriwhy-check doctor
```

For beginner-friendly installation, command, folder, update, and uninstall instructions, read the
[complete student guide](docs/STUDENT-GUIDE.md).

See [Known Issues](docs/KNOWN-ISSUES.md) for the documented Windows uninstall edge case and
workaround.

If an application problem remains after troubleshooting, use the structured
[GitHub bug-report form](https://github.com/buwebdev/veriwhy-check/issues/new?template=bug_report.yml).
Reports are evaluated before they are classified as defects. Do not include assignment code or
private information in a public issue.

See [Release Notes](RELEASE-NOTES.md) for Version 1 capabilities, validation, supported systems, and
installation commands.

## Developer setup

The project requires NVM and Node.js 24.18.0 during development:

```bash
nvm use
npm install
npm run check
```

Dependencies are installed locally. Nothing is installed globally.

## Manual quality and release commands

Version 1 does not use automatic CI or deployment. Run these commands from the repository folder
when you want to verify or package the application:

```bash
nvm use
npm ci
npm run format:check
npm run check
npm run lint:yaml
npm run lint:md
npm run docs:build
npm run release:package
```

The commands build the application, run its tests and coverage gates, validate the public YAML
profiles, lint the documentation, build the offline guide, and create the release packages.
Publishing the resulting packages as a GitHub release remains a deliberate manual step.

When a release is ready, follow the
[step-by-step maintainer release guide](docs/MAINTAINER-RELEASE-GUIDE.md). The manually initiated
command is:

```bash
npm run deploy -- patch
```

## Student commands

```text
veriwhy-check help
veriwhy-check guide
veriwhy-check check WEB-330/assignment-1.3
veriwhy-check list WEB-330
veriwhy-check doctor
veriwhy-check paths
veriwhy-check update
```

Commands are designed for students who are new to terminals. Incorrect input produces a
plain-language explanation and an exact “Try this next” command.

The complete visual guide is written in Markdown under `docs/guide`. Build the dark-themed offline
website with:

```text
npm run docs:build
```

Generated preview files are written to ignored `tmp/docs-site`. Release packaging rebuilds and
bundles the guide automatically.

## Documentation

- [Privacy](docs/PRIVACY.md)
- [Security](docs/SECURITY.md)
- [Assessment boundary](docs/ASSESSMENT-BOUNDARY.md)
- [Installation](docs/INSTALLATION.md)
- [Uninstallation](docs/UNINSTALL.md)
- [Student installation and use guide](docs/STUDENT-GUIDE.md)
- [Version 1 release checklist](docs/RELEASE-CHECKLIST.md)
- [Maintainer release guide](docs/MAINTAINER-RELEASE-GUIDE.md)
- [Support and platform lifecycle](docs/SUPPORT-POLICY.md)
- [Code style and documentation standard](docs/CODE-STYLE.md)
- [Public profile reference](profiles/README.md)
- [Public functional check reference](public-checks/README.md)

## Author

Richard Krasso

## License

VeriWhy-check is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). It
may be used, studied, changed, and redistributed for permitted noncommercial purposes, including use
by educational institutions. Commercial use is not permitted by this license.
