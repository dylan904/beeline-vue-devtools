// get violation by matching id to the label of the matching node

export default function getViolation(id, violators, violations) {
    for (const violator of violators) {
        for (const child of violator.children) {
            for (const uniqueChild of child.children) {
                if (uniqueChild.id === id) {
                    return violations.find(v => v.id === uniqueChild.label)
                }
            }
        }
    }
}