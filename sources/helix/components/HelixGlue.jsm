var EXPORTED_SYMBOLS = ['HelixGlue']

const JS_PROCESS_ACTORS = {}

const JS_WINDOW_ACTORS = {
  LinkHandler: {
    parent: {
      moduleURI: 'resource:///actors/LinkHandlerParent.jsm',
    },
    child: {
      moduleURI: 'resource:///actors/LinkHandlerChild.jsm',
      events: {
        DOMHeadElementParsed: {},
        DOMLinkAdded: {},
        DOMLinkChanged: {},
        pageshow: {},
        // The `pagehide` event is only used to clean up state which will not be
        // present if the actor hasn't been created.
        pagehide: { createActor: false },
      },
    },

    messageManagerGroups: ['browsers'],
  },
}

function HelixGlue() {
  console.log('Browser glue')

  lazy.ActorManagerParent.addJSProcessActors(JS_PROCESS_ACTORS)
  lazy.ActorManagerParent.addJSWindowActors(JS_WINDOW_ACTORS)
}

HelixGlue.prototype = {}
