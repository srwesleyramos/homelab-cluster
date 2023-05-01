class ServerThread {

    constructor(server) {
        this.server = server
    }

    start() {
        if (this.intervalId) return

        this.intervalId = setInterval(async () => {
            try {
                if (await this.server.isStorageLimited()) {
                    await this.server.stop()
                }
            } catch (err) {
                console.log(err)
            }
        }, 60 * 1000)
    }

    stop() {
        if (!this.intervalId) return

        clearInterval(this.intervalId)

        this.intervalId = undefined
    }
}

module.exports = ServerThread