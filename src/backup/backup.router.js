const control = require('./backup.controller')
const unique = require('uuid')
const express = require('express')

const MethodError = require("../errors/method.error")

class BackupRouter {

    constructor() {
        this.router = express.Router()
        this.router.use(this.validate)

        this.router.post('/create/', this.create)
        this.router.post('/delete/', this.delete)
        this.router.post('/export/', this.export)

        this.router.get('/details/', this.details)
        this.router.get('/details/:uuid/', this.details)
    }

    async create(req, res, next) {
        if (!req.body.uuid || !req.body.server || !req.body.expires) {
            return next(new MethodError('o corpo da requisição está incompleto ou inválido. (4)'))
        }

        try {
            const entity = await control.createBackup(req.body)

            const response = {
                ...entity, data: undefined, file: undefined, path: undefined
            }

            res.json(response)
        } catch (err) {
            next(err)
        }
    }

    async delete(req, res, next) {
        if (!req.body.uuid) {
            return next(new MethodError('o corpo da requisição está incompleto ou inválido. (4)'))
        }

        try {
            const entity = await control.deleteBackup(req.body)

            const response = {
                ...entity, data: undefined, file: undefined, path: undefined
            }

            res.json(response)
        } catch (err) {
            next(err)
        }
    }

    async export(req, res, next) {
        if (!req.body.uuid) {
            return next(new MethodError('o corpo da requisição está incompleto ou inválido. (4)'))
        }

        try {
            const entity = await control.exportBackup(req.body)

            const response = {
                ...entity, data: undefined, file: undefined, path: undefined
            }

            res.json(response)
        } catch (err) {
            next(err)
        }
    }

    async details(req, res) {
        const entities = Array.from(control.memory.cached.values()).filter(entity =>
            !req.params.uuid || entity.uuid === req.params.uuid || entity.server === req.params.uuid
        )

        const response = entities.map(entity => ({
            ...entity, data: undefined, file: undefined, path: undefined
        }))

        res.json(response)
    }

    validate(req, res, next) {
        if (req.body.uuid && !unique.validate(req.body.uuid)) {
            return next(new MethodError('o corpo da requisição está incompleto ou inválido. (1)'))
        }

        if (req.body.expires && isNaN(req.body.expires)) {
            return next(new MethodError('o corpo da requisição está incompleto ou inválido. (2)'))
        }

        if (req.body.server && !unique.validate(req.body.server)) {
            return next(new MethodError('o corpo da requisição está incompleto ou inválido. (3)'))
        }

        return next()
    }
}

module.exports = new BackupRouter().router