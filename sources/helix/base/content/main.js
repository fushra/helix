import { addMenus } from './menus.mjs'
import { Tab } from './tabs.mjs'
import { Browser } from './browser.mjs'

const { NetUtil } = ChromeUtils.import('resource://gre/modules/NetUtil.jsm')

function showMore() {
  document.getElementById('more-text').hidden = false
}

// const tabs = [
//   Tab.fromUri(NetUtil.newURI('https://google.com')),
//   Tab.fromUri(NetUtil.newURI('https://github.com')),
// ]

// console.log(tabs)

addMenus()

const browser = new Browser()
browser.createBrowser()
