import vOps from "./violationOps.js"

export default async function syncViolation(srcV, srcVIdx, destViolations, isPending, opsObj, updateNodeCheck) {
    if (!srcV.nodes.length)
        return
  
    const type = isPending ? 'pending' : 'current'
    const ops = opsObj[type]
    const destV = destViolations.find(v => v.id === srcV.id)
  
    if (destV) {
        const isCurrent = !isPending
        const nodes = isPending ? srcV.nodes.filter(filterOutRoot) : srcV.nodes
        const targetNodes = Array.from(nodes).reverse()
        const nodeCount = srcV.nodes.length
  
        for (const [nIdx, node] of targetNodes.entries()) {
            const component = node.component || {}

            if (component.file && component.commitHash) {
                const shouldUpdate = await updateNodeCheck(component)
                const adjustedNodeIdx = nodeCount - 1 - nIdx
                const destNode = destV.nodes.find(n => n.target[0] === node.target[0])
                
                console.log('shouldUpdate?', {hasDestNode: !!destNode, isCurrent, shouldUpdate, componentName: component.name})

                if (destNode) {
                    if ((isCurrent && shouldUpdate) || (isPending && !shouldUpdate)) {
                        vOps.removeNode(ops, srcVIdx, adjustedNodeIdx)
                    }
                }
                else if ((isCurrent && !shouldUpdate) || (isPending && shouldUpdate)) {
                    vOps.addNode(ops, srcVIdx, node)
                }
            }
        }
    }
    else {
        vOps.addViolation(ops, srcV)
    }
}
  
function filterOutRoot(node) {
    return node.component?.name !== 'ROOT'
}