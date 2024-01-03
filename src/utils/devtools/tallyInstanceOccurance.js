export default function tallyInstanceOccurence(violationNode) {
    if (violationNode) {
        ++violationNode.occurences
        const tag = violationNode.tags.find(tag => tag.impact)
        tag.label = tag.impact + ' (x' + violationNode.occurences + ')'
    }
    else {
        console.error('cant tally!')
    }
}
