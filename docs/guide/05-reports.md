# Understanding Reports

Every check creates `report.html` for people and `report.json` for structured
records. The terminal prints the exact HTML report location.

## Result Labels

### Passed

The published requirement worked during this run. The report includes the
observed evidence, such as finding required files or receiving the expected
program output.

### Needs Attention

At least one part of the requirement did not pass. Read the detail, make one
correction, and check again. Common examples include a missing file, incorrect
text, unexpected output, a build error, or a control that does not respond.

### Not Checked

The application could not run that behavior or you selected `--static-only`.
This is not the same as passing. Follow the report explanation.

## Reports Are Formative

The report is pre-submission practice feedback. It does not guarantee that an
assignment is complete and does not replace your instructor's official grade.

## Sharing a Report

You control whether a report is shared. The HTML file can be uploaded with an
assignment or sent to your instructor when requested. Review the local project
path shown in the report before sharing it publicly.

## Find Reports Later

```text
veriwhy-check paths
```

Look beneath **Your saved reports**. Uninstalling the application preserves
reports unless you explicitly use `--remove-reports`.
