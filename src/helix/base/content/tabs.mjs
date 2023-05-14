///<reference path="./_global.d.ts" />
// @ts-check

import { Event } from 'resource://app/modules/Event.sys.mjs'
import { browserController } from './browser.mjs'

/** @type {HTMLElement} */
const tabPanels = document.getElementById('tabpanels')
const tabsContainer = document.getElementById('tabs')
/** @type {HTMLTemplateElement} */
const tabTemplate = document.getElementById('tab_template')

export class Tab {
  /**
   * @private
   * @type {TabView}
   */
  tabView

  /** @type {number} */
  id

  /**
   * The browser element that is bound to this tab
   * @type {HTMLElement?}
   */
  browser

  // /**
  //  * @returns {number}
  //  */
  // get tabPanelIndex() {
  //   return Array.from(tabPanels.children).indexOf(this.panel)
  // }

  /** @return {string} */
  get title() {
    return this.browser?.contentTitle
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
    this.tabView = new TabView(browser)

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.tabView.tabFocusEvent.addListener((_) =>
      browserController.selectTab(this.id)
    )
    this.tabView.closeTabEvent.addListener((_) =>
      browserController.removeTab(this.id)
    )
  }

  /**
   * @param {string} iconURL
   */
  setIcon(iconURL) {
    this.tabView.setIcon(iconURL)
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

class TabView {
  /** @type {*} */
  browser

  /** @private */
  tab =
    /** @type {DocumentFragment} */
    (tabTemplate?.content.cloneNode(true)).children[0]

  /** @type {Event<{ newPageTitle: string }>} */
  titleChangeEvent = new Event()

  /** @type {Event<undefined>} */
  tabFocusEvent = new Event()

  /** @type {Event<undefined>} */
  closeTabEvent = new Event()

  constructor(browser) {
    this.browser = browser
    tabsContainer?.append(this.tab)
  }

  /**
   * @private
   * @returns {HTMLImageElement}
   */
  get iconElement() {
    /** @type {*} */
    const iconElement = this.tab.querySelector('.tab-icon')
    return iconElement
  }

  /**
   * @param {string} iconURL Sets the icon URL
   */
  setIcon(iconURL) {
    this.iconElement.setAttribute('src', iconURL)
  }

  /**
   * @private
   * @returns {HTMLDivElement}
   */
  get titleElement() {
    /** @type {*} */
    const titleElement = this.tab.querySelector('.title')

    return titleElement
  }

  /**
   * @param {string} title The new tab title
   */
  setTitle(title) {
    this.titleElement.innerText = title
  }

  /**
   * @param {TabProgressListenerModel} model
   */
  connectTabProgressListenerModel(model) {
    const filter = Cc[
      '@mozilla.org/appshell/component/browser-status-filter;1'
    ].createInstance(Ci.nsIWebProgress)
    filter.addProgressListener(model, Ci.nsIWebProgress.NOTIFY_ALL)
    this.browser.addProgressListener(filter, Ci.nsIWebProgress.NOTIFY_ALL)
  }
}

export class TabModel {}

export class TabProgressListenerModel {
  /**
   * @type {Event<{ location: nsIURIType }>}
   */
  locationChangeEvent = new Event()

  QueryInterface = ChromeUtils.generateQI(['nsIWebProgressListener'])

  /**
   * Notification indicating the state has changed for one of the requests
   * associated with aWebProgress.
   *
   * @param {nsIWebProgressType} aWebProgress
   * The nsIWebProgress instance that fired the notification
   * @param {nsIRequestType} aRequest
   * The nsIRequest that has changed state.
   * @param {unsigned_long} aStateFlags
   * Flags indicating the new state.  This value is a combination of one
   * of the State Transition Flags and one or more of the State Type
   * Flags defined above.  Any undefined bits are reserved for future
   * use.
   * @param {nsresult} aStatus
   * Error status code associated with the state change.  This parameter
   * should be ignored unless aStateFlags includes the STATE_STOP bit.
   * The status code indicates success or failure of the request
   * associated with the state change.  NOTE: aStatus may be a success
   * code even for server generated errors, such as the HTTP 404 error.
   * In such cases, the request itself should be queried for extended
   * error information (e.g., for HTTP requests see nsIHttpChannel).
   */
  onStateChange(aWebProgress, aRequest, aStateFlags, aStatus) {
    console.log({ aWebProgress, aRequest, aStateFlags, aStatus })
  }

  onProgressChange(
    aWebProgress,
    aRequest,
    aCurSelfProgress,
    aMaxSelfProgress,
    aCurTotalProgress,
    aMaxTotalProgress
  ) {}

  /**
   * Called when the location of the window being watched changes.  This is not
   * when a load is requested, but rather once it is verified that the load is
   * going to occur in the given window.  For instance, a load that starts in a
   * window might send progress and status messages for the new site, but it
   * will not send the onLocationChange until we are sure that we are loading
   * this new page here.
   *
   * @param {nsIWebProgressType} aWebProgress
   * The nsIWebProgress instance that fired the notification.
   * @param {nsIRequestType} aRequest
   * The associated nsIRequest.  This may be null in some cases.
   * @param {nsIURIType} aLocation
   * The URI of the location that is being loaded.
   * @param {unsigned_long} aFlags
   * This is a value which explains the situation or the reason why
   * the location has changed.
   */
  onLocationChange(aWebProgress, aRequest, aLocation, aFlags) {
    console.log('Location change', {
      aWebProgress,
      aRequest,
      aLocation,
      aFlags,
    })
    this.locationChangeEvent.trigger({ location: aLocation })
  }

  onStatusChange(aWebProgress, aRequest, aStatus, aMessage) {}

  onSecurityChange(aWebProgress, aRequest, aState) {}

  onContentBlockingEvent(aWebProgress, aRequest, aEvent) {}
}
