/**
 * @file Beginner-friendly command help, examples, and typo suggestions.
 * @author Richard Krasso
 */

/** All supported top-level commands, kept in one place for help and validation. */
export const commands = ['check', 'list', 'doctor', 'paths', 'guide', 'update', 'uninstall', 'profiles', 'help', 'version'] as const;
export type CommandName = typeof commands[number];

/** Small edit-distance implementation used only to suggest likely command typos. */
export function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0]!;
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length]!;
}

/** Return a command suggestion only when it is close enough to be helpful. */
export function suggestCommand(input: string): CommandName | undefined {
  const ranked = commands.map((command) => ({ command, distance: editDistance(input.toLowerCase(), command) })).sort((a, b) => a.distance - b.distance);
  return ranked[0]!.distance <= 3 ? ranked[0]!.command : undefined;
}

/** Complete top-level help written for a student with little CLI experience. */
export function mainHelp(): string {
  return `VeriWhy Check — check your work before you submit it

Usage:
  veriwhy-check check <course/assignment> [folder]

Start here:
  1. Open a terminal in or near your assignment folder.
  2. Enter: veriwhy-check list WEB-425
  3. Enter the check command shown for your assignment.

Commands:
  check     Check one assignment and create a local report.
  list      Show the assignments available for a course.
  doctor    Confirm that VeriWhy Check is ready to use.
  paths     Show exactly where reports and support files are stored.
  guide     Open the complete visual guide in your default browser.
  update    Safely update to the newest published version.
  uninstall Remove the application; reports are kept unless you request otherwise.
  help      Show this help page.
  version   Show the installed version.

Examples:
  veriwhy-check check WEB-425/lab-1.1
  veriwhy-check check WEB-231/assignment-2.2 ./week-2
  veriwhy-check list WEB-340
  veriwhy-check update

Privacy:
  Checks run locally. Your source code is not uploaded.

Need help?
  Enter: veriwhy-check help`;
}
