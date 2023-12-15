import { ref, watch } from 'vue'
import devtools from '@vue/devtools'
import { setupDevtoolsPlugin } from '@vue/devtools-api'
import auditA11Y from './utils/audit'
import getInspectorActions from './utils/devtools/getInspectorActions'
import getInspectorNodeActions from './utils/devtools/getInspectorNodeActions'
import setInspectorState from './utils/devtools/setInspectorState'
import setInspectorTree from './utils/devtools/setInspectorTree'
import createAxeScript from './utils/audit/createAxeScript'

if (import.meta.hot) {
    import.meta.hot.on('revisions-update', revisions => {
        console.log('revisions-update', JSON.parse(JSON.stringify(process.env.revisions)), revisions)
        process.env.revisions = revisions
    })
}

const compEls = ref({ value: [] })
const violationsRef = ref([])
const inspectorId = 'bln-a11y'
let devtoolsAPI

export async function prepareA11YAudit(router) {
    if (process.env.AUDITA11Y)
        devtools.connect()

    const script = createAxeScript()
    script.onload = async () => {
        watch(compEls, async els => {
            await auditA11Y(els, router, violationsRef.value)
            console.log('try send mytree', violationsRef.value, devtoolsAPI)
            if (devtoolsAPI)
                devtoolsAPI.sendInspectorTree(inspectorId)
        })
    
        watch(() => router.currentRoute.value,
            async newRoute => {
                violationsRef.value = []
                await auditA11Y(compEls.value, router, violationsRef.value)
                console.log('try send mytree', violationsRef.value, devtoolsAPI)
                if (devtoolsAPI)
                    devtoolsAPI.sendInspectorTree(inspectorId)
            }
        )
    }
}

export const DevtoolsPlugin = {
    install: (app, opts) => {
        setupDevtoolsPlugin({
            id: 'beeline-a11y-plugin',
            label: 'Beeline A11y',
            app,
        }, async (api) => {
            devtoolsAPI = api
            const violators = []
            const componentInstances = await api.getComponentInstances(app)
            const relevantComponentInstances = componentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1)
            compEls.value = relevantComponentInstances.map(instance => instance.subTree.el)

            api.on.getInspectorTree(async payload => {
                if (payload.inspectorId === inspectorId) {
                    violators.length = 0  // reset, empty array
                    console.log('set mytree', JSON.parse(JSON.stringify(payload.rootNodes)), JSON.parse(JSON.stringify(violators)), JSON.parse(JSON.stringify(violationsRef.value)))
                    await setInspectorTree(payload, api, violators, violationsRef.value)
                    console.log('mytree was set', SON.parse(JSON.stringify(payload.rootNodes)), SON.parse(JSON.stringify(violators)), SON.parse(JSON.stringify(violationsRef.value)))
                }
            })

            api.on.getInspectorState(async payload => {
                if (payload.inspectorId === inspectorId) {
                    await setInspectorState(payload, api, violators, violationsRef.value, componentInstances)
                }
            })

            api.addInspector({
                id: inspectorId,
                label: 'Accessibility inspector',
                icon: 'tab_unselected',
                treeFilterPlaceholder: 'Search for test...',
                noSelectionText: 'Select a node to view details',
                actions: getInspectorActions(),
                nodeActions: getInspectorNodeActions(inspectorId, componentInstances)
            })
        })
    }
}