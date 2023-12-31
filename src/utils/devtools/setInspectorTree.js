import labelOtherImpacts from './labelOtherImpacts.js'
import ViolationTally from './violationTally.js'
import sortViolators from './sortViolators.js'
import generatePayloadFromViolation from './generatePayloadFromViolation.js'

let lastViolations
let lastRootNodes

export default async function setInspectorTree(payload, api, violatorsRef, violations, relevantComponentInstances) {
    if (!violations || !relevantComponentInstances) {
        console.error('Missing context...', violations, relevantComponentInstances)
        return
    } else if (violations === lastViolations) {
        payload.rootNodes = lastRootNodes
        console.log('findme: blocked')
        return
    }

    lastViolations = violations
    violatorsRef.value = []
    const violators = violatorsRef.value
    const violatorNodes = []

    for (const violation of violations) {
        for (const node of violation.nodes) {
            await generatePayloadFromViolation(violation, node, violatorNodes, api)
        }
    }

    const vTally = new ViolationTally()
    await vTally.init(relevantComponentInstances, violations, api)
    labelOtherImpacts(violatorNodes, 'component', vTally)

    for (const violatorNode of violatorNodes) {
        const instances = violatorNode.children.find(c => c.label === 'Instances').children
        
        if (!violators.find(v => v.id === violatorNode.id)) {
            const componentName = await vTally.getComponentNameById(instances[0].instanceId)
            violators.push({
                id: violatorNode.id,
                instanceIds: instances.map(i => i.instanceId),
                name: componentName,
                violations: vTally.getComponentViolations(componentName).violations,
                instances: instances.map(i => ({ id: i.instanceId, selector: i.selector, violations: vTally.getInstanceViolations(i.instanceId) }))
            })
        }
        labelOtherImpacts(instances, 'instance', vTally)
    }

    payload.rootNodes = sortViolators(violatorNodes)
    lastRootNodes = payload.rootNodes
}
