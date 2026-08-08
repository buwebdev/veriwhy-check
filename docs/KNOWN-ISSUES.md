# Known Issues

**Author:** Richard Krasso  
**Applies to:** VeriWhy Check Version 1 on Windows

## Windows Uninstall Can Leave Application Files Behind

Normal installation, checking, report creation, help, and updating are not
affected by this issue.

Windows locks the private Node.js runtime while VeriWhy Check is running.
VeriWhy Check schedules those private application files for removal after the
command exits, but delayed cleanup does not finish on every Windows terminal.
This can leave the private runtime behind after the uninstall command finishes.
Student projects are never removed, and reports remain preserved by default.

## Workaround

1. Run `veriwhy-check uninstall`.
2. Close every Command Prompt, PowerShell, and terminal window.
3. Open File Explorer.
4. Enter `%LOCALAPPDATA%` in the address bar.
5. Open the `VeriWhy Check` folder if it remains.
6. To keep saved reports, leave the `reports` folder and remove `versions`,
   `cache`, `bin`, and `install.json` if they remain.
7. If saved reports are not needed, remove the entire `VeriWhy Check` folder.

The Version 1 follow-up work is to make delayed Windows cleanup reliable in
every supported terminal and validate that the command file, private runtime,
and installation record are all removed.
