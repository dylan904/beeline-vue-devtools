import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

export default async function getPackageJSON(importURL) {
  try {
    const __dirname = dirname(fileURLToPath(importURL))
    const resolvedPackagePath = resolve(__dirname, './package.json')
    const packageModule = await import(resolvedPackagePath, {
      assert: { type: 'json' }
    })
    return packageModule.default
  }
  catch(err) {
    console.log(err)
  }
}
