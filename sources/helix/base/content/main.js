///<reference path="./_global.d.ts" />

import { addMenus } from './menus.mjs'
import { Browser } from './browser.mjs'

addMenus()

window.gBrowser = new Browser()
window.gBrowser.createBrowser()
window.gBrowser.createBrowser()
