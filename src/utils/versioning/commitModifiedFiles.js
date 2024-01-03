import git from "./git.js"

export default async function commitModifiedFiles(filePaths) {
  const newCommitFiles = []
  const existingCommitFiles = []

  for (const filePath of filePaths) {
    if (await git.fileExists(filePath)) {
      const exisitingHash = await git.getFileCommitHash(filePath)
      console.log('file rev check', (await git.fileDiffersFromCommit(filePath, exisitingHash)), {filePath, exisitingHash})
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

  const newCommitHash = await git.commitFiles(newCommitFiles, "File tracking commit", ['-u'], true)
  return { newCommitHash, existingCommitFiles, newCommitFiles }
}
