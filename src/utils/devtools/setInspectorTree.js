import getClosestComponentInstance from './getClosestComponentInstance'
import labelOtherImpacts from './labelOtherImpacts'
import tallyInstanceOccurence from './tallyInstanceOccurance'
import { impactTextMap, impactBGMap } from './colorMaps'
import sortViolators from './sortViolators'

export default async function setInspectorTree(payload, api, violators, violations) {
    if (!violations) {
        console.error('No violations...')
        return
    }

    for (const violation of violations) {
        for (const node of violation.nodes) {
            // const closestComponentInstance = closestAncestor(vEl, relevantComponentInstances) || { uid: -1, type: { name: 'ROOT' } }
            const closestComponentInstance = getClosestComponentInstance(node.target[0])
            const componentName = await api.getComponentName(closestComponentInstance)
            const uid = closestComponentInstance.uid
            const random = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)

            const uniqueViolation = {
                id: uid + '-' + random + '-' + violation.id,
                uid: uid,
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

            const violator = violators.find(violator => violator.name === componentName)
            const instanceId = 'instance-' + random + '-' + uid
            const instanceViolation = {
                selector: node.target[0],
                id: instanceId,
                tags: [],
                children: [
                    uniqueViolation
                ],
            }

            if (!violator) {
                if (!componentName) {
                    console.log('noname?', closestComponentInstance)
                }
                instanceViolation.label = 'Instance #1'
                violators.push({
                    id: uid,
                    name: componentName,
                    instanceIds: [uid],
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
                const instanceViolations = violator.children.find(v => v.label === 'Instances').children
                const aggViolations = violator.children.find(v => v.label === 'Aggregate').children
                const existingInstanceViolation = instanceViolations.find(v => Number(v.id.split('-')[2]) === uid)

                if (existingInstanceViolation) {
                    const existingUniqueViolation = existingInstanceViolation.children.find(child => child.label === violation.id)
                    tallyInstanceOccurence(existingUniqueViolation)
                } else {
                    instanceViolations.push(instanceViolation)
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
    }

    labelOtherImpacts(violators, true)
    for (const violator of violators) {
        labelOtherImpacts(violator.children.find(v => v.label === 'Instances').children, false)
    }

    payload.rootNodes = sortViolators(violators)
}
