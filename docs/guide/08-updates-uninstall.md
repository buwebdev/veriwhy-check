# Updates and Uninstallation

## Update VeriWhy Check

```text
veriwhy-check update
```

The application checks the official GitHub release, downloads the package for
your computer, and verifies its SHA-256 digital fingerprint. A new version is
installed beside the current version before the command launcher changes. A
failed download or copy leaves the working version available.

After an update, confirm readiness:

```text
veriwhy-check version
veriwhy-check doctor
```

The updated release includes its matching assignment profiles, checks, and
offline documentation website.

## Preview Uninstallation

```text
veriwhy-check uninstall --dry-run
```

The preview lists every target and changes nothing.

## Remove the Application

```text
veriwhy-check uninstall
```

This removes the command, installed versions, managed browser, cache, and
installation record. It never removes student project folders. Saved reports
remain on the computer.

## Remove Reports Too

Only use the explicit option when you no longer want saved reports:

```text
veriwhy-check uninstall --remove-reports
```

On Windows, file removal begins after the running command closes so the private
runtime is no longer in use.

### Windows Uninstall Workaround

Windows may leave the private runtime behind. If the `VeriWhy Check` folder
remains after uninstallation:

1. Close every Command Prompt, PowerShell, and terminal window.
2. Open File Explorer.
3. Enter `%LOCALAPPDATA%` in the address bar and press Enter.
4. Remove the `VeriWhy Check` folder.

This known Version 1 issue affects only uninstallation. It does not affect
student projects or normal assignment checks.
