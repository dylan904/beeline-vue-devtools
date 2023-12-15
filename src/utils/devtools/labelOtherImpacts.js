import { impactTextMap, impactBGMap } from './colorMaps'

export default function labelOtherImpacts(impactArray, isAgg) {
    for (const item of impactArray) {
        const impactCounts = {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0
        }

        const violations = isAgg ? item.children.find(child => child.label === 'Aggregate').children : item.children
        for (const violation of violations) {
            const impact = violation.tags.find(tag => tag.impact).impact
            impactCounts[impact] += violation.occurences
        }

        for (const [label, count] of Object.entries(impactCounts)) {
            if (count) {
                item.tags.push({
                    label: label + ' (x' + count + ')',
                    textColor: impactTextMap[label],
                    backgroundColor: impactBGMap[label],
                })
            }
        }
    }
}