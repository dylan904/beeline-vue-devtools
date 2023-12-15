# Welcome to Beeline Vue Devtools!

This plugin in its current state is designed to help debug **accessibility** issues within your vue environment. It currently utilizes **[axe-core](https://github.com/dequelabs/axe-core)** to run accessibility audits, then ties the violations that are found on a given page to a Vue component.

# Installation

## Plugin Setup (main.js)

We are going to import the plugin and preparation function:

```js
import { DevtoolsPlugin, prepareAccessibilityAudit } from 'beeline-vue-devtools/src/devtools'
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
	prepareAccessibilityAudit(router)
}
```

## package.json

From your package.json, add one script:

	"test:audit": "AUDITA11Y=1 ./node_modules/.bin/vue-devtools & npm run dev"

 ## vite.config

We'll want to pass along a few environment variables for useful context in the auditing process.

Inside your vite config file, import these lines:

```js
import packageJSON from './package.json' assert {type: 'json'}
import { getRevisions, revisionWatcherVitePlugin } from 'beeline-vue-devtools/src/versioning.js'
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
	'process.env.project': '"' + packageJSON.name + '"',
	'process.env.version': '"' + packageJSON.version + '"',
	'process.env.revisions': await getRevisions(),
	'process.env.AUDITA11Y': process.env.AUDITA11Y
},
```

Last, within defineConfig plugins add:
```js
plugins: [
      // vue(),
      revisionWatcherVitePlugin()
],
```

# Usage

	npm run test:audit
