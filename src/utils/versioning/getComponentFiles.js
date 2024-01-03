import fromDir from "./fromDir.js"

export default function getComponentFiles() {
    const componentFiles = []
    console.log('getComponentFiles', { root: process.env.projectRoot })
    fromDir(process.env.projectRoot + '/src/', /\.vue$/, function(info) {
        componentFiles.push(info)
    })
    return componentFiles
}