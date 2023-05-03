const express = require('express')
const http = require('http')

class HttpController {

    initialize() {
        this.app = express()
        this.app.use(express.json())
        this.app.use(express.urlencoded({extended: true}))

        this.app.use(this.handleTokens)
        this.app.use('/backup/', require('../backup/backup.router'))
        this.app.use('/image/', require('../images/image.router'))
        this.app.use('/server/', require('../server/router.server'))
        this.app.use(this.handleErrors)

        this.srv = http.createServer(this.app)
        this.srv.listen(8080)

        console.info(`.  OK! O controlador de routers foi carregado com êxito.     .`)
    }

    handleErrors(err, req, res, next) {
        res.json({
            status: err.status ?? 500,
            message: err.reason ?? err.message
        }).status(err.status ?? 500)
    }

    handleTokens(req, res, next) {
        return next()
    }
}

module.exports = new HttpController()