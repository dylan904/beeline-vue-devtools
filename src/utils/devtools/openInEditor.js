export default async function openInEditor(file) {
    const fileName = file.replace(/\\/g, '\\\\')
    let src

    try {
        src = `fetch('/__open-in-editor?file=${encodeURI(file)}').then(response => {
      if (response.ok) {
        console.log('File ${fileName} opened in editor')
      } else {
        const msg = 'Opening component ${fileName} failed'
        const target = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {}
        if (target.__VUE_DEVTOOLS_TOAST__) {
          target.__VUE_DEVTOOLS_TOAST__(msg, 'error')
        } else {
          console.log('%c' + msg, 'color:red')
        }
        console.log('Check the setup of your project, see https://devtools.vuejs.org/guide/open-in-editor.html')
      }
    })`
    } catch (err) {
        console.log(err)
    }

    try {
        console.log('openineditor attempt')
        // eslint-disable-next-line no-eval
        eval(src)
    } catch (e) {
        console.log('openineditor fail')
        const err = e.constructor('Error in Evaled Script: ' + e.message)
        err.lineNumber = e.lineNumber - err.lineNumber + 3
        console.log(err)
        throw err
    }
}