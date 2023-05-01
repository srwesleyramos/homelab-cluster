const Docker = require('dockerode')
const Client = new Docker()

const MissingError = require("../errors/missing.error")

class ImageEntity {

    constructor(data) {
        this.uuid = data.uuid
        this.name = data.name

        this.starts_command = data.starts_command
        this.finish_command = data.finish_command

        this.created = data.created
        this.updated = data.updated
    }

    /*
     * Área para gerenciamento do modelo
     */

    async create() {
        return new Promise((resolve, reject) => {
            Client.pull(this.name, (err, stream) => {
                if (err) {
                    if (err?.message.includes('repository does not exist')) {
                        return reject(new MissingError('a imagem não pôde ser encontrada no Docker Hub.'))
                    }

                    if (err?.message.includes('manifest unknown')) {
                        return reject(new MissingError('a imagem não pôde ser encontrada no Docker Hub.'))
                    }

                    return reject(err)
                }

                stream.on('data', () => {
                })
                stream.on('end', () => resolve())
                stream.on('error', (err) => reject(err))
            })
        })
    }

    delete() {
        return new Promise((resolve, reject) => {
            const image = Client.getImage(this.name)

            image.remove({force: true}, (err) => {
                if (err && err.message.includes('No such image')) {
                    return resolve()
                }

                err ? reject(err) : resolve()
            })
        })
    }

    /*
     * Área de utilidades gerais do modelo
     */

    exists() {
        return new Promise((resolve, reject) => {
            Client.listImages((err, data) => {
                if (err) return reject(err)

                const images = data.flatMap(image => image.RepoTags)
                const exists = images.includes(this.name)

                resolve(exists)
            })
        })
    }
}

module.exports = ImageEntity