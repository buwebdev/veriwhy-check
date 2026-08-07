# Student Guide to VeriWhy Check

**Author:** Richard Krasso

## What Is VeriWhy Check?

VeriWhy Check is a practice coach for your coding assignments.

Think about building a LEGO model. Before you show it to your teacher, you may
look at the picture on the box and check that the important pieces are in the
right places. VeriWhy Check does something similar. It checks that the parts of
your program work the way the assignment describes.

It does not give your official grade. Your instructor still decides that.

## What Does It Do?

VeriWhy Check can:

- find your assignment folder;
- test the assignment requirements;
- tell you what passed and what needs attention; and
- make a report that opens like a regular web page.

It does not send your code to the internet. It does not use artificial
intelligence. It does not look inside your normal web browser, email, photos,
or other schoolwork.

## Installing VeriWhy Check

Your instructor will give you one command to copy. Think of the command as a
delivery address for a trusted delivery truck. It tells GitHub which official
toolbox to bring and tells your computer where to put it.

### macOS on Apple Silicon

Open Terminal, copy the complete line below, paste it, and press Return:

```text
curl -fsSL https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.sh | sh
```

### Windows, Linux, or Intel Mac

Your instructor will tell you when VeriWhy Check is available for your
computer. Do not run an installation command until your operating-system
package has been announced. The planned Windows command is:

Open PowerShell, copy the complete line below, paste it, and press Enter:

```text
irm https://raw.githubusercontent.com/buwebdev/veriwhy-check/v1.0.0/install/install.ps1 | iex
```

The command chooses the correct package, downloads it from the official GitHub
release, checks its digital fingerprint, and installs the complete toolbox.
You do not need to choose or open an installer file yourself.

When it finishes, open a new terminal or PowerShell window. Enter:

```text
veriwhy-check doctor
```

The `doctor` command is like a mechanic checking a car before a trip. It does
not change your assignment. It only confirms that the needed tools are ready.

You do not need to install Node.js, NVM, Docker, Python, or Chrome just to use
VeriWhy Check. Its installer brings its own private toolbox.

## Checking an Assignment

First, move into your assignment folder in the terminal. Then enter a command
like this:

```text
veriwhy-check check WEB-425/lab-1.1
```

The course and assignment name will change. If you do not know the name, enter:

```text
veriwhy-check list WEB-425
```

VeriWhy Check will show the exact commands available for that course.

## Reading the Report

After the check finishes, VeriWhy Check tells you where it saved `report.html`.
Open that file in a web browser.

- **Passed** means the requirement worked during the check.
- **Needs attention** means you should read the message, make a correction,
  and check again.
- **Not checked** means that part did not run. Follow the message or ask your
  instructor for help.

This is like checking answers on a practice worksheet. Fixing a problem and
trying again is part of learning.

## If You Type Something Incorrectly

That is okay. VeriWhy Check explains what was wrong and shows a command under
“Try this next.” You can copy that command and try again.

For the full help page, enter:

```text
veriwhy-check help
```

## Updating the Application

You do not need to uninstall and reinstall VeriWhy Check for normal updates.
Enter:

```text
veriwhy-check update
```

The application checks the official release, performs a safety check on the
download, and updates itself. Your assignment folders and old reports are not
removed.

## Where Are the Files?

Enter this command:

```text
veriwhy-check paths
```

It shows where the application keeps reports, its private checking browser,
and support files. Think of it as a map of the application's toolbox.

## Getting Help

Run these two commands first:

```text
veriwhy-check doctor
veriwhy-check help
```

If the problem continues, send your instructor the error message. Do not post
passwords, access codes, private repository links, or your complete assignment
in a public issue.

## Removing VeriWhy Check

You can first preview exactly what would be removed:

```text
veriwhy-check uninstall --dry-run
```

Then remove the application with:

```text
veriwhy-check uninstall
```

Your saved reports stay on the computer. VeriWhy Check never removes your
assignment folders. If you also want to remove saved reports, use the separate
`--remove-reports` option described in the uninstallation guide.
