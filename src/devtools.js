/* eslint-disable @typescript-eslint/no-var-requires */

import { setupDevtoolsPlugin } from '@vue/devtools-api'
import { ref, useSlots } from 'vue'
//import { SharedData, isChrome, BridgeEvents } from '@vue-devtools/shared-utils'
import { isChrome } from './utils/env'
import { BridgeEvents } from './utils/consts'
import { getBridge, useBridge } from './features/bridge'

export { auditAccessibility } from './utils/auditAccessibility'

function inspectDOM (id) {
  if (!id) return
  if (isChrome) {
    getBridge().send(BridgeEvents.TO_BACK_COMPONENT_INSPECT_DOM, { instanceId: id })
  } else {
    window.alert('DOM inspection is not supported in this shell.')
  }
}

function getVNodes (el, output = {}) {
  for (const child of el.children) {
    const vNode = child.__vnode
    const type = vNode.type
    if (!output.hasOwnProperty(type)) {
      output[type] = []
    }
    output[type].push(vNode)
    getVNodes(child, output)
  }
  return output
}

function getViolatingComponents (id, violators, componentInstances) {
  const components = []
  for (const violator of violators) {
    if (violator.id === id) {
      return violator.children.map(child => componentInstances.find(instance => instance.uid === child.uid))
    }
  }
}

const violationSortScoreScale = {
  minor: 1,
  moderate: 100,
  serious: 10000,
  critical: 1000000,
}

function getViolationSortScore (accumulator, item) {
  console.log('scoreme1?', item)
  return accumulator + item.children.reduce(getViolationSortScoreDeep, 0)
}

function getViolationSortScoreDeep (accumulator, item) {
  console.log('scoreme2?', item)
  const impact = item.tags[0].label
  return accumulator + violationSortScoreScale[impact]
}

function getViolation (id, violators) {
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

async function openInEditor (file) {
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

  console.log('three...')

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

export const compEls = ref({ value: [] })

function getClosestComponentInstance (vEl) {
  if (vEl.__vueParentComponent) {
    if (vEl.__vnode.dirs?.length) {
      try {
        return vEl.__vnode.dirs[0].instance.$el.__vueParentComponent || vEl.__vueParentComponent
      } catch (err) {
        console.log('cant apply instance to dir', err)
        return vEl.__vueParentComponent
      }
    } else {
      console.log('revert')
      return vEl.__vueParentComponent
    }
  } else {
    console.log('default')
    return { uid: -1, type: { name: 'ROOT' } }
  }
}

function closestAncestor (el, candidateComponents) {
  while (el) {
    for (const candidate of candidateComponents) {
      if (candidate.subTree.el === el) {
        return candidate
      }
    }
    el = el.parentElement
  }
  return null
}

export const DevtoolsPlugin = {
  install: (app) => {
    app.provide('componentEls', compEls)
    setupDevtoolsPlugin({
      id: 'simple-plugin',
      label: 'Simple devtools plugin',
      app,
    }, async (api) => {
      console.log('settings', api.getSettings())

      const componentInstances = await api.getComponentInstances(app)
      window.componentInstances = componentInstances
      console.log('instances', componentInstances);
      let violators = []
      let pending = true
      const relevantComponentInstances = componentInstances.filter(instance => instance.type.__file && instance.subTree.el.nodeType === 1)

      console.log('wintest', window);

      compEls.value = relevantComponentInstances.map(instance => instance.subTree.el)

      console.log('set componentEls', compEls)

      api.on.getInspectorTree(async payload => {
        if (payload.inspectorId === 'test-inspector') {
          const doc = window.document
          violators = []
          const impactBGMap = {
            critical: 0xfc1c03,
            serious: 0xff6a0d,
            moderate: 0xfcf403,
            minor: 0xc9c8c7,
          }
          const impactTextMap = {
            critical: 0xFFFFFF,
            serious: 0xFFFFFF,
            moderate: 0x000000,
            minor: 0x000000,
          }

          if (!relevantComponentInstances) {
            console.error('No component Els...')
            return
          }
          if (!window.violations) {
            console.error('No violations...')
            return
          }

          window.console.log('testme', window.violations)

          for (const violation of window.violations) {
            for (const node of violation.nodes) {
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
                tags: [
                  {
                    label: violation.impact,
                    textColor: impactTextMap[violation.impact],
                    backgroundColor: impactBGMap[violation.impact],
                  },
                ],
              }

              console.log('testthis', componentName, closestComponentInstance, node.html, vEl, violation)

              const violator = violators.find(violator => violator.name === componentName)
              const instanceId = 'instance-' + random + '-' + uid
              const instanceViolation = {
                id: instanceId,
                children: [
                  uniqueViolation,
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
                  children: [
                    instanceViolation,
                  ],
                })
              } else {
                // violator.children.push(uniqueViolation)

                const existingInstanceViolation = violator.children.find(v => Number(v.id.split('-')[2]) === uid)
                if (existingInstanceViolation) {
                  existingInstanceViolation.children.push(uniqueViolation)
                } else {
                  violator.children.push(instanceViolation)
                }
                instanceViolation.label = 'Instance #' + violator.children.length
              }
            }
          }

          console.log('checkviolators', violators)

          console.log('sorteddd', violators.sort((a, b) => {
            const aScore = a.children.reduce(getViolationSortScore, 0)
            a.score = aScore
            const bScore = b.children.reduce(getViolationSortScore, 0)
            b.score = bScore
            console.log('sortscore', aScore, bScore, a, b)
            return bScore - aScore
          }))

          payload.rootNodes = violators
          pending = false;
        }
      })

      api.on.getInspectorState(payload => {
        if (payload.inspectorId === 'test-inspector') {
          console.log('nodeid', {pending}, payload.nodeId, violators)
          if (typeof payload.nodeId === 'string') {
            let nodeId
            if (payload.nodeId.includes('instance')) {
              nodeId = payload.nodeId.split('-')[2]
              console.log('test')
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
                })),
              }
            }

            const instance = componentInstances.find(instance => instance.uid.toString() === nodeId)
            if (instance) {
              console.log('highlight', instance)
              api.highlightElement(instance)
            } else {
              console.log('cant highlight', nodeId)
            }
          } else {
            const violatingInstances = getViolatingComponents(payload.nodeId, violators, componentInstances)
            console.log(payload, violatingInstances)

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
              console.log('Node action scroll', id, uid)

              const { bridge } = useBridge()
              console.log('bridgeis', bridge)
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
              console.log('Node action inspect', id, uid)
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
                console.log('open instance', uid, componentFile, componentInstance, relevantComponentInstances, componentInstances)

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
