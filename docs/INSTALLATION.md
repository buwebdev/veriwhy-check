# Installation

**Author:** Richard Krasso  
**Status:** Version 1 installer implemented; public release packages pending

Version 1 provides packaging and installer support for Windows, macOS, and
Linux on supported x64 or ARM64 computers. Public GitHub release packages have
not yet been published.
Each package will contain the VeriWhy-check application, a private Node.js
runtime, public profiles, public checks, report assets, and an uninstaller.

Students will not need to install Node.js, NVM, NVS, Docker, Python, Go, or an
LLM. Static web assessment additionally installs Playwright's managed Chromium
browser in the application's documented user-data location.

Before public releases exist, installation is tested from local release
archives and sandbox directories inside the ignored `tmp` directory. The
installer supports explicit data and command directories so a test never
changes the normal user installation. Each release includes a SHA-256 digest;
the installer checks it before running any packaged code.

The installed layout uses versioned folders. An update installs the new folder
first and changes the small command launcher only after the copy succeeds. The
previous version is not damaged by a failed copy.
