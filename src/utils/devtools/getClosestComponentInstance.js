export default function(selector) {
    const el = document.querySelector(selector)
    if (!el)
        throw new Error('no element found for: ' + selector)

    if (el.__vueParentComponent) {
        if (el.__vnode.dirs?.length) {
            try {
                return el.__vnode.dirs[0].instance.$el.__vueParentComponent || el.__vueParentComponent
            } catch (err) {
                console.log('cant apply instance to dir', err)
                return el.__vueParentComponent
            }
        } else {
            return el.__vueParentComponent
        }
    } else {
        return { uid: -1, type: { name: 'ROOT' } }
    }
}