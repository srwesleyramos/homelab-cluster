const Container = require('./server.container')
const Files = require('../helper')
const Image = require('../images/image.controller')
const State = require('./server.state')
const Thread = require('./server.thread')

class ServerModel {

    constructor(data) {
        this.uuid = data.uuid

        this.cpu_limit = data.cpu_limit
        this.ram_limit = data.ram_limit
        this.net_limit = data.net_limit

        this.backup_limit = data.backup_limit
        this.volume_limit = data.volume_limit

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
        this.image = Image.memory.restore({uuid: this.image_uuid})
        this.thread = new Thread(this)

        this.statistics = {}
    }

    /*
     * Área de gerenciamento do servidor
     */

    async create() {
        if (this.state_blocked || this.state_suspend || this.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (await this.container.exists() || !await this.image.exists()) {
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
            throw err
        }
    }

    async delete() {
        if (this.state_blocked || this.state_suspend || this.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (!await this.container.exists()) {
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
            throw err
        }
    }

    async start() {
        if (this.state_blocked || this.state_suspend || this.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (!await this.container.exists() || await this.isStorageLimited()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            await this.sendStatus(State.STARTING)

            await this.container.start()
            await this.container.attach()
            await this.container.stats()
        } catch (err) {
            console.log(err)

            await this.kill()
            throw err
        }
    }

    async stop() {
        if (this.state_blocked || this.state_suspend || this.state !== State.ONLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (!await this.container.exists()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            await this.sendStatus(State.STOPPING)

            if (this.image.finish_command === '^C') {
                await this.stop()
            } else {
                await this.container.write(this.image.finish_command)
            }
        } catch (err) {
            await this.kill()
            throw err
        }
    }

    async kill() {
        if (this.state_blocked || this.state_suspend || this.state !== State.ONLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        if (!await this.container.exists()) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            await this.sendStatus(State.STOPPING)

            await this.container.kill()

            await this.sendStatus(State.OFFLINE)
        } catch (err) {
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

        if (!await this.container.exists()) {
            return new Error('o servidor precisa existir e estar instalado na máquina.')
        }

        try {
            if (this.image.finish_command === command) {
                await this.stop()
            } else {
                await this.container.write(command)
            }
        } catch (err) {
            throw err
        }
    }

    async sendConsole(message) {
        if (this.state === State.STARTING && message.includes(this.image_detector)) {
            await this.sendStatus(State.ONLINE)
        }

        // this.websocket.emit('console', message)
    }

    async sendCrashReport() {
        if (this.state === State.ONLINE) {
            // TODO: executar detecção de crash
        }

        await this.sendStatus(State.OFFLINE)
    }

    async sendHardware(stats) {
        this.statistics = stats

        if (this.state_blocked || this.state_suspend || this.state === State.OFFLINE) {
            await this.container.kill()
        }

        /*
          {
            disk: {
                backup,
                volume
            }
          }
         */

        console.log(stats)

        // this.websocket.emit('statistics', JSON.stringify(stats))
    }

    async sendStatus(state) {
        this.state = state

        if (this.state === State.STARTING || this.state === State.ONLINE) {
            this.thread.start()
        }

        if (this.state === State.STOPPING || this.state === State.OFFLINE) {
            this.thread.stop()
        }

        // this.websocket.emit('status', state)
    }

    async isStorageLimited() {
        const size = await Files.size('/etc/homelab/volumes', this.uuid)

        return size > this.volume_limit * 1024 * 1024
    }
}

module.exports = ServerModel