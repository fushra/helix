// @ts-check
/// <reference path="_global.d.ts" />

import { browserController } from './browser.mjs'

/** @type {HTMLElement} */
const tabPanels = document.getElementById('tabpanels')
const tabsContainer = document.getElementById('tabs')
/** @type {HTMLTemplateElement} */
const tabTemplate = document.getElementById('tab_template')

export class Tab {
  /** @type {number} */
  id

  /** @type {Element} */
  tab

  /**
   * If the tab is loading a page
   * @type {boolean}
   */
  busy = true

  /**
   * The browser element that is bound to this tab
   * @type {HTMLElement?}
   */
  browser

  get panel() {
    return this.browser?.parentElement
  }

  /**
   * @returns {number}
   */
  get tabPanelIndex() {
    return Array.from(tabPanels.children).indexOf(this.panel)
  }

  /** @return {string} */
  get title() {
    return this.browser?.contentTitle
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
   * @param {object} config The options to create the browser with
   * @param {number} config.id The browser ID
   * @param {*} [config.browser] The browser element
   * @private
   */
  constructor({ id, browser }) {
    this.id = id
    this.browser = browser

    const tab =
      /** @type {DocumentFragment} */
      (tabTemplate?.content.cloneNode(true)).children[0]
    tabsContainer?.appendChild(tab)
    this.tab = tab
    console.log(this.titleEl)
    this.titleEl.innerHTML = this.title

    this.browser?.addEventListener('pagetitlechanged', (e) =>
      this.setPageTitle()
    )
    this.tab.addEventListener('click', this.tabClick.bind(this))
    this.closeIconEl?.addEventListener('click', this.close.bind(this))
  }

  tabClick() {
    browserController.selectTab(this.id)
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
    browserController.removeTab(this.id)
  }

  /**
   * Sets the location of a specific tab
   * @param {object} config The config parameters
   * @param {string} config.url The URL that the browser should navigate to
   * @param {object} [config.loadURIOptions] Options to be passed down into loadURI
   */
  goto({ url, loadURIOptions }) {
    if (!loadURIOptions) loadURIOptions = {}
    if (!loadURIOptions.triggeringPrincipal)
      loadURIOptions.triggeringPrincipal =
        Services.scriptSecurityManager.getSystemPrincipal()

    if (!this.browser) {
      console.warn(
        `goto was called before the browser with id of ${this.id} was initialized`
      )
      return
    }

    this.browser.loadURI(url, loadURIOptions)
  }

  // ===========================================================================
  // Static init methods

  /**
   * Creates a tab that is associated with a specific browser
   * @param {object} config The config for the tab to be created
   * @param {number} config.id The id of the tab
   * @param {*} [config.browser] The browser element
   *
   * @returns {Tab}
   * @todo Do I really need this function? Can I replace it with a public constructor?
   */
  static createFromBrowser({ id, browser }) {
    return new Tab({ id, browser })
  }
}
