export default function getApplicableFixes(violation) {
    const node = violation.nodes[0]
    const fixTypes = ['all', 'any', 'none']
    const applicableFixTypes = fixTypes.filter(t => node[t].length)
    return applicableFixTypes.length ? { 
        'Accessibility Fixes': applicableFixTypes.map(type => ({
            key: type,
            value: node[type]
        })) 
    } : {}
}
