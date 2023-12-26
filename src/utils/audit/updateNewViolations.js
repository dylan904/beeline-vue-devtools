import appendViolations from './appendViolations'

export default async function updateNewViolations(cosmosSingleton, violations, urlKey, modified=false) {
    const qResult = await cosmosSingleton.queryViolations(urlKey, modified)[0]
    const recordedViolations = qResult.violations || []
    const { altered, ops } = appendViolations(recordedViolations, violations, qResult.id, modified)

    if (recordedViolations.length) {
        if (altered) 
            cosmosSingleton.updateViolations(qResult.id, ops, modified)
    }
    else {
        const { container, modifiedContainer } = cosmosSingleton.getContainers()
        const dbContainer = modified ? modifiedContainer : container
        const item = dbContainer.item(qResult.id)
        const { resource } = await item.patch([{ 
            "op": "set", 
            "path": "/violations", 
            "value": violations
        }])
    }
}