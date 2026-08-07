# VeriWhy-check

> Check your work before you submit it.

VeriWhy-check is a source-available, noncommercial command-line application
that helps students validate published functional requirements for JavaScript,
Node.js, and Angular coursework. It runs entirely on the student's computer
and creates local reports. It does not assign the official course grade.

## Version 1 status

Version 1 is publicly released and validated for macOS on Apple Silicon.
Windows, Linux, and Intel Mac packages remain pending until they can be built
and tested on those operating systems. Initial course support is:

- WEB 231 Enterprise JavaScript I
- WEB 330 Enterprise JavaScript II
- WEB 340 Node.js
- WEB 425 Angular with TypeScript

## Privacy summary

VeriWhy-check does not upload source code, contact a cloud AI service, inspect
browser profiles, or collect analytics. Public checks run against a temporary
copy of the selected project and the copy is removed after the run. See the
[complete privacy statement](docs/PRIVACY.md) for the precise boundaries.

## Student installation

Students do not need to install Node.js, NVM, Docker, Python, Chrome, or an LLM.
VeriWhy Check installs its own private runtime and managed checking browser.

### macOS on Apple Silicon

Open Terminal, paste this complete command, and press Return or Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.sh | sh
```

### Windows, Linux, and Intel Mac

The installation scripts support these systems, but their release packages
have not yet been uploaded and tested. Do not give students these installation
commands until the maintainer announces support for their platform.

The planned Windows command is:

Open PowerShell, paste this complete command, and press Enter:

```powershell
irm https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.ps1 | iex
```

### Confirm the installation

Open a new Terminal or PowerShell window and enter:

```text
veriwhy-check doctor
```

For beginner-friendly installation, command, folder, update, and uninstall
instructions, read the [complete student guide](docs/STUDENT-GUIDE.md).

## Developer setup

The project requires NVM and Node.js 24.18.0 during development:

```bash
nvm use
npm install
npm run check
```

Dependencies are installed locally. Nothing is installed globally.

## Manual quality and release commands

Version 1 does not use automatic CI or deployment. Run these commands from the
repository folder when you want to verify or package the application:

```bash
nvm use
npm ci
npm run check
npm run lint:yaml
npm run lint:md
npm run docs:build
npm run release:package
```

The commands build the application, run its tests and coverage gates, validate
the public YAML profiles, lint the documentation, build the offline guide, and
create the release packages. Publishing the resulting packages as a GitHub
release remains a deliberate manual step.

When a release is ready, follow the
[step-by-step maintainer release guide](docs/MAINTAINER-RELEASE-GUIDE.md). The
manually initiated command is:

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

Commands are designed for students who are new to terminals. Incorrect input
produces a plain-language explanation and an exact “Try this next” command.

The complete visual guide is written in Markdown under `docs/guide`. Build the
dark-themed offline website with:

```text
npm run docs:build
```

Generated preview files are written to ignored `tmp/docs-site`. Release
packaging rebuilds and bundles the guide automatically.

## Documentation

- [Privacy](docs/PRIVACY.md)
- [Security](docs/SECURITY.md)
- [Assessment boundary](docs/ASSESSMENT-BOUNDARY.md)
- [Installation](docs/INSTALLATION.md)
- [Uninstallation](docs/UNINSTALL.md)
- [Student installation and use guide](docs/STUDENT-GUIDE.md)
- [Version 1 release checklist](docs/RELEASE-CHECKLIST.md)
- [Maintainer release guide](docs/MAINTAINER-RELEASE-GUIDE.md)

## Author

Richard Krasso

## License

VeriWhy-check is source-available under the
[PolyForm Noncommercial License 1.0.0](LICENSE.md). It may be used, studied,
changed, and redistributed for permitted noncommercial purposes, including use
by educational institutions. Commercial use is not permitted by this license.
