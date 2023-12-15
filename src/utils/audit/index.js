import scan from './runA11YScan'

export default async function auditA11Y(compEls, router, violations) {
  const result = await scan(router, violations, true)
  violations = result.violations
  
  return { result, compEls }
}