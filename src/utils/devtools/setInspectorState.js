import getViolatingComponents from './getViolatingComponents'
import getViolation from './getViolation'

export default async function setInspectorState(payload, api, violators, violations, componentInstances) {
    console.log('inspect', payload.nodeId)
    if (typeof payload.nodeId === 'string') {
        let nodeId
        if (payload.nodeId.includes('instance')) {
            nodeId = payload.nodeId.split('-')[2]

            console.log('sel', payload)
        } else {
            nodeId = payload.nodeId.split('-')[0]
            const violation = getViolation(payload.nodeId, violators)
            if (!violation) {
                console.error('no matching violation found', payload.nodeId, violators, violations.value)
                return
            }
            payload.state = {
                'Accessibility Violation Info': ['impact', 'id', 'description', 'help', 'helpUrl'].map(key => ({
                    key: key,
                    value: violation[key],
                }))
            }
        }

        const instance = componentInstances.find(instance => instance.uid.toString() === nodeId)
        if (instance) {
            api.highlightElement(instance)
        } else {
            console.log('cant highlight', nodeId)
        }
    } else {
        const violatingInstances = getViolatingComponents(payload.nodeId, violators, componentInstances)

        if (violatingInstances.length) {
            for (const violatingInstance of violatingInstances) {
                api.highlightElement(violatingInstance)
            }
        }

        // placeholder
        payload.state = {
            'child info': [
                {
                    key: 'answer',
                    value: {
                        _custom: {
                            display: '42!!!',
                            value: 42,
                            tooltip: 'The answer',
                        }
                    }
                }
            ]
        }
    }
}