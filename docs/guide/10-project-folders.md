# Project Folder Guide

This guide assumes that folders, files, and computer projects are new to you.
It explains where to save your course work and which folder to use with
VeriWhy Check.

## What Is a File?

A **file** holds one piece of work. A file can hold code, text, a picture, or
settings for an application.

You can think of a file as one sheet of paper:

```text
┌──────────────────────────┐
│ home.component.ts        │ ← file name
│                          │
│ Your TypeScript code     │ ← information inside the file
└──────────────────────────┘
```

The letters after the period help the computer understand the file:

| Ending | What the file usually contains |
| --- | --- |
| `.html` | The content and parts of a web page |
| `.css` | Colors, spacing, and page appearance |
| `.js` | JavaScript instructions |
| `.ts` | TypeScript instructions |
| `.json` | Application information and settings |
| `.md` | Written instructions |

Do not remove or change a file ending unless your assignment tells you to do
so.

## What Is a Folder?

A **folder** holds files and other folders. It works like a paper folder that
keeps related work together.

```text
course-work/                 ← folder
├── instructions.md          ← file inside the folder
└── week-1/                  ← another folder inside it
    ├── index.html           ← file inside week-1
    └── script.js            ← file inside week-1
```

The lines in this picture only show what is inside each folder. You do not
type the lines or arrows into your computer.

## What Is a Project Folder?

A **project folder** holds all parts of one programming project. Files that
work together must stay together inside this folder.

Think of it as one school binder:

```text
One binder
└── cooking-app/             ← project folder
    ├── package.json         ← project information
    ├── package-lock.json    ← exact package information
    └── src/                 ← source-code folder
```

VeriWhy Check looks for special files to recognize a project. For example, an
Angular project normally has `angular.json` and `package.json`.

## What Is a Repository?

A **repository**, often called a **repo**, is a project folder that Git tracks.
Git can remember changes to your files. GitHub can store a copy of the
repository online.

For these courses, a repository may hold:

- One project that grows each week, or
- Several week folders with a different assignment in each folder.

You do not need to understand how Git works to recognize the folder pictures
in this guide.

## How to Read a Folder Picture

```text
web-340/                     ← main course folder
└── week-2/                  ← inside web-340
    └── cooking-app/         ← inside week-2
        ├── package.json     ← inside cooking-app
        └── src/             ← also inside cooking-app
```

Each step to the right means **inside the folder above it**.

The full location is:

```text
web-340/week-2/cooking-app
```

On Windows, the computer may display the same location with backslashes:

```text
web-340\week-2\cooking-app
```

## WEB 231 Folder Example

WEB 231 assignments use HTML and JavaScript files. A student repository can
hold one folder for each week.

```text
web-231/
├── week-1/
│   └── project1-2/          ← Week 1 project folder
│       ├── project01-02.html
│       └── project01-02.js
└── week-2/
    └── project2-2/          ← Week 2 project folder
        ├── project02-02.html
        └── project02-02.js
```

The textbook starter files may end in `_txt`, such as
`project01-02_txt.html`. VeriWhy Check accepts the textbook name and the
renamed assignment name.

You can run a check inside the project folder:

```text
cd "web-231/week-1/project1-2"
veriwhy-check check WEB-231/assignment-1.3
```

You can also remain in the main course folder and tell VeriWhy Check where the
project is:

```text
veriwhy-check check WEB-231/assignment-1.3 "./week-1/project1-2"
```

## WEB 330 Folder Example

WEB 330 also uses HTML and JavaScript files.

```text
web-330/
├── week-1/
│   └── project8-1/          ← Week 1 project folder
│       ├── project08-01.html
│       └── project08-01.js
└── week-2/
    └── character-generator/ ← Week 2 project folder
        ├── index.html
        └── JavaScript files
```

The textbook files may still contain `_txt` in their names. VeriWhy Check can
recognize both supported forms.

Example check from the main course folder:

```text
veriwhy-check check WEB-330/assignment-1.3 "./week-1/project8-1"
```

## WEB 340 Folder Example

WEB 340 projects use Node.js. Each assignment project normally has its own
`package.json` file.

```text
web-340/
├── week-1/
│   └── weight-converter/    ← Week 1 project folder
│       ├── package.json
│       └── weight-converter.js
└── week-2/
    └── cooking-app/         ← Week 2 project folder
        ├── package.json
        ├── package-lock.json
        └── source files
```

Example check from the main course folder:

```text
veriwhy-check check WEB-340/assignment-2.2 "./week-2/cooking-app"
```

## WEB 425 Folder Example

WEB 425 uses one Angular project that grows during the course. The repository
and the project folder are normally the same folder.

```text
rpg-character-builder/       ← repository and project folder
├── angular.json             ← tells us this is an Angular project
├── package.json             ← lists the project packages and commands
├── package-lock.json        ← records exact package versions
├── assignments/             ← assignment instructions
└── src/                     ← your application code
    └── app/
```

Open `rpg-character-builder` in Visual Studio Code. Do not open only the `src`
folder or only the `app` folder.

Run each lab check from `rpg-character-builder`:

```text
veriwhy-check check WEB-425/lab-1.1
```

The same project receives more files and features as you complete later labs.

## Which Folder Should I Open in Visual Studio Code?

Open the folder that holds the complete project.

1. Open Visual Studio Code.
2. Select **File**.
3. Select **Open Folder**.
4. Find the project folder.
5. Select the folder once.
6. Select **Open** or **Select Folder**.

Look at the Explorer area on the left side of Visual Studio Code.

For WEB 340, you should see something like:

```text
EXPLORER
COOKING-APP
├── package.json
├── package-lock.json
└── source files
```

For WEB 425, you should see something like:

```text
EXPLORER
RPG-CHARACTER-BUILDER
├── angular.json
├── package.json
├── assignments
└── src
```

If the Explorer only shows `src` or `app`, you may have opened a folder that
is too far inside the project. Select **File**, then **Open Folder**, and open
the complete project folder instead.

## How to Check the Folder in the Terminal

If the terminal is new to you, the
[Beginner CLI Guide](cli-basics.html) explains how to open it, type a command,
and understand what the computer shows you.

Open a new terminal in Visual Studio Code:

1. Select **Terminal** from the top menu.
2. Select **New Terminal**.
3. Enter the command that shows your current folder.

On macOS:

```text
pwd
```

On Windows PowerShell:

```text
Get-Location
```

Then show the files in that folder.

On macOS:

```text
ls
```

On Windows PowerShell:

```text
Get-ChildItem
```

Compare the displayed names with the course examples in this guide.

## Common Problem: The ZIP File Was Not Opened

A downloaded ZIP file is a closed package that holds other files. Your tools
usually need the normal folder inside it.

```text
Downloads/
├── rpg-character-builder.zip  ← closed package
└── rpg-character-builder/     ← opened folder to use
```

### macOS

Double-click the ZIP file in Finder. macOS creates the normal folder beside
it.

### Windows

1. Right-click the ZIP file in File Explorer.
2. Select **Extract All**.
3. Select **Extract**.

Open the extracted folder in Visual Studio Code. Do not open the ZIP file as
if it were the project folder.

## Common Problem: The Project Is Inside Too Many Copies

Downloading or copying a project more than once can create extra folders:

```text
rpg-character-builder/
└── rpg-character-builder/
    └── rpg-character-builder/
        ├── angular.json
        ├── package.json
        └── src
```

The correct project folder is the deepest `rpg-character-builder` in this
picture because it directly contains `angular.json`, `package.json`, and
`src`.

Open that deepest folder in Visual Studio Code, or give VeriWhy Check its
complete path. Do not delete the other folders until you know which copy holds
your newest work.

## Common Problem: Two Copies of the Same Project

You may see names such as:

```text
rpg-character-builder
rpg-character-builder-copy
rpg-character-builder-final
```

VeriWhy Check may report **Multiple Projects Were Found** because it will not
guess which copy is correct.

Open each copy and check the files. Find the copy with your newest work. Then
give VeriWhy Check that exact folder:

```text
veriwhy-check check WEB-425/lab-1.1 "./rpg-character-builder-final"
```

Do not delete the other copies merely to make the message disappear. First
make sure that you have found and saved your correct work.

## Common Problem: A Required File Is Missing

A project file may have been moved, renamed, or saved in a different folder.
Compare your folder with the assignment instructions.

For example, this is not a complete Angular project folder:

```text
rpg-character-builder/
└── src/
```

The same folder should also have `angular.json`, `package.json`, and the other
project files shown earlier.

Do not create an empty replacement file only to make its name appear. Find the
original project or starter files and restore the correct file contents.

## Common Problem: Files from Different Assignments Are Mixed Together

Keep each WEB 231, WEB 330, or WEB 340 assignment in its own project folder.

```text
Correct
week-1/project1-2/            ← only Project 1-2 files
week-2/project2-2/            ← only Project 2-2 files
```

```text
Hard to identify
all-my-work/
├── project01-02.html
├── project02-02.html
├── weight-converter.js
└── cooking-app files
```

Separate project folders make it easier for you, Visual Studio Code, and
VeriWhy Check to identify the correct assignment.

## A Safe Folder Check

Before running VeriWhy Check, answer these questions:

1. Am I using the folder with my newest work?
2. Did I open a normal folder instead of a ZIP file?
3. Can I see the expected HTML files or `package.json`?
4. For WEB 425, can I see `angular.json`, `package.json`, and `src` together?
5. Did I keep different assignments in different folders?

If you are still unsure, do not move or delete files. Take a screenshot of the
folder in Finder, File Explorer, or Visual Studio Code and ask your instructor
for help.
