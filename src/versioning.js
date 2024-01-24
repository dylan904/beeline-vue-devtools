import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { loadEnv } from 'vite'
import git from './utils/versioning/git.js'  // singleton
import getRevisions from './utils/versioning/getRevisions.js'
import getPackageJSON from './utils/general/getPackageJSON.js'

export async function getA11yConfig(importURL) {
  try {
    await git.init()
  } catch(err) {
    console.log(err)
    return {}
  }

  process.env = { ...process.env, ...loadEnv(process.env.NODE_ENV, process.cwd()) }
  
  const packageJSON = await getPackageJSON(importURL)
  const newProcessProps = {
    'process.env.project': '"' + packageJSON.name + '"',
    'process.env.version': '"' + packageJSON.version + '"',
    'process.env.author': '"' + (await git.getConfigProp('user.email')) + '"',
    'process.env.AUDITA11Y': process.env.AUDITA11Y || '""',
    'process.env.projectRoot': '"' + dirname(fileURLToPath(importURL)) + '"',
    'process.env.VITE_A11Y_COSMOS_CONNECTION_STRING': '"' + process.env.VITE_A11Y_COSMOS_CONNECTION_STRING + '"'
  }

  for (const propKey in newProcessProps) {
    const value = newProcessProps[propKey]
    process.env[propKey.replace('process.env.', '')] = value.substring(1, value.length-1)
  }

  // set revisions after so it can access cosmos string
  const revisions = await getRevisions(packageJSON.name, packageJSON.version)
  console.log('got revisions', revisions)
  newProcessProps['process.env.revisions'] = revisions
  process.env.revisions = revisions

  return newProcessProps
}


let updateQueue = Promise.resolve()
let processedFileStates = {}

export function revisionWatcherVitePlugin() {
  return {
    name: 'beeline-revision-watcher',
    enforce: 'post',
    async handleHotUpdate({ file, server }) {
      const isVueFile = file.endsWith('.vue')
      const pending = processedFileStates[file]
      console.log('revisioncheck1', { isVueFile, file, pending })

      if (isVueFile && !pending) {
        processedFileStates[file] = true
        console.log('reloading revisions...', { currentBranch: (await git.getCurrentBranch()) })

        updateQueue = updateQueue.then(async () => {
          const revisions = await getRevisions()
          try {
            server.ws.send({
              type: 'custom',
              event: 'revisions-update',
              data: revisions
            })
          } catch (err) {
            console.error('Error sending message to server:' + err)
          } finally {
            lastProcessedFiles[file] = { time: Date.now(), pending: false }
          }
        })
      }
    }
  }
}
