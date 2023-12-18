import highlighterSingleton from './highlighter'
import tryHighlightComponent from './tryHighlightComponent'
import getApplicableFixes from './getApplicableFixes'

export default async function setInspectorState(payload, api, violators, violations, componentInstances) {
    highlighterSingleton.clear()
    
    if (typeof payload.nodeId === 'string') {
        let nodeId
        const splitId = payload.nodeId.split('-')
        
        if (payload.nodeId.includes('instance')) {
            nodeId = splitId[2]
        } else {
            nodeId = splitId[0]
            const vId = splitId.slice(2).join('-').replace('-agg', '')
            const violation = violations.find(v => v.id === vId)

            if (!violation) {
                console.error('no matching violation found', {nodeId, 'payload.nodeId': payload.nodeId, violators, violations, componentInstances})
                return
            }

            const applicableFixes = getApplicableFixes(violation) 
            payload.state = {
                'Accessibility Violation Overview': ['impact', 'id', 'description', 'help', 'helpUrl'].map(key => ({
                    key: key,
                    value: violation[key],
                })),
                ...applicableFixes
            }
            return
        }

        const instance = componentInstances.find(instance => instance.uid.toString() === nodeId)
        if (instance) {
            tryHighlightComponent(highlighterSingleton, instance, api)
            const propsToCheck = ['props', 'setupProps', 'data'].filter(prop => instance.hasOwnProperty(prop))
            const state = {}

            for (const prop of propsToCheck) {
                const itemEntries = Object.entries(instance[prop])
                if (itemEntries.length) {
                    const displayItems = []
                    for (const [itemName, itemValue] of itemEntries) {
                        displayItems.push({ key: itemName, value: itemValue })
                    }
                    state[prop] = displayItems
                }
            }
            payload.state = state

        } else {
            console.log('cant highlight, no instance', nodeId, instance)
        }
    } else {
        const componentId = payload.nodeId
        const violatingInstances = violators.find(v => v.id === componentId).instances
        if (violatingInstances.length) {
            for (const violatingInstance of violatingInstances) {
                //api.highlightElement(violatingInstance)
                console.log('highlight', violatingInstance)
                highlighterSingleton.highlightComponent(violatingInstance.id)
            }
        }
    }
}
