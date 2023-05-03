const control = require('./image.controller')
const unique = require('uuid')
const express = require('express')

const MethodError = require("../errors/method.error")

class ImageRouter {

    constructor() {
        this.router = express.Router()
        this.router.use(this.validate)

        this.router.post('/create/', this.create)
        this.router.post('/delete/', this.delete)
        this.router.post('/update/', this.update)

        this.router.get('/details/', this.details)
        this.router.get('/details/:uuid/', this.details)
    }

    async create(req, res, next) {
        if (!req.body.uuid || !req.body.name || !req.body.starts_command || !req.body.finish_command) {
            return next(new MethodError('o corpo da requisição está incompleto. (2)'))
        }

        try {
            const entity = await control.createImage(req.body)

            const response = {
                ...entity
            }

            res.json(response)
        } catch (err) {
            next(err)
        }
    }

    async delete(req, res, next) {
        if (!req.body.uuid) {
            return next(new MethodError('o corpo da requisição está incompleto. (2)'))
        }

        try {
            const entity = await control.deleteImage(req.body)

            const response = {
                ...entity
            }

            res.json(response)
        } catch (err) {
            next(err)
        }
    }

    async update(req, res, next) {
        if (!req.body.uuid || !req.body.name || !req.body.starts_command || !req.body.finish_command) {
            return next(new MethodError('o corpo da requisição está incompleto. (2)'))
        }

        try {
            const entity = await control.updateImage(req.body)

            const response = {
                ...entity
            }

            res.json(response)
        } catch (err) {
            next(err)
        }
    }

    async details(req, res) {
        const entities = Array.from(control.memory.cached.values()).filter(entity =>
            !req.params.uuid || entity.uuid === req.params.uuid
        )

        const response = entities.map(entity => ({
            ...entity
        }))

        res.json(response)
    }

    validate(req, res, next) {
        if (req.body.uuid && !unique.validate(req.body.uuid)) {
            return next(new MethodError('o corpo da requisição está incompleto. (1)'))
        }

        return next()
    }
}

module.exports = new ImageRouter().router