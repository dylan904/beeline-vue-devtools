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
    console.log({'qResult.current': qResult.current, 'qResult.pending': qResult.pending})

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
            "value": []
          }], isPending)
        }
      }
    }
    else {
      const opsFromCurrent = await getUpdatedOps(dbViolations.current, dbViolations.pending, false)
      const opsFromPending = await getUpdatedOps(dbViolations.pending, dbViolations.current, true)

      console.log({ opsFromPending, opsFromCurrent })

      const currentOps = [ ...opsFromPending.current, ...opsFromCurrent.current ]
      if (currentOps.length) {
        //await cosmos.updateViolations(qResultCurrent.id, currentOps)
      }

      const pendingOps = [ ...opsFromPending.pending, ...opsFromCurrent.pending ]
      if (pendingOps.length) {
        //await cosmos.updateViolations(qResultPending.id, pendingOps, true)
      }
    }
  }
}

async function getUpdatedOps(srcViolations, violations, isPending) {
  const ops = { pending: [], current: [] }

  for (const [vIdx, violation] of srcViolations.entries()) {
    syncViolation(violation, vIdx, violations, isPending, ops, async (component) => await git.fileDiffersFromCommit(component.file, component.commitHash))
  }
  
  return ops
}