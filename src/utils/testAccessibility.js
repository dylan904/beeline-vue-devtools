function getClosestComponent(vEl) {
    if (vEl.__vueParentComponent) {
      if (vEl.__vnode.dirs?.length) {
        try {
          return vEl.__vnode.dirs[0].instance.$el.__vueParentComponent || vEl.__vueParentComponent
        } catch (err) {
          console.log('cant apply instance to dir', err)
          return vEl.__vueParentComponent
        }
      } else {
        console.log('revert')
        return vEl.__vueParentComponent
      }
    } else {
      console.log('default')
      return { uid: -1, type: { name: 'ROOT' } }
    }
  }
  
  function closestAncestor(el, candidateParents) {
    while (el) {
      for (const candidate of candidateParents) {
        if (candidate === el) {
          return el
        }
      }
      el = el.parentElement
    }
    return null
  }

export default function testAccessibility() {
    console.log('test')
    const script = document.createElement("script");
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js';
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return new Promise((resolve, reject) => {
        console.log('waitforscript', script)
        script.onload = async () => {
        console.log('try4?')
        const result = await axe.run()

        const int = setInterval(() => {
            const componentEls = compEls.value;
            console.log('check', !!componentEls)
            if (componentEls) {
            clearInterval(int)

            for (const violation of result.violations) {
                for (const node of violation.nodes) {
                    const vEl = document.body.querySelector(node.target[0])
                    //console.log('try closest', node.target, vEl, componentEls)
                    const closestComponent = closestAncestor(vEl, componentEls)
                    const otherClosestComponent = getClosestComponent(vEl);
                    console.log({ closestComponent, otherClosestComponent })
                    if (!closestComponent)
                        console.log('failtofind', vEl, violation)
                    //else if (closestComponent !== otherClosestComponent)
                    //    console.error('not matching closest component', vEl.__vueParentComponent, closestComponent)
                    else
                        console.log('closest', vEl, closestComponent, violation)
                    }
                }
            }
        }, 50);

        window.violations = result.violations
        console.log(result.violations)
        //console.log('violations', result.violations[0].nodes[6].target[0])
        
        resolve({ result, componentEls: compEls.value })
        }
        
    })
}
