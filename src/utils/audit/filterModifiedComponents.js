import getClosestComponentInstance from '../devtools/getClosestComponentInstance'

const filePathRegex = /.*\/src\//

export default function filterModifiedComponents(newNode) {
    const componentInstance = getClosestComponentInstance(newNode.target[0])
    const componentInfo = {
      name: componentInstance.type.name || componentInstance.type.__name
    }
    
    if (componentInstance.type.__file) {
      const componentFile = componentInstance.type.__file.replace(filePathRegex, 'src/')
      if (process.env.revisions[componentFile]) // if file revised skip. TODO: store for later and check if in PR
        return false
      componentInfo.file = componentFile
    }
    componentInfo.props = componentInstance.props
    componentInfo.data = componentInstance.data
    componentInfo.setupState = componentInstance.setupState
    newNode.component = componentInfo
  
    return true
}