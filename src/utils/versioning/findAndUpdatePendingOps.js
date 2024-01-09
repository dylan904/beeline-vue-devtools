import cosmos from '../audit/cosmos/index.js'
import getCosmosViolationOps from './getCosmosViolationOps.js'
import joinArraysByProp from '../general/joinArraysByProp.js'

export default async function findAndUpdatePendingOps() {
  const currentOps = []
  const pendingOps = []
  
  const qResultsCurrent = await cosmos.queryViolations(null, false)
  const qResultsPending = await cosmos.queryViolations(null, true)
  const syncedPageViolationSet = joinArraysByProp(qResultsCurrent, 'current', qResultsPending, 'pending', 'urlKey')

  console.log({qResultsCurrent, qResultsPending})

  for (const syncedPageViolations of syncedPageViolationSet) {
    const pendingViolations = syncedPageViolations.pending?.violations || []
    const currentViolations = syncedPageViolations.current?.violations || []
    // console.log('loop', {pendingViolations, currentViolations})

    const opsFromPending = await getCosmosViolationOps(pendingViolations, currentViolations, true)
    const opsFromCurrent = await getCosmosViolationOps(currentViolations, pendingViolations, false)

    pendingOps.push( ...opsFromPending.pending, ...opsFromCurrent.pending )
    currentOps.push( ...opsFromPending.current, ...opsFromCurrent.pending )
  }
  console.log({syncedPageViolationSet})
  console.log({pendingOps, currentOps})

  if (pendingOps.length) {
    //await cosmos.updateViolations(qResultPending.id, pendingOps, true)
  }
  if (currentOps.length) {
    //await cosmos.updateViolations(qResultCurrent.id, currentOps)
  }
}
