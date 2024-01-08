export default async function updateViolations(id, ops, modified=false) {
  const container = this.getContainer(modified)
  console.log('updateViolations', {modified, id, ops})
  const item = container.item(id)
  console.log('updateVItem', item)
  const { resource } = await item.patch(ops)

  return resource
}
