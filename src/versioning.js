import { promisify } from 'util'
import { exec } from 'child_process' 
import getModifiedInfo from './utils/versioning/getModifiedInfo'
import getComponentFiles from './utils/versioning/getComponentFiles'

const componentFiles = getComponentFiles()

export async function getRevisions() {
  const execPromise = promisify(exec)
  const revisions = {}
  
  for (const componentFile of componentFiles) {
    revisions[componentFile] = await getModifiedInfo(componentFile, execPromise)
  }
  return revisions
}

export function revisionWatcherVitePlugin() {
  return {
    name: 'grammarwatch',
    enforce: 'post',
    // HMR
    async handleHotUpdate({ file, server }) {
      console.log('reloading revisions...', file.endsWith('.vue'), file);
      if (file.endsWith('.vue')) {
        server.ws.send({
          type: 'custom',
          event: 'revisions-update',
          data: await getRevisions()
        })
      }
    },
  }
}
