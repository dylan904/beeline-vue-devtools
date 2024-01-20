import git from "./git.js"  // singleton

export default async function gitCommitHashs(filePaths) {
  for (const filePath of filePaths) {
    if (!git.isFileTracked(filePath)) {
      console.log('gitCommitHashs add()', filePath)
      const { error: addError } = await git.add(filePath)
      if (addError)
        throw(addError)
    }

    const hasModifiedChanges = await git.fileHasChanges(filePath)
    const hasStagedChanges = await git.fileHasChanges(filePath, true)

    if (hasModifiedChanges || hasStagedChanges) {
      return await git.getFileCommitHash(filePath)
    }
  }
}
