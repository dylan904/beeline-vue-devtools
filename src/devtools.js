/* eslint-disable @typescript-eslint/no-var-requires */

import { setupDevtoolsPlugin } from '@vue/devtools-api'
import { ref, watch } from 'vue'
import { isChrome } from './utils/env'
import { BridgeEvents } from './utils/consts'
import { getBridge, useBridge } from './features/bridge'
import { auditAccessibility } from './utils/auditAccessibility'
import devtools from '@vue/devtools'

if (import.meta.hot) {
    import.meta.hot.on('revisions-update', revisions => {
        console.log('revisions-update', JSON.parse(JSON.stringify(process.env.revisions)), revisions)
        process.env.revisions = revisions
    })
}

const compEls = ref({ value: [] })

const impactTextMap = {
    critical: 0xFFFFFF,
    serious: 0xFFFFFF,
    moderate: 0x000000,
    minor: 0x000000,
}
const impactBGMap = {
    critical: 0xfc1c03,
    serious: 0xff6a0d,
    moderate: 0xfcf403,
    minor: 0xc9c8c7,
}

export function prepareAccessibilityAudit(router) {
    if (process.env.AUDITA11Y)
        devtools.connect()

    watch(compEls, (els) => {
        auditAccessibility(els, router)
    })
}

function tallyInstanceOccurence(v, isAgg) {
    if (v) {
        ++v.occurences
        const tag = v.tags.find(tag => tag.impact)
        tag.label = tag.impact + ' (x' + v.occurences + ')'
    }
    else {
        console.error('cant tally!')
    }
}

function inspectDOM(id) {
    if (!id) return
    if (isChrome) {
        getBridge().send(BridgeEvents.TO_BACK_COMPONENT_INSPECT_DOM, { instanceId: id })
    } else {
        window.alert('DOM inspection is not supported in this shell.')
    }
}

function getViolatingComponents(id, violators, componentInstances) {
    for (const violator of violators) {
        if (violator.id === id) {
            return violator.children.map(child => componentInstances.find(instance => instance.uid === child.uid))
        }
    }
}

function getViolationSortScore(accumulator, item) {
    const modifier = 5 // each step of impact has x times this weight
    const violationSortScoreScale = { minor: 1 }
    violationSortScoreScale.moderate = violationSortScoreScale.minor * modifier
    violationSortScoreScale.serious = violationSortScoreScale.moderate * modifier
    violationSortScoreScale.critical = violationSortScoreScale.serious * modifier

    const impact = item.tags[0].label
    return accumulator + violationSortScoreScale[impact]
}

function getViolation(id, violators) {
    for (const violator of violators) {
        for (const child of violator.children) {
            for (const uniqueChild of child.children) {
                if (uniqueChild.id === id) {
                    return window.violations.find(v => v.id === uniqueChild.label)
                }
            }
        }
    }
}

async function openInEditor(file) {
    console.log('one...')
    const fileName = file.replace(/\\/g, '\\\\')
    let src

    try {
        src = `fetch('/__open-in-editor?file=${encodeURI(file)}').then(response => {
      if (response.ok) {
        console.log('File ${fileName} opened in editor')
      } else {
        const msg = 'Opening component ${fileName} failed'
        const target = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {}
        if (target.__VUE_DEVTOOLS_TOAST__) {
          target.__VUE_DEVTOOLS_TOAST__(msg, 'error')
        } else {
          console.log('%c' + msg, 'color:red')
        }
        console.log('Check the setup of your project, see https://devtools.vuejs.org/guide/open-in-editor.html')
      }
    })`
    } catch (err) {
        console.log(err)
    }

    try {
        console.log('openineditor attempt')
        // eslint-disable-next-line no-eval
        eval(src)
    } catch (e) {
        console.log('openineditor fail')
        const err = e.constructor('Error in Evaled Script: ' + e.message)
        err.lineNumber = e.lineNumber - err.lineNumber + 3
        console.log(err)
        throw err
    }
}

function getClosestComponentInstance(vEl) {
    if (vEl.__vueParentComponent) {
        if (vEl.__vnode.dirs?.length) {
            try {
                return vEl.__vnode.dirs[0].instance.$el.__vueParentComponent || vEl.__vueParentComponent
            } catch (err) {
                console.log('cant apply instance to dir', err)
                return vEl.__vueParentComponent
            }
        } else {
            return vEl.__vueParentComponent
        }
    } else {
        return { uid: -1, type: { name: 'ROOT' } }
    }
}

function labelOtherImpacts(impactArray, isAgg) {
    for (const item of impactArray) {
        const impactCounts = {
            critical: 0,
            serious: 0,
            moderate: 0,
            minor: 0
        }

        const violations = isAgg ? item.children.find(child => child.label === 'Aggregate').children : item.children
        for (const violation of violations) {
            const impact = violation.tags.find(tag => tag.impact).impact
            impactCounts[impact] += violation.occurences
        }

        for (const [label, count] of Object.entries(impactCounts)) {
            if (count) {
                item.tags.push({
                    label: label + ' (x' + count + ')',
                    textColor: impactTextMap[label],
                    backgroundColor: impactBGMap[label],
                })
            }
        }
    }
}

export const DevtoolsPlugin = {
    install: (app, opts) => {

        setupDevtoolsPlugin({
            id: 'beeline-a11y-plugin',
            label: 'Beeline A11y',
            app,
        }, async (api) => {
            console.log({api, app, opts})
            const componentInstances = await api.getComponentInstances(app)
            let violators = []
            const pending = ref({ value: true })
            let inited = false;
            const relevantComponentInstances = componentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1)
            compEls.value = relevantComponentInstances.map(instance => instance.subTree.el)

            api.on.getInspectorTree(async payload => {
                if (payload.inspectorId === 'test-inspector' && !inited) {
                    inited = true;
                    const doc = window.document
                    violators = []

                    if (!relevantComponentInstances) {
                        console.error('No component Els...')
                        return
                    }
                    if (!window.violations) {
                        console.error('No violations...')
                        return
                    }

                    for (const [vi, violation] of window.violations.entries()) {
                        for (const [ni, node] of violation.nodes.entries()) {
                            const vEl = doc.querySelector(node.target[0])
                            if (!vEl) {
                                console.log('wtf', node, violation)
                            }
                            // const closestComponentInstance = closestAncestor(vEl, relevantComponentInstances) || { uid: -1, type: { name: 'ROOT' } }
                            const closestComponentInstance = getClosestComponentInstance(vEl)
                            const componentName = await api.getComponentName(closestComponentInstance)
                            const uid = closestComponentInstance.uid
                            const random = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)

                            const uniqueViolation = {
                                id: uid + '-' + random + '-' + violation.id,
                                uid: uid,
                                label: violation.id,
                                occurences: 1,
                                tags: [
                                    {
                                        impact: violation.impact,
                                        label: violation.impact,
                                        textColor: impactTextMap[violation.impact],
                                        backgroundColor: impactBGMap[violation.impact],
                                    },
                                ],
                            }

                            const violator = violators.find(violator => violator.name === componentName)
                            const instanceId = 'instance-' + random + '-' + uid
                            const instanceViolation = {
                                selector: node.target[0],
                                id: instanceId,
                                tags: [],
                                children: [
                                    uniqueViolation
                                ],
                            }

                            if (!violator) {
                                if (!componentName) {
                                    console.log('noname?', closestComponentInstance)
                                }
                                instanceViolation.label = 'Instance #1'
                                violators.push({
                                    id: uid,
                                    name: componentName,
                                    instanceIds: [uid],
                                    label: '<' + componentName + '>',
                                    color: 0xFF0000,
                                    textColor: 0x00FF00,
                                    tags: [],
                                    children: [
                                        {
                                            uid: uid + '-agg',
                                            label: 'Aggregate',
                                            children: [JSON.parse(JSON.stringify(uniqueViolation))]
                                        },
                                        {
                                            uid: uid + '-instances',
                                            label: 'Instances',
                                            children: [instanceViolation]
                                        }
                                    ]
                                })
                            } else {
                                const instanceViolations = violator.children.find(v => v.label === 'Instances').children
                                const aggViolations = violator.children.find(v => v.label === 'Aggregate').children
                                const existingInstanceViolation = instanceViolations.find(v => Number(v.id.split('-')[2]) === uid)

                                if (existingInstanceViolation) {
                                    const existingUniqueViolation = existingInstanceViolation.children.find(child => child.label === violation.id)
                                    tallyInstanceOccurence(existingUniqueViolation)
                                } else {
                                    instanceViolations.push(instanceViolation)
                                }

                                const existingAggViolation = aggViolations.find(v => v.label === violation.id)
                                if (existingAggViolation) {
                                    tallyInstanceOccurence(existingAggViolation, true)
                                }
                                else {
                                    const uniqueViolationCopy = JSON.parse(JSON.stringify(uniqueViolation))
                                    uniqueViolationCopy.id = uid + '-' + random + '-' + violation.id + '-agg'    // needs unique id
                                    uniqueViolationCopy.occurences = 1
                                    aggViolations.push(uniqueViolationCopy)
                                }

                                instanceViolation.label = 'Instance #' + violator.children.length
                            }
                        }
                    }

                    labelOtherImpacts(violators, true)
                    for (const violator of violators) {
                        labelOtherImpacts(violator.children.find(v => v.label === 'Instances').children, false)
                    }

                    console.log('sorteddd', violators.sort((a, b) => {
                        const aAggViolations = a.children.find(v => v.label === 'Aggregate').children
                        const aScore = aAggViolations.reduce(getViolationSortScore, 0)
                        a.score = aScore
                        const bAggViolations = b.children.find(v => v.label === 'Aggregate').children
                        const bScore = bAggViolations.reduce(getViolationSortScore, 0)
                        b.score = bScore
                        console.log('sortscore', aScore, bScore, a, b)
                        return bScore - aScore
                    }))

                    payload.rootNodes = violators
                    pending.value = false;
                }
            })

            api.on.getInspectorState(payload => {
                if (payload.inspectorId === 'test-inspector') {
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
                                console.error('no matching violation found', payload.nodeId, violators, window.violations)
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

                        payload.state = {
                            'child info': [
                                {
                                    key: 'answer',
                                    value: {
                                        _custom: {
                                            display: '42!!!',
                                            value: 42,
                                            tooltip: 'The answer',
                                        },
                                    },
                                },
                            ],
                        }
                    }
                }
            })

            api.addInspector({
                id: 'test-inspector',
                label: 'Accessibility inspector',
                icon: 'tab_unselected',
                treeFilterPlaceholder: 'Search for test...',
                noSelectionText: 'Select a node to view details',
                actions: [
                    {
                        icon: 'star',
                        tooltip: 'Test custom action',
                        action: () => {
                            console.log('Meow! 🐱')
                            api.selectInspectorNode('test-inspector', 'child')
                        },
                    },
                ],
                nodeActions: [
                    {
                        icon: 'help',
                        tooltip: 'Test custom node action',
                        action: (id) => {
                            console.log('Node action', id)
                            api.selectInspectorNode('test-inspector', 'child')
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
                ],
            })
        })
    },
}
