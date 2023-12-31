import git from "./git.js"

export default async function commitModifiedFiles(filePaths) {
  const newCommitFiles = []
  const existingCommitFiles = []

  for (const filePath of filePaths) {
    if (await git.fileExists(filePath)) {
      const exisitingHash = await git.getFileCommitHash(filePath)
      if (await git.fileDiffersFromCommit(filePath, exisitingHash)) {
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

  console.log('try test', newCommitFiles)

  const newCommitHash = await git.commitFiles(newCommitFiles, "File tracking commit", ['-u'], true)
  console.log('try return', { newCommitHash, existingCommitFiles, newCommitFiles })
  return { newCommitHash, existingCommitFiles, newCommitFiles }
}