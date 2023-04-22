const Docker = require('dockerode')

const client = new Docker()

class ImageModel {

    constructor(data) {
        this.uuid = data.uuid
        this.name = data.name
        this.starts_command = data.starts_command
        this.finish_command = data.finish_command
    }

    create() {
        return new Promise(async (resolve, reject) => {
            if (await this.isCreated()) return resolve()

            client.pull(this.name, (err, stream) => {
                if (err) return reject(err)

                stream.on('end', () => resolve())
                stream.on('error', (err) => reject(err))
            })
        })
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            if (await this.isDeleted()) return resolve()

            const image = client.getImage(this.name)

            const options = {
                force: true
            }

            image.remove(options, (err) => {
                err ? reject(err) : resolve()
            })
        })
    }

    isCreated() {
        return new Promise((resolve, reject) => {
            client.listImages((err, data) => {
                if (err) return reject(err)

                const images = data.flatMap(image => image.RepoTags)
                const exists = images.includes(this.name)

                resolve(exists)
            })
        })
    }

    isDeleted() {
        return new Promise((resolve, reject) => {
            client.listImages((err, data) => {
                if (err) return reject(err)

                const images = data.flatMap(image => image.RepoTags)
                const exists = images.includes(this.name)

                resolve(!exists)
            })
        })
    }
}

module.exports = ImageModel