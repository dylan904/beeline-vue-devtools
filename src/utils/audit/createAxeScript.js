export default function createAxeScript() {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js'
    script.type = 'text/javascript'
    document.body.appendChild(script)
    return script
}
