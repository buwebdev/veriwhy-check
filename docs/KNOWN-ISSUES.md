# Known Issues

**Author:** Richard Krasso  
**Applies to:** VeriWhy Check Version 1

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

## Resolved: Duplicate Chrome for Testing Notification Entries on macOS

This issue was found during Version 1 release testing and resolved before the
Apple Silicon and Intel packages were finalized. It is recorded here so a
future browser change does not accidentally restore it.

### What Happened

The original package included Playwright's complete Google Chrome for Testing
macOS application. Playwright stores each browser revision in a different
versioned folder. macOS Notifications can treat those application paths as
separate registrations, so browser upgrades or repeated development builds
could display more than one Google Chrome for Testing entry.

The full application had originally been included because WEB courses require
real browser rendering, viewport changes, media queries, DOM behavior,
computed styles, screenshots, and Angular browser tests. Testing confirmed
that all of those requirements work with Playwright's headless Chromium shell;
the normal `.app` bundle is not required.

### Resolution

VeriWhy Check now downloads and packages only Playwright's headless Chromium
shell and its required media helper. The application locates that executable
directly. Release packaging rejects any `.app` bundle, and the macOS release
validation confirms that none is present. The headless shell has no normal
macOS application registration and therefore does not create a Chrome for
Testing entry in Notifications.

Existing notification entries created by an older development build are stale
macOS settings. They can be disabled in **System Settings > Notifications**.
They do not mean Chrome is running, do not provide access to a personal browser
profile, and are not recreated by the corrected package.

### If a Full macOS Application Is Needed Later

Do not restore the old approach by copying Playwright's complete cache into
each release. First document a browser requirement that the headless shell
cannot satisfy and add a regression test that demonstrates it. If the full
application is truly required, it should use one stable application path that
is replaced during updates rather than a new versioned path. Before release,
test fresh installation, repeated updates, notification registration, privacy
boundaries, responsive behavior, screenshots, and uninstallation. Update the
privacy, installation, release, and student documentation to explain the
visible application and how to disable or remove its notification entry.
