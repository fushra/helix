import { BrowserToolboxLauncher } from 'resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs'

function showMore() {
  document.getElementById('more-text').hidden = false
}

function startDevtools() {
  BrowserToolboxLauncher.init()
}

function reload() {
  window.location.reload()
}

document
  .getElementById('start-devtools')
  .addEventListener('command', startDevtools)

document.getElementById('reload').addEventListener('command', reload)
