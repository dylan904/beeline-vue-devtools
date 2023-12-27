import { impactTextMap, impactBGMap } from './colorMaps.js'

export default async function labelOtherImpacts(impactArray, type, vTally) {
    for (const impactItem of impactArray) {
        let impactCounts
        if (type.toLowerCase() === 'component') {
            impactCounts = await vTally.getComponentViolations(impactItem.name).totals
        }
        else if (type.toLowerCase() === 'instance')
            impactCounts = await vTally.getInstanceViolations(impactItem.instanceId).totals
        else 
            throw('type incorrect parameter: "' + type + '" in labelOtherImpacts()')

        for (const [label, count] of Object.entries(impactCounts)) {
            if (count) {
                impactItem.tags.push({
                    label: label + ' (x' + count + ')',
                    textColor: impactTextMap[label],
                    backgroundColor: impactBGMap[label],
                })
            }
        }
    }
}