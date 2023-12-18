const modifier = 5 // each step of impact has x times this weight
const violationSortScoreScale = { minor: 1 }
violationSortScoreScale.moderate = violationSortScoreScale.minor * modifier
violationSortScoreScale.serious = violationSortScoreScale.moderate * modifier
violationSortScoreScale.critical = violationSortScoreScale.serious * modifier

export default function sortViolatiors(violators) {
    return violators.sort((a, b) => {
        return getSortScore(b) - getSortScore(a)
    })
}

function getSortScore(item) {
    const aggViolations = item.children.find(v => v.label === 'Aggregate').children
    return aggViolations.reduce(getViolationSortScore, 0)
}

function getViolationSortScore (accumulator, item) {
    const impact = item.tags.find(t => t.impact).impact
    return accumulator + (violationSortScoreScale[impact] * item.occurences)
}
