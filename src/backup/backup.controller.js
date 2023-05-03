const ConflictError = require('../errors/conflict.error')
const BackupEntity = require('./backup.entity')
const BackupMemory = require('./backup.memory')
const BackupThread = require('./backup.thread')
const MissingError = require('../errors/missing.error')

class BackupController {

    initialize() {
        try {
            this.memory = new BackupMemory(this)
            this.memory.setup()

            this.thread = new BackupThread(this)
            this.thread.setup()

            console.info(`.  OK! O controlador de backups foi carregado com êxito.     .`)
        } catch (err) {
            throw err
        }
    }

    async createBackup(data) {
        if (this.memory.exists(data)) {
            throw new ConflictError('a cópia já está cadastrada no sistema.')
        }

        const entity = new BackupEntity(data)
        await entity.create()

        return this.memory.create(entity)
    }

    async deleteBackup(data) {
        if (!this.memory.exists(data)) {
            throw new MissingError('a cópia não está cadastrada no sistema.')
        }

        const entity = this.memory.restore(data)
        await entity.delete()

        return this.memory.delete(entity)
    }

    async exportBackup(data) {
        if (!this.memory.exists(data)) {
            throw new MissingError('a cópia não está cadastrada no sistema.')
        }

        const entity = this.memory.restore(data)
        await entity.export()

        return this.memory.update(entity)
    }
}

module.exports = new BackupController()