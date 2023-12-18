export default class ViolationTally {
    #componentInstances
    #violations
    
    constructor(componentInstances, violations) {
        this.#componentInstances = componentInstances
        this.#violations = violations
        this.tally = {
            instances: this.#getAllInstanceViolations(),
            components: this.#getAllComponentViolations()
        }
    }

    getComponentViolations(componentName) {
        return this.tally.components[componentName]
    }

    getInstanceViolations(instanceId) {
        return this.tally.instances[instanceId]
    }

    #getAllInstanceViolations() {
        const instanceViolations = {}
        for (const instance of this.#componentInstances) {
            const iid = instance.uid
            const matchingVs = {
                totals: { minor: 0, moderate: 0, serious: 0, critical: 0 },
                violations: {}
            }

            for (const violation of this.#violations) {
                const violationMatches = violation.nodes.filter(n => n.componentInstanceId === iid)
                this.#incrementIfMatched(violation, violationMatches.length, matchingVs)
            }
            instanceViolations[iid] = matchingVs
        }
        return instanceViolations
    }

    getInstanceComponentName(componentInstance) {
        if (!componentInstance.type)
            console.log('wtf', componentInstance)

        const type = componentInstance.type
        if (!type)
            return 'ROOT'
        const nameFromNameProp = type.name || type.__name
        if (nameFromNameProp)
            return nameFromNameProp
        console.log('cfile', type.__file)
        const fileName = type.__file.split('/').slice(-1)[0]
        const dotSplit = fileName.split('.')
        dotSplit.pop()
        return dotSplit.join('.')
    }

    getComponentNameById(id) {
        const instance = this.#componentInstances.find(i => i.uid === id)
        return this.getInstanceComponentName(instance)
    }

    #incrementIfMatched(violation, matchCount, matchingVs) {
        if (matchCount) {
            if (!matchingVs.violations.hasOwnProperty(violation.id)) {
                matchingVs.violations[violation.id] = {
                    count: 0, impact: violation.impact
                }
            }
            matchingVs.violations[violation.id].count += matchCount
            matchingVs.totals[violation.impact] += matchCount
        }
    }

    #getAllComponentViolations() {
        const componentViolations = {}
        for (const instance of this.#componentInstances) {
            const componentName = this.getInstanceComponentName(instance)
            const matchingVs = {
                totals: { minor: 0, moderate: 0, serious: 0, critical: 0 },
                violations: {}
            }

            for (const violation of this.#violations) {
                const violationMatches = violation.nodes.filter(n => this.getComponentNameById(n.componentInstanceId) === componentName)
                this.#incrementIfMatched(violation, violationMatches.length, matchingVs)
            }
            componentViolations[componentName] = matchingVs
        }
        return componentViolations
    }
}