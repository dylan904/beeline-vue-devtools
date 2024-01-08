export default async function updateViolations(id, ops, modified=false) {
  const container = this.getContainer(modified)
  console.log('updateViolations', {modified, id, ops, container})
  const item = container.item(id)
  console.log('updateVItem', item)
  const { resource } = await item.patch(ops)
  console.log('updateVdone', resource)

  return resource
}
