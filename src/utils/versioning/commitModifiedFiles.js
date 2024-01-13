import git from './git.js'

export default async function commitModifiedFiles(filePaths) {
  const newCommitFiles = []
  const existingCommitFiles = []

  const defaultBranch = await git.getDefaultBranch()

  for (const filePath of filePaths) {
    if (await git.isFileTracked(filePath)) {
      const exisitingHash = await git.getFileCommitHash(filePath, defaultBranch)
      const fileModified = await git.fileDiffersFromCommit(filePath, exisitingHash) // differs from default branch, remote origin...
      console.log('file rev check', {
        filePath, 
        exisitingHash,
        fileModified,
        test: await git.fileDiffersFromCommit('/Users/dylanmaxey/Downloads/temp/vue-project-5/src/components/TheWelcome.vue', '0d6874d97abedb4d9eb5a737758fb8232098101b'),
        test2: filePath === '/Users/dylanmaxey/Downloads/temp/vue-project-5/src/components/TheWelcome.vue',
        test3: exisitingHash === '0d6874d97abedb4d9eb5a737758fb8232098101b'
      })
      if (fileModified) {
        // TODO: delete linked violations from pending DB (linked via violation -> node -> component -> hash)
        newCommitFiles.push(filePath)
      }
      else 
        existingCommitFiles.push(filePath)
    }
    else {
      newCommitFiles.push(filePath)
    }
  }

  const newCommitHash = await git.commitFiles(newCommitFiles, "File tracking commit", ['-u'], true)
  return { newCommitHash, existingCommitFiles, newCommitFiles }
}
