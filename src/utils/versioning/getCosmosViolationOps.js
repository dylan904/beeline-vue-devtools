import git from './git.js'           // singleton
import vOps from './violationOps.js' // singleton
import shiftViolation from './shiftViolation.js'

export default async function getCosmosViolationOps(srcViolations, violations, isPending) {
  // isPending - is evaluating pending violation files from DB, otherwise evaluating current violations
  
  const ops = { pending: [], current: [] }

  for (const [vIdx, violation] of srcViolations.entries()) {
    const nodeCount = violation.nodes.length
    const heldOps = { pending: [], current: [] }

    for (const [nIdx, node] of violation.nodes.reverse().entries()) {
      const component = node.component
      //console.log('componentcheck', component, node)
      if (component?.file && component?.commitHash) {
        const componentFileDiffersFromCommit = await git.fileDiffersFromCommit(component.file, component.commitHash)
        console.log('filediffers', componentFileDiffersFromCommit, component.file)
        if (isPending && !componentFileDiffersFromCommit) {
          shiftViolation(srcViolations, violations, heldOps.pending, heldOps.current, vIdx, nIdx) // shift to current violations
        }
        else if (!isPending && componentFileDiffersFromCommit) {
          shiftViolation(srcViolations, violations, heldOps.current, heldOps.pending, vIdx, nIdx) // shift to pending violations
        }
      }
    }
    violation.nodes.reverse() // re-reverse

    console.log('checkit', nodeCount, heldOps)

    if (nodeCount && heldOps.pending.length === nodeCount) {
      if (isPending)
        ops.current.push(vOps.addViolation(violation))
      else
        ops.pending.push(vOps.addViolation(violation))
    }
    else {
      ops.pending.push(...heldOps.pending)
      ops.current.push(...heldOps.current)
    }
  }
  
  return ops
}
