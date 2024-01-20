class HighlighterSingleton {
    #highlighers = []

    #create(refEl, color) {
        const rect = refEl.getBoundingClientRect()
        const highlighter = document.createElement('div')
        highlighter.style.position = 'absolute'
        highlighter.style.top = rect.top + 'px'
        highlighter.style.left = rect.left + 'px'
        highlighter.style.width = rect.width + 'px'
        highlighter.style.height = rect.height + 'px'
        highlighter.style.background = 'blue'
        highlighter.style.opacity = '0.35'
        highlighter.style.zIndex = '99999999'
        highlighter.style.backgroundColor = color
        document.body.append(highlighter)
        this.#highlighers.push(highlighter)
    }

    highlightElement(element) {
        if (typeof element === 'string')    // selector
            element = document.querySelector(element)

        this.#create(element, '#00BFFF')
    }

    performHighlight(componentInstanceId) {
        const element = this.#getComponentElement(componentInstanceId)
        if (element)
            this.#create(element, '#41B883')
    }

    highlightComponent(componentInstance) {
        try {
            //api.highlightElement(componentInstance)
            highlighter.performHighlight(componentInstance.uid)
        } catch(err) {
            console.error('cant highlight, no instance', componentInstance, err)
        }
    }

    clear() {
        for (const highlighter of this.#highlighers) {
            highlighter.remove()
        }
        this.#highlighers = []
    }

    #getComponentElement(componentInstanceId, allEls = [...document.querySelectorAll('body *')]) {
        for (var el of allEls) {
            if (el.__vueParentComponent?.uid === componentInstanceId)
                return el
        }
    }
}

const highlighter = new HighlighterSingleton()
export default highlighter
