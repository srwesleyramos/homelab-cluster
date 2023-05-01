const control = require('./backup.controller')
const express = require('express')

const MethodError = require("../errors/method.error")

class BackupRouter {

    constructor() {
        this.router = express.Router()

        this.router.post('/create/', this.create)
        this.router.post('/delete/', this.delete)
        this.router.post('/export/', this.export)

        this.router.get('/details/', this.details)
        this.router.get('/details/:uuid/', this.details)
    }

    async create(req, res, next) {
        if (!req.body.uuid || !req.body.server || isNaN(req.body.expires)) {
            return next(new MethodError('o corpo da requisição está incompleto.'))
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
            return next(new MethodError('o corpo da requisição está incompleto.'))
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
            return next(new MethodError('o corpo da requisição está incompleto.'))
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
}

module.exports = new BackupRouter().router