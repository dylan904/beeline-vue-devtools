import cosmos from './cosmos/index.js'
import { appendAndProcessViolations } from './appendViolations.js'
import syncViolation from '../versioning/syncViolation.js'

export default async function syncViolationsDB(violations, urlKey=null) {
  const currentQueryResults = await cosmos.queryViolations(urlKey, false)
  const pendingQueryResults = await cosmos.queryViolations(urlKey, true)

  const qResults = currentQueryResults.map(cResult => ({
    current: cResult,
    pending: pendingQueryResults.find(pResult => pResult.urlKey === cResult.urlKey)
  }))

  for (const qResult of qResults) {
    console.log('sync', {urlKey, qResult})

    if (!qResult.current)
      qResult.current = await cosmos.createItem(qResult.pending.urlKey, false)
    else if (!qResult.pending)
      qResult.pending = await cosmos.createItem(qResult.current.urlKey, true)
    
    const dbViolations = {
      current: qResult.current.violations || [],
      pending: qResult.pending.violations || []
    }
    console.log({currentRecorded: dbViolations.current, pendingRecorded: dbViolations.pending, idc: qResult.current.id, idp: qResult.pending.id})

    if (violations) {
      const { altered, ops } = appendAndProcessViolations(dbViolations.current, violations, dbViolations.pending)
      console.log({altered, ops})

      if (!altered) 
        continue

      for (const type of ['current', 'pending']) {
        const isPending = type === 'pending'
        if (dbViolations[type].length) {
          if (ops[type].length) 
            await cosmos.updateViolations(qResult[type].id, ops[type], isPending)
        }
        else {
          await cosmos.updateViolations(qResult[type].id, [{ 
            "op": "set", 
            "path": "/violations", 
            "value": [ ...dbViolations[type] ]
          }], isPending)
        }
      }
    }
    else {
      const opsFromCurrent = await getUpdatedOps(dbViolations.current, dbViolations.pending, false)
      const opsFromPending = await getUpdatedOps(dbViolations.pending, dbViolations.current, true)

      const currentOps = [ ...opsFromPending.current, ...opsFromCurrent.current ]
      if (currentOps.length) {
        await cosmos.updateViolations(qResultCurrent.id, currentOps)
      }

      const pendingOps = [ ...opsFromPending.pending, ...opsFromCurrent.pending ]
      if (pendingOps.length) {
        await cosmos.updateViolations(qResultPending.id, pendingOps, true)
      }

      console.log({ currentOps, pendingOps })
    }
  }
}

const fileDiffersStates = {}
let git

async function getUpdatedOps(srcViolations, violations, isPending) {
  const ops = { pending: [], current: [] }
  
  if (typeof window === 'undefined' && !git) {
    console.log('setgit')
    git = (await import('../versioning/git.js')).default
  }

  for (const [vIdx, violation] of srcViolations.entries()) {
    console.log('syncVfrom getUpdatedOps', violation)
    await syncViolation(violation, vIdx, violations, isPending, ops, async (component) => {
      console.log('trysetstate', {git, serverSide: typeof window === 'undefined', component, state: fileDiffersStates[component.file], file: component.file})
      if (!fileDiffersStates.hasOwnProperty(component.file))
        fileDiffersStates[component.file] = await git.fileDiffersFromCommit(component.file, component.commitHash)

      return fileDiffersStates[component.file]
    })
  }
  
  return ops
}
