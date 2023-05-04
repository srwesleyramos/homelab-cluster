class BackupThread {

    constructor(control) {
        this.control = control
    }

    setup() {
        setInterval(() => this.check(), 300000)
    }

    async check() {
        const memory = this.control.memory
        const cached = Array.from(memory.cached.values())

        for (const entity of cached.filter(e => e.isInvalid())) {
            try {
                await memory.delete(entity)
                await entity.delete()
            } catch (ignored) {
            }
        }

        cached.filter(e => !e.data).forEach(e => e.configure())
    }
}

module.exports = BackupThread