const ConflictError = require('../errors/conflict.error')
const ImageEntity = require('./image.entity')
const ImageMemory = require('./image.memory')
const MissingError = require('../errors/missing.error')
const RefusedError = require("../errors/refused.error")

class ImageController {

    initialize() {
        try {
            this.memory = new ImageMemory()
            this.memory.setup()

            console.info(`.  OK! O controlador de imagens foi carregado com êxito.     .`)
        } catch (err) {
            throw err
        }
    }

    async createImage(data) {
        if (this.memory.exists(data)) {
            throw new ConflictError('a imagem já está cadastrada no sistema.')
        }

        const entity = new ImageEntity(data)
        await entity.create()

        return this.memory.create(entity)
    }

    async deleteImage(data) {
        if (!this.memory.exists(data)) {
            throw new MissingError('a imagem não está cadastrada no sistema.')
        }

        const entity = this.memory.restore(data)
        await entity.delete()

        return this.memory.delete(entity)
    }

    async updateImage(data) {
        if (data.created || data.updated) {
            throw new RefusedError('os atributos `created` e `updated` são inalteráveis.')
        }

        if (!this.memory.exists(data)) {
            throw new MissingError('a imagem não está cadastrada no sistema.')
        }

        const oldest = this.memory.restore(data)

        const entity = new ImageEntity({
            ...oldest,
            ...data
        })

        if (entity.name !== oldest.name) {
            await entity.create()
        }

        return this.memory.update(entity)
    }
}

module.exports = new ImageController()