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

  for (const [vi, newV] of srcViolations.entries()) {
    const vCopy = copy(newV)
    const newNodes = []
    const currentViolation = currentViolations.find(v => v.id === vCopy.id)
    const pendingViolation = pendingViolations.find(v => v.id === vCopy.id)

    preProcessViolation(currentViolation, pendingViolation, vCopy, newNodes)
    preProcessViolation(pendingViolation, currentViolation, vCopy, newNodes)

    console.log('appendandprocess 1', {
      currentViolations: JSON.parse(JSON.stringify(currentViolations)), 
      pendingViolations: JSON.parse(JSON.stringify(pendingViolations)), 
      vCopy: JSON.parse(JSON.stringify(vCopy)), newNodes
    })

    const [unModifiedCompNodes, modifiedCompNodes] = partition(newNodes, filterModifiedComponents)

    console.log('appendandprocess 2', {newNodes, unModifiedCompNodes, modifiedCompNodes})

    appendViolation(newV, currentViolations, unModifiedCompNodes, ops.current)
    appendViolation(newV, pendingViolations, modifiedCompNodes, ops.pending)
  }
  return { altered: ops.length, ops }
}

function preProcessViolation(violation, altViolation, vCopy, newNodes) {
  if (violation) {
    const filteredNodes = vCopy.nodes.filter(nv => 
      !violation.nodes.find(ov => ov.target[0] === nv.target[0]) && 
      (!altViolation || !altViolation.nodes.find(ov => ov.target[0] === nv.target[0]))
    )
    console.log('preprocess', {violation, filteredNodes, 'vCopy.nodes.target': vCopy.nodes.map(item => item.target[0]), 'violation.nodes.target': violation.nodes.map(item => item.target[0]) })
    newNodes.push(...filteredNodes)
    violation.nodes.push(...filteredNodes)
  }
  else if (!newNodes.length) {
    newNodes.push(...vCopy.nodes)
  }
}

function filterOutRoot(node) {
  return node.component?.name !== 'ROOT'
}

function appendViolation(newV, violations, compNodes, ops) {
  const newVCopy = copy(newV)
  const evi = violations.findIndex(v => v.id === newVCopy.id) // existing violation index
  const existingViolation = violations[evi]
  newVCopy.nodes = compNodes.filter(filterOutRoot)

  console.log('appendPending', {existingViolation, newVCopy, compNodes})

  if (newVCopy.nodes.length) {
    if (existingViolation) {
      for (const newNode of newVCopy.nodes) {
        ops.push(vOps.addNode(evi, newNode))
      }
    }
    else {
      violations.push(newVCopy)
      ops.push(vOps.addViolation(newVCopy))
    }
  }
}
