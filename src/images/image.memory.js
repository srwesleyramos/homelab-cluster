const Sqlite = require('sqlite3')
const Entity = require("./image.entity")

class ImageMemory {

    constructor() {
        this.cached = new Map()
        this.server = new Sqlite.Database('/etc/homelab/sqlite.db')
    }

    setup() {
        this.server.run(`
            CREATE TABLE IF NOT EXISTS images
            (
                uuid           TEXT PRIMARY KEY,
                name           TEXT,
                starts_command TEXT,
                finish_command TEXT,
                created        INTEGER,
                updated        INTEGER
            )
        `)

        this.server.all('SELECT * FROM images', (err, rows) => {
            if (rows) {
                rows.forEach(data => this.cached.set(data.uuid, new Entity(data)))
            }
        })
    }

    create(entity) {
        entity.created = Date.now()
        entity.updated = Date.now()

        return new Promise((resolve, reject) => {
            const command = 'INSERT INTO images VALUES (?, ?, ?, ?, ?, ?)'

            const params = [
                entity.uuid,
                entity.name,
                entity.starts_command,
                entity.finish_command,
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
            const command = 'DELETE FROM images WHERE uuid = ?'

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
            const command = 'UPDATE images SET name = ?, starts_command = ?, finish_command = ?, updated = ? WHERE uuid = ?'

            const params = [
                entity.name,
                entity.starts_command,
                entity.finish_command,
                entity.updated,
                entity.uuid
            ]

            this.server.run(command, params, (err) => {
                err ? reject(err) : resolve(entity)
            })

            this.cached.set(entity.uuid, entity)
        })
    }

    count(data) {
        return Array.from(this.cached.values()).filter((i) => i.name === data.name).length
    }

    exists(data) {
        return this.cached.has(data.uuid)
    }

    restore(data) {
        return this.cached.get(data.uuid)
    }
}

module.exports = ImageMemory