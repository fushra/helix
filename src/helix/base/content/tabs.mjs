// @ts-check
/// <reference path="_global.d.ts" />

/** @type {HTMLElement} */
const tabPanels = document.getElementById('tabpanels')
const tabsContainer = document.getElementById('tabs')
/** @type {HTMLTemplateElement} */
const tabTemplate = document.getElementById('tab_template')

/**
 * @param {number} index The index of the tab that you want to focus
 */
function setFocusedTab(index) {
  tabPanels.selectedIndex = index.toString()
}

export class Tab {
  /** @type {number} */
  browserId

  /** @type {Element} */
  tab

  /**
   * If the tab is loading a page
   * @type {boolean}
   */
  busy = true

  /** @return {HTMLElement | undefined} */
  get browserEl() {
    return window.gBrowser.getBrowser(this.browserId)
  }

  get panel() {
    return this.browserEl?.parentElement
  }

  /**
   * @returns {number}
   */
  get tabPanelIndex() {
    return Array.from(tabPanels.children).indexOf(this.panel)
  }

  /** @return {string} */
  get title() {
    return this.browserEl?.contentTitle
  }

  get iconEl() {
    return this.tab.querySelector('.tab-icon')
  }

  /** @returns {HTMLDivElement?} */
  get titleEl() {
    return this.tab.querySelector('.title')
  }

  /** @returns {HTMLDivElement?} */
  get closeIconEl() {
    return this.tab.querySelector('.close-icon')
  }

  /**
   * @param {number} id The browser ID
   * @private
   */
  constructor(id) {
    this.browserId = id

    const tab =
      /** @type {DocumentFragment} */
      (tabTemplate?.content.cloneNode(true)).children[0]
    tabsContainer?.appendChild(tab)
    this.tab = tab
    console.log(this.titleEl)
    this.titleEl.innerHTML = this.title

    this.browserEl?.addEventListener('pagetitlechanged', (e) =>
      this.setPageTitle()
    )
    this.tab.addEventListener('click', this.tabClick.bind(this))
    this.closeIconEl?.addEventListener('click', this.close.bind(this))
  }

  tabClick() {
    window.gBrowser.setFocusedTabIndex(this.tabPanelIndex)
  }

  setPageTitle() {
    this.titleEl.innerHTML = this.title
  }

  /**
   * @param {string} iconURL
   * @param {string} originalURL
   */
  setIcon(iconURL, originalURL) {
    this.iconEl?.setAttribute('src', iconURL)
  }

  close() {
    console.log('close', this.browserId)
    window.gBrowser.removeBrowser(this.browserId)
  }

  // ===========================================================================
  // Static init methods

  /**
   * Creates a tab that is assosiated with the tab
   * @param {number} id The id of the browser
   */
  static createFromBrowser(id) {
    const browser = window.gBrowser.getBrowser(id)

    if (!browser) {
      console.error('The browser id passed into `createFromBrowser` is invalid')
      return
    }

    return new Tab(id)
  }
}
