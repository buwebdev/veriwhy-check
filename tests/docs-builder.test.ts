/**
 * @file Unit and sandbox integration tests for Markdown documentation builds.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { buildDocsSite, describeGuidePage, discoverGuidePages, escapeGuideHtml, renderGuidePage } from '../src/docs-builder.js';
import { withFixture } from './helpers.js';

test('guide page descriptions use numbered filenames, headings, and searchable text', () => {
  const page = describeGuidePage('02-getting-started.md', '# Getting Started\n\nUse `doctor` and **help**.');
  assert.equal(page.slug, 'getting-started');
  assert.equal(page.title, 'Getting Started');
  assert.match(page.plainText, /doctor and help/);
  assert.equal(escapeGuideHtml('<Guide & Help>'), '&lt;Guide &amp; Help&gt;');
  assert.throws(() => describeGuidePage('missing.md', 'No heading'), /level-one heading/);
});

test('Markdown builder creates navigation, pages, assets, and offline search', async () => {
  await withFixture('docs-build', async (root) => {
    const source = join(root, 'source');
    const theme = join(root, 'theme');
    const output = join(root, 'output');
    await mkdir(source);
    await mkdir(theme);
    await writeFile(join(source, '01-index.md'), '# Welcome\n\nStart here.\n\n```text\nveriwhy-check help\n```');
    await writeFile(join(source, '02-reports.md'), '# Reports\n\nUnderstand passed results.');
    await writeFile(join(theme, 'styles.css'), 'body { color: white; }');
    await writeFile(join(theme, 'app.js'), '/* test theme */');
    await mkdir(join(output, 'assets'), { recursive: true });
    await writeFile(join(output, 'retired-page.html'), 'stale page');
    await writeFile(join(output, 'assets', 'retired.js'), 'stale asset');
    await writeFile(join(output, 'development-note.txt'), 'preserve me');
    const result = await buildDocsSite(source, output, theme);
    assert.equal(result.pages.length, 2);
    const index = await readFile(join(output, 'index.html'), 'utf8');
    assert.match(index, /VeriWhy Check Guide/);
    assert.match(index, /reports\.html/);
    assert.match(index, /Content-Security-Policy/);
    assert.match(await readFile(join(output, 'reports.html'), 'utf8'), /aria-current="page"/);
    assert.match(await readFile(join(output, 'assets', 'search-index.js'), 'utf8'), /Understand passed results/);
    assert.equal(await readFile(join(output, 'assets', 'styles.css'), 'utf8'), 'body { color: white; }');
    await assert.rejects(readFile(join(output, 'retired-page.html'), 'utf8'), /ENOENT/);
    await assert.rejects(readFile(join(output, 'assets', 'retired.js'), 'utf8'), /ENOENT/);
    assert.equal(await readFile(join(output, 'development-note.txt'), 'utf8'), 'preserve me');
  });
});

test('page rendering escapes generated navigation labels and discovers errors', async () => {
  const page = describeGuidePage('01-index.md', '# Safe <Title>\n\nContent.');
  assert.match(await renderGuidePage(page, [page]), /Safe &lt;Title&gt;/);
  await withFixture('docs-errors', async (root) => {
    await assert.rejects(discoverGuidePages(join(root, 'missing')), /not found/);
    await mkdir(join(root, 'empty'));
    await assert.rejects(discoverGuidePages(join(root, 'empty')), /contains no Markdown/);
    await mkdir(join(root, 'duplicate'));
    await writeFile(join(root, 'duplicate', '01-page.md'), '# One');
    await writeFile(join(root, 'duplicate', '02-page.md'), '# Two');
    await assert.rejects(discoverGuidePages(join(root, 'duplicate')), /duplicate names/);
  });
});
