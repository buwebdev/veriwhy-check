/**
 * @file Local HTML and JSON report generation for student check results.
 * @author Richard Krasso
 *
 * Reports intentionally use plain language, visible status labels, and no
 * grading points. The same structured result is written as JSON so future
 * interfaces can consume it without scraping the accessible HTML report.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CheckReport, RequirementResult } from './types.js';

/** Escape student-controlled text before inserting it into an HTML document. */
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      })[character]!
  );
}

/** Convert a requirement result into an accessible report row. */
function resultRow(result: RequirementResult): string {
  // Internal status values become plain instructional phrases; color is only a
  // secondary cue, so the document remains understandable without CSS.
  const status =
    result.status === 'pass'
      ? 'Passed'
      : result.status === 'fail'
        ? 'Needs attention'
        : 'Not checked';
  return `<article class="result ${result.status}"><h3><span>${escapeHtml(status)}</span> ${escapeHtml(result.label)}</h3><p>${escapeHtml(result.detail)}</p></article>`;
}

/** Render a complete, self-contained report that works without a web server. */
export function renderHtmlReport(report: CheckReport): string {
  const heading = report.complete
    ? 'Your project passed every checked requirement.'
    : 'Your project has requirements that need attention.';
  // The report is intentionally one self-contained file with inline CSS. A
  // student can upload it to the LMS without losing assets or running a server.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VeriWhy Check report — ${escapeHtml(report.profile.assignment)}</title>
<style>body{font:16px/1.55 system-ui,sans-serif;max-width:960px;margin:auto;padding:2rem;color:#172033;background:#f6f8fb}header,.result,.notice{background:white;border:1px solid #d7deea;border-radius:.6rem;padding:1rem 1.25rem;margin:1rem 0}.pass{border-left:6px solid #198754}.fail{border-left:6px solid #c0392b}.skipped{border-left:6px solid #8a6d1d}h1,h2,h3{line-height:1.25}.summary{display:flex;gap:1rem;flex-wrap:wrap}.summary strong{font-size:1.35rem}code{overflow-wrap:anywhere}footer{margin-top:2rem;color:#526071}</style></head>
<body><header><p>VeriWhy Check</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(report.profile.course)} — ${escapeHtml(report.profile.assignment)}</p><div class="summary"><span><strong>${report.passed}</strong> passed</span><span><strong>${report.failed}</strong> need attention</span><span><strong>${report.skipped}</strong> not checked</span></div></header>
<main><h2>Requirement results</h2>${report.results.map(resultRow).join('\n')}<section class="notice"><h2>What this means</h2><p>This report checks published functional requirements. It is practice feedback, not your official course grade. Correct anything marked “Needs attention,” then run the same check again.</p></section>${report.notices.map((notice) => `<p class="notice">${escapeHtml(notice)}</p>`).join('')}</main>
<footer><p>Run ID: <code>${escapeHtml(report.runId)}</code> · Profile version ${escapeHtml(report.profile.version)} · ${escapeHtml(report.generatedAt)}</p><p>Your work was checked locally. VeriWhy Check does not upload your source code.</p></footer></body></html>`;
}

/** Write both human-readable and machine-readable forms of a check report. */
export async function writeReport(
  report: CheckReport,
  directory: string
): Promise<{ html: string; json: string }> {
  await mkdir(directory, { recursive: true });
  const html = join(directory, 'report.html');
  const json = join(directory, 'report.json');
  // Write the human and structured forms together. JSON supports future tools;
  // HTML remains the primary accessible feedback artifact for students.
  await Promise.all([
    writeFile(html, renderHtmlReport(report), 'utf8'),
    writeFile(json, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  ]);
  return { html, json };
}
