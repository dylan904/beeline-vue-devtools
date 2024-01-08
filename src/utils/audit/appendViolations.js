import filterModifiedComponents from "./filterModifiedComponents.js"
import partition from "lodash/partition"
import copy from "../copy.js"
import vOps from "../versioning/violationOps.js"

export default function appendViolations(targetViolations, srcViolations, pendingViolations) {
  let altered = false
  const ops = {
    current: [],
    pending: []
  }

  for (const [vi, newV] of srcViolations.entries()) {
    const vCopy = copy(newV)
    const targetViolation = targetViolations.find(v => v.id === vCopy.id)

    if (targetViolation) {
      const newNodes = vCopy.nodes.filter(nv => !targetViolation.nodes.find(ov => ov.target[0] === nv.target[0]))

      if (newNodes.length) {
        altered = true
        targetViolation.nodes.push(...newNodes)

        if (pendingViolations) {
          const [unModifiedCompNodes, modifiedCompNodes] = partition(newNodes, filterModifiedComponents)
          console.log({modifiedCompNodes, unModifiedCompNodes})

          for (const newNode of unModifiedCompNodes) {
            ops.current.push(vOps.addNode(vi, newNode))
          }
          appendPendingViolation(newV, pendingViolations, modifiedCompNodes, ops.pending)
        }
      }
    }
    else {
      altered = true
      targetViolations.push(vCopy)

      if (pendingViolations) {
        const [unModifiedCompNodes, modifiedCompNodes] = partition(vCopy.nodes, filterModifiedComponents)

        if (unModifiedCompNodes.length) {
          const newVCopy = copy(newV)
          newVCopy.nodes = unModifiedCompNodes
          ops.current.push(vOps.addViolation(newVCopy))
        }

        appendPendingViolation(newV, pendingViolations, modifiedCompNodes, ops.pending)
      }
    }
  }
  return { altered, ops }
}

function filterOutRoot(node) {
  return node.component?.name !== 'ROOT'
}

function appendPendingViolation(newV, pendingViolations, modifiedCompNodes, pendingOps) {
  const newVCopy = copy(newV)
  const pendingViolation = pendingViolations.find(v => v.id === newVCopy.id)
  newVCopy.nodes = modifiedCompNodes.filter(filterOutRoot)

  console.log('appendPending', {pendingViolation, newVCopy, modifiedCompNodes})

  if (newVCopy.nodes.length) {
    if (pendingViolation) {
      for (const newNode of modifiedCompNodes.filter(filterOutRoot)) {
        pendingOps.push(vOps.addNode(vi, newNode))
      }
    }
    else {
      pendingViolations.push(newVCopy)
      pendingOps.push(vOps.addViolation(newVCopy))
    }
  }
}
