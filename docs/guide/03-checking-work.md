# Checking Your Work

## Find the Assignment Name

List the checks for your course:

```text
veriwhy-check list WEB-231
veriwhy-check list WEB-330
veriwhy-check list WEB-340
veriwhy-check list WEB-425
```

The application prints complete commands you can copy.

## Run a Check

If the terminal is already inside your assignment repository:

```text
veriwhy-check check WEB-425/lab-1.1
```

You can also give it the folder to search:

```text
veriwhy-check check WEB-231/assignment-2.2 ./week-2
```

VeriWhy Check searches a small number of folder levels. It works when the
assignment is at the repository root or beneath course and week folders.

## When More Than One Project Is Found

The application will not guess. Run the command again with the specific
project folder:

```text
veriwhy-check check WEB-231/assignment-2.2 ./week-2/solution/project2-2
```

## Textbook Filenames

WEB 231 and WEB 330 accept the textbook filenames that end in `_txt` as well
as the renamed filenames. You should still follow your assignment directions,
but forgetting to rename a textbook starter file does not prevent functional
checking.

## Static-Only Checks

This option checks files and source evidence without running programs:

```text
veriwhy-check check WEB-425/lab-1.1 --static-only
```

Behavior requirements will appear as **Not checked**. Use this option only for
diagnosis; a complete pre-submission check should run the behavior tests.
