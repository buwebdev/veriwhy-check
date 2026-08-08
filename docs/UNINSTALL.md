# Uninstallation

**Author:** Richard Krasso  
**Status:** Version 1 implementation

The Version 1 uninstaller removes only the application versions, managed runtime, public profiles,
public checks, and command shim installed by VeriWhy Check. It does not remove student repositories.
Reports remain unless the student explicitly requests report removal.

Before deletion, `veriwhy-check uninstall --dry-run` prints every targeted path. The normal command
preserves reports:

```text
veriwhy-check uninstall
```

Removing reports requires the separate, explicit option:

```text
veriwhy-check uninstall --remove-reports
```

On Windows, cleanup begins after the running command exits so the private Node runtime is no longer
locked. `veriwhy-check paths` shows installed application, browser, report, and cache locations at
any time.

Windows may leave the private runtime behind. Close every terminal, open File Explorer, enter
`%LOCALAPPDATA%`, and open `VeriWhy Check`. To preserve reports, leave `reports` and remove
`versions`, `cache`, `bin`, and `install.json` if they remain. Remove the entire folder only when
saved reports are not needed. See [Known Issues](KNOWN-ISSUES.md) for the tracked Version 1
limitation.
