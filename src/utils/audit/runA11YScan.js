import cooler from './cooler.js'
import serialize from './serialize.js'
import cosmos from './cosmos/index.js'
import appendViolations from './appendViolations.js'
console.log('hi4')

export default async function scan(router, violations, firstRun) {
  const currentRoute = router?.currentRoute.value
  console.log('scan', currentRoute.name, serialize(currentRoute.query), router)
  const serializedQuery = serialize(currentRoute.query)
  const urlKey = serializedQuery ? currentRoute.name + '?' + serializedQuery : currentRoute.name

  const result = await axe.run()
  console.log('result violations', JSON.parse(JSON.stringify(result.violations)))

  if (!result.violations.length)
    return
    console.log('hii5')
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
      console.log('await query', random)
      const qResult = {
        current: (await cosmos.queryViolations(urlKey, false))[0],
        pending: (await cosmos.queryViolations(urlKey, true))[0]
      }
      
      console.log({'qResult.current': qResult.current, 'qResult.pending': qResult.pending})

      const recordedViolations = {
        current: qResult.current.violations || [],
        pending: qResult.pending.violations || []
      }

      console.log('testdbd2', process.env.version, urlKey, recordedViolations.current, qResult.current)
      const recordedViolationCount = recordedViolations.current.length
      console.log({recordedViolationCount, id: qResult.current.id})
      const { altered, ops } = appendViolations(recordedViolations.current, violations, recordedViolations.pending)
  console.log({altered, ops})
      if (recordedViolationCount) {
        if (altered) 
          cosmos.updateViolations(qResult.current.id, ops)
      }
      else {
        const container = cosmos.getContainer()
        const item = container.item(qResult.current.id)
        console.log('create new violations set', violations)
        const { resource } = await item.patch([{ 
          "op": "set", 
          "path": "/violations", 
          "value": violations
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
