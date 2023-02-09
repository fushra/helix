//@ts-check

const nsICommandLineHandler = Ci.nsICommandLineHandler

/**
 * This component is responsible for launching application windows and
 * handling commandline arguments.
 *
 * Its will try to launch the following:
 * - `-chrome` command line flag (if it exists)
 * - `app.content` if it exists
 * - Warn if neither
 */
export class AppLauncher {
  classID = Components.ID('{2bdc979f-d4da-4c22-8a05-8fc9dd37854d}')

  // nsISupports
  QueryInterface = ChromeUtils.generateQI([nsICommandLineHandler])

  // nsICommandLineHandler

  /**
   * @param {nsICommandLineType} cmdLine
   * @see {@link https://searchfox.org/mozilla-central/source/toolkit/components/commandlines/nsICommandLineHandler.idl}
   */
  handle(cmdLine) {
    console.log('AppLauncher hit')

    var prefs = Services.prefs
    // Cc['@mozilla.org/preferences-service;1'].getService(nsIPrefBranch)

    const wwatch = Services.ww
    // Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(nsIWindowWatcher)

    // Handle chrome flag
    {
      const chromeFlagURI = cmdLine.handleFlagWithParam('chrome', false)

      if (chromeFlagURI) {
        try {
          const flags = prefs.getCharPref(
            'toolkit.defaultChromeFeatures',
            'chrome,dialog=no,all'
          )

          wwatch.openWindow(null, chromeFlagURI, '_blank', flags, cmdLine)
        } catch (e) {
          console.warn('Failed to open chrome URL', chromeFlagURI)
          console.warn(e)
        }

        return
      }
    }

    {
      try {
        // @ts-ignore This pref does not define a default type. That will lead
        // to an error if the pref is not set, which is what we want
        var chromeURI = prefs.getCharPref('app.content')

        // var flags = prefs.getCharPref(
        //   'toolkit.defaultChromeFeatures',
        //   'chrome,dialog=no,all'
        // )

        wwatch.openWindow(
          null,
          chromeURI,
          '_blank',
          'chrome,all,dialog=no,extrachrome,menubar,resizable,scrollbars,status,location,toolbar,personalbar',
          cmdLine
        )
        return
      } catch (e) {}
    }

    console.warn(
      'Neither `--chrome` nor `app.content` are set. It is highly likely that your app will launch with no content'
    )
  }
}
