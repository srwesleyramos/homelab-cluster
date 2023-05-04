const Helper = require('../helper')
const MissingError = require('../errors/missing.error')
const Server = require('../server/server.controller')
const RefusedError = require('../errors/refused.error')

class BackupEntity {

    constructor(data) {
        this.uuid = data.uuid

        this.server = data.server
        this.expires = data.expires
        this.stored = data.stored

        this.created = data.created
        this.updated = data.updated

        this.configure()
    }

    configure() {
        this.data = Server.memory.restore(this.server)
        this.file = '/etc/homelab/backups/' + this.server + '/' + this.uuid + '.zip'
        this.path = '/etc/homelab/volumes/' + this.server
    }

    /*
     * Área para gerenciamento do modelo
     */

    async create() {
        if (!Helper.exists(this.path)) {
            throw new MissingError('o servidor fornecido não foi encontrado no sistema.')
        }

        if (this.data.state_blocked || this.data.state_suspend) {
            throw new RefusedError('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.data.state_blocked = true

            this.stored = await Helper.zip(this.path, this.file, this.data.websocket)

            this.data.state_blocked = false
        } catch (err) {
            this.data.state_blocked = false
            throw err
        }
    }

    async delete() {
        if (!Helper.exists(this.file)) {
            throw new MissingError('a cópia fornecida não existe para este servidor.')
        }

        if (this.data.state_blocked || this.data.state_suspend) {
            throw new RefusedError('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.data.state_blocked = true

            this.stored = await Helper.delete(this.file)

            this.data.state_blocked = false
        } catch (err) {
            this.data.state_blocked = false
            throw err
        }
    }

    async update() {
        if (!Helper.exists(this.file)) {
            throw new MissingError('a cópia fornecida não existe para este servidor.')
        }

        if (this.data.state_blocked || this.data.state_suspend) {
            throw new RefusedError('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (this.expires <= Date.now() && this.expires !== 0) {
            throw new RefusedError('a cópia fornecida já expirou para este servidor.')
        }

        try {
            this.data.state_blocked = true

            await Helper.unzip(this.file, this.path, this.data.websocket)

            this.data.state_blocked = false
        } catch (err) {
            this.data.state_blocked = false
            throw err
        }
    }

    /*
     * Área de utilidades gerais do modelo
     */

    isInvalid() {
        return !Helper.exists(this.path) || !Helper.exists(this.file) || this.expires !== 0 && this.expires <= Date.now()
    }
}

module.exports = BackupEntity