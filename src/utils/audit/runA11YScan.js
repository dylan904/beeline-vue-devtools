import cooler from './cooler.js'
import serialize from './serialize.js'
import cosmos from './cosmos/index.js'
import appendViolations from './appendViolations.js'

export default async function scan(router, violations, firstRun) {
  const currentRoute = router?.currentRoute.value
  console.log('scan', currentRoute.name, serialize(currentRoute.query), router)
  const serializedQuery = serialize(currentRoute.query)
  const urlKey = serializedQuery ? currentRoute.name + '?' + serializedQuery : currentRoute.name

  const result = await axe.run()
  console.log('result violations', JSON.parse(JSON.stringify(result.violations)))

  if (!result.violations.length)
    return
  const { altered } = appendViolations(violations, result.violations)
  if (altered) {
    if (!cosmos.getContainer()) {
      try {
        await cosmos.init()
      } catch (e) {
        console.error(e)
        return result
      }
    }
      
    if (import.meta.env.VITE_A11Y_COSMOS_CONNECTION_STRING) {
      const qResult = {
        current: (await cosmos.queryViolations(urlKey, false))[0],
        pending: (await cosmos.queryViolations(urlKey, true))[0]
      }
      
      console.log({'qResult.current': qResult.current, 'qResult.pending': qResult.pending})

      const recordedViolations = {
        current: qResult.current.violations || [],
        pending: qResult.pending.violations || []
      }

      console.log({currentRecorded: recordedViolations.current, pendingRecorded: recordedViolations.pending, idc: qResult.current.id, idp: qResult.pending.id})
      const { altered, ops } = appendViolations(recordedViolations.current, violations, recordedViolations.pending)
      console.log({altered, ops})
      if (recordedViolations.current.length) {
        if (ops.current.length) 
          cosmos.updateViolations(qResult.current.id, ops.current, false)
      }
      else {
        cosmos.updateViolations(qResult.current.id, [{ 
          "op": "set", 
          "path": "/violations", 
          "value": recordedViolations.current
        }])
      }
      if (recordedViolations.pending.length) {
        if (ops.pending.length) 
          cosmos.updateViolations(qResult.pending.id, ops.pending, true)
      }
      else {
        cosmos.updateViolations(qResult.current.id, [{ 
          "op": "set", 
          "path": "/violations", 
          "value": recordedViolations.pending
        }])
      }
    }

    if (firstRun) {
      const auditCooler = new cooler(2000, scan)
      const mutationsObserver = new MutationObserver(mutations => {
          setTimeout(auditCooler.proxy.call(auditCooler, router, violations), 500)
      })
      mutationsObserver.observe(document.body, { subtree: true, childList: true, attributes: true })
    }
  }
  return result
}
