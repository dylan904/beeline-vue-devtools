export default function getComponentFiles() {
    const componentFiles = []
    fromDir('./src', /\.vue$/, function(info) {
        componentFiles.push(info)
    })
    return componentFiles
}