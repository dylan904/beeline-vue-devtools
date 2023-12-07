# Welcome to Beeline Vue Devtools!

This plugin in its current state is designed to help debug **accessibility** issues within your vue environment. It currently utilizes **[axe-core](https://github.com/dequelabs/axe-core)** to run accessibility audits, then ties the violations that are found on a given page to a Vue component.

# Installation

## Plugin Setup (main.js)

We are going to import the plugin and preparation function:

	import { DevtoolsPlugin, prepareAccessibilityAudit } from 'beeline-vue-devtools/src/devtools'

Then, after the app is created we have it use our plugin:

		// const app = createApp(App)
		...
		app.use(DevtoolsPlugin)

Last, at the bottom of the page, add this code block:

		if (process.env.NODE_ENV === 'development' && process.env.AUDITA11Y) {
			prepareAccessibilityAudit()
		}

## package.json

From your package.json, add one script:

	"test:audit": "AUDITA11Y=1 ./node_modules/.bin/vue-devtools & vite"

# Usage

	npm run test:audit

