export default function getViolatingComponents(id, violators, componentInstances) {
    for (const violator of violators) {
        if (violator.id === id) {
            return violator.children.map(child => componentInstances.find(instance => instance.uid === child.uid))
        }
    }
}