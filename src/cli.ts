#!/usr/bin/env node
/**
 * @file Beginner-friendly command-line entry point for VeriWhy Check.
 * @author Richard Krasso
 *
 * The parser is intentionally explicit instead of clever: invalid commands,
 * missing values, unsupported flags, and ambiguous folders each produce a
 * plain-language explanation followed by a command the student can try next.
 */

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkProject } from './checker.js';
import { locationText, runDoctor } from './doctor.js';
import { commands, editDistance, mainHelp, suggestCommand } from './help.js';
import { packageRoot } from './paths.js';
import { listProfileIds } from './profile.js';
import { updateApplication } from './update.js';
import { dataRoot } from './paths.js';
import { uninstallApplication } from './uninstall.js';
import { openGuide } from './guide.js';

export interface CliEnvironment {
  out(message: string): void;
  error(message: string): void;
  cwd(): string;
}

// Console and working-directory functions are grouped behind this boundary so
// the command parser can be tested without replacing global process state. In
// production these functions still behave exactly like an ordinary CLI.
const defaultEnvironment: CliEnvironment = {
  out: console.log,
  error: console.error,
  cwd: process.cwd
};

/** Convert expected student mistakes into useful explanations rather than traces. */
export function commandError(message: string, next: string): Error {
  return new Error(`${message}\n\nTry this next:\n  ${next}`);
}

/** Compare decoded filesystem paths so installations beneath folders with spaces start correctly. */
export function isCliEntrypoint(argumentPath: string | undefined, moduleUrl: string): boolean {
  return Boolean(argumentPath) && resolve(argumentPath!) === resolve(fileURLToPath(moduleUrl));
}

/** Accept harmless case differences and suggest the closest published assignment. */
export function resolveProfileInput(
  input: string,
  available: string[]
): { id?: string; suggestion?: string } {
  const caseInsensitive = available.find((id) => id.toLowerCase() === input.toLowerCase());
  if (caseInsensitive) return { id: caseInsensitive };
  const ranked = available
    .map((id) => ({ id, distance: editDistance(input.toLowerCase(), id.toLowerCase()) }))
    .sort((left, right) => left.distance - right.distance);
  return ranked[0] && ranked[0].distance <= 4 ? { suggestion: ranked[0].id } : {};
}

/** Parse and execute one command; injectable output makes every path testable. */
export async function runCli(
  args: string[],
  environment: CliEnvironment = defaultEnvironment
): Promise<number> {
  // Treat an empty command as a request for help. A beginning student should
  // never receive an undefined-command stack trace merely for opening the tool.
  const command = args[0]?.toLowerCase() ?? 'help';
  try {
    // Informational commands exit before any project discovery or file access.
    // This keeps help and version safe to run from any directory.
    if (command === 'help' || command === '--help' || command === '-h') {
      environment.out(mainHelp());
      return 0;
    }
    if (command === 'version' || command === '--version' || command === '-v') {
      const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as {
        version: string;
      };
      environment.out(`VeriWhy Check ${manifest.version}`);
      return 0;
    }
    if (!commands.includes(command as (typeof commands)[number])) {
      // A bounded edit-distance suggestion corrects common typing mistakes but
      // never guesses when the input is not close to a supported command.
      const suggestion = suggestCommand(command);
      throw commandError(
        `“${command}” is not a VeriWhy Check command.`,
        suggestion ? `veriwhy-check ${suggestion}` : 'veriwhy-check help'
      );
    }
    if (command === 'paths') {
      // Extra arguments are rejected consistently instead of being ignored;
      // silent acceptance teaches students an inaccurate command syntax.
      if (args.length > 1)
        throw commandError(
          'The paths command does not accept extra words or options.',
          'veriwhy-check paths'
        );
      environment.out(locationText());
      return 0;
    }
    if (command === 'guide') {
      // --path is intentionally the only option. It supports computers where
      // the operating system cannot automatically open the offline website.
      const unsupported = args.slice(1).filter((argument) => argument !== '--path');
      if (unsupported.length || args.filter((argument) => argument === '--path').length > 1) {
        throw commandError(
          'The guide command accepts only the optional --path setting.',
          'veriwhy-check guide'
        );
      }
      const result = await openGuide(!args.includes('--path'));
      environment.out(
        result.opened
          ? `The VeriWhy Check guide opened in your default browser.\n\nGuide location:\n  ${result.path}`
          : `VeriWhy Check guide location:\n  ${result.path}`
      );
      return 0;
    }
    if (command === 'doctor') {
      if (args.length > 1)
        throw commandError(
          'The doctor command does not accept extra words or options.',
          'veriwhy-check doctor'
        );
      const results = await runDoctor();
      // A nonzero exit code allows a script or support technician to detect an
      // incomplete installation even though the displayed text stays friendly.
      environment.out(
        [
          'VeriWhy Check readiness',
          '',
          ...results.map(
            ({ label, ok, detail }) => `${ok ? 'READY' : 'ACTION NEEDED'} — ${label}: ${detail}`
          )
        ].join('\n')
      );
      return results.every(({ ok }) => ok) ? 0 : 1;
    }
    if (command === 'update') {
      // Updates remain an explicit student action. Merely running another
      // command never downloads or activates software in the background.
      if (args.length > 1)
        throw commandError(
          'The update command does not accept extra words or options.',
          'veriwhy-check update'
        );
      environment.out('Checking for a safe VeriWhy Check update...');
      const result = await updateApplication();
      environment.out(result.message);
      return 0;
    }
    if (command === 'uninstall') {
      // The allowlist prevents a misspelled removal option from changing what
      // is deleted. Reports require a separate, explicit opt-in flag.
      const allowed = new Set(['--dry-run', '--remove-reports']);
      const unsupported = args.slice(1).filter((argument) => !allowed.has(argument));
      if (unsupported.length)
        throw commandError(
          `Unsupported uninstall option: ${unsupported.join(', ')}.`,
          'veriwhy-check uninstall --dry-run'
        );
      const dryRun = args.includes('--dry-run');
      const removeReports = args.includes('--remove-reports');
      const result = await uninstallApplication({ dataDirectory: dataRoot, dryRun, removeReports });
      environment.out(
        `${dryRun ? 'Uninstall preview' : result.scheduled ? 'Uninstall scheduled' : 'Uninstall complete'}\n\n${result.removed.map((path) => `  Remove: ${path}`).join('\n')}${result.preserved.map((path) => `\n  Keep reports: ${path}`).join('')}\n\nStudent project folders are never removed.`
      );
      return 0;
    }
    if (command === 'list' || command === 'profiles') {
      if (command === 'profiles' && args[1] === 'validate') {
        // Maintainers use this branch as a YAML linter. Loading every profile
        // exercises the same strict parser used during a student check.
        if (args.length > 2)
          throw commandError(
            'Profile validation does not accept extra words or options.',
            'veriwhy-check profiles validate'
          );
        const ids = await listProfileIds();
        const { loadProfile } = await import('./profile.js');
        for (const id of ids) await loadProfile(id);
        environment.out(`Validated ${ids.length} public assignment profiles.`);
        return 0;
      }
      if (args.length > 2)
        throw commandError(
          'The list command accepts only an optional course name.',
          'veriwhy-check list WEB-425'
        );
      const course = args[1]?.toUpperCase();
      // Course filtering is case-insensitive because capitalization is not an
      // academic requirement and should not block a novice at the terminal.
      const profiles = (await listProfileIds()).filter(
        (id) => !course || id.toUpperCase().startsWith(`${course}/`)
      );
      if (!profiles.length)
        throw commandError(
          course
            ? `No assignments were found for “${course}”.`
            : 'No assignment profiles are installed.',
          'veriwhy-check list'
        );
      environment.out(
        ['Available checks', '', ...profiles.map((id) => `  veriwhy-check check ${id}`)].join('\n')
      );
      return 0;
    }
    if (command === 'check') {
      // Resolve the public assignment before touching a project. This provides
      // an exact correction for a misspelled identifier and avoids needless IO.
      const enteredProfile = args[1];
      if (!enteredProfile)
        throw commandError('The check command needs an assignment name.', 'veriwhy-check list');
      const resolvedProfile = resolveProfileInput(enteredProfile, await listProfileIds());
      if (!resolvedProfile.id) {
        const course = enteredProfile.split('/')[0]?.toUpperCase();
        throw commandError(
          `“${enteredProfile}” is not an available assignment.`,
          resolvedProfile.suggestion
            ? `veriwhy-check check ${resolvedProfile.suggestion}`
            : `veriwhy-check list ${course || 'WEB-425'}`
        );
      }
      const profileId = resolvedProfile.id;
      const flags = args.slice(2).filter((argument) => argument.startsWith('-'));
      const unknownFlags = flags.filter((flag) => flag !== '--static-only');
      if (unknownFlags.length)
        throw commandError(
          `Unsupported option: ${unknownFlags.join(', ')}.`,
          `veriwhy-check check ${profileId}`
        );
      const paths = args.slice(2).filter((argument) => !argument.startsWith('-'));
      // One search root is the maximum safe interpretation. If two are given,
      // refusing the command is more trustworthy than grading the wrong folder.
      if (paths.length > 1)
        throw commandError(
          'Enter only one folder to search.',
          `veriwhy-check check ${profileId} "${paths[0]}"`
        );
      environment.out(
        `Checking ${profileId}...\nYour files stay on this computer. This may take a few minutes.`
      );
      const result = await checkProject(profileId, {
        searchPath: resolve(environment.cwd(), paths[0] ?? '.'),
        staticOnly: flags.includes('--static-only')
      });
      environment.out(
        `${result.report.complete ? 'PASSED' : 'NEEDS ATTENTION'} — ${result.report.passed} passed, ${result.report.failed} need attention, ${result.report.skipped} not checked.\n\nYour report is ready:\n  ${result.html}\n\nOpen report.html in a browser, make corrections, and run this command again.`
      );
      return result.report.complete ? 0 : 2;
    }
    return 0;
  } catch (error) {
    // All anticipated and unexpected failures cross one learner-facing error
    // boundary. Internal stack traces remain available to developers through
    // tests, while students receive the cause and a stable help command.
    environment.error(
      `VeriWhy Check could not finish.\n\n${error instanceof Error ? error.message : String(error)}\n\nFor general help, enter:\n  veriwhy-check help`
    );
    return 1;
  }
}

if (isCliEntrypoint(process.argv[1], import.meta.url)) {
  // Importing this module in a unit test must not execute the CLI. The explicit
  // entrypoint comparison preserves that separation without environment flags.
  process.exitCode = await runCli(process.argv.slice(2));
}
