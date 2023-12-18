import path from 'path'
import fs from 'fs'

export default function fromDir(startPath, filter, callback) {
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath)
        return
    }

    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file)
        const stat = fs.lstatSync(filename)
        if (stat.isDirectory()) {
          fromDir(filename, filter, callback) //recurse
        } else if (filter.test(filename)) callback(filename)
    };
}