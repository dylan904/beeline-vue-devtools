import fromDir from "./fromDir"

export default function getComponentFiles() {
    const componentFiles = []
    fromDir('/Users/dylanmaxey/Downloads/temp/vue-project-2/src/', /\.vue$/, function(info) {
        componentFiles.push(info)
    })
    return componentFiles
}