# VeriWhy Check Release Notes

## Version 1.0.7

VeriWhy Check 1.0.7 repairs Windows command discovery after installation and updating.

### Windows Installation Repair

- Fresh Windows installations add the VeriWhy Check command directory to the current user's PATH.
- Repair installations and updates remove an equivalent prior entry before adding the canonical
  directory, preventing duplicates.
- Windows uninstallation removes only VeriWhy Check's PATH entry and preserves unrelated entries.
- Reports and student projects remain unchanged during installation, repair, updating, and normal
  removal.

### Windows Validation

- The defect was independently reproduced with the published Version 1.0.6 package on a clean
  Windows runner.
- The release process now begins with the actual public Version 1.0.6 package, upgrades it with the
  candidate package, and confirms that `veriwhy-check` works by command name.
- Reinstalling the candidate over itself must leave exactly one PATH entry and preserve a saved
  report.
- Uninstallation must remove command discovery while retaining the saved report.

### Repair a Version 1.0.6 Installation

Rerun the documented Windows installation command:

```powershell
irm https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.ps1 | iex
```

Close the entire Windows Terminal or PowerShell application, reopen PowerShell, and run:

```text
veriwhy-check doctor
```

## Version 1.0.6

VeriWhy Check 1.0.6 corrects the WEB 425 Angular unit-test boundary and makes test results easier to
understand.

### WEB 425 Test Isolation

- Labs 1.1 and 2.1 run only the current assignment behavior check. Generated or unrelated student
  unit tests cannot make these labs report **Needs attention**.
- Lab 3.1 begins the cumulative student-authored unit-test suite.
- Labs 3.1 through 6.1 run cumulative student tests separately from the current assignment behavior
  check.
- The cumulative minimums are 4, 8, 14, and 18 tests for Labs 3.1 through 6.1.
- The checker never counts its injected assignment test as student-authored work.

### Clearer Reports

WEB 425 reports now use two direct requirement labels when both apply:

- **Cumulative student-authored unit tests**
- **Assignment behavior requirements**

Labs 1.1 and 2.1 display only the assignment behavior requirement because unit testing is not part
of those labs.

### Documentation

- The offline guide explains when WEB 425 unit testing begins and how to interpret both testing
  requirements.
- The maintained `RELEASE-NOTES.md` file is now included automatically in the offline guide. There
  is no second release-history document to update.

### Quality Checks

- The complete automated test and coverage gates pass.
- All 24 public YAML assignment profiles validate.
- A Lab 2 regression project with an intentionally failing unrelated unit test passed all eight
  assignment requirements.
- A complete Lab 3 project displayed separate passing results for cumulative student tests and
  assignment behavior.
- A known broken Lab 2 project continued to report **Needs attention**, confirming that isolation
  does not create a false pass.

### Update an Existing Installation

```text
veriwhy-check update
```

After the update finishes, run `veriwhy-check version` and `veriwhy-check doctor`.

## Version 1.0.5

VeriWhy Check Version 1 is the first student-ready release of the local coursework checker. It helps
students check functional assignment requirements before submission and creates a private HTML
report on their computer.

### Supported Systems

- macOS on Apple Silicon
- macOS on Intel x64
- Windows x64

Linux and Windows ARM64 are not currently supported. The one macOS installation command
automatically selects the correct Apple Silicon or Intel package.

### Supported Courses

- WEB 231 Enterprise JavaScript I
- WEB 330 Enterprise JavaScript II
- WEB 340 Node.js
- WEB 425 Angular with TypeScript

The release contains 24 public assignment profiles across these courses.

### Student Features

- One-command installation from the official GitHub repository
- A private Node.js 24 runtime and npm installation
- A private Playwright headless browser for functional and responsive checks
- Beginner-friendly commands, corrections, and troubleshooting messages
- Functional checks based on published assignment requirements
- Local HTML and JSON reports
- A searchable offline documentation website
- Commands for readiness, supported assignments, paths, updates, and removal
- SHA-256 verification before an installer runs downloaded package code

### Privacy and Safety

VeriWhy Check runs locally. It does not upload student code, use a cloud AI service, inspect
personal browser profiles, or collect analytics. Checks run against a temporary project copy. The
tool does not assign the official course grade and never removes student project folders.

### Quality Checks

- All 73 automated tests pass on the supported clean release systems.
- Line, function, and branch coverage requirements pass.
- All 24 YAML assignment profiles validate.
- All Markdown documentation passes the VS Code-compatible Markdown linter.
- macOS installation, readiness, updating, checking, and removal were tested.
- All browser-dependent course solutions and responsive viewport behavior were validated using only
  the packaged headless browser.
- Release packaging rejects macOS `.app` bundles so Chrome for Testing does not register in macOS
  Notifications.
- Intel macOS packaging, installation, readiness, and removal are validated on GitHub's dedicated
  Intel runner.
- Windows x64 packaging, checksum verification, installation, private runtime, readiness, and
  checking were tested on a clean Windows runner.

### Known Windows Issue

Windows may leave VeriWhy Check's private runtime folder after uninstallation. This does not affect
installation, assignment checking, reports, or updates. To remove the remaining files, close every
terminal, open File Explorer, enter `%LOCALAPPDATA%`, and open `VeriWhy Check`. Leave `reports` in
place and remove `versions`, `cache`, `bin`, and `install.json` if they remain. Remove the entire
folder only if saved reports are not needed. Student projects are never removed.

See [Known Issues](docs/KNOWN-ISSUES.md) for the tracked limitation.

### Install on macOS Apple Silicon or Intel

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
