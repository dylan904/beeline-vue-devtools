export default function getInspectorActions(inspectorId) {
    return [
        {
            icon: 'star',
            tooltip: 'Test custom action',
            action: () => {
                console.log('Meow! 🐱')
                api.selectInspectorNode(inspectorId, 'child')
            },
        },
    ]
}