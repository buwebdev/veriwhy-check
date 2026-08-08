# Installation

**Author:** Richard Krasso  
**Status:** Apple Silicon macOS, Intel macOS, and Windows x64 releases available

Version 1 supports macOS on Apple Silicon, Intel-based Mac computers, and Windows x64. Linux and
Windows ARM64 are not currently supported. The same macOS installation command detects the computer
and selects the correct package. Each published package contains the VeriWhy-check application,
private Node.js and npm runtimes, public profiles, public checks, report assets, and an uninstaller.

Students will not need to install Node.js, NVM, NVS, Docker, Python, Go, or an LLM. Static web
assessment additionally installs Playwright's managed headless Chromium shell in the application's
documented user-data location. It is not a normal macOS application and does not register a Chrome
for Testing entry in macOS Notifications.

The Apple Silicon release has been tested from its public GitHub download in an isolated directory
and in the normal macOS user locations. The Windows x64 package has been built, installed, and
checked on a clean Windows runner. The installer supports explicit data and command directories for
controlled validation. Each release includes a SHA-256 digest; the installer checks it before
running any packaged code.

The installed layout uses versioned folders. An update installs the new folder first and changes the
small command launcher only after the copy succeeds. The previous version is not damaged by a failed
copy.
