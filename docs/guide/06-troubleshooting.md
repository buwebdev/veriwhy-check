# Troubleshooting

## Start With the Readiness Check

```text
veriwhy-check doctor
```

## “Command Not Found”

Close the terminal, open a new one, and try again. If the problem continues, run the official
installation command again. Reinstalling the same version is safe and replaces it through a staged
repair.

## “No Project Was Found”

First, display the folder where the terminal is currently working.

On macOS Terminal:

```text
pwd
```

On Windows PowerShell:

```text
Get-Location
```

Then display the files and folders at that location.

On macOS Terminal:

```text
ls
```

On Windows PowerShell:

```text
Get-ChildItem
```

Use `cd` to move into the folder containing your course repository. Put a path in quotation marks
when any folder name contains a space:

```text
cd "Documents/GitHub/web-340"
```

Run the check from there, or give VeriWhy Check the exact assignment folder:

```text
veriwhy-check check WEB-340/assignment-2.2 ./week-2/cooking-app
```

See the [Beginner CLI Guide](cli-basics.html) for illustrated instructions on reading the prompt,
moving between folders, checking your location, and fixing common terminal mistakes.

See the [Project Folder Guide](project-folders.html) if you are unsure which folder should contain
the assignment files.

## “Multiple Projects Were Found”

Provide one exact project folder. VeriWhy Check refuses to guess because it might otherwise check
the wrong work.

The [Project Folder Guide](project-folders.html) shows how extra copies and folders inside folders
can cause this message.

## “Managed Headless Browser Is Missing”

Run the official installer again. The headless browser is part of the VeriWhy Check toolbox and does
not require or change regular Chrome.

## Dependency Installation Failed

Confirm that the project has its `package.json` and `package-lock.json`. An Angular or Node.js
project may need internet access to obtain dependencies declared by the project.

## The Guide Did Not Open

Display its location and open that file in your preferred browser:

```text
veriwhy-check guide --path
```

## Asking for Help

If the problem remains after running `veriwhy-check doctor`, use the
[GitHub bug-report form](https://github.com/buwebdev/veriwhy-check/issues/new?template=bug_report.yml).
Provide the application version, operating system, course and assignment, exact command, expected
result, actual result, and safe readiness-check output. The maintainer will review the report and
decide whether it is a product defect, setup issue, assignment question, unsupported system, or
feature request. A report does not guarantee an application change.

Do not post passwords, tokens, student information, private repository links, screenshots with
private information, or your complete assignment in a public issue.
