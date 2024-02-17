import { ref, watch } from 'vue'
import devtools from '@vue/devtools'
import { setupDevtoolsPlugin } from '@vue/devtools-api'
import auditA11y from './utils/audit/auditA11y.js'
import getInspectorActions from './utils/devtools/getInspectorActions.js'
import getInspectorNodeActions from './utils/devtools/getInspectorNodeActions.js'
import createAxeScript from './utils/audit/createAxeScript.js'
import setInspectorState from './utils/devtools/setInspectorState.js'
import setInspectorTree from './utils/devtools/setInspectorTree.js'

if (import.meta.hot) {
    import.meta.hot.on('revisions-update', revisions => {
        process.env.revisions = revisions
    })
}

const compEls = ref({ value: [] })
const violationsRef = ref([])
const inspectorId = 'bln-a11y'
let devtoolsAPI
const violatorsRef = ref([])
let init = false

export async function prepareA11YAudit(router) {
    if (process.env.AUDITA11Y)
        devtools.connect()

    const script = createAxeScript()
    script.onload = async () => {
        init = true
        watch(compEls, async els => {
            await auditA11y(els, router, violationsRef.value)
            console.log()
            if (devtoolsAPI)
                devtoolsAPI.sendInspectorTree(inspectorId)
        })
    
        watch(() => router.currentRoute.value,
            async newRoute => {
                violationsRef.value = []
                await auditA11y(compEls.value, router, violationsRef.value)
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
            const relevantComponentInstances = componentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1)
            console.log({componentInstances, relevantComponentInstances})
            compEls.value = relevantComponentInstances.map(instance => instance.subTree.el)

            setTimeout(async () => {
                const newComponentInstances = await api.getComponentInstances(app)
                console.log('try again1', newComponentInstances)
                const newRelevantComponentInstances = newComponentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1)
                console.log('try again2', {newComponentInstances, newRelevantComponentInstances})
            }, 3000)

            api.on.getInspectorTree(async payload => {
                if (payload.inspectorId === inspectorId && init) {
                    await setInspectorTree(payload, api, violatorsRef, violationsRef.value, relevantComponentInstances)
                }
            })

            api.on.getInspectorState(async payload => {
                if (payload.inspectorId === inspectorId) {
                    await setInspectorState(payload, api, violatorsRef.value, violationsRef.value, componentInstances)
                }
            })

            api.addInspector({
                id: inspectorId,
                label: 'Accessibility inspector',
                icon: 'tab_unselected',
                treeFilterPlaceholder: 'Search for test...',
                noSelectionText: 'Select a node to view details',
                actions: getInspectorActions(),
                nodeActions: getInspectorNodeActions(api, inspectorId, componentInstances)
            })
        })
    }
}
