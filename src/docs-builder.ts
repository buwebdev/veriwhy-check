/**
 * @file Build the offline student documentation website from Markdown files.
 * @author Richard Krasso
 *
 * Numbered Markdown filenames define navigation order. The builder discovers
 * pages automatically, so instructors can revise or add documentation without
 * changing application code. Generated files belong only in ignored tmp or a
 * release package.
 */

import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { pathExists } from './files.js';
import { packageRoot } from './paths.js';

export interface GuidePage {
  /** Original Markdown filename used to establish navigation order. */
  source: string;
  /** Stable output filename without its `.html` suffix. */
  slug: string;
  /** Level-one heading displayed in navigation and page metadata. */
  title: string;
  /** Source retained for standards-compliant Markdown rendering. */
  markdown: string;
  /** Formatting-free content used by the offline search index. */
  plainText: string;
}

/** Escape text placed in HTML attributes or generated navigation elements. */
export function escapeGuideHtml(value: string): string {
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

/** Produce a readable title and search text from one Markdown source file. */
export function describeGuidePage(source: string, markdown: string): GuidePage {
  // Numeric filename prefixes control navigation order but are omitted from the
  // student-visible URL, allowing maintainers to reorder pages without code.
  const filename = basename(source, '.md');
  const slug = filename.replace(/^\d+[-_]?/, '') || 'index';
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!heading) throw new Error(`${source} must contain a level-one heading.`);
  const plainText = markdown
    // Search text removes markup but keeps the meaning of link labels and inline
    // code. Fenced examples are excluded to avoid noisy command fragments.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { source, slug, title: heading, markdown, plainText };
}

/** Read every Markdown page in stable filename order. */
export async function discoverGuidePages(sourceRoot: string): Promise<GuidePage[]> {
  if (!(await pathExists(sourceRoot)))
    throw new Error(`Guide source folder not found: ${sourceRoot}.`);
  const filenames = (await readdir(sourceRoot)).filter((name) => name.endsWith('.md')).sort();
  // Lexical sorting is deterministic because the documented convention uses
  // zero-padded numeric prefixes for every guide page.
  if (!filenames.length) throw new Error('The guide source folder contains no Markdown pages.');
  const pages: GuidePage[] = [];
  for (const filename of filenames)
    pages.push(describeGuidePage(filename, await readFile(join(sourceRoot, filename), 'utf8')));
  const duplicates = pages.filter(
    (page, index) => pages.findIndex(({ slug }) => slug === page.slug) !== index
  );
  if (duplicates.length)
    throw new Error(
      `Guide pages produce duplicate names: ${duplicates.map(({ slug }) => slug).join(', ')}.`
    );
  return pages;
}

/** Render the shared shell around one converted Markdown document. */
export async function renderGuidePage(page: GuidePage, pages: GuidePage[]): Promise<string> {
  // Navigation text and URLs are escaped even though maintainers author them;
  // build-time safety should not rely on every future heading being benign.
  const navigation = pages
    .map((candidate) => {
      const active = candidate.slug === page.slug ? ' aria-current="page" class="active"' : '';
      return `<li><a href="${escapeGuideHtml(candidate.slug)}.html"${active}>${escapeGuideHtml(candidate.title)}</a></li>`;
    })
    .join('\n');
  const content = await marked.parse(page.markdown, { gfm: true });
  // The CSP intentionally blocks remote content and network connections. The
  // installed guide is documentation, not a remotely executable web surface.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#10131f">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'">
<title>${escapeGuideHtml(page.title)} · VeriWhy Check Guide</title><link rel="stylesheet" href="assets/styles.css"></head>
<body><a class="skip-link" href="#guide-content">Skip to guide content</a>
<header class="topbar"><button class="menu-button" type="button" aria-label="Open guide navigation" aria-expanded="false" data-menu-button>☰</button><a class="brand" href="index.html"><span class="brand-mark">V✓</span><span>VeriWhy Check</span><small>Student Guide</small></a><label class="search"><span class="sr-only">Search the guide</span><input type="search" placeholder="Search the guide" autocomplete="off" data-search></label></header>
<div class="layout"><aside class="sidebar" data-sidebar><nav aria-label="Guide pages"><p class="nav-heading">Documentation</p><ul>${navigation}</ul></nav><div class="privacy-note"><strong>Local and private</strong><span>This guide and your checks work on your computer.</span></div></aside>
<main id="guide-content" class="content"><div class="breadcrumbs"><a href="index.html">Guide</a><span>›</span><span>${escapeGuideHtml(page.title)}</span></div><article class="prose">${content}</article><footer><p>VeriWhy Check 1.0 · Documentation by Richard Krasso</p></footer></main></div>
<section class="search-panel" aria-label="Search results" hidden data-results><div class="search-card"><div class="search-heading"><h2>Guide search</h2><button type="button" data-close-search>Close</button></div><p data-search-summary>Type a word or phrase to search.</p><ul data-search-list></ul></div></section>
<script src="assets/search-index.js"></script><script src="assets/app.js"></script></body></html>`;
}

/** Build all pages and reusable assets into one self-contained static site. */
export async function buildDocsSite(
  sourceRoot = join(packageRoot, 'docs', 'guide'),
  outputRoot = join(packageRoot, 'tmp', 'docs-site'),
  themeRoot = join(packageRoot, 'docs', 'theme')
): Promise<{ outputRoot: string; pages: GuidePage[] }> {
  const pages = await discoverGuidePages(sourceRoot);
  // Remove only files owned by the documentation generator. This prevents a
  // deleted Markdown page from surviving as stale HTML while preserving any
  // unrelated development artifacts someone may keep beside the output.
  if (await pathExists(outputRoot)) {
    const generatedEntries = await readdir(outputRoot, { withFileTypes: true });
    for (const entry of generatedEntries) {
      if (
        (entry.isFile() && entry.name.endsWith('.html')) ||
        (entry.isDirectory() && entry.name === 'assets')
      ) {
        await rm(join(outputRoot, entry.name), { recursive: true, force: true });
      }
    }
  }
  await mkdir(join(outputRoot, 'assets'), { recursive: true });
  // Each page is rendered independently into a self-contained navigation shell,
  // which allows any HTML file to open directly from disk.
  for (const page of pages)
    await writeFile(
      join(outputRoot, `${page.slug}.html`),
      await renderGuidePage(page, pages),
      'utf8'
    );
  // The first numbered page is always copied to index.html, regardless of its
  // filename, which keeps adding and reordering pages configuration-free.
  if (pages[0]!.slug !== 'index')
    await cp(join(outputRoot, `${pages[0]!.slug}.html`), join(outputRoot, 'index.html'));
  await cp(join(themeRoot, 'styles.css'), join(outputRoot, 'assets', 'styles.css'));
  await cp(join(themeRoot, 'app.js'), join(outputRoot, 'assets', 'app.js'));
  const index = pages.map(({ slug, title, plainText }) => ({
    page: `${slug}.html`,
    title,
    text: plainText
  }));
  // The search index is JavaScript rather than fetched JSON because file://
  // pages cannot depend on browser network permissions.
  await writeFile(
    join(outputRoot, 'assets', 'search-index.js'),
    `/* Generated offline search index. Author: Richard Krasso. */\nwindow.VERIWHY_GUIDE_INDEX = ${JSON.stringify(index)};\n`,
    'utf8'
  );
  return { outputRoot, pages };
}

/** Run the builder when this compiled module is invoked as a script. */
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  // The entrypoint guard keeps imports side-effect free during tests and lets
  // this same module serve as both library code and a maintainer command.
  const result = await buildDocsSite();
  console.log(`Built ${result.pages.length} guide pages in ${result.outputRoot}`);
}
