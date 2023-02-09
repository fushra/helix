// @ts-check

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

  /** @returns {HTMLDivElement?} */
  get titleEl() {
    return this.tab.querySelector('.title')
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
  }

  tabClick() {
    setFocusedTab(this.tabPanelIndex)
  }

  setPageTitle() {
    this.titleEl.innerHTML = this.title
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
