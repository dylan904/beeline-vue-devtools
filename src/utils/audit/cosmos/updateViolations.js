export default async function updateViolations(id, ops, modified=false) {
  const container = this.getContainer(modified)
  const item = container.item(id)
  console.log('updateViolations', {modified, id, ops, container, item})

  try {
    const batchSize = 10
    const resources = []

    for (let i=0; i<ops.length; i+=batchSize) {
      const batch = ops.slice(i, i + batchSize)
      const { resource } = await item.patch(batch)
      resources.push(resource)
    }

    console.log("updateVdone: Item patched successfully:", resources)
    return resources
  } 
  catch (error) {
    if (error.code === 404) {
      console.error("Document not found. It may have been deleted or never existed.")
    } else {
      console.error("Error patching document:", error)
    }
  }
}
