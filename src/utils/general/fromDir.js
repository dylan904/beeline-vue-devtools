import path from 'path'
import fs from 'fs'

export default async function fromDir(startPath, filterRegex) {
    const results = []

    async function helper(dir) {
        const files = await fs.promises.readdir(dir)
        for (let file of files) {
            const filePath = path.join(dir, file)
            const isDirectory = (await fs.promises.stat(filePath)).isDirectory()
            if (isDirectory) {
                await helper(filePath)
            } else if (filterRegex.test(filePath)) {
                results.push(filePath)
            }
        }
    }

    try {
        await helper(startPath)
    } catch(err) {
        console.log('fromDir() error: ', err)
    }
    
    return results
}
