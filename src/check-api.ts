/**
 * @file Public type contracts for browser and Node.js check contributors.
 * @author Richard Krasso
 *
 * Public check modules are ordinary JavaScript files, but these exported types
 * document the only capabilities the application supplies to those modules.
 */

import type { Page } from 'playwright';

/** Browser errors collected while a public interaction is running. */
export interface BrowserState {
  pageErrors: string[];
  consoleErrors: string[];
}

/** One named browser interaction exported from a public check module. */
export type BrowserCase = (page: Page, state: BrowserState) => Promise<string | void>;

/** One named Node.js behavior check exported from a public check module. */
export type NodeCase = (projectRoot: string) => Promise<string | void>;
