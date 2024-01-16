import filterModifiedComponents from "./filterModifiedComponents.js"
import partition from "lodash/partition"
import copy from "../copy.js"
import vOps from "../versioning/violationOps.js"

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

  for (const newV of srcViolations) {
    const vCopy = copy(newV)
    const existingViolation = {
      current: currentViolations.find(v => v.id === vCopy.id),
      pending: pendingViolations.find(v => v.id === vCopy.id)
    }

    console.log('appendandprocess 1', {
      currentViolations: JSON.parse(JSON.stringify(violations.current)), 
      pendingViolations: JSON.parse(JSON.stringify(violations.pending)), 
      vCopy: JSON.parse(JSON.stringify(vCopy))
    })

    const [unModifiedCompNodes, modifiedCompNodes] = partition(newV.nodes, filterModifiedComponents)
    const compNodes = {
      current: unModifiedCompNodes,
      pending: modifiedCompNodes
    }

    console.log('appendandprocess 2', {unModifiedCompNodes, modifiedCompNodes})

    appendViolation(newV, violations, existingViolation, compNodes, ops, 'current')
    appendViolation(newV, violations, existingViolation, compNodes, ops, 'pending')
  }
  return { altered: ops.length, ops }
}

function filterOutRoot(node) {
  return node.component?.name !== 'ROOT'
}

function appendViolation(newV, violations, existingViolation, compNodes, ops, type) {
  const isCurrent = type === 'current'
  const isPending = type === 'pending'
  
  const newVCopy = copy(newV)
  newVCopy.nodes = compNodes[type].filter(filterOutRoot)

  console.log('appendPending', {existingViolation, newVCopy, compNodes})

  if (newVCopy.nodes.length) {
    const existingV = existingViolation[type]
    if (existingV) {
      for (const node of newVCopy.nodes) {
        const commitHash = node.component?.commitHash
        const existingNodeIdx = existingV.nodes.findIndex(n => n.target[0] === node.target[0])
        const existingNode = existingV.nodes[existingNodeIdx]
        const evi = violations[type].findIndex(v => v.id === newVCopy.id)

        if ((isCurrent && existingNode && commitHash) || (isPending && existingNode && !commitHash)) {
          ops[type].push(vOps.removeNode(evi, existingNodeIdx))
        }
        else if ((isCurrent && !existingNode && !commitHash) || (isPending && !existingNode && commitHash)) {
          ops[type].push(vOps.addNode(evi, newNode))
        }
      }
    }
    else {
      violations[type].push(newVCopy)
      ops.push(vOps.addViolation(newVCopy))
    }
  }
}
