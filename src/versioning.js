import cosmos from './utils/audit/cosmos/index.js' // singleton
import git from './utils/versioning/git.js'  // singleton
import getCosmosViolationOps from './utils/versioning/getCosmosViolationOps.js'
import updateTrackingRepo from './utils/versioning/updateTrackingRepo.js'

const a11yBranch = 'a11y-file-tracking'

export async function getRevisions(packageName, packageVersion) {
  try {
    if (!cosmos.getContainer())
      await cosmos.init(packageName, packageVersion)
  } catch(err) {
    console.warn('Cant get revisions: ' + err)
    return {}
  }
  const currentBranch = await git.forcefullyCheckoutBranch(a11yBranch)
  const revisions = await updateTrackingRepo()

  setTimeout(async () => {
    const currentOps = []
    const pendingOps = []
    
    const qResultsCurrent = await cosmos.queryViolations(null, false)
    const qResultsPending = await cosmos.queryViolations(null, true)
    const syncedPageViolationSet = joinArraysByProp(qResultsCurrent, 'current', qResultsPending, 'pending', 'urlKey')

    console.log({qResultsCurrent, qResultsPending})

    for (const syncedPageViolations of syncedPageViolationSet) {
      const pendingViolations = syncedPageViolations.pending?.violations || []
      const currentViolations = syncedPageViolations.current?.violations || []
      console.log('loop', {pendingViolations, currentViolations})

      const opsFromPending = await getCosmosViolationOps(pendingViolations, currentViolations, true)
      const opsFromCurrent = await getCosmosViolationOps(currentViolations, pendingViolations, false)

      pendingOps.push( ...opsFromPending.pending, ...opsFromCurrent.pending )
      currentOps.push( ...opsFromPending.current, ...opsFromCurrent.pending )
    }
    console.log({syncedPageViolationSet})
    console.log({pendingOps, currentOps})
    console.log({currentBranch})

    git.checkoutBranch(currentBranch)    // return to previous branch

    if (pendingOps.length) {
      //await cosmos.updateViolations(qResultPending.id, pendingOps, true)
    }
    if (currentOps.length) {
      //await cosmos.updateViolations(qResultCurrent.id, currentOps)
    }
  })

  return revisions
}

export function revisionWatcherVitePlugin() {
  return {
    name: 'grammarwatch',
    enforce: 'post',
    // HMR
    async handleHotUpdate({ file, server }) {
      console.log('reloading revisions...', file.endsWith('.vue'), file);
      if (file.endsWith('.vue')) {
        server.ws.send({
          type: 'custom',
          event: 'revisions-update',
          data: await getRevisions()
        })
      }
    }
  }
}

function joinArraysByProp(array1, array1name, array2, array2name, prop=id) {
  const propSet = new Set([...array1.map(obj => obj[prop]), ...array2.map(obj => obj[prop])])

  return Array.from(propSet).map(propValue => {
    const obj1 = array1.find(obj => obj[prop] === propValue)
    const obj2 = array2.find(obj => obj[prop] === propValue)
    const output = {}
    if (obj1)
      output[array1name] = { ...obj1 }
    if (obj2)
      output[array2name] = { ...obj2 }
    return output
  })
}