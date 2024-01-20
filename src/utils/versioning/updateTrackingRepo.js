import gitCommitHashs from './gitCommitHashs.js'
import commitModifiedFiles from './commitModifiedFiles.js'
import { promisify } from 'util'
import { exec } from 'child_process'
import fromDir from "../general/fromDir.js"

const execPromise = promisify(exec)
const srcPathRegex = /.*\/src\//

export default async function updateTrackingRepo() { // commit modified files to secondary branch for version reference
  const componentFiles = await fromDir(process.env.projectRoot + '/src/', /\.vue$/)
  console.log({componentFiles})
  const revisions = {}
  const { newCommitHash, existingCommitFiles, newCommitFiles } = await commitModifiedFiles(componentFiles)

  console.log({newCommitHash, existingCommitFiles, newCommitFiles, componentFiles})

  await gitCommitHashs(existingCommitFiles, execPromise)

  for (const newCommitFile of newCommitFiles) {
    const relativeFilePath = newCommitFile.replace(srcPathRegex, 'src/')
    revisions[relativeFilePath] = newCommitHash
  }

  return revisions
}
