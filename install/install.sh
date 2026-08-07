#!/bin/sh
# VeriWhy Check macOS/Linux release installer.
# Author: Richard Krasso

set -eu

repository="https://github.com/buwebdev/veriwhy-check/releases/latest/download"
machine="$(uname -m)"
case "$(uname -s)-$machine" in
  Darwin-arm64) asset="veriwhy-check-macos-arm64.tar.gz" ;;
  Darwin-x86_64) asset="veriwhy-check-macos-x64.tar.gz" ;;
  Linux-aarch64|Linux-arm64) asset="veriwhy-check-linux-arm64.tar.gz" ;;
  Linux-x86_64) asset="veriwhy-check-linux-x64.tar.gz" ;;
  *) printf '%s\n' "VeriWhy Check does not yet have an installer for this computer." >&2; exit 1 ;;
esac

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT HUP INT TERM
printf '%s\n' "Downloading the official VeriWhy Check package..."
curl --fail --location --silent --show-error "$repository/$asset" --output "$work/$asset"
curl --fail --location --silent --show-error "$repository/$asset.sha256" --output "$work/$asset.sha256"
(cd "$work" && shasum -a 256 -c "$asset.sha256")
tar -xzf "$work/$asset" -C "$work"
"$work/payload/runtime/node" "$work/install.mjs"
