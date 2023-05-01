const { Server } = require('socket.io')

class WebSocketModel {
    constructor(httpServer) {
        this.io = new Server(httpServer)
    }

    on(event, fn) {
        this.io.on(event, fn)
    }

    emit(event, data, fn = () => null) {
        this.io.emit(event, data, fn)
    }
}

module.exports = WebSocketModel;