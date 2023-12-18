import filterModifiedComponents from "./filterModifiedComponents"

export default function appendViolations(targetViolations, srcViolations, id) {
  let altered = false
  const ops = []
  for (const [vi, newV] of srcViolations.entries()) {
    const targetViolation = targetViolations.find(v => v.id === newV.id)
    if (targetViolation) {
      const newNodes = newV.nodes.filter(nv => !targetViolation.nodes.find(ov => ov.target[0] === nv.target[0]))
      if (newNodes.length) {
        altered = true
        targetViolation.nodes.push(...newNodes)
        if (id) {
          newNodes.filter(filterModifiedComponents).forEach(newNode => {
            ops.push({ "op": "add", "path": `/violations/${vi}/nodes/-`, "value": newNode })
          })
        }
      }
    }
    else {
      altered = true
      targetViolations.push(newV)
      if (id) {
        newV.nodes = newV.nodes.filter(filterModifiedComponents)
        if (newV.nodes.length) {
          ops.push({ "op": "add", "path": `/violations/-`, "value": newV })
        }
      }
    }
  }
  return { altered, ops }
}