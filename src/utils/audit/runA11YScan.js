import cooler from './cooler'
import serialize from './serialize'
import cosmosSingleton from './cosmos'
import appendViolations from './appendViolations'

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
      if (!cosmosSingleton.getContainer()) {
        try {
          await cosmosSingleton.initialize()
        } catch (e) {
          console.error(e)
          return result
        }
      }
        
      if (import.meta.env.VITE_A11Y_COSMOS_CONNECTION_STRING) {
        const qResult = await cosmosSingleton.queryViolations(urlKey)
        const recordedViolations = qResult.violations || []
        console.log('testdbd', process.env.version, urlKey, recordedViolations, qResult)
        const recordedViolationCount = recordedViolations.length
        const { altered, ops } = appendViolations(recordedViolations, violations, qResult.id)
    
        if (recordedViolationCount) {
          if (altered) 
            cosmosSingleton.updateViolations(qResult.id, ops)
        }
        else {
          const container = cosmosSingleton.getContainer();
          const item = container.item(qResult.id)
          const { resource } = await item.patch([{ 
            "op": "set", 
            "path": "/violations", 
            "value": violations
          }])
        }
      }

      window.violations = violations  // temporary transparency
  
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