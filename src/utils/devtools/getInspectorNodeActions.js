import { BridgeEvents } from '../consts.js'
import { useBridge } from '../../features/bridge.js'

export default function getInspectorNodeActions(inspectorId, componentInstances) {
    return [
        {
            icon: 'help',
            tooltip: 'Test custom node action',
            action: (id) => {
                console.log('Node action', id)
                api.selectInspectorNode(inspectorId, 'child')
            },
        },
        {
            icon: 'preview',
            tooltip: 'Scroll to component',
            action: (id) => {
                const uid = typeof id === 'number' ? id : Number(id.split('-')[0])
                const { bridge } = useBridge()
                bridge.send(BridgeEvents.TO_BACK_COMPONENT_SCROLL_TO, {
                    instanceId: uid,
                })
            },
        },
        {
            icon: 'code',
            tooltip: 'Inspect DOM',
            action: (id) => {
                const uid = typeof id === 'number' ? id : Number(id.split('-')[0])
                inspectDOM(uid)
            },
        },
        {
            icon: 'launch',
            tooltip: 'Edit in VS Code',
            action: (id) => {
                try {
                    const uid = typeof id === 'number' ? id : Number(id.split('-')[0])
                    const componentInstance = componentInstances.find(instance => instance.uid === uid)
                    const componentFile = componentInstance ? componentInstance.type.__file || componentInstance.parent?.type.__file : null

                    if (componentFile) {
                        openInEditor(componentFile)
                    }
                } catch (err) {
                    console.log(err)
                }
            },
        },
    ]
}
