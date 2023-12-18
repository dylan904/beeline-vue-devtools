export default class ViolationTally {
    #componentInstances
    #violations
    #api
    
    async init(componentInstances, violations, api) {
        this.#componentInstances = componentInstances
        this.#violations = violations
        this.#api = api
        this.tally = {
            instances: this.#getAllInstanceViolations(),
            components: await this.#getAllComponentViolations()
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

    async getComponentNameById(id) {
        const instance = this.#componentInstances.find(i => i.uid === id)
        return await this.#api.getComponentName(instance)
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

    async #getAllComponentViolations() {
        const componentViolations = {}
        for (const instance of this.#componentInstances) {
            const componentName = await this.#api.getComponentName(instance)
            const matchingVs = {
                totals: { minor: 0, moderate: 0, serious: 0, critical: 0 },
                violations: {}
            }

            for (const violation of this.#violations) {
                const violationMatches = violation.nodes.filter(async n => {
                    return await this.getComponentNameById(n.componentInstanceId) === componentName
                })
                this.#incrementIfMatched(violation, violationMatches.length, matchingVs)
            }
            componentViolations[componentName] = matchingVs
        }
        return componentViolations
    }
}
