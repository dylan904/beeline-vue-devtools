import git from './git.js'           // singleton
import syncViolation from './syncViolation.js'

export default async function getCosmosViolationOps(srcViolations, violations, isPending) {
  // isPending - is evaluating pending violation files from DB, otherwise evaluating current violations
  
  const ops = { pending: [], current: [] }

  for (const [vIdx, violation] of srcViolations.entries()) {
    syncViolation(violation, vIdx, violations, isPending, ops, async (component) => await git.fileDiffersFromCommit(component.file, component.commitHash))
  }
  
  return ops
}
