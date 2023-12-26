class ViolationOps {
  addViolation(value) {
    return { 
      op: "add", path: `/violations/-`, value
    }
  }
  
  addNode(vIdx, value) {
    return { 
      op: "add", 
      path: `/violations/${vIdx}/nodes/-`,
      value
    }
  }

  removeNode(vIdx, nIdx) {
    return { op: "remove", path: `/violations/${vIdx}/nodes/${nIdx}` }
  }
}

export default new ViolationOps()