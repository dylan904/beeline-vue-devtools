import git from "./git"

export default async function getModifiedHash(filePath, exec) {
    const { stdout: savedChanges} = await git.fileHasChanges(filePath)
    if (!!savedChanges) {
      const { stdout: revisionId } = await git.getFileCommitHash(filePath)
      return revisionId.trim()
    }
    const { stdout: stagedChanges } = await exec(`git diff --staged ${filePath}`)
    if (!!stagedChanges) {
      const { stdout: revisionId } = await git.fileHasChanges(filePath, true)
      return revisionId.trim()
    }
    return null
  }
  