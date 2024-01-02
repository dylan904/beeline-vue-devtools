import { v4 as uuidv4 } from 'uuid'

export default async function queryViolations(urlKey, modified=false, randomTemp) {
  let query = 'SELECT c.id, c.violations, c.urlKey FROM c'
  if (urlKey)
    query += ` WHERE c.urlKey = "${urlKey}"`

  console.log('wtf', this.container.toString().length, this.modifiedContainer.toString.length)

  const container = this.getContainer(modified)
  console.log({findit: true, modified, containers: this.getContainers()})
  const { resources: items } = await container.items
    .query(query)
    .fetchAll();

  console.log({query, items, cid: container.id, did: container.database.id, urlKey, randomTemp})

  if (items.length) {
    console.log('got items', items)
    return items.map(item => ({
      id: item.id, 
      violations: item.violations, 
      urlKey: item.urlKey
    }))
  }
  else if (urlKey) {  // page doesn't exist
    const id = uuidv4()
    const { resource: createdItem } = await container.items.create({ 
      id, urlKey, violations: []
    });
    
    return [{ id, violations: [] }]
  }
  else return []
}
