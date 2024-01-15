import getClosestComponentInstance from '../devtools/getClosestComponentInstance.js'

const srcPathRegex = /.*\/src\//

export default async function filterModifiedComponents(newNode) {
  let match = true
  const componentInstance = getClosestComponentInstance(newNode.target[0])
  const componentInfo = {
    name: componentInstance.type.name || componentInstance.type.__name,
    props: componentInstance.props,
    data: componentInstance.data,
    setupState: componentInstance.setupState
  }
  
  if (componentInstance.type.__file) {
    const componentFile = componentInstance.type.__file.replace(srcPathRegex, 'src/')
    if (!componentInfo.name) {
      const url = new URL(componentFile, window.location.origin);
      const filenameWithoutExtension = url.pathname.split('/').pop().replace(/\.[^/.]+$/, '')
      componentInfo.name = filenameWithoutExtension
    }

    console.log('checkFileRevisions1', {componentFile, check: process.env.revisions[componentFile], componentInfo})
    
    if (process.env.revisions[componentFile]) { // if file revised, store for later and check if pushed in recent commit
      componentInfo.commitHash = process.env.revisions[componentFile]
      componentInfo.file = `authors/${process.env.author}/${componentFile}`
      match = false
    }
    else {
      componentInfo.file = componentFile
    }

    console.log('checkFileRevisions2', {match, componentInfo})
  }

  newNode.component = componentInfo
  return match
}
