const express = require('express')
const { createServer } = require('http')
const HttpRoutes = require('../http/http.routes')

class HttpModel {
    constructor() {
        this.app = express()
        this.http_server = null

        this.host = '0.0.0.0'
        this.port = 8080
        this.callback = () => {
            console.log(`web server online em ${this.host}:${this.port}`)
        }
    }

    init() {
        // middlewares
        this.app.use(express.json())
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(this.handleErrors)

        // routes
        this.app.use('/backup/', require('../backup/backup.router'))
        this.app.use('/image/', require('../image/image.router'))
        this.app.use('/server/', require('./router.server'))

        this.http_server = createServer(this.app)
        this.http_server.listen(this.port, this.host, this.callback)
    }

    // start() {
    //     this.http_server.listen(this.port, this.host, this.callback)
    // }

    handleErrors(err, req, res, next) {
        res.json({
            status: err.status ?? 500,
            message: err.reason ?? err.message
        }).status(err.status ?? 500)
    }
}

module.exports = HttpModel