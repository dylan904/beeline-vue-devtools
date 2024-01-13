import git from './git.js'

export default async function commitModifiedFiles(filePaths) {
  const newCommitFiles = []
  const existingCommitFiles = []

  const defaultBranch = await git.getDefaultBranch()

  for (const filePath of filePaths) {
    if (await git.isFileTracked(filePath)) {
      const exisitingHash = await git.getFileCommitHash(filePath, defaultBranch)
      const fileModified = await git.fileDiffersFromCommit(filePath, exisitingHash, 0, defaultBranch) // differs from default branch, remote origin...
      console.log('file rev check', {
        filePath, exisitingHash, fileModified
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
