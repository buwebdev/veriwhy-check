# VeriWhy-check

> Check your work before you submit it.

VeriWhy-check is a source-available, noncommercial command-line application
that helps students validate published functional requirements for JavaScript,
Node.js, and Angular coursework. It runs entirely on the student's computer
and creates local reports. It does not assign the official course grade.

## Version 1 status

Version 1.0.0 is a local release candidate undergoing installation validation
before its first GitHub release. Initial course support is:

- WEB 231 Enterprise JavaScript I
- WEB 330 Enterprise JavaScript II
- WEB 340 Node.js
- WEB 425 Angular with TypeScript

## Privacy summary

VeriWhy-check does not upload source code, contact a cloud AI service, inspect
browser profiles, or collect analytics. Public checks run against a temporary
copy of the selected project and the copy is removed after the run. See the
[complete privacy statement](docs/PRIVACY.md) for the precise boundaries.

## Developer setup

The project requires NVM and Node.js 24.18.0 during development:

```bash
nvm use
npm install
npm run check
```

Dependencies are installed locally. Nothing is installed globally.

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

## Student installation

Version 1 uses an NVM-style copy-and-paste installer. Students paste one
official GitHub command into Terminal or PowerShell; the script chooses the
correct release, verifies its SHA-256 digest, and installs the private runtime
and browser. See the [student guide](docs/STUDENT-GUIDE.md) for both commands.

## Documentation

- [Privacy](docs/PRIVACY.md)
- [Security](docs/SECURITY.md)
- [Assessment boundary](docs/ASSESSMENT-BOUNDARY.md)
- [Installation](docs/INSTALLATION.md)
- [Uninstallation](docs/UNINSTALL.md)
- [Student installation and use guide](docs/STUDENT-GUIDE.md)
- [Version 1 release checklist](docs/RELEASE-CHECKLIST.md)

## Author

Richard Krasso

## License status

Copyright is currently reserved while the noncommercial release terms and
legal copyright holder are finalized. Do not redistribute this development
version. The planned public license is
[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0).
