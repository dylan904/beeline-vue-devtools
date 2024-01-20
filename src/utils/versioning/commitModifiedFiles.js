import git from './git.js'

export default async function commitModifiedFiles(filePaths) {
  const newCommitFiles = []
  const existingCommitFiles = []
  const defaultBranch = await git.getDefaultBranch()

  await Promise.all(filePaths.map(async (filePath) => {
    if (await git.isFileTracked(filePath)) {
      const [exisitingHash, fileModified] = await Promise.all([
        git.getFileCommitHash(filePath, defaultBranch),
        git.fileDiffersFromCommit(filePath, exisitingHash, 0, defaultBranch)  // differs from default branch, remote origin...
      ])

      if (fileModified) {
        newCommitFiles.push(filePath)
      }
      else {
        existingCommitFiles.push(filePath)
      }
    }
    else {
      newCommitFiles.push(filePath)
    }
  }))

  const newCommitHash = await git.commitFiles(newCommitFiles, "File tracking commit", ['-u'], true)
  return { newCommitHash, existingCommitFiles, newCommitFiles }
}
