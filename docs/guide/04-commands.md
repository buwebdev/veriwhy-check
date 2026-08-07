# Command Reference

## `help`

Shows the short terminal help page and examples.

```text
veriwhy-check help
```

## `guide`

Opens this complete offline documentation website.

```text
veriwhy-check guide
veriwhy-check guide --path
```

## `check`

Checks one published assignment and creates HTML and JSON reports.

```text
veriwhy-check check <course/assignment> [folder]
```

## `list`

Lists every installed assignment or only one course.

```text
veriwhy-check list
veriwhy-check list WEB-340
```

## `doctor`

Checks the private Node.js runtime, assignment profiles, and managed browser.

```text
veriwhy-check doctor
```

## `paths`

Shows the exact application, profile, browser, cache, and report locations.

```text
veriwhy-check paths
```

## `version`

Shows the installed VeriWhy Check version.

```text
veriwhy-check version
```

## `update`

Downloads and verifies the newest official GitHub release.

```text
veriwhy-check update
```

## `uninstall`

Preview removal, remove the application, or explicitly remove reports too.

```text
veriwhy-check uninstall --dry-run
veriwhy-check uninstall
veriwhy-check uninstall --remove-reports
```
