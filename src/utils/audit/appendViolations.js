import filterModifiedComponents from "./filterModifiedComponents.js"
import partition from "lodash/partition"
import copy from "../copy.js"
import vOps from "../versioning/violationOps.js"

export default function appendViolations(targetViolations, srcViolations, id, modified=false) {
  let altered = false
  const ops = []

  for (const [vi, newV] of srcViolations.entries()) {
    const vCopy = copy(newV)
    const targetViolation = targetViolations.find(v => v.id === vCopy.id)

    if (targetViolation) {
      const newNodes = vCopy.nodes.filter(nv => !targetViolation.nodes.find(ov => ov.target[0] === nv.target[0]))

      if (newNodes.length) {
        altered = true
        targetViolation.nodes.push(...newNodes)

        if (id) {
          const [unModifiedCompNodes, modifiedCompNodes] = partition(newNodes, filterModifiedComponents)
          const newNodes = modified ? modifiedCompNodes.filter(filterOutRoot) : unModifiedCompNodes

          for (const newNode of newNodes) {
            ops.push(vOps.addNode(vi, newNode))
          }
        }
      }
    }
    else {
      altered = true
      targetViolations.push(vCopy)

      if (id) {
        const [unModifiedCompNodes, modifiedCompNodes] = partition(vCopy.nodes, filterModifiedComponents)
        vCopy.nodes = modified ? modifiedCompNodes.filter(filterOutRoot) : unModifiedCompNodes
        
        if (vCopy.nodes.length) {
          ops.push(vOps.addViolation(vCopy))
        }
      }
    }
  }
  return { altered, ops }
}

function filterOutRoot(node) {
  return node.component?.name !== 'ROOT'
}
