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
  
    console.log('try append 1', violations, result.violations)
    const { altered } = appendViolations(violations, result.violations)
    console.log('altered check 1', altered)
    if (altered) {
      if (!cosmosSingleton.getContainer())
        await cosmosSingleton.initialize()
  
      const qResult = await cosmosSingleton.queryViolations(urlKey)
      const recordedViolations = qResult.violations || []
      console.log('testdbd', process.env.version, urlKey, recordedViolations, qResult)
      const recordedViolationCount = recordedViolations.length
      const { altered, ops } = appendViolations(recordedViolations, violations, qResult.id)
  
      if (recordedViolationCount) {
        console.log('2', recordedViolations, violations, router.currentRoute.value.name, altered)
        if (altered) 
          cosmosSingleton.updateViolations(qResult.id, ops)
      }
      else {
        console.log('3', violations, result.violations)
        const container = cosmosSingleton.getContainer();
        const item = container.item(qResult.id)
        console.log({ id: qResult.id, ops: [{ 
          "op": "set", "path": "/violations", "value": violations
        }]})
        const { resource } = await item.patch([{ 
          "op": "set", 
          "path": "/violations", 
          "value": violations
        }])
      }
  
      window.violations = violations  // temporary transparency
      
      console.log({ recordedViolations, windowViolations: violations })
  
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