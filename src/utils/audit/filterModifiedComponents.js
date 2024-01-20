import getClosestComponentInstance from '../devtools/getClosestComponentInstance.js'

const srcPathRegex = /.*\/src\//
const extractFileRegex = /\.[^/.]+$/

export default function filterModifiedComponents(newNode) {
  let match = true
  const instance = getClosestComponentInstance(newNode.target[0])
  const componentInfo = {
    name: instance.type.name || instance.type.__name,
    props: instance.props,
    data: instance.data,
    setupState: instance.setupState
  }
  
  if (instance.type.__file) {
    const componentFile = instance.type.__file.replace(srcPathRegex, 'src/')
    componentInfo.name = componentInfo.name || new URL(componentFile, window.location.origin).pathname.split('/').pop().replace(extractFileRegex, '')
    
    const { revisions, author } = process.env
    if (revisions[componentFile]) { // if file revised, store for later and check if pushed in recent commit
      componentInfo.commitHash = revisions[componentFile]
      componentInfo.file = `authors/${author}/${componentFile}`
      match = false
    }
    else {
      componentInfo.file = componentFile
    }
  }

  newNode.component = componentInfo
  return match
}
