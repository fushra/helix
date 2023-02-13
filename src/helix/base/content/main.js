///<reference path="./_global.d.ts" />

import { addMenus } from './menus.mjs'
import { Browser } from './browser.mjs'

addMenus()

window.gBrowser = new Browser()
window.gBrowser.createBrowser()

document
  .getElementById('new-tab')
  .addEventListener('click', () => window.gBrowser.createBrowser())
