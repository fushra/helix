///<reference path="./_global.d.ts" />
// @ts-check

import { Event } from 'resource://app/modules/Event.sys.mjs'
import { E10SUtils } from 'resource://gre/modules/E10SUtils.sys.mjs'
import { Tab } from './tabs.mjs'

const DEFAULT_ATTRIBUTES = {
  flex: '1',
  type: 'content',
  context: 'contentAreaContextMenu',
  tooltip: 'aHTMLTooltip',
  autocompletepopup: 'PopupAutoComplete',
  selectmenulist: 'ContentSelectDropdown',
  message: true,
  messagemanagergroup: 'browsers',
  remote: true,
  maychangeremoteness: true,
}

export class BrowserController {
  /** @private */
  tabsView = new TabsView()

  /** @private */
  tabsModel = new TabsModel()

  constructor() {
    this.tabsView.createdBrowserEvent.addListener(({ browser }) =>
      this.tabsModel.initializeTab({ browser, url: 'https://google.com' })
    )

    this.tabsModel.tabRemovedEvent.addListener(({ tab }) =>
      this.tabsView.removeTab(tab)
    )
    this.tabsModel.tabSelectedEvent.addListener(({ id }) => {
      const tab = this.tabsModel.tabs.get(id)
      if (!tab) return

      this.tabsView.updateSelectedTab(tab)
    })
  }

  /**
   * @param {number} id The id of the tab you wish to remove
   */
  removeTab(id) {
    this.tabsModel.removeTab(id)
  }

  /**
   * @param {number} id The id of the tab you wish to select
   */
  selectTab(id) {
    this.tabsModel.selectTab(id)
  }
}

export class TabsView {
  // ===========================================================================
  // Data

  /** @type {HTMLElement} */
  tabPanels = document.getElementById('tabpanels')

  /** @type {HTMLDivElement} */
  tabs = document.getElementById('tabs')

  // ===========================================================================
  // Events

  /**
   * Called when a new browser is created. e.g. When the new tab button is
   * pressed
   * @type {Event<{ browser: MozBrowserElement }>}
   */
  createdBrowserEvent = new Event()

  // ===========================================================================
  // Logic

  constructor() {
    document
      .getElementById('new-tab')
      ?.addEventListener('click', () => this.createBrowser())
  }

  createBrowser() {
    const container = document.createXULElement('hbox')
    container.setAttribute('flex', '1')

    const browser = document.createXULElement('browser')

    for (const key in DEFAULT_ATTRIBUTES)
      browser.setAttribute(key, DEFAULT_ATTRIBUTES[key])

    container.appendChild(browser)
    this.tabPanels.appendChild(container)

    const { browserId: id } = browser
    browser.id = `browser-el-${id}`

    let oa = E10SUtils.predictOriginAttributes({ browser })

    const { useRemoteTabs } = window.docShell.QueryInterface(Ci.nsILoadContext)
    const remoteType = E10SUtils.getRemoteTypeForURI(
      browser.currentURI.spec,
      useRemoteTabs /* is multi process browser */,
      false /* fission */,
      E10SUtils.DEFAULT_REMOTE_TYPE,
      null,
      oa
    )
    browser.setAttribute('remoteType', remoteType)

    this.createdBrowserEvent.trigger({ browser })
  }

  /**
   * @param {Tab} tab The tab to remove
   */
  removeTab(tab) {
    tab.browser?.remove()
    tab.panel?.remove()
    tab.tab.remove()
  }

  /**
   * This makes sure that only one tab in the sidebar is selected and sets the
   * correct index in the browser stack
   *
   * @param {Tab} tab The tab to select
   */
  updateSelectedTab(tab) {
    for (const child of this.tabs.children) {
      child.classList.remove('tab--selected')
    }

    tab.tab.classList.add('tab--selected')

    const browserElement = tab.browser
    const browserContainer = browserElement?.parentElement

    if (browserContainer) {
      const browserIndex = Array.from(this.tabPanels.childNodes).indexOf(
        browserContainer
      )

      this.tabPanels.selectedIndex = browserIndex
    }
  }
}

export class TabsModel {
  // ===========================================================================
  // Data

  /** @type {Map<number, Tab>} */
  tabs = new Map()

  /** @type {number} */
  selectedTab = 0

  // ===========================================================================
  // Events

  /**
   * Called when a tab is created. Includes the ID of the tab
   * @type {Event<{ id: number }>}
   */
  tabInitializedEvent = new Event()

  /**
   * Triggered whenever a tab is removed, includes the {@link Tab} as it will
   * have already been removed from {@link this.tabs} and the UI
   * @type {Event<{ tab: Tab }>}
   */
  tabRemovedEvent = new Event()

  /**
   * Triggered whenever a tab is selected. No UI updates will have been
   * performed when it is initially triggered
   * @type {Event<{ id: number }>}
   */
  tabSelectedEvent = new Event()

  // ===========================================================================
  // Logic

  /**
   * Creates a new tab and adds it to the window
   * @param {object} config The config parameters for the new tab
   * @param {HTMLBrowserElement} config.browser The browser element for the tab
   * @param {string} [config.url] The url that the new tab should open. Defaults to `about:blank`
   * @returns {number} The id of the associated {@link Tab}
   */
  initializeTab({ browser, url }) {
    if (!url) url = 'about:blank'

    const { browserId: id } = browser
    const tab = Tab.createFromBrowser({ id, browser })
    tab.goto({ url })
    this.tabs.set(id, tab)

    this.tabInitializedEvent.trigger({ id })

    if (this.tabs.size == 1) this.selectTab(id)
    return id
  }

  /**
   * Removes a tab from the browser model & the UI
   *
   * @param {number} id The id of the Tab you wish to remove
   * @returns Early if the does not exist in {@link this.tabs}
   */
  removeTab(id) {
    const tab = this.tabs.get(id)

    if (!tab) {
      console.warn(`Attempted to remove tab that didn't exist (tab id ${id})`)
      return
    }

    this.tabs.delete(id)
    this.tabRemovedEvent.trigger({ tab })
  }

  /**
   * @param {number} id The id of the tab that needs to be selected
   */
  selectTab(id) {
    this.selectedTab = id
    this.tabSelectedEvent.trigger({ id })
  }
}

export const browserController = new BrowserController()
