import { v4 as uuidv4 } from 'uuid'

export default async function createItem(urlKey, modified) {
  const container = this.getContainer(modified)
  const id = uuidv4()
  console.log('createContainerItem', id)
  const { resource } = await container.items.create({ 
    id, urlKey, violations: []
  })

  return resource
}