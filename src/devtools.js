import { ref, watch } from 'vue'
import devtools from '@vue/devtools'
import { setupDevtoolsPlugin } from '@vue/devtools-api'
import auditA11y from './utils/audit/auditA11y.js'
import getInspectorActions from './utils/devtools/getInspectorActions.js'
import getInspectorNodeActions from './utils/devtools/getInspectorNodeActions.js'
import createAxeScript from './utils/audit/createAxeScript.js'
import setInspectorState from './utils/devtools/setInspectorState.js'
import setInspectorTree from './utils/devtools/setInspectorTree.js'
import auditColors from './utils/audit/auditColors.js'

if (import.meta.hot) {
    import.meta.hot.on('revisions-update', revisions => {
        process.env.revisions = revisions
    })
}

const compEls = ref({ value: [] })
const violationsRef = ref([])
const a11yInspectorId = 'bln-a11y'
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
                devtoolsAPI.sendInspectorTree(a11yInspectorId)
        })
    
        watch(() => router.currentRoute.value,
            async newRoute => {
                violationsRef.value = []
                await auditA11y(compEls.value, router, violationsRef.value)
                if (devtoolsAPI)
                    devtoolsAPI.sendInspectorTree(a11yInspectorId)
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

            const checkInterval = setInterval(async () => {
                const componentInstances = await api.getComponentInstances(app);
                
                if (componentInstances.length > 1) {  // Check if more than one componentInstance is found
                    const relevantComponentInstances = componentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1);
                    console.log('tada', {componentInstances, relevantComponentInstances});
                    compEls.value = relevantComponentInstances.map(instance => instance.subTree.el);
                    clearInterval(checkInterval);  // Clear interval once we have our component instances

                    api.on.getInspectorTree(async payload => {
                        if (payload.inspectorId === a11yInspectorId && init) {
                            await setInspectorTree(payload, api, violatorsRef, violationsRef.value, relevantComponentInstances);
                        }
                    });

                    api.on.getInspectorState(async payload => {
                        console.log('getInspectorState', payload);
                        if (payload.inspectorId === a11yInspectorId) {
                            await setInspectorState(payload, api, violatorsRef.value, violationsRef.value, componentInstances);
                        }
                    });

                    api.addInspector({
                        id: a11yInspectorId,
                        label: 'Accessibility inspector',
                        icon: 'tab_unselected',
                        treeFilterPlaceholder: 'Search for test...',
                        noSelectionText: 'Select a node to view details',
                        actions: getInspectorActions(),
                        nodeActions: getInspectorNodeActions(api, a11yInspectorId, componentInstances)
                    });
                }
            }, 250);  // Check every 250ms

            api.on.visitComponentTree((payload) => {
                const node = payload.treeNode;
                const componentInstance = payload.componentInstance;
                
                // Assuming you have a way to get the root element of the component
                const rootElement = node.componentInstance?.$el;
                console.log('visitComponentTree', {node, componentInstance, rootElement});
          
                if (rootElement) {
                  const mismatches = auditColors(rootElement);
                  if (mismatches && mismatches.length > 0) {
                    node.tags.push({
                      label: `Color Mismatches (x${mismatches.length})`,
                      textColor: 0xFFFFFF,
                      backgroundColor: 0xFF0000,
                      tooltip: 'This component has color properties outside of the design system.',
                    });
                  }
                }
              });

              api.on.inspectComponent(({ componentInstance, instanceData }) => {
                const rootElement = componentInstance.$el;
                console.log('inspectComponent', {componentInstance, instanceData, rootElement});
                if (instanceData && rootElement) {
                    const mismatches = auditColors(rootElement);
                    if (mismatches && mismatches.length > 0) {
                        instanceData.state.push({
                            type: stateType,
                            key: 'colorMismatches',
                            value: mismatches
                        })
                    }
                }
            })
        })
    }
}
