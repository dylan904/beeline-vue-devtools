export default async function updateViolations(id, ops, modified=false) {
  const container = this.getContainer(modified)
  console.log('updateViolations', {modified, id, ops, container})
  const item = container.item(id)
  console.log('updateVItem', item)

  try {
    const { resource } = await item.patch(ops)
    console.log("updateVdone: Item patched successfully:", resource)
    return resource
  } catch (error) {
    if (error.code === 404) {
      console.error("Document not found. It may have been deleted or never existed.")
    } else {
      console.error("Error patching document:", error)
    }
  }
}
