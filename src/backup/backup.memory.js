const Sqlite = require('sqlite3')
const Entity = require("./backup.entity");

class BackupMemory {

    constructor() {
        this.cached = new Map()
        this.server = new Sqlite.Database('/etc/homelab/sqlite.db')
    }

    setup() {
        this.server.run(`
            CREATE TABLE IF NOT EXISTS backups
            (
                uuid    TEXT PRIMARY KEY,
                server  TEXT,
                expires INTEGER,
                stored  INTEGER,
                created INTEGER,
                updated INTEGER
            )
        `)

        this.server.all('SELECT * FROM backups', (err, rows) => {
            if (rows) {
                rows.forEach(data => this.cached.set(data.uuid, new Entity(data)))
            }
        })
    }

    create(entity) {
        entity.created = Date.now()
        entity.updated = Date.now()

        return new Promise((resolve, reject) => {
            const command = 'INSERT INTO backups VALUES (?, ?, ?, ?, ?, ?)'

            const params = [
                entity.uuid,
                entity.server,
                entity.expires,
                entity.stored,
                entity.created,
                entity.updated
            ]

            this.server.run(command, params, (err) => {
                err ? reject(err) : resolve(entity)
            })

            this.cached.set(entity.uuid, entity)
        })
    }

    delete(entity) {
        return new Promise((resolve, reject) => {
            const command = 'DELETE FROM backups WHERE uuid = ?'

            const params = [
                entity.uuid
            ]

            this.server.run(command, params, (err) => {
                err ? reject(err) : resolve(entity)
            })

            this.cached.delete(entity.uuid)
        })
    }

    update(entity) {
        entity.updated = Date.now()

        return new Promise((resolve, reject) => {
            const command = 'UPDATE backups SET expires = ?, stored = ?, updated = ? WHERE uuid = ?'

            const params = [
                entity.expires,
                entity.stored,
                entity.updated,
                entity.uuid
            ]

            this.server.run(command, params, (err) => {
                err ? reject(err) : resolve(entity)
            })

            this.cached.set(entity.uuid, entity)
        })
    }

    exists(data) {
        return this.cached.has(data.uuid)
    }

    restore(data) {
        return this.cached.get(data.uuid)
    }
}

module.exports = BackupMemory