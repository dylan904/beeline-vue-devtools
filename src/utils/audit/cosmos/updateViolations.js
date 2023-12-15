export default async function updateViolations(id, ops) {
    const container = this.getContainer()
    const item = container.item(id)
    const { resource } = await item.patch(ops)
  
    return resource
  }