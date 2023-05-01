const HttpModel = require('./http.model')
const WebsocketController = require('../websocket/websocket.controller')

class HttpController {

    initialize() {
        const http = new HttpModel();
        http.init()

        const websocket = new WebsocketController(http.http_server);
        websocket.initialize()

        //http.start()

        console.info(`.  OK! O controlador de rotas foi carregado com êxito.       .`)
    }
}

module.exports = new HttpController()