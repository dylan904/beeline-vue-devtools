export default function tallyInstanceOccurence(v) {
    if (v) {
        ++v.occurences
        const tag = v.tags.find(tag => tag.impact)
        tag.label = tag.impact + ' (x' + v.occurences + ')'
    }
    else {
        console.error('cant tally!')
    }
}