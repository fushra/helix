#! /bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Include the DevTools client, not just the server (which is the default)
MOZ_DEVTOOLS=all

# We need to specify an app id to fix xpcshell loading HelixGlue. If it is
# changed here, then it needs to be changed in HelixComponents.manifest as well.
MOZ_APP_ID={a5d56a92-a287-42b3-8149-719a8b9eb060}

BROWSER_CHROME_URL=chrome://helix/content/main.xhtml