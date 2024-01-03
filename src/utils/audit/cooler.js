export default class cooler {
    constructor(interval, cb) {
        if (!interval)
            throw('No cooldown interval argument provided')
        if (!interval)
            throw('No cooldown callback argument provided')
        this.interval = interval
        this.cb = cb
        this.cooling = false
        this.queued = false
    }

    cooldown() {
        const interval = this.last ? Math.min(new Date().getTime() - this.last, this.interval) : this.interval;
        console.log({interval});
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
            this.last = new Date().getTime()
            this.cb(...this.args)
            this.args = []
        }
        else {
            this.queued = true
            this.cooldown()
        }
    }
}
