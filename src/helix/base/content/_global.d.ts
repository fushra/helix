import { Browser } from './browser.mjs'

declare global {
  interface Window {
    gBrowser: Browser
  }
}
