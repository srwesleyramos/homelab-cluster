const WebsocketModel = require('./websocket.model')

class WebSocketController {
    constructor(httpServer) {
        this.httpServer = httpServer
    }

    async initialize() {
        this.socket = new WebsocketModel(this.httpServer);
        this.setupEvents()
        
        console.log(' OK! O controlador de websockets foi carregado com êxito.')
    }

    setupEvents() {
        this.socket.on('teste', () => console.log('será q funciona?'))
    }
}

module.exports = WebSocketController