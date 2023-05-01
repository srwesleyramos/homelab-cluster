const express = require('express')

class HttpController {

    initialize() {
        this.app = express()
        this.app.listen(8080)

        this.app.use(express.json())
        this.app.use(express.urlencoded({extended: true}))

        this.app.use('/backup/', require('../backup/backup.router'))
        this.app.use('/image/', require('../image/image.router'))
        this.app.use('/server/', require('../server/router.server'))

        this.app.use(this.handlerErrors)

        console.info(`.  OK! O controlador de rotas foi carregado com êxito.       .`)
    }

    handlerErrors(err, req, res, next) {
        res.json({
            status: err.status ?? 500,
            message: err.reason ?? err.message
        }).status(err.status ?? 500)
    }
}

module.exports = new HttpController()