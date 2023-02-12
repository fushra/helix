/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
///<reference path="../base/content/_global.d.ts" />

'use strict'

const EXPORTED_SYMBOLS = ['LinkHandlerParent']

const lazy = {}

class LinkHandlerParent extends JSWindowActorParent {
  receiveMessage(aMsg) {
    let browser = this.browsingContext.top.embedderElement
    if (!browser) {
      return
    }

    /** @type {Window} */
    let win = browser.ownerGlobal

    let gBrowser = win.gBrowser

    switch (aMsg.name) {
      case 'Link:LoadingIcon':
        if (!gBrowser) {
          return
        }

        if (aMsg.data.canUseForTab) {
          let tab = gBrowser.getTabForBrowser(browser)
          if (tab) tab.busy = true
        }

        break

      case 'Link:SetIcon':
        // Cache the most recent icon and rich icon locally.
        if (aMsg.data.canUseForTab) {
          this.icon = aMsg.data
        } else {
          this.richIcon = aMsg.data
        }

        if (!gBrowser) {
          return
        }

        this.setIconFromLink(gBrowser, browser, aMsg.data)
        break

      case 'Link:SetFailedIcon':
        if (!gBrowser) {
          return
        }

        if (aMsg.data.canUseForTab) {
          this.clearPendingIcon(gBrowser, browser)
        }
        break

      case 'Link:AddSearch':
        if (!gBrowser) {
          return
        }

        let tab = gBrowser.getTabForBrowser(browser)
        if (!tab) {
          break
        }

        if (win.BrowserSearch) {
          win.BrowserSearch.addEngine(browser, aMsg.data.engine)
        }
        break
    }
  }

  /**
   * @param {typeof window.gBrowser} gBrowser The global gBrowser object
   * @param {HTMLElement} aBrowser The browser element
   */
  clearPendingIcon(gBrowser, aBrowser) {
    let tab = gBrowser.getTabForBrowser(aBrowser)
    if (tab) tab.busy = false
  }

  /**
   * @param {import('../base/content/browser.mjs').Browser} gBrowser The global gBrowser object
   * @param {HTMLElement} browser The browser element
   */
  setIconFromLink(
    gBrowser,
    browser,
    { pageURL, originalURL, canUseForTab, expiration, iconURL, canStoreIcon }
  ) {
    let tab = gBrowser.getTabForBrowser(browser)
    if (!tab) {
      return
    }

    if (canUseForTab) {
      this.clearPendingIcon(gBrowser, browser)
    }

    let iconURI
    try {
      iconURI = Services.io.newURI(iconURL)
    } catch (ex) {
      console.error(ex)
      return
    }
    if (iconURI.scheme != 'data') {
      try {
        Services.scriptSecurityManager.checkLoadURIWithPrincipal(
          browser.contentPrincipal,
          iconURI,
          Services.scriptSecurityManager.ALLOW_CHROME
        )
      } catch (ex) {
        return
      }
    }

    if (canUseForTab) {
      tab.setIcon(iconURL, originalURL)
    }
  }
}
