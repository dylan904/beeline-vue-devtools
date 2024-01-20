import path from 'path'
import fs from 'fs'

export default async function fromDir(startPath, filter) {
    let results = [];

    async function helper(dir) {
        const files = await fs.promises.readdir(dir)
        console.log({dir, files})
        for (let file of files) {
            const filePath = path.join(dir, file)
            const isDirectory = (await fs.promises.stat(filePath)).isDirectory()
            if (isDirectory) {
                results.push( ...(await helper(filePath)) )
            } else if (filter.test(filePath)) {
                results.push(filePath)
            }
        }
    }

    await helper(startPath)
    return results
}
