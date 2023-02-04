import { BrowserToolboxLauncher } from 'resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs'

function showMore() {
  document.getElementById('more-text').hidden = false
}

function startDevtools() {
  BrowserToolboxLauncher.init()
}

document
  .getElementById('start-devtools')
  .addEventListener('command', startDevtools)
