const ServerCache = new Map()
const ServerModel = require('./server.model.js')

class ServerController {

    async initialize() {
        console.info(` OK! O controlador de servidores foi carregado com êxito.`)
    }

    async createServer(data) {
        if (ServerCache.has(data.uuid)) {
            throw new Error('o servidor já está cadastrado no sistema.')
        }

        const server = new ServerModel(data)
        await server.create()

        ServerCache.set(server.uuid, server)

        return server
    }

    async deleteServer(uuid) {
        if (!ServerCache.has(data.uuid)) {
            throw new Error('o servidor não está cadastrado no sistema.')
        }

        const server = ServerCache.get(uuid)
        await server.delete()

        ServerCache.delete(server.uuid)
    }

    getServerById(uuid) {
        return ServerCache.get(uuid)
    }
}

module.exports = new ServerController()