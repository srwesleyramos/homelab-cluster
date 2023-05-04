class ServerModel {

    server_blocked = false
    server_suspend = false
}

class ServerMemory {

    restore(data) {
        return new ServerModel()
    }
}

module.exports = ServerMemory