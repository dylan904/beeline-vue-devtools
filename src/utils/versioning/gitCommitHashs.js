import git from "./git.js"  // singleton

export default async function gitCommitHashs(filePaths) {
  for (const filePath of filePaths) {
    console.log('gitCommitHash()', git.isFileTracked(filePath), filePath)
    if (!git.isFileTracked(filePath)) {
      const { error: addError } = await git.addFile(filePath)
      if (addError)
        throw(addError)
    }

    const hasModifiedChanges = await git.fileHasChanges(filePath)
    if (hasModifiedChanges) {
      return await git.getFileCommitHash(filePath)
    }
    const hasStagedChanges = await git.fileHasChanges(filePath, true)
    if (hasStagedChanges) {
      return await git.getFileCommitHash(filePath)
    }
  }
}
