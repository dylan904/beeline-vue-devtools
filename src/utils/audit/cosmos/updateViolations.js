export default async function updateViolations(id, ops, modified=false) {
  const container = this.getContainer(modified)
  const item = container.item(id)
  const { resource } = await item.patch(ops)

  return resource
}
