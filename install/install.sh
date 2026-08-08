#!/bin/sh
# VeriWhy Check macOS/Linux release installer.
# Author: Richard Krasso

# Exit on the first failure and reject unset variables. A partial install must
# never continue after a download, checksum, or extraction error.
set -eu

repository="https://github.com/buwebdev/veriwhy-check/releases/latest/download"
machine="$(uname -m)"
# One public command supports both Mac processor families. The operating system
# selects one native archive instead of downloading an oversized universal file.
case "$(uname -s)-$machine" in
  Darwin-arm64) asset="veriwhy-check-macos-arm64.tar.gz" ;;
  Darwin-x86_64) asset="veriwhy-check-macos-x64.tar.gz" ;;
  Linux-aarch64|Linux-arm64) asset="veriwhy-check-linux-arm64.tar.gz" ;;
  Linux-x86_64) asset="veriwhy-check-linux-x64.tar.gz" ;;
  *) printf '%s\n' "VeriWhy Check does not yet have an installer for this computer." >&2; exit 1 ;;
esac

# All download and extraction work occurs in one unique temporary directory.
# Cleanup runs after success, failure, interruption, or terminal termination.
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT HUP INT TERM
printf '%s\n' "Downloading the official VeriWhy Check package..."
curl --fail --location --silent --show-error "$repository/$asset" --output "$work/$asset"
curl --fail --location --silent --show-error "$repository/$asset.sha256" --output "$work/$asset.sha256"
# Verify the exact compressed archive before any packaged JavaScript executes.
(cd "$work" && shasum -a 256 -c "$asset.sha256")
tar -xzf "$work/$asset" -C "$work"
# Use the archive's private Node runtime; students do not need Node.js or NVM.
"$work/payload/runtime/node" "$work/install.mjs"
