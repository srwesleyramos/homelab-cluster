class ImageThread {

    constructor(control) {
        this.control = control
    }

    setup() {
        setInterval(() => this.check(), 300000)
    }

    async check() {
        const memory = this.control.memory
        const cached = Array.from(memory.cached.values())

        for (const entity of cached) {
            try {
                const exists = await entity.exists()

                if (exists) continue

                await entity.create()
            } catch (ignored) {
            }
        }
    }
}

module.exports = ImageThread