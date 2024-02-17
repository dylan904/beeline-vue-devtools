export default class cooler {
    constructor(interval, cb) {
        if (!interval)
            throw('No cooldown interval argument provided')
        if (!cb)
            throw('No cooldown callback argument provided')

        this.interval = interval
        this.cb = cb
        this.cooling = false
        this.queued = false
    }

    #getIntervalDiff() {
        if (!this.last)
            return this.interval;
        else
            return Math.min(Date.now() - this.last, this.interval)
    }

    cooldown() {
        const interval = this.#getIntervalDiff()
        setTimeout(() => {
            this.cooling = false
            if (this.queued) {
                this.proxy()
            }
        }, interval)
    }

    proxy(...args) {
        if (args.length)
            this.args = args
        console.log('proxy mutations', this.args, this)
        if (!this.cooling) {
            this.queued = false
            this.cooling = true
            this.last = Date.now()
            this.cb(...this.args)
            this.args = []
        }
        else {
            this.queued = true
            this.cooldown()
        }
    }
}
