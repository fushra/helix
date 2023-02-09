import { E10SUtils } from 'resource://gre/modules/E10SUtils.sys.mjs'

const { NetUtil } = ChromeUtils.import('resource://gre/modules/NetUtil.jsm')

/** @type {HTMLElement} */
const tabPanels = document.getElementById('tabpanels')

const DEFAULT_ATTRIBUTES = {
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

export class Browser {
  /** @type {Map<number, HTMLElement>} */
  browsers = new Map()

  createBrowser() {
    const container = document.createXULElement('hbox')
    container.setAttribute('flex', '1')

    const browser = document.createXULElement('browser')

    for (const key in DEFAULT_ATTRIBUTES)
      browser.setAttribute(key, DEFAULT_ATTRIBUTES[key])

    container.appendChild(browser)
    tabPanels.appendChild(container)

    const { browserId: id } = browser

    this.browsers.set(id, browser)
    browser.id = `browser-el-${id}`

    this.goto(id, NetUtil.newURI('https://google.com'))
    this.initBrowser(browser)
  }

  /**
   * Loads a specific URI in a browser
   * @param {number} id The browser id. This is a key in {@link this.browsers}
   * @param {nsIURIType} uri The URI to navigate to
   * @param {*} options The options to pass into `loadURI`
   */
  goto(id, uri, options) {
    const browser = this.browsers.get(id)
    if (!browser) {
      console.warn(
        '`goto` was called on an unregistered browser with an id of',
        id
      )
      return
    }

    const triggeringPrincipal =
      options && options.triggeringPrincipal
        ? options.triggeringPrincipal
        : Services.scriptSecurityManager.getSystemPrincipal()

    browser.loadURI(uri.spec, { triggeringPrincipal, ...options })
  }

  /**
   * @private
   */
  initBrowser(browser) {
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
  }
}
