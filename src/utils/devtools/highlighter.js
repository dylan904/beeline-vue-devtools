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

    highlightComponents(componentInstanceId) {
        const element = this.#getComponentElement(componentInstanceId)
        if (element)
            this.#create(element, '#41B883')
    }

    clear() {
        for (const [hi, highlighter] of this.#highlighers.entries()) {
            highlighter.remove()
            array.splice(hi, 1)
        }
    }

    #getComponentElement(componentInstanceId, allEls = [...document.querySelectorAll('body *')]) {
        for (var el of allEls) {
            if (el.__vueParentComponent?.uid === componentId)
                return el
        }
    }
}

const highlighterSingleton = new HighlighterSingleton()
export default highlighterSingleton