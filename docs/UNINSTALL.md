# Uninstallation

**Author:** Richard Krasso  
**Status:** Version 1 implementation

The Version 1 uninstaller removes only the application versions, managed
runtime, public profiles, public checks, and command shim installed by
VeriWhy Check. It does not remove student repositories. Reports remain unless
the student explicitly requests report removal.

Before deletion, `veriwhy-check uninstall --dry-run` prints every targeted
path. The normal command preserves reports:

```text
veriwhy-check uninstall
```

Removing reports requires the separate, explicit option:

```text
veriwhy-check uninstall --remove-reports
```

On Windows, cleanup begins after the running command exits so the private Node
runtime is no longer locked. `veriwhy-check paths` shows installed application,
browser, report, and cache locations at any time.

Windows may leave the private runtime behind. Close every Command Prompt,
PowerShell, and terminal window, open File Explorer, enter `%LOCALAPPDATA%` in
the address bar, and remove the `VeriWhy Check` folder if it remains. See
[Known Issues](KNOWN-ISSUES.md) for the tracked Version 1 limitation.
