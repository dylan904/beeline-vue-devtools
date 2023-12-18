
import { ref, watch } from 'vue'
import devtools from '@vue/devtools'
import { setupDevtoolsPlugin } from '@vue/devtools-api'
import auditA11Y from './utils/audit'
import getInspectorActions from './utils/devtools/getInspectorActions'
import getInspectorNodeActions from './utils/devtools/getInspectorNodeActions'
import createAxeScript from 'beeline-vue-devtools/src/utils/audit/createAxeScript'
import setInspectorState from './setInspectorState'
import setInspectorTree from './setInspectorTree'

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
const violatorsRef = ref([])
let init = false
window.violations = violationsRef.value

export async function prepareA11YAudit(router) {
    if (process.env.AUDITA11Y)
        devtools.connect()

    const script = createAxeScript()
    script.onload = async () => {
        init = true
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
            
            const componentInstances = await api.getComponentInstances(app)
            window.componentInstances = componentInstances
            const relevantComponentInstances = componentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1)
            compEls.value = relevantComponentInstances.map(instance => instance.subTree.el)

            api.on.getInspectorTree(async payload => {
                if (payload.inspectorId === inspectorId && init) {
                    console.log('set mytree', JSON.parse(JSON.stringify(payload.rootNodes)), JSON.parse(JSON.stringify(violatorsRef.value)), JSON.parse(JSON.stringify(violationsRef.value)))
                    await setInspectorTree(payload, api, violatorsRef, violationsRef.value, componentInstances)
                    console.log('mytree was set', JSON.parse(JSON.stringify(payload.rootNodes)), JSON.parse(JSON.stringify(violatorsRef.value)), JSON.parse(JSON.stringify(violationsRef.value)))
                }
            })

            api.on.getInspectorState(async payload => {
                if (payload.inspectorId === inspectorId) {
                    await setInspectorState(payload, api, violatorsRef.value, violationsRef.value, componentInstances, relevantComponentInstances)
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