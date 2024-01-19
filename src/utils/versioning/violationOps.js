class ViolationOps {
  addViolation(ops, value) {
    ops.push({ 
      op: "add", 
      path: `/violations/-`, 
      value
    })
  }
  
  addNode(ops, vIdx, value) {
    ops.push({ 
      op: "add", 
      path: `/violations/${vIdx}/nodes/-`,
      value
    })
  }

  removeNode(ops, vIdx, nIdx) {
    ops.push({ 
      op: "remove", 
      path: `/violations/${vIdx}/nodes/${nIdx}` 
    })
  }
}

export default new ViolationOps()
