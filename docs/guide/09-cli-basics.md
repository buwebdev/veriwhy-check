# Beginner CLI Guide

This guide assumes that you have never used a command-line interface (CLI). You will learn only the
commands needed to find your coursework and use VeriWhy Check safely.

## What Is a CLI?

A CLI is a text-based way to give your computer instructions. Think of it as an address bar for your
computer: you type where you want to go and what you want the computer to do.

On macOS, use **Terminal**. On Windows, use **PowerShell**.

## The Three Parts of a Terminal

```text
┌──────────────────────────────────────────────────────────────┐
│ student@computer web-425 % veriwhy-check version             │
│ ──────────────── ────────   ────────────────────             │
│ computer prompt  location   command you entered              │
│                                                              │
│ VeriWhy Check 1.0.0  ← output from the application           │
└──────────────────────────────────────────────────────────────┘
```

Only type the command. Do not type the prompt symbol (`%`, `$`, or `>`) and do not type the example
output.

```text
Type this:       veriwhy-check version
Do not type:   % veriwhy-check version
```

## Open the Terminal

### macOS

1. Press Command + Space.
2. Type `Terminal`.
3. Press Return.

### Windows

1. Open the Start menu.
2. Type `PowerShell`.
3. Select **Windows PowerShell** or **PowerShell**.

If you use Visual Studio Code, you can instead select **Terminal**, then **New Terminal**. Its
starting folder is usually the folder open in VS Code.

## Check Your Current Location

Your terminal is always working inside one folder. Check that location before running an assignment
check.

### macOS Terminal

```text
pwd
```

Example:

```text
/Users/student/Documents/GitHub/web-425
```

### Windows PowerShell

```text
Get-Location
```

Example:

```text
Path
----
C:\Users\student\Documents\GitHub\web-425
```

`pwd` means **print working directory**. A directory is another word for a folder. PowerShell also
accepts `pwd` as a short form of `Get-Location`.

## See What Is in the Current Folder

### macOS Terminal

```text
ls
```

### Windows PowerShell

```text
Get-ChildItem
```

PowerShell also accepts `ls` as a short form. A course repository might look like this:

```text
week-1    week-2    week-3    README.md
  ↑
folders you can enter
```

The WEB 425 project might look like this:

```text
angular.json    package.json    package-lock.json    src    assignments
     ↑               ↑                  ↑             ↑
Angular file    project file      package details   code folder
```

## Move Into a Folder

Use `cd`, which means **change directory**.

```text
cd week-2
```

Check the result:

```text
pwd
ls
```

Illustrated example:

```text
Before:  web-340
           ├── week-1
           └── week-2

Command: cd week-2

After:   web-340/week-2
```

PowerShell users can enter `Get-Location` instead of `pwd` in these examples.

## Move Up One Folder

Two periods mean the parent folder—the folder one level above the current one.

```text
cd ..
```

```text
Before: web-340/week-2/cooking-app
After:  web-340/week-2
```

Move up twice by entering the command twice:

```text
cd ..
cd ..
```

## Move to Your Home Folder

This works in both macOS Terminal and PowerShell:

```text
cd ~
```

The tilde (`~`) is a shortcut for your personal user folder.

## Enter a Complete Folder Path

You do not have to move one folder at a time. Enter the complete path in quotation marks:

### macOS example

```text
cd "/Users/student/Documents/GitHub/web-340/week-2/cooking-app"
```

### Windows example

```text
cd "C:\Users\student\Documents\GitHub\web-340\week-2\cooking-app"
```

Quotation marks are required when a folder name contains spaces:

```text
cd "C:\Users\student\My Courses\web-340"
```

Without quotation marks, the terminal may treat each word as a separate instruction.

## Understand Path Shortcuts

| Shortcut   | Meaning                | Example              |
| ---------- | ---------------------- | -------------------- |
| `.`        | Current folder         | `./week-2`           |
| `..`       | One folder above       | `../week-1`          |
| `~`        | Your user folder       | `~/Documents`        |
| `/` or `\` | Separates folder names | `week-2/cooking-app` |

VeriWhy Check accepts a quoted complete path, so use one if you are uncertain.

## Find the Correct Assignment Folder

Look for the files that identify the kind of project.

If folders and files are new to you, read the [Project Folder Guide](project-folders.html) first. It
explains these ideas in basic English and shows complete examples for every supported course.

| Course  | What you should usually see                   |
| ------- | --------------------------------------------- |
| WEB 231 | The assignment `.html` and `.js` files        |
| WEB 330 | The assignment `.html` and `.js` files        |
| WEB 340 | `package.json` and the assigned Node.js files |
| WEB 425 | `angular.json`, `package.json`, and `src`     |

Example WEB 340 location:

```text
web-340
└── week-2
    └── cooking-app       ← run the assignment check here
        ├── package.json
        └── src
```

Example WEB 425 location:

```text
rpg-character-builder       ← open this folder and run the lab check here
├── angular.json
├── package.json
├── package-lock.json
└── src
```

The WEB 425 repository and project folder are normally the same folder. The
[Project Folder Guide](project-folders.html) explains why this looks different from courses that use
separate week folders.

## Run Your First Check

Start by confirming that VeriWhy Check is ready:

```text
veriwhy-check doctor
```

List the checks for your course:

```text
veriwhy-check list WEB-425
```

Copy one complete command from the list:

```text
veriwhy-check check WEB-425/lab-1.1
```

Successful terminal flow:

```text
student@computer rpg-character-builder % veriwhy-check check WEB-425/lab-1.1

Checking WEB-425/lab-1.1...
Your files stay on this computer. This may take a few minutes.

PASSED — 8 passed, 0 need attention, 0 not checked.

Your report is ready:
  /your/local/report/location/report.html
```

Your exact output may differ. Look for **Your report is ready**. The next line tells you where the
student-facing HTML report was saved.

## Check a Project Without Moving Into It

Give the command an exact folder after the assignment name:

```text
veriwhy-check check WEB-340/assignment-2.2 "./week-2/cooking-app"
```

You can also provide a complete path:

```text
veriwhy-check check WEB-340/assignment-2.2 "/Users/student/Documents/GitHub/web-340/week-2/cooking-app"
```

On Windows, use your Windows path inside quotation marks.

## All VeriWhy Check Commands

| What you want to do                          | Command                                               |
| -------------------------------------------- | ----------------------------------------------------- |
| Get a short introduction                     | `veriwhy-check help`                                  |
| Open the visual guide                        | `veriwhy-check guide`                                 |
| Show the guide file location                 | `veriwhy-check guide --path`                          |
| Check one assignment                         | `veriwhy-check check COURSE/ASSIGNMENT`               |
| Check a particular folder                    | `veriwhy-check check COURSE/ASSIGNMENT "FOLDER"`      |
| Inspect files without running behavior tests | `veriwhy-check check COURSE/ASSIGNMENT --static-only` |
| List all available checks                    | `veriwhy-check list`                                  |
| List one course                              | `veriwhy-check list WEB-425`                          |
| Test whether the installation is ready       | `veriwhy-check doctor`                                |
| Show saved file locations                    | `veriwhy-check paths`                                 |
| Show the installed version                   | `veriwhy-check version`                               |
| Install the latest release                   | `veriwhy-check update`                                |
| Preview uninstallation                       | `veriwhy-check uninstall --dry-run`                   |
| Uninstall but preserve reports               | `veriwhy-check uninstall`                             |
| Uninstall and remove reports                 | `veriwhy-check uninstall --remove-reports`            |

The uninstall commands are included for completeness. Do not run them while you are trying to check
an assignment.

## Helpful Terminal Controls

| Action                   | macOS Terminal | Windows PowerShell |
| ------------------------ | -------------- | ------------------ |
| Run the command          | Return         | Enter              |
| Paste copied text        | Command + V    | Control + V        |
| Stop a running command   | Control + C    | Control + C        |
| Show an earlier command  | Up Arrow       | Up Arrow           |
| Clear the visible screen | `clear`        | `Clear-Host`       |

Stopping a command with Control + C does not delete your assignment. It only asks the currently
running command to stop.

## Troubleshooting: No Project Was Found

This message means VeriWhy Check could not identify the assignment under the folder it searched. It
does not mean that your work was deleted.

The [Project Folder Guide](project-folders.html) can help you recognize the correct project folder
before you continue.

Follow this sequence:

1. Display your current location with `pwd` or `Get-Location`.
2. Display its contents with `ls` or `Get-ChildItem`.
3. Look for your course, week, or project folder.
4. Use `cd` to move closer to the project.
5. Confirm that the expected project files are visible.
6. Run the VeriWhy Check command again.

```text
pwd
ls
cd week-2
ls
cd cooking-app
ls
veriwhy-check check WEB-340/assignment-2.2
```

Or remain in the course folder and provide the project path:

```text
veriwhy-check check WEB-340/assignment-2.2 "./week-2/cooking-app"
```

## Troubleshooting: Multiple Projects Were Found

VeriWhy Check found more than one possible project and refused to guess. Give it the exact folder:

```text
veriwhy-check check WEB-231/assignment-2.2 "./week-2/project2-2"
```

The exact folder names can be different. Use `ls` or `Get-ChildItem` to read the names on your
computer, and copy those names into the command.

## Troubleshooting: Command Not Found

Typical messages include:

```text
command not found: veriwhy-check
```

```text
The term 'veriwhy-check' is not recognized...
```

Try these steps:

1. Close Terminal or PowerShell.
2. Open a new Terminal or PowerShell window.
3. Enter `veriwhy-check doctor` again.
4. If it still fails, rerun the official installer.

Your current folder does not cause a **command not found** message. That message concerns the
VeriWhy Check installation.

## Troubleshooting: Folder Not Found

Typical messages include **No such file or directory** or **Cannot find path**.

Check for these common mistakes:

- The folder name was misspelled.
- A path containing spaces was not placed in quotation marks.
- The terminal is starting from a different folder than the example.
- You entered a macOS path on Windows or a Windows path on macOS.

Enter `ls` or `Get-ChildItem` and copy the folder name exactly as displayed.

## Troubleshooting: You Entered the Wrong Command

VeriWhy Check explains unsupported commands and shows a corrected example. You can always return to
the main help:

```text
veriwhy-check help
```

Use the Up Arrow to recall the previous command, correct the typing, and press Return or Enter
again.

## Troubleshooting: A Check Appears Stuck

Angular and Node.js projects may need time to prepare dependencies, build, and run tests. If the
terminal is still displaying new activity, allow it to continue.

If there is no new activity for several minutes:

1. Press Control + C once.
2. Confirm that your internet connection is available.
3. Run `veriwhy-check doctor`.
4. Run the assignment check again.

## Troubleshooting: Find a Saved Report

Display every location used by the application:

```text
veriwhy-check paths
```

The output labels the saved reports folder. You can also copy the report path printed at the end of
a completed check.

## Commands to Avoid

You do not need administrator commands or file-deletion commands to use VeriWhy Check. Do not enter
commands such as `sudo`, `rm`, `del`, or `Remove-Item` merely to solve a checking error. Ask your
instructor for help before using a command that changes permissions or removes files.

## A Safe Practice Exercise

Try these read-only commands before checking an assignment:

```text
pwd
ls
veriwhy-check version
veriwhy-check doctor
veriwhy-check list WEB-425
```

On Windows, replace `pwd` and `ls` with `Get-Location` and `Get-ChildItem` if you prefer the
complete PowerShell command names.
