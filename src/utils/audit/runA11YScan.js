import cooler from './cooler.js'
import serialize from '../general/serialize.js'
import cosmos from './cosmos/index.js'
import { appendViolations } from './appendViolations.js'
import syncViolationsDB from './syncViolationsDB.js'

async function scan(router, violations, firstRun) {
  const currentRoute = router?.currentRoute.value
  console.log('scan', currentRoute.name, serialize(currentRoute.query), router)
  
  const result = await axe.run()
  console.log('result violations', JSON.parse(JSON.stringify(result.violations)))

  if (!result.violations.length)
    return
  const altered = appendViolations(violations, result.violations)
  console.log('mycheck', {altered, violations, 'result.violations': result.violations })
  if (altered) {
    if (import.meta.env.VITE_A11Y_COSMOS_CONNECTION_STRING) {
      if (!(await cosmos.init()))
        return result

      const serializedQuery = serialize(currentRoute.query)
      const urlKey = serializedQuery ? currentRoute.name + '?' + serializedQuery : currentRoute.name

      syncViolationsDB(violations, urlKey)
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

export default async function auditA11y(compEls, router, violations) {
  const result = await scan(router, violations, true)
  violations = result.violations  // set here for parent context
  
  return { result, compEls }
}
