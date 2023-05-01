const express = require('express')
const { createServer } = require('http')
const HttpRoutes = require('./http.routes')

class HttpModel {
    constructor() {
        this.app = express()
        this.http_server = null
        this.routes = new HttpRoutes().init().get()

        this.host = '0.0.0.0'
        this.port = 3000
        this.callback = () => {
            console.log(`web server online em ${this.host}:${this.port}`)
        }
    }

    init() {
        this.app.use('/', this.routes)

        this.app.on('error', this.handleError)

        this.http_server = createServer(this.app)
    }

    start() {
        this.http_server.listen(this.port, this.host, this.callback)
    }

    handleError(err) {
        console.log('Web server:', err)
    }

    getServer() {
        return this.http_server
    }
}

module.exports = HttpModel