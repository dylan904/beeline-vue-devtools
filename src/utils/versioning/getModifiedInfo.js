export default async function getModifiedInfo(filePath, exec) {
    const { stdout: savedChanges, stderr: savedError } = await exec(`git diff ${filePath}`)
    if (!!savedChanges) {
      const { stdout: revisionId, stderr: revisionError } = await exec(`git rev-list -1 HEAD -- ${filePath}`)
      return revisionId.replace('\n', '')
    }
    const { stdout: stagedChanges, stderr: stagedError } = await exec(`git diff --staged ${filePath}`)
    if (!!stagedChanges) {
      const { stdout: revisionId, stderr: revisionError } = await exec(`git rev-list -1 HEAD -- ${filePath}`)
      return revisionId.replace('\n', '')
    }
    return null
  }
  