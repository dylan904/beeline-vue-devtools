import { v4 as uuidv4 } from 'uuid'

export default async function queryViolations(urlKey) {
  const container = this.getContainer()
  const { resources: items } = await container.items
    .query(`SELECT c.id, c.violations FROM c WHERE c.urlKey = "${urlKey}"`)
    .fetchAll();

  if (items.length) {
    const item = items[0]
    return { violations: item.violations, id: item.id }
  }
  else {  // page doesn't exist
    const id = uuidv4()
    const { resource: createdItem } = await container.items.create({ 
      id, urlKey, violations: []
    });
    
    return { violations: [], id }
  }
}