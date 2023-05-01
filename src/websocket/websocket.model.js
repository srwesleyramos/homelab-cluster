const { Server } = require('socket.io')

class WebSocketModel {
    constructor(http_server) {
        this.http_server = http_server
    }

    init() {
        this.io = new Server(this.http_server)

        return this
    }

    on(event, fn) {
        this.io.on(event, fn)
    }

    emit(event, data, fn = () => null) {
        this.io.emit(event, data, fn)
    }
}

module.exports = WebSocketModel;