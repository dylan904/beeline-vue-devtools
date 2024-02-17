import getClosestComponentInstance from './getClosestComponentInstance.js'
import tallyInstanceOccurence from './tallyInstanceOccurance.js'
import { impactTextMap, impactBGMap } from './colorMaps.js'

export default async function generatePayloadFromViolation(violation, node, violatorNodes, api) {
    const closestComponentInstance = getClosestComponentInstance(node.target[0])
    const componentName = await api.getComponentName(closestComponentInstance)
    const uid = closestComponentInstance.uid
    node.componentInstanceId = uid
    const random = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)

    const uniqueViolation = {
        id: uid + '-' + random + '-' + violation.id,
        uid: uid,
        vid: violation.id,
        selector: node.target[0],
        label: violation.id,
        occurences: 1,
        tags: [
            {
                impact: violation.impact,
                label: violation.impact,
                textColor: impactTextMap[violation.impact],
                backgroundColor: impactBGMap[violation.impact],
            },
        ],
    }

    const violatorNode = violatorNodes.find(violator => violator.name === componentName)
    const instanceId = 'instance-' + random + '-' + uid
    const instanceViolation = {
        selector: node.target[0],
        id: instanceId,
        instanceId: uid,
        tags: [],
        children: [
            uniqueViolation
        ],
    }

    if (!violatorNode) {
        if (!componentName) {
            console.error('noname?', closestComponentInstance)
        }
        instanceViolation.label = 'Instance #1'
        violatorNodes.push({
            id: uid,
            name: componentName,
            label: '<' + componentName + '>',
            color: 0xFF0000,
            textColor: 0x00FF00,
            tags: [],
            children: [
                {
                    uid: uid + '-agg',
                    label: 'Aggregate',
                    children: [JSON.parse(JSON.stringify(uniqueViolation))]
                },
                {
                    uid: uid + '-instances',
                    label: 'Instances',
                    children: [instanceViolation]
                }
            ]
        })
    } else {
        const instanceViolations = violatorNode.children.find(v => v.label === 'Instances').children
        const aggViolations = violatorNode.children.find(v => v.label === 'Aggregate').children
        let existingInstanceViolation = instanceViolations.find(v => Number(v.id.split('-')[2]) === uid)   
        
        console.log('itest', existingInstanceViolation, violation.id, instanceViolation)

        if (existingInstanceViolation) {
            const existingUniqueViolation = existingInstanceViolation.children.find(child => child.label === violation.id)
            if (existingUniqueViolation)
                tallyInstanceOccurence(existingUniqueViolation)
        } else {
            instanceViolations.push(instanceViolation)
            existingInstanceViolation = instanceViolation
        }

        const existingAggViolation = aggViolations.find(v => v.label === violation.id)
        if (existingAggViolation) {
            tallyInstanceOccurence(existingAggViolation, true)
        }
        else {
            const uniqueViolationCopy = JSON.parse(JSON.stringify(uniqueViolation))
            uniqueViolationCopy.id = uid + '-' + random + '-' + violation.id + '-agg'    // needs unique id
            uniqueViolationCopy.occurences = 1
            aggViolations.push(uniqueViolationCopy)
        }
        instanceViolation.label = 'Instance #' + instanceViolations.length
    }
}
