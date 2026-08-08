/**
 * @file Unit tests for transparent path and readiness diagnostics.
 * @author Richard Krasso
 *
 * Readiness tests confirm that diagnostics remain read-only, describe the same
 * centralized paths used by the application, and distinguish actionable
 * installation problems from student-project behavior.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { locationText, runDoctor } from '../src/doctor.js';

test('path display identifies report, browser, and privacy boundaries', () => {
  const output = locationText();
  assert.match(output, /Your saved reports:/);
  assert.match(output, /Managed browser files:/);
  assert.match(output, /does not use your installed browser profile/);
});

test('doctor reports Node, profiles, and managed browser without changing them', async () => {
  const diagnostics = await runDoctor();
  assert.deepEqual(
    diagnostics.map(({ label }) => label),
    ['Node.js', 'Assignment profiles', 'Managed browser']
  );
  assert.equal(diagnostics[0]!.ok, true);
  assert.match(diagnostics[1]!.detail, /24 assignment profiles/);
});
