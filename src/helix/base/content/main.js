///<reference path="./_global.d.ts" />

import { addMenus } from './menus.mjs'
import { browserController } from './browser.mjs'

addMenus()

browserController.tabsView.createBrowser()
