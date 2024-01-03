export default function(object) {
  const output = []
  const sortedKeys = Object.keys(object).sort()    // sort keys to avoid duplicate queries in a different order
  for (const key of sortedKeys) {
    if (object.hasOwnProperty(key)) {
      output.push(encodeURIComponent(key) + "=" + encodeURIComponent(object[key]));
    }
  }
  return output.join("&")
}
