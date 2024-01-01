import appendViolations from './appendViolations.js'

export default async function updateNewViolations(cosmos, violations, urlKey, modified=false) {
    const qResult = await cosmos.queryViolations(urlKey, modified)[0]
    const recordedViolations = qResult.violations || []
    const { altered, ops } = appendViolations(recordedViolations, violations, qResult.id, modified)

    if (recordedViolations.length) {
        if (altered) 
            cosmos.updateViolations(qResult.id, ops, modified)
    }
    else {
        const { container, modifiedContainer } = cosmos.getContainers()
        const dbContainer = modified ? modifiedContainer : container
        const item = dbContainer.item(qResult.id)
        const { resource } = await item.patch([{ 
            "op": "set", 
            "path": "/violations", 
            "value": violations
        }])
    }
}