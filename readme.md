# Welcome to Beeline Vue Devtools!

This plugin in its current state is designed to help debug **accessibility** issues within your vue environment. It currently utilizes **[axe-core](https://github.com/dequelabs/axe-core)** to run accessibility audits, then ties the violations that are found on a given page to a Vue component.

# Installation

## Plugin Setup (main.js)

We are going to import the plugin and preparation function:

```js
import { DevtoolsPlugin, prepareA11YAudit } from 'beeline-vue-devtools/src/devtools'
```

Then, after the app is created we have it use our plugin:

```js
// const app = createApp(App)
...
app.use(DevtoolsPlugin)
```

Last, at the bottom of the page, add this code block:

```js
if (import.meta.env.DEV && process.env.AUDITA11Y) {
    prepareA11YAudit(router)
}
```

## package.json

From your package.json, add one script:

	"test:audit": "node_modules/.bin/vue-devtools & node_modules/cross-env/src/bin/cross-env.js AUDITA11Y=1 npm run dev"

 ## vite.config

We'll want to pass along a few environment variables for useful context in the auditing process.

Inside your vite config file, add this line to your imports:

```js
import { getA11yConfig, revisionWatcherVitePlugin } from 'beeline-vue-devtools/src/versioning.js'
```

Then, wrap defineConfig with an async function:

```js
export default async () => {
    return defineConfig({ ... })
}
```

Within defineConfig add:
```js
define: {
    ...(await getA11yConfig(import.meta.url))
},
```

Last, within defineConfig plugins add:
```js
plugins: [
      // vue(),
      revisionWatcherVitePlugin()
],
```

## .env or .env.development.local

    VITE_A11Y_COSMOS_CONNECTION_STRING="YOUR_COSMOS_CONNECTION_STRING"
    
Obtain your Cosmos DB connection string [here](https://portal.azure.com/#@beelineco.onmicrosoft.com/resource/subscriptions/c40fc505-7ef8-48d0-beb1-1ad31231db6a/resourcegroups/rg-a11y-scus/providers/Microsoft.DocumentDB/databaseAccounts/beeline-a11y-audits-scus/Connection%20strings)

# Usage

	npm run test:audit

### Switch to the "Accessibility Inspector" tab

 ![test](https://github.com/dylan904/beeline-vue-devtools/blob/main/screenshots/devtools-plugin-tab.png?raw=true)
