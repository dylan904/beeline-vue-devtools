import vOps from './violationOps.js'   // singleton

export default function shiftViolation(srcViolations, destViolations, destOps, srcOps, vIdx, nIdx) {
  const violation = srcViolations[vIdx]
  srcOps.push(vOps.removeNode(vIdx, nIdx))
  
  const destViolationIdx = destViolations.findIndex((v) => { v.id === violation.id })
  if (destViolationIdx !== -1){ 
    destOps.push(vOps.addNode(destViolationIdx, node))
  }
  else {
    destOps.push(vOps.addViolation({
      ...violation,
      nodes: [node]
    }))
  }
}
