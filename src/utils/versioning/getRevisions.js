import cosmos from '../audit/cosmos/index.js' // singleton
import git from './git.js'
import updateTrackingRepo from './updateTrackingRepo.js'
import findAndUpdatePendingOps from './findAndUpdatePendingOps.js'

const a11yBranch = 'a11y-file-tracking'

export default async function getRevisions(packageName, packageVersion) {
  try {
    if (!cosmos.getContainer()) {
      await cosmos.init(packageName, packageVersion)
    }
  } catch(err) {
    console.warn('Cant get revisions: ' + err)
    git.checkoutBranch(currentBranch)
    return {}
  }

  git.stash()
  const currentBranch = await git.forcefullyCheckoutBranch(a11yBranch)
  
  try {
    const revisions = await updateTrackingRepo()

    git.checkoutBranch(currentBranch)    // return to previous branch
    git.applyStash()

    setTimeout(() => findAndUpdatePendingOps) // call in new thread
    return revisions
  }
  catch (err) {
    console.warn('Cant get revisions: ' + err)
    git.checkoutBranch(currentBranch)
    git.applyStash()
    return {}
  }
}
