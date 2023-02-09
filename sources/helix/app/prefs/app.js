pref('app.content', 'chrome://helix/content/main.xhtml');

// Whether to show the dialogs opened at the content level, such as
// alert() or prompt(), using a SubDialogManager in the TabDialogBox.
pref('prompts.contentPromptSubDialog', false);

// Allows for reloading the browser content without restarting the chrome.
pref('nglayout.debug.disable_xul_cache', true);

// Enable places by default as we want to store global history for visited links
// Below we define reasonable defaults as copied from Firefox so that we have
// something sensible.
pref("places.history.enabled", true);

pref("browser.tabs.loadDivertedInBackground", false);

// Enable multi-process.
pref("browser.tabs.remote.autostart", true);
pref("browser.tabs.remote.desktopbehavior", true);
pref("extensions.webextensions.remote", true);

// Make the browser appear as firefox
pref("general.useragent.compatMode.firefox", true);
