export default function getViolation(id, violators) {
    for (const violator of violators) {
        for (const child of violator.children) {
            for (const uniqueChild of child.children) {
                if (uniqueChild.id === id) {
                    return violationsRef.value.find(v => v.id === uniqueChild.label)
                }
            }
        }
    }
}