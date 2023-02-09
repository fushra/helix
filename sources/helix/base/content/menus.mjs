// @ts-check
import { BrowserToolboxLauncher } from 'resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs'

const { NetUtil } = ChromeUtils.import('resource://gre/modules/NetUtil.jsm')

/**
 * @typedef {Object} Menu
 * @property {string} id
 * @property {string} label
 * @property {string} shortcut
 * @property {string} modifiers
 * @property {string} keyId
 * @property {() => void} oncommand
 */

/** @type {Menu[]} */
const menus = [
  {
    id: 'dev_reloadChrome',
    label: 'Reload',
    shortcut: 'R',
    modifiers: 'accel,shift,alt',
    keyId: 'key_reloadChrome',
    oncommand: () => window.location.reload(),
  },
  {
    id: 'dev_browserToolbox',
    label: 'Browser Toolbox',
    shortcut: 'I',
    modifiers: 'accel,shift,alt',
    keyId: 'key_browserToolbox',
    oncommand: () => BrowserToolboxLauncher.init(),
  },
  {
    id: 'dev_aboutConfig',
    label: 'Open about:config',
    shortcut: 'C',
    modifiers: 'accel,shift,alt',
    keyId: 'key_aboutConfig',
    oncommand: () =>
      Services.ww.openWindow(
        window,
        'about:config',
        '_blank',
        'chrome,all,dialog=no',
        null
      ),
  },
]

export function addMenus() {
  /** @type {HTMLDivElement} */
  const devMenuPopup = document.getElementById('menubar-dev-popup')

  const keyset = document.createXULElement('keyset')
  keyset.setAttribute('id', 'helix-keyset')
  document.body.appendChild(keyset)

  for (const menu of menus) {
    createMenuItem(devMenuPopup, menu)
    createKey(keyset, menu)
  }
}

/**
 * @param {HTMLDivElement} container This is the containing `<menupopup>`. It is just that type does not exist
 * @param {Menu} menu The menu to create
 */
function createMenuItem(container, menu) {
  const { label, oncommand } = menu
  /** @type {HTMLElement} */
  const menuItem = document.createXULElement('menuitem')

  menuItem.label = label
  menuItem.setAttribute('acceltext', genAccelText(menu))

  menuItem.addEventListener('command', oncommand)
  container.appendChild(menuItem)
}

/**
 * Creates a keybind
 * @param {HTMLDivElement} container
 * @param {Menu} key Select the key to create
 */
function createKey(container, { shortcut, modifiers, keyId, oncommand }) {
  /** @type {HTMLDivElement} */
  const key = document.createXULElement('key')
  key.id = keyId

  key.setAttribute('key', shortcut)
  if (modifiers) key.setAttribute('modifiers', modifiers)

  key.addEventListener('command', oncommand)
  container.appendChild(key)
}

/**
 * @param {Menu} menu
 * @returns {string}
 *
 * @todo MacOS support
 */
const genAccelText = ({ shortcut, modifiers }) =>
  [
    modifiers.includes('accel') ? 'Ctrl' : null,
    modifiers.includes('shift') ? 'Shift' : null,
    modifiers.includes('alt') ? 'Alt' : null,
    shortcut,
  ]
    .filter(Boolean)
    .join('+')

const getKeyElementId = (key) => `key_${key}`
