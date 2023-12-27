import scan from './runA11YScan.js'

export default async function auditA11Y(compEls, router, violations) {
  const result = await scan(router, violations, true)
  violations = result.violations  // set here for parent context
  
  return { result, compEls }
}