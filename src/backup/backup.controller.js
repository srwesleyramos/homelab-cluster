const BackupCache = new Map()
const BackupModel = require('./backup.model.js')

class BackupController {

    async initialize() {
        console.info(` OK! O controlador de cópias foi carregado com êxito.`)
    }

    async createBackup(data) {
        if (BackupCache.has(data.uuid)) {
            throw new Error('a cópia já está cadastrada no sistema.')
        }

        const backup = new BackupModel(data)
        await backup.create()

        BackupCache.set(backup.uuid, backup)

        return backup
    }

    async deleteBackup(uuid) {
        if (!BackupCache.has(data.uuid)) {
            throw new Error('a cópia já está cadastrada no sistema.')
        }

        const backup = BackupCache.get(uuid)
        await backup.delete()

        BackupCache.delete(uuid)
    }

    getBackupById(uuid) {
        return BackupCache.get(uuid)
    }
}

module.exports = new BackupController()