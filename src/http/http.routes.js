const { Router } = require("express")

class HttpRoutes {

    constructor() {
        this.router = Router()
    }

    init() {
        /* setup das rotas */
        this.router.get('teste', (req, res) => res.text('testado com sucesso'))

        return this
    }

    get() {
        return this.router
    }
}

module.exports = HttpRoutes;