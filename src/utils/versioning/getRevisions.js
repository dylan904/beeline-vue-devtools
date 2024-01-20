import cosmos from '../audit/cosmos/index.js' // singleton
import git from './git.js'
import updateTrackingRepo from './updateTrackingRepo.js'
import syncViolationsDB from '../audit/syncViolationsDB.js'

const a11yBranch = 'a11y-file-tracking'

export default async function getRevisions(packageName, packageVersion) {
    try {
        if (!cosmos.getContainer()) {
            await cosmos.init(packageName, packageVersion)
        }
    } catch(err) {
        console.warn(`Cant get revisions: ${err}`)
        return {}
    }

    await git.stash()
    const currentBranch = await git.forcefullySwitchBranch(a11yBranch)

    let revisions

    try {
        revisions = await updateTrackingRepo()
    } catch(err) {
        console.warn(`Cant get revisions: ${err}`)
        return {}
    } finally {
        await git.switchBranch(currentBranch)    // return to previous branch
        await git.popStash()
    }

    console.log('wait syncViolationsDB()')
    setTimeout(syncViolationsDB)

    return revisions
}
