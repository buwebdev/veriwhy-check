# Installation

**Author:** Richard Krasso  
**Status:** Apple Silicon macOS release published and validated

Version 1 provides packaging and installer support for Windows, macOS, and
Linux on supported x64 or ARM64 computers. The Apple Silicon macOS package is
published and validated. Windows, Linux, and Intel Mac packages remain pending
until they can be built and tested on those operating systems. Each package
contains the VeriWhy-check application, private Node.js and npm runtimes,
public profiles, public checks, report assets, and an uninstaller.

Students will not need to install Node.js, NVM, NVS, Docker, Python, Go, or an
LLM. Static web assessment additionally installs Playwright's managed Chromium
browser in the application's documented user-data location.

The Apple Silicon release has been tested from its public GitHub download in an
isolated directory and in the normal macOS user locations. The installer
supports explicit data and command directories for controlled validation. Each
release includes a SHA-256 digest; the installer checks it before running any
packaged code.

The installed layout uses versioned folders. An update installs the new folder
first and changes the small command launcher only after the copy succeeds. The
previous version is not damaged by a failed copy.
