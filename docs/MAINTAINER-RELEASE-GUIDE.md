# Maintainer Release Guide

**Author:** Richard Krasso  
**Audience:** VeriWhy Check maintainer

This guide explains how to publish VeriWhy Check after documentation or
application changes. Publication is manual: nothing runs on a schedule, after
a push, or without you entering a release command.

## What the Release Command Does

The release command performs these steps in order:

1. Confirms that the release choice is valid.
2. Refuses unexpected uncommitted application changes.
3. Confirms that GitHub CLI is installed and signed in.
4. Updates the application version when requested.
5. Builds the application.
6. Runs the unit tests and coverage requirements.
7. Validates every public YAML profile.
8. Lints every Markdown document.
9. Converts the Markdown student guide into the bundled offline website.
10. Builds the release package and SHA-256 checksum for this computer.
11. Commits the release, creates its Git tag, and pushes both to GitHub.
12. Creates the GitHub release and uploads the package and checksum.

If a required check fails, publication stops. A failed check is never ignored.

## One-Time Computer Setup

### 1. Open the Repository

Open Terminal and move into the repository:

```bash
cd /path/to/veriwhy-check
```

Replace `/path/to/veriwhy-check` with the repository's actual location. In VS
Code, **Terminal > New Terminal** normally opens in the correct folder, so the
`cd` command may not be needed.

### 2. Select the Project's Node.js Version

```bash
nvm use
```

The command reads `.nvmrc` and selects Node.js 24.18.0.

### 3. Install the Locked Development Dependencies

```bash
npm ci
```

### 4. Install the Managed Test Browser

```bash
npm run setup:browser
```

This browser is isolated from a normal personal browser.

### 5. Install and Sign In to GitHub CLI

Install GitHub CLI from <https://cli.github.com>. Then sign in once:

```bash
gh auth login
```

Choose GitHub.com and follow the browser sign-in directions. Confirm the
connection afterward:

```bash
gh auth status
```

The release script uses GitHub CLI so a GitHub token is not saved in this
repository.

## Publish the First Version 1 Release

The project is already version 1.0.0. Publish that current version with:

```bash
npm run deploy -- current
```

Use `current` only when publishing the version already written in
`package.json`, or when uploading another operating-system package to a release
that already exists.

## Release a Markdown Documentation Change

Markdown-only working changes may remain uncommitted. The release command will
include them in the release commit.

1. Edit and save the Markdown files.
2. Review the changes in VS Code.
3. From the repository folder, run:

   ```bash
   npm run deploy -- patch
   ```

For example, version 1.0.0 becomes 1.0.1. The command rebuilds the offline
guide before packaging, so students receive the changed documentation.

## Release an Application or Profile Change

Application, test, YAML profile, installer, or packaging changes must be
reviewed and committed before deployment. This boundary prevents an unfinished
code change from being released accidentally.

```bash
git add <the-files-you-reviewed>
git commit -m "Describe the completed change"
npm run deploy -- patch
```

The release command stops and lists the files when non-Markdown changes have
not been committed.

## Choose the Version Change

Use one of these commands:

| Change | Command | Example |
| --- | --- | --- |
| Publish the version already in the project | `npm run deploy -- current` | 1.0.0 stays 1.0.0 |
| Backward-compatible fix or documentation update | `npm run deploy -- patch` | 1.0.0 becomes 1.0.1 |
| Substantial backward-compatible feature | `npm run deploy -- minor` | 1.0.1 becomes 1.1.0 |
| Incompatible product change | `npm run deploy -- major` | 1.1.0 becomes 2.0.0 |

Most documentation, profile, and defect corrections should use `patch`.

## Build Packages for Other Operating Systems

A release package contains a platform-specific Node.js runtime and managed
browser. Therefore, a macOS computer builds a macOS package; it cannot produce
the real Windows or Linux package.

After the first computer creates the release, repeat these steps on each other
supported operating system:

```bash
git fetch --tags
git checkout v1.0.0
npm ci
npm run setup:browser
npm run deploy -- current
```

Replace `v1.0.0` with the release being completed. When that GitHub release
already exists, `current` uploads or replaces only the package and checksum for
the current computer. It does not create a second release.

Version 1 should not be announced as cross-platform until its required macOS,
Windows, and Linux packages have been uploaded and tested.

### Manual Windows x64 Runner

The repository includes a manual-only GitHub Windows runner. It has no push,
pull-request, or schedule trigger and never runs unless the maintainer starts
it deliberately.

To validate the current `main` branch without publishing:

```bash
gh workflow run manual-windows-release.yml \
  -f source_ref=main \
  -f release_tag=v1.0.2 \
  -f publish=false
```

After the validation succeeds, build a tagged version and upload its verified
Windows archive by changing `source_ref` and `release_tag` to that same tag and
setting `publish=true`. The runner performs tests, packaging, checksum
verification, installation, private npm verification, readiness, uninstall,
and release upload on a clean Windows x64 virtual machine.

## Check the Published Release

After deployment:

1. Open <https://github.com/buwebdev/veriwhy-check/releases>.
2. Confirm the version title and tag.
3. Confirm the platform archive and matching `.sha256` file are present.
4. Download the archive from a normal user account.
5. Test installation, `veriwhy-check doctor`, an assignment check, update, and
   uninstallation as required by the release checklist.
6. Update [the Version 1 release checklist](RELEASE-CHECKLIST.md).

## If a Release Stops

Read the final `Release stopped safely` explanation before changing anything.

- If GitHub CLI is missing, install it and repeat the command.
- If GitHub is not signed in, run `gh auth login` and repeat the command.
- If non-Markdown files are listed, review and commit them before repeating.
- If tests, YAML validation, or Markdown linting fails, correct the reported
  problem and repeat the original command.
- If a release commit or tag was created before a network failure, inspect the
  repository and rerun with `npm run deploy -- current`. Do not select `patch`
  again, because the version may already have advanced.

Do not delete tags or published releases merely to retry a command. Review the
state first so an existing student release is not damaged.

## Prepare Without Publishing

To inspect a package without creating a GitHub release, run:

```bash
npm run release:package
```

The archive and checksum are written beneath ignored `tmp/releases`. This is
useful for local installation testing. It does not commit, tag, push, or upload
anything.
