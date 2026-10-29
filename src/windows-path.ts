/**
 * @file Safe Windows user-PATH registration for the VeriWhy Check launcher.
 * @author Richard Krasso
 *
 * Windows does not automatically discover a command merely because its
 * launcher exists. This module adds or removes only the application-owned
 * command directory while preserving every unrelated user PATH entry.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export type WindowsPathAction = 'add' | 'remove';

export interface WindowsPathServices {
  /** Injectable platform keeps unit tests off the real Windows registry. */
  platform: NodeJS.Platform;
  /** Execute one prepared PowerShell process. */
  run(executable: string, arguments_: string[], environment: NodeJS.ProcessEnv): Promise<void>;
}

const defaultServices: WindowsPathServices = {
  platform: process.platform,
  run: async (executable, arguments_, environment) => {
    await execute(executable, arguments_, {
      encoding: 'utf8',
      windowsHide: true,
      env: environment
    });
  }
};

/**
 * Build the fixed PowerShell program used to update the user PATH.
 *
 * The directory is delivered through a process environment variable rather
 * than interpolated into source code. A path containing spaces, apostrophes,
 * or PowerShell punctuation therefore remains data and cannot become code.
 */
export function windowsUserPathScript(action: WindowsPathAction): string {
  const includeDirectory = action === 'add' ? '$entries += $directory' : '';
  return `
$ErrorActionPreference = 'Stop'
$directory = [System.IO.Path]::GetFullPath($env:VERIWHY_CHECK_COMMAND_DIRECTORY).TrimEnd('\\')
$current = [Environment]::GetEnvironmentVariable('Path', 'User')
$entries = @()

if ($current) {
  foreach ($entry in ($current -split ';')) {
    $normalized = $entry.Trim().TrimEnd('\\')
    if ($normalized -and $normalized -ine $directory) {
      $entries += $entry
    }
  }
}

${includeDirectory}
$updated = if ($entries.Count -gt 0) { $entries -join ';' } else { $null }
[Environment]::SetEnvironmentVariable('Path', $updated, 'User')

# Tell desktop applications that future child processes should read the new
# environment. Failure to broadcast is non-fatal because the registry value is
# already correct and reopening the terminal after sign-in still reads it.
try {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class VeriWhyEnvironmentBroadcast {
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd,
    uint message,
    UIntPtr wParam,
    string lParam,
    uint flags,
    uint timeout,
    out UIntPtr result
  );
}
'@
  $result = [UIntPtr]::Zero
  [void][VeriWhyEnvironmentBroadcast]::SendMessageTimeout(
    [IntPtr]0xffff,
    0x001A,
    [UIntPtr]::Zero,
    'Environment',
    0x0002,
    5000,
    [ref]$result
  )
} catch {
  Write-Verbose 'The user PATH was saved, but the environment-change broadcast was unavailable.'
}
`.trim();
}

/** Persist one exact launcher directory in the Windows user PATH. */
export async function updateWindowsUserPath(
  directory: string,
  action: WindowsPathAction,
  services: WindowsPathServices = defaultServices
): Promise<void> {
  if (services.platform !== 'win32') return;
  try {
    await services.run(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        windowsUserPathScript(action)
      ],
      { ...process.env, VERIWHY_CHECK_COMMAND_DIRECTORY: directory }
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Windows could not ${action} the VeriWhy Check command PATH entry. ${detail}`);
  }
}

/** Add the application launcher directory without creating duplicates. */
export async function addWindowsCommandPath(directory: string): Promise<void> {
  await updateWindowsUserPath(directory, 'add');
}

/** Remove only the application launcher directory from the user PATH. */
export async function removeWindowsCommandPath(directory: string): Promise<void> {
  await updateWindowsUserPath(directory, 'remove');
}
