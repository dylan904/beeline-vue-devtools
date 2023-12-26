import getClosestComponentInstance from '../devtools/getClosestComponentInstance'
import git from '../versioning/git'

const srcPathRegex = /.*\/src\//
const authorEmail = await git.getUserEmail()

export default function filterModifiedComponents(newNode) {
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
    if (process.env.revisions[componentFile]) { // if file revised, store for later and check if pushed in recent commit
      componentInfo.commitHash = process.env.revisions[componentFile]
      match = false
    }
    componentInfo.file = `authors/${authorEmail}/${componentFile}`
  }

  newNode.component = componentInfo
  return match
}
