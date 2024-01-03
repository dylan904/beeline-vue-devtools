import { isChrome } from './utils/env.js'
import { getBridge } from './features/bridge.js'

export default function inspectDOM(id) {
    if (!id) return
    
    if (isChrome)
        getBridge().send(BridgeEvents.TO_BACK_COMPONENT_INSPECT_DOM, { instanceId: id })
    else
        window.alert('DOM inspection is not supported in this shell.')
}
