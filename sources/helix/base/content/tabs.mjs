// @ts-check

/** @type {HTMLElement} */
const tabPanels = document.getElementById('tabpanels')

/**
 * @param {number} index The index of the tab that you want to focus
 */
function setFocusedTab(index) {
  tabPanels.selectedIndex = index.toString()
}

export class Tab {
  /** @type {string} */
  title

  /** @type {nsIURIType} */
  uri

  /** @type {HTMLElement} */
  panel

  /** @type {HTMLElement} */
  tab

  /**
   * @param {string} title
   * @param {HTMLElement} panel
   * @param {nsIURIType} uri
   * @param {HTMLElement} tab
   *
   * @private
   */
  constructor(title, panel, uri, tab) {
    this.title = title
    this.panel = panel
    this.uri = uri
    this.tab = tab

    this.tab.addEventListener('click', this.tabClick.bind(this))
  }

  tabClick() {
    setFocusedTab(this.tabPanelIndex)
  }

  /**
   * @returns {number}
   */
  get tabPanelIndex() {
    return Array.from(tabPanels.children).indexOf(this.panel)
  }

  // ===========================================================================
  // Static init methods

  /**
   * @param {nsIURIType} uri This is the tabs URI
   *
   * @return {Tab}
   * @public
   */
  static fromUri(uri) {
    /** @type {HTMLDivElement} */
    const panel = document.createXULElement('hbox')
    const contents = document.createElement('h1')
    contents.innerHTML = uri.spec
    panel.appendChild(contents)

    const tab = document.createElement('div')
    tab.classList.add('tab')
    tab.innerText = uri.asciiHost

    document.getElementById('tabs')?.appendChild(tab)
    document.getElementById('tabpanels')?.appendChild(panel)

    return new Tab(uri.asciiHost, panel, uri, tab)
  }
}
