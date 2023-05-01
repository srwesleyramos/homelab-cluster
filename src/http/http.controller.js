const HttpModel = require('./http.model')
const WebSocketController = require('../websocket/websocket.controller')

class HttpController {

    constructor() {
        this.http = new HttpModel()
    }

    async initialize() {
        try {
            this.http.init()
            const websocketController = new WebSocketController(this.http.http_server);
            websocketController.initialize()

            this.http.start()

            console.log(' OK! O controlador da web foi carregado com êxito.')
        } catch (err) {
            console.log(' Fatal: O controlador HTTP não obteve êxito no carregamento.')
            console.log(err)
        } 
    }

    getServer() {
        return this.http.getServer()
    }
}

module.exports = new HttpController()