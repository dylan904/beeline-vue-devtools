export default function joinArraysByProp(array1, array1name, array2, array2name, prop=id) {
  const propSet = new Set([...array1.map(obj => obj[prop]), ...array2.map(obj => obj[prop])])

  return Array.from(propSet).map(propValue => {
    const obj1 = array1.find(obj => obj[prop] === propValue)
    const obj2 = array2.find(obj => obj[prop] === propValue)
    const output = {}
    if (obj1)
      output[array1name] = { ...obj1 }
    if (obj2)
      output[array2name] = { ...obj2 }
    return output
  })
}
