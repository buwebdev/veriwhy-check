# Getting Started

## Install on macOS

Open Terminal, copy the complete command, paste it, and press Return:

```text
curl -fsSL https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.sh | sh
```

## Install on Windows

Open PowerShell, copy the complete command, paste it, and press Enter:

```text
irm https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.ps1 | iex
```

The installer chooses the correct package, downloads it from the official
GitHub release, checks its digital fingerprint, and installs its private
toolbox. You do not need to install Node.js, NVM, Docker, Python, or Chrome.

## Confirm the Installation

Open a new Terminal or PowerShell window and enter:

```text
veriwhy-check doctor
```

Each item should say **READY**. If an item says **ACTION NEEDED**, follow the
explanation beside it or see the troubleshooting page.

## Find the Installed Version

```text
veriwhy-check version
```

## Open This Guide Again

```text
veriwhy-check guide
```

If automatic opening is blocked, display the exact guide location with:

```text
veriwhy-check guide --path
```
