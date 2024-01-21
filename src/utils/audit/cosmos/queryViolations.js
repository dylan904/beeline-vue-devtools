export default async function queryViolations(urlKey, modified=false) {
  let query = 'SELECT c.id, c.violations, c.urlKey FROM c'
  if (urlKey)
    query += ` WHERE c.urlKey = "${urlKey}"`


  const container = this.getContainer(modified)
  const { resources: items } = await container.items
    .query(query)
    .fetchAll();

  if (items.length) {
    console.log('got items', items)
    return items.map(item => ({
      id: item.id, 
      violations: item.violations, 
      urlKey: item.urlKey
    }))
  }
  else if (urlKey) {  // page doesn't exist
    const { id } = await this.createItem(urlKey, modified)

    return [{ id, violations: [] }]
  }
  else return []
}
