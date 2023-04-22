const ImageCache = new Map()
const ImageModel = require('./image.model.js')

class ImageController {

    async initialize() {
        console.info(` OK! O controlador de imagens foi carregado com êxito.`)
    }

    async createImage(data) {
        if (ImageCache.has(data.uuid)) {
            throw new Error('a imagem já está cadastrada no sistema.')
        }

        const image = new ImageModel(data)
        await image.create()

        ImageCache.set(image.uuid, image)

        return image
    }

    async deleteImage(uuid) {
        if (!ImageCache.has(data.uuid)) {
            throw new Error('a imagem não está cadastrada no sistema.')
        }

        const image = this.getImageById(uuid)
        await image.delete()

        ImageCache.delete(image.uuid)
    }

    getImageById(uuid) {
        return ImageCache.get(uuid)
    }
}

module.exports = new ImageController()