# Maintainer Release Guide

**Author:** Richard Krasso  
**Audience:** VeriWhy Check maintainer

This guide explains how to publish VeriWhy Check after documentation or application changes.
Publication is manual: nothing runs on a schedule, after a push, or without you entering a release
command.

## What the Release Command Does

The release command performs these steps in order:

1. Confirms that the release choice is valid.
2. Refuses unexpected uncommitted application changes.
3. Confirms that GitHub CLI is installed and signed in.
4. Updates the application version when requested.
5. Verifies that maintained source and documentation match Prettier.
6. Builds the application.
7. Runs the unit tests and coverage requirements.
8. Validates every public YAML profile.
9. Lints every Markdown document.
10. Converts the Markdown student guide into the bundled offline website.
11. Builds the Apple Silicon package and SHA-256 checksum on this computer.
12. Commits the release, creates its Git tag, and pushes both to GitHub.
13. Creates the GitHub release and uploads the Apple Silicon files.
14. Starts the manual-only Intel macOS and Windows x64 release builders.
15. Waits for both builders to test, package, install, inspect, uninstall, and upload their platform
    files.
16. Confirms that all three archives and all three checksums are present.

If a required check fails, publication stops. A failed check is never ignored.

## One-Time Computer Setup

### 1. Open the Repository

Open Terminal and move into the repository:

```bash
cd /path/to/veriwhy-check
```

Replace `/path/to/veriwhy-check` with the repository's actual location. In VS Code, **Terminal > New
Terminal** normally opens in the correct folder, so the `cd` command may not be needed.

### 2. Select the Project's Node.js Version

```bash
nvm use
```

The command reads `.nvmrc` and selects Node.js 24.18.0.

### 3. Install the Locked Development Dependencies

```bash
npm ci
```

### 4. Install the Managed Headless Test Browser

```bash
npm run setup:browser
```

This rendering engine is isolated from a normal personal browser. It supports DOM behavior, CSS,
responsive viewports, media queries, computed styles, screenshots, and Angular tests without
installing a macOS `.app` bundle. See
[the resolved notification issue](KNOWN-ISSUES.md#resolved-duplicate-chrome-for-testing-notification-entries-on-macos)
before making any future browser-packaging change.

### 5. Install and Sign In to GitHub CLI

Install GitHub CLI from <https://cli.github.com>. Then sign in once:

```bash
gh auth login
```

Choose GitHub.com and follow the browser sign-in directions. Confirm the connection afterward:

```bash
gh auth status
```

The release script uses GitHub CLI so a GitHub token is not saved in this repository.

## Publish the First Version 1 Release

The project is already version 1.0.0. Publish that current version with:

```bash
npm run deploy -- current
```

Use `current` only when publishing the version already written in `package.json`, or when uploading
another operating-system package to a release that already exists.

## Release a Markdown Documentation Change

Markdown-only working changes may remain uncommitted. The release command will include them in the
release commit.

1. Edit and save the Markdown files.
2. Review the changes in VS Code.
3. From the repository folder, run:

   ```bash
   npm run deploy -- patch
   ```

For example, version 1.0.0 becomes 1.0.1. The command rebuilds the offline guide before packaging,
so students receive the changed documentation.

## Release an Application or Profile Change

Application, test, YAML profile, installer, or packaging changes must be reviewed and committed
before deployment. This boundary prevents an unfinished code change from being released
accidentally.

```bash
git add <the-files-you-reviewed>
git commit -m "Describe the completed change"
npm run deploy -- patch
```

The release command stops and lists the files when non-Markdown changes have not been committed.

## Choose the Version Change

Use one of these commands:

| Change                                          | Command                     | Example             |
| ----------------------------------------------- | --------------------------- | ------------------- |
| Publish the version already in the project      | `npm run deploy -- current` | 1.0.0 stays 1.0.0   |
| Backward-compatible fix or documentation update | `npm run deploy -- patch`   | 1.0.0 becomes 1.0.1 |
| Substantial backward-compatible feature         | `npm run deploy -- minor`   | 1.0.1 becomes 1.1.0 |
| Incompatible product change                     | `npm run deploy -- major`   | 1.1.0 becomes 2.0.0 |

Most documentation, profile, and defect corrections should use `patch`.

Before creating a new version, update `RELEASE-NOTES.md` so its version heading matches the version
being created. The deployment script stops if they differ and publishes that maintained file as the
GitHub release description.

## Packages for Other Operating Systems

A release package contains a platform-specific Node.js runtime and managed headless browser.
Therefore, this computer cannot build authentic Intel macOS or Windows x64 packages. The one release
command starts the repository's two manual-only GitHub builders and waits for their results.

Normal publication needs only one command:

```bash
npm run deploy -- patch
```

If publication stops after the GitHub release exists, correct the cause and retry the same version
with `npm run deploy -- current`. That command replaces the current computer's files, starts both
remote builders again, and verifies the complete six-file release. It does not create another
version.

Version 1 supports Apple Silicon macOS, Intel macOS, and Windows x64. Other platform packages must
be built and tested before support is announced.

### Manual Remote Builders

The repository includes manual-only GitHub workflows for Intel macOS and Windows x64. They have no
push, pull-request, or schedule trigger. The local release command deliberately starts them through
GitHub CLI.

To validate the current `main` branch without publishing:

```bash
gh workflow run manual-macos-intel-release.yml \
  -f source_ref=main \
  -f release_tag=v1.0.5 \
  -f publish=false
```

Replace the workflow filename with `manual-windows-release.yml` to validate Windows. These commands
are diagnostic alternatives; the deployment command starts both automatically. When publishing
manually, change `source_ref` and `release_tag` to the same existing tag and set `publish=true`.

GitHub has announced availability of the `macos-15-intel` runner through August 2027. Publish a
final tested Intel package before that cutoff, then stop creating new Intel releases while leaving
the frozen package downloadable. Follow [the support policy](SUPPORT-POLICY.md) and update it with
the final Intel version.

## Check the Published Release

After deployment:

1. Open <https://github.com/buwebdev/veriwhy-check/releases>.
2. Confirm the version title and tag.
3. Confirm all six files are present: three platform archives and their three matching `.sha256`
   files.
4. Download the archive from a normal user account.
5. Test installation, `veriwhy-check doctor`, an assignment check, update, and uninstallation as
   required by the release checklist.
6. Update [the Version 1 release checklist](RELEASE-CHECKLIST.md).

## If a Release Stops

Read the final `Release stopped safely` explanation before changing anything.

- If GitHub CLI is missing, install it and repeat the command.
- If GitHub is not signed in, run `gh auth login` and repeat the command.
- If non-Markdown files are listed, review and commit them before repeating.
- If tests, YAML validation, or Markdown linting fails, correct the reported problem and repeat the
  original command.
- If a release commit or tag was created before a network failure, inspect the repository and rerun
  with `npm run deploy -- current`. Do not select `patch` again, because the version may already
  have advanced.

Do not delete tags or published releases merely to retry a command. Review the state first so an
existing student release is not damaged.

## Prepare Without Publishing

To inspect a package without creating a GitHub release, run:

```bash
npm run release:package
```

The archive and checksum are written beneath ignored `tmp/releases`. This is useful for local
installation testing. It does not commit, tag, push, or upload anything.
