import filterModifiedComponents from "./filterModifiedComponents.js"
import copy from "../general/copy.js"
import syncViolation from "../versioning/syncViolation.js"

export function appendViolations(targetViolations, violations) {
  let altered = false

  for (const newV of violations) {
    const vCopy = copy(newV)
    const targetViolation = targetViolations.find(v => v.id === vCopy.id)
    console.log('appendViolation', {vCopy, targetViolation, targetViolations})

    if (targetViolation) {
      const newNodes = vCopy.nodes.filter(nv => !targetViolation.nodes.find(ov => ov.target[0] === nv.target[0]))
      if (newNodes.length) {
        altered = true
        targetViolation.nodes.push(...newNodes)
      }
    }
    else {
      altered = true
      targetViolations.push(vCopy)
    }
  }
  return altered
}

export async function appendAndProcessViolations(dbViolations, violations) {
  const ops = {
    current: [],
    pending: []
  }

  for (const [vIdx, newV] of violations.entries()) {
    console.log('appendandprocess 1', {
      violations: copy(dbViolations), 
      newV: copy(newV)
    })

    const compNodes = {
      current: newV.nodes.filter(node => filterModifiedComponents(node)),
      pending: newV.nodes.filter(node => !filterModifiedComponents(node))
    }
    const newVCopy = copy(newV)

    console.log('appendandprocess 2', {compNodes})

    for (const type of ['current', 'pending']) {
      newVCopy.nodes = compNodes[type]
      console.log('appendV - set nodes', {type, nodes: compNodes[type]})
      const isPending = type === 'pending'
    
      await syncViolation(newVCopy, vIdx, dbViolations[type], isPending, ops, checkComponentHash)
    
      console.log('appendPending', {newVCopy})
    }
  }

  const opCount = (ops.current.length + ops.pending.length)
  return { 
    altered: !!opCount, 
    ops
  }
}

function checkComponentHash(component) {
  return !!component.commitHash
}
