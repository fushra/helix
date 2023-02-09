// @ts-check

const lazy = {}

ChromeUtils.defineESModuleGetters(lazy, {
  E10SUtils: 'resource://gre/modules/E10SUtils.sys.mjs',
})

var gMultiProcessBrowser = window.docShell.QueryInterface(
  Ci.nsILoadContext
).useRemoteTabs
var gFissionBrowser = window.docShell.QueryInterface(
  Ci.nsILoadContext
).useRemoteSubframes

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

    let oa = lazy.E10SUtils.predictOriginAttributes({ window })
    const remoteType = lazy.E10SUtils.getRemoteTypeForURI(
      uri.spec,
      gMultiProcessBrowser,
      gFissionBrowser,
      lazy.E10SUtils.DEFAULT_REMOTE_TYPE,
      uri,
      oa
    )

    const browserConfig = {
      remoteType,
      uriIsAboutBlank: false,
      initiallyActive: true,
    }

    console.log(browserConfig)

    const contents = createBrowser(browserConfig)
    contents.setAttribute('flex', '1')
    // contents.setAttribute('type', 'content-primary')
    // contents.setAttribute('remoteType', remoteType)
    panel.setAttribute('flex', '1')
    panel.appendChild(contents)

    const tab = document.createElement('div')
    tab.classList.add('tab')
    tab.innerText = uri.asciiHost

    document.getElementById('tabs')?.appendChild(tab)
    document.getElementById('tabpanels')?.appendChild(panel)

    contents.source = uri.spec
    try {
      contents.loadURI(uri.spec, {
        triggeringPrincipal:
          Services.scriptSecurityManager.getSystemPrincipal(),
        remoteTypeOverride: remoteType,
      })
    } catch (e) {
      console.error(e)
    }

    return new Tab(uri.asciiHost, panel, uri, tab)
  }
}

/**
 * @typedef {Object} CreateBrowserConfig
 * @property {boolean} [isPreloadBrowser] If the browser should be preloaded
 * @property {string} [name] The name of the browser stored for elsewhere in the browser?
 * @property {string} [remoteType] The remote type of the browser
 * @property {boolean} [uriIsAboutBlank] If the URI is about:blank
 * @property {boolean} [skipLoad] If the browser should skip loading
 * @property {boolean} [initiallyActive] If the browser should be initially active
 */

/**
 * @param {CreateBrowserConfig} config Config for the new browser to be created
 * @returns {MozBrowser} The newly created browser
 */
function createBrowser({
  isPreloadBrowser,
  name,
  openWindowInfo,
  remoteType,
  initialBrowsingContextGroupId,
  uriIsAboutBlank,
  userContextId,
  skipLoad,
  initiallyActive,
} = {}) {
  let b = document.createXULElement('browser')
  // Use the JSM global to create the permanentKey, so that if the
  // permanentKey is held by something after this window closes, it
  // doesn't keep the window alive.
  b.permanentKey = new (Cu.getGlobalForObject(Services).Object)()

  // Ensure that SessionStore has flushed any session history state from the
  // content process before we this browser's remoteness.
  // if (!Services.appinfo.sessionHistoryInParent) {
  //   b.prepareToChangeRemoteness = () =>
  //     SessionStore.prepareToChangeRemoteness(b)
  //   b.afterChangeRemoteness = (switchId) => {
  //     let tab = this.getTabForBrowser(b)
  //     SessionStore.finishTabRemotenessChange(tab, switchId)
  //     return true
  //   }
  // }

  const defaultBrowserAttributes = {
    contextmenu: 'contentAreaContextMenu',
    message: 'true',
    messagemanagergroup: 'browsers',
    tooltip: 'aHTMLTooltip',
    type: 'content',
  }
  for (let attribute in defaultBrowserAttributes) {
    b.setAttribute(attribute, defaultBrowserAttributes[attribute])
  }

  if (gMultiProcessBrowser || remoteType) {
    b.setAttribute('maychangeremoteness', 'true')
  }

  if (!initiallyActive) {
    b.setAttribute('initiallyactive', 'false')
  }

  if (userContextId) {
    b.setAttribute('usercontextid', userContextId)
  }

  if (remoteType) {
    b.setAttribute('remoteType', remoteType)
    b.setAttribute('remote', 'true')

    // b.changeRemoteness({ remoteType })
  }

  if (!isPreloadBrowser) {
    b.setAttribute('autocompletepopup', 'PopupAutoComplete')
  }

  /*
   * This attribute is meant to describe if the browser is the
   * preloaded browser. When the preloaded browser is created, the
   * 'preloadedState' attribute for that browser is set to "preloaded", and
   * when a new tab is opened, and it is time to show that preloaded
   * browser, the 'preloadedState' attribute for that browser is removed.
   *
   * See more details on Bug 1420285.
   */
  if (isPreloadBrowser) {
    b.setAttribute('preloadedState', 'preloaded')
  }

  // Ensure that the browser will be created in a specific initial
  // BrowsingContextGroup. This may change the process selection behaviour
  // of the newly created browser, and is often used in combination with
  // "remoteType" to ensure that the initial about:blank load occurs
  // within the same process as another window.
  if (initialBrowsingContextGroupId) {
    b.setAttribute(
      'initialBrowsingContextGroupId',
      initialBrowsingContextGroupId
    )
  }

  // Propagate information about the opening content window to the browser.
  if (openWindowInfo) {
    b.openWindowInfo = openWindowInfo
  }

  // This will be used by gecko to control the name of the opened
  // window.
  if (name) {
    // XXX: The `name` property is special in HTML and XUL. Should
    // we use a different attribute name for this?
    b.setAttribute('name', name)
  }

  let notificationbox = document.createXULElement('notificationbox')
  notificationbox.setAttribute('notificationside', 'top')

  let stack = document.createXULElement('stack')
  stack.className = 'browserStack'
  stack.appendChild(b)

  let browserContainer = document.createXULElement('vbox')
  browserContainer.className = 'browserContainer'
  browserContainer.appendChild(notificationbox)
  browserContainer.appendChild(stack)

  let browserSidebarContainer = document.createXULElement('hbox')
  browserSidebarContainer.className = 'browserSidebarContainer'
  browserSidebarContainer.appendChild(browserContainer)

  // Prevent the superfluous initial load of a blank document
  // if we're going to load something other than about:blank.
  if (!uriIsAboutBlank || skipLoad) {
    b.setAttribute('nodefaultsrc', 'true')
  }

  return b
}
