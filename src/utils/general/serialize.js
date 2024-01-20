export default function serialize(object) {
  const output = []
  const sortedKeys = Object.keys(object).sort()    // sort keys to avoid duplicate queries in a different order
  for (const key of sortedKeys) {
    output.push(encodeURIComponent(key) + "=" + encodeURIComponent(object[key]))
  }
  return output.join("&")
}
