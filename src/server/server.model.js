const Container = require('./server.container.js')
const Files = require('../helper/files.helper.js')
const State = require('./server.state.js')

class ServerModel {

    constructor(data) {
        this.uuid = data.uuid

        this.cpu_limit = data.cpu_limit
        this.disk_limit = data.disk_limit
        this.ram_limit = data.ram_limit

        this.image_detector = data.image_detector
        this.image_environment = data.image_environment
        this.image_uuid = data.image_uuid

        this.state = State.OFFLINE
        this.state_blocked = false
        this.state_suspend = data.state_suspend

        this.init()
    }

    init() {
        this.container = new Container(this)
        this.websocket = new WebSocket(this)

        this.statistics = {}
    }

    /*
     * Área de gerenciamento do servidor
     */

    async create() {
        if (this.state_blocked || this.state_suspend || this.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.isCreated() || await this.getDockerImage().isDeleted()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.state_blocked = true

            await Files.mkdir('/etc/homelab/backups', this.uuid)
            await Files.mkdir('/etc/homelab/volumes', this.uuid)

            await this.container.create()

            this.state_blocked = false
        } catch (err) {
            this.state_blocked = false

            this.websocket.emit('console', '[Daemon Lab] [ERROR]: aconteceu um problema ao tentar executar a criação:')
            this.websocket.emit('console', `[Daemon Lab] [ERROR]: ${err}`)

            throw err
        }
    }

    async delete() {
        if (this.state_blocked || this.state_suspend || this.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.isDeleted()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.state_blocked = true

            await Files.delete('/etc/homelab/backups', this.uuid)
            await Files.delete('/etc/homelab/volumes', this.uuid)

            await this.container.delete()

            this.state_blocked = false
        } catch (err) {
            this.state_blocked = false

            this.websocket.emit('console', '[Daemon Lab] [ERROR]: aconteceu um problema ao tentar executar a remoção:')
            this.websocket.emit('console', `[Daemon Lab] [ERROR]: ${err}`)

            throw err
        }
    }

    async start() {
        if (this.state_blocked || this.state_suspend || this.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.isDeleted() || await this.isStorageLimited()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.sendStatus(State.STARTING)

            await this.container.start()
            await this.container.attach()
            await this.container.stats()
        } catch (err) {
            await this.kill()

            this.websocket.emit('console', '[Daemon Lab] [ERROR]: aconteceu um problema ao tentar executar a inicialização:')
            this.websocket.emit('console', `[Daemon Lab] [ERROR]: ${err}`)

            throw err
        }
    }

    async stop() {
        if (this.state_blocked || this.state_suspend || this.state !== State.ONLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.isDeleted()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.sendStatus(State.STOPPING)

            if (this.getFinishCommand() === '^C') {
                await this.stop()
            } else {
                await this.container.write(this.getFinishCommand())
            }
        } catch (err) {
            await this.kill()

            this.websocket.emit('console', '[Daemon Lab] [ERROR]: aconteceu um problema ao tentar executar a finalização:')
            this.websocket.emit('console', `[Daemon Lab] [ERROR]: ${err}`)

            throw err
        }
    }

    async kill() {
        if (this.state_blocked || this.state_suspend || this.state !== State.ONLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.isDeleted()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.sendStatus(State.STOPPING)

            await this.container.kill()

            this.sendStatus(State.OFFLINE)
        } catch (err) {
            this.websocket.emit('console', '[Daemon Lab] [ERROR]: aconteceu um problema ao tentar executar a finalização:')
            this.websocket.emit('console', `[Daemon Lab] [ERROR]: ${err}`)

            throw err
        }
    }

    /*
     * Área de interações com o servidor
     */

    async sendCommand(command) {
        if (this.state_blocked || this.state_suspend || this.state !== State.ONLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.isDeleted()) {
            return new Error('o servidor precisa existir e estar instalado na máquina.')
        }

        try {
            if (this.getFinishCommand() === command) {
                await this.stop()
            } else {
                await this.container.write(command)
            }
        } catch (err) {
            this.websocket.emit('console', '[Daemon Lab] [ERROR]: aconteceu um problema ao tentar executar o comando:')
            this.websocket.emit('console', `[Daemon Lab] [ERROR]: ${err}`)

            throw err
        }
    }

    async sendConsole(message) {
        if (this.state === State.STARTING && message.includes(this.image_detector)) {
            this.sendStatus(State.ONLINE)
        }

        this.websocket.emit('console', message)
    }

    async sendCrashReport() {
        if (this.state === State.ONLINE) {
            // TODO: executar detecção de crash
        }

        this.sendStatus(State.OFFLINE)
    }

    async sendHardware(stats) {
        this.statistics = stats

        if (this.state_blocked || this.state_suspend || this.state === State.OFFLINE) {
            this.container.kill()
        }

        this.websocket.emit('statistics', JSON.stringify(stats))
    }

    async sendStatus(state) {
        this.state = state

        if (this.state === State.STARTING || this.state === State.ONLINE) {
            // TODO: iniciar verificações de espaço em disco
        }

        if (this.state === State.STOPPING || this.state === State.OFFLINE) {
            // TODO: encerrar verificações de espaço em disco
        }

        this.websocket.emit('console', `[Daemon Lab] [INFO]: o servidor foi classificado como ${state}`)
    }

    async isStorageLimited() {
        const size = await Files.size('/etc/homelab/volumes', this.uuid)

        return size > this.disk_limit * 1024 * 1024
    }

    /*
     * Área de utilidades gerais do servidor
     */

    getDockerImage() {
        const Images = require('../image/image.controller.js')
        const image = Images.getImageById(this.image_uuid)

        return image
    }

    getStartsCommand() {
        return this.getDockerImage().starts_command
    }

    getFinishCommand() {
        return this.getDockerImage().finish_command
    }
}

module.exports = ServerModel