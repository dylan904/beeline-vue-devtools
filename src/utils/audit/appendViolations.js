import filterModifiedComponents from "./filterModifiedComponents.js"
import partition from "lodash/partition"
import copy from "../copy.js"
import syncViolation from "../versioning/syncViolation.js"

export function appendViolations(targetViolations, srcViolations) {
  let altered = false

  for (const newV of srcViolations) {
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

export function appendAndProcessViolations(currentViolations, srcViolations, pendingViolations) {
  const ops = {
    current: [],
    pending: []
  }
  const violations = {
    current: currentViolations,
    pending: pendingViolations
  }

  for (const [srcVIdx, newV] of srcViolations.entries()) {
    console.log('appendandprocess 1', {
      violations: copy(violations), 
      newV: copy(newV)
    })

    const [unModifiedCompNodes, modifiedCompNodes] = partition(newV.nodes, filterModifiedComponents)
    const compNodes = {
      current: unModifiedCompNodes,
      pending: modifiedCompNodes
    }
    const newVCopy = copy(newV)

    console.log('appendandprocess 2', {unModifiedCompNodes, modifiedCompNodes})

    for (const type of ['current', 'pending']) {
      newVCopy.nodes = compNodes[type]
      const isPending = type === 'pending'
    
      syncViolation(newVCopy, srcVIdx, violations[type], isPending, ops, (component) => !!component.commitHash)
    
      console.log('appendPending', {newVCopy, compNodes})
    }
  }
  return { 
    altered: !!(ops.current.length + ops.pending.length), 
    ops 
  }
}

function filterOutRoot(node) {
  return node.component?.name !== 'ROOT'
}
