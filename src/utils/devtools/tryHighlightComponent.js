export default function tryHighlightComponent(highlighterSingleton, componentInstance, api) {
    try {
        //api.highlightElement(componentInstance)
        highlighterSingleton.highlightComponent(componentInstance.uid)
    } catch(e) {
        console.error('cant highlight, no instance', componentInstance, e)
    }
}