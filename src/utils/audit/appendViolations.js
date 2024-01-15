import filterModifiedComponents from "./filterModifiedComponents.js"
import partition from "lodash/partition"
import copy from "../copy.js"
import vOps from "../versioning/violationOps.js"

export function appendViolations(targetViolations, srcViolations) {
  let altered = false

  for (const [vi, newV] of srcViolations.entries()) {
    const vCopy = copy(newV)
    const targetViolation = targetViolations.find(v => v.id === vCopy.id)

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
  let altered = false
  const ops = {
    current: [],
    pending: []
  }

  for (const [vi, newV] of srcViolations.entries()) {
    const vCopy = copy(newV)
    const currentViolation = currentViolations.find(v => v.id === vCopy.id)
    const pendingViolation = pendingViolations.find(v => v.id === vCopy.id)
    const newCurrentNodes = []
    const newPendingNodes = []

    preProcessViolation(currentViolation, vCopy, newCurrentNodes)
    preProcessViolation(pendingViolation, vCopy, newPendingNodes)

    console.log('appendandprocess 1', {currentViolation, pendingViolation, currentViolations, pendingViolations, vCopy})

    const newNodes = newCurrentNodes.concat(newPendingNodes)
    const [unModifiedCompNodes, modifiedCompNodes] = partition(newNodes, filterModifiedComponents)

    console.log('appendandprocess 2', {newNodes, unModifiedCompNodes, modifiedCompNodes})

    const currentAltered = appendViolation(newV, currentViolations, unModifiedCompNodes, ops.current, vi, false)
    if (currentAltered) {
      altered = true
    }

    const pendingAltered = appendViolation(newV, pendingViolations, modifiedCompNodes, ops.pending, vi, true)
    if (pendingAltered) {
      altered = true
    }
  }
  return { altered, ops }
}

function preProcessViolation(violation, vCopy, newNodes) {
  if (violation) {
    const filteredNodes = vCopy.nodes.filter(nv => !violation.nodes.find(ov => ov.target[0] === nv.target[0]))
    newNodes.push(...filteredNodes)
    violation.nodes.push(...filteredNodes)
  }
}

function filterOutRoot(node) {
  return node.component?.name !== 'ROOT'
}

function appendViolation(newV, violations, compNodes, ops, vi, isPending) {
  altered = false
  const newVCopy = copy(newV)
  const existingViolation = violations.find(v => v.id === newVCopy.id)
  newVCopy.nodes = compNodes.filter(filterOutRoot)

  console.log('appendPending', {existingViolation, newVCopy, compNodes})

  if (newVCopy.nodes.length) {
    if (existingViolation) {
      for (const newNode of newVCopy.nodes) {
        ops.push(vOps.addNode(vi, newNode))
        altered = true
      }
    }
    else {
      violations.push(newVCopy)
      ops.push(vOps.addViolation(newVCopy))
      altered = true
    }
  }
  return altered
}
