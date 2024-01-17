import cosmos from '../audit/cosmos/index.js' // singleton
import git from './git.js'
import updateTrackingRepo from './updateTrackingRepo.js'
import findAndUpdateViolations from './findAndUpdateViolations.js'

const a11yBranch = 'a11y-file-tracking'

export default async function getRevisions(packageName, packageVersion) {
    try {
        if (!cosmos.getContainer()) {
            await cosmos.init(packageName, packageVersion)
        }
    } catch(err) {
        console.warn('Cant get revisions: ' + err)
        return {}
    }

    await git.stash()
    const currentBranch = await git.forcefullySwitchBranch(a11yBranch)

    let revisions
  
    try {
        revisions = await updateTrackingRepo()
    } catch (err) {
        await git.switchBranch(currentBranch)
        await git.popStash()
        console.warn('Cant get revisions: ' + err)
        return {}
    }

    await git.switchBranch(currentBranch)    // return to previous branch
    await git.popStash()

    console.log('wait findAndUpdateViolations()')
    setTimeout(() => findAndUpdateViolations) // call in new thread
    return revisions
}
