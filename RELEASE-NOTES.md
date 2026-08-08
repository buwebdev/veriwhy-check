# VeriWhy Check Release Notes

## Version 1.0.3

VeriWhy Check Version 1 is the first student-ready release of the local
coursework checker. It helps students check functional assignment requirements
before submission and creates a private HTML report on their computer.

### Supported Systems

- macOS on Apple Silicon
- Windows x64

Linux, Windows ARM64, and Intel Mac are not currently supported.

### Supported Courses

- WEB 231 Enterprise JavaScript I
- WEB 330 Enterprise JavaScript II
- WEB 340 Node.js
- WEB 425 Angular with TypeScript

The release contains 24 public assignment profiles across these courses.

### Student Features

- One-command installation from the official GitHub repository
- A private Node.js 24 runtime and npm installation
- A private Playwright browser for functional web checks
- Beginner-friendly commands, corrections, and troubleshooting messages
- Functional checks based on published assignment requirements
- Local HTML and JSON reports
- A searchable offline documentation website
- Commands for readiness, supported assignments, paths, updates, and removal
- SHA-256 verification before an installer runs downloaded package code

### Privacy and Safety

VeriWhy Check runs locally. It does not upload student code, use a cloud AI
service, inspect personal browser profiles, or collect analytics. Checks run
against a temporary project copy. The tool does not assign the official course
grade and never removes student project folders.

### Quality Checks

- 69 automated tests pass.
- Line, function, and branch coverage requirements pass.
- All 24 YAML assignment profiles validate.
- All Markdown documentation passes the VS Code-compatible Markdown linter.
- macOS installation, readiness, updating, checking, and removal were tested.
- Windows x64 packaging, checksum verification, installation, private runtime,
  readiness, and checking were tested on a clean Windows runner.

### Known Windows Issue

Windows may leave VeriWhy Check's private runtime folder after uninstallation.
This does not affect installation, assignment checking, reports, or updates.
To remove the remaining files, close every terminal, open File Explorer, enter
`%LOCALAPPDATA%` in the address bar, and remove the `VeriWhy Check` folder.
Student projects and saved reports are not removed automatically.

See [Known Issues](docs/KNOWN-ISSUES.md) for the tracked limitation.

### Install on macOS Apple Silicon

```bash
curl -fsSL https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.sh | sh
```

### Install on Windows x64

Open PowerShell and run:

```powershell
irm https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.ps1 | iex
```

After installation, open a new terminal and run:

```text
veriwhy-check doctor
```
