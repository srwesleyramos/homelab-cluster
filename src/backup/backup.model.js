const Files = require('../helper/files.helper.js')
const Servers = require('../server/server.controller.js')
const State = require('../server/server.state.js')

class BackupModel {

    constructor(data) {
        this.uuid = data.uuid

        this.created = data.created
        this.expires = data.expires

        this.server = data.server
        this.stored = data.stored

        this.init()
    }

    init() {
        this.srv = Servers.getServerById(this.server)
        this.srv_uri = '/etc/homelab/volumes/' + this.server
        this.srv_zip = '/etc/homelab/backups/' + this.server + '/' + this.uuid + '.zip'
    }

    check() {
        const exists = Files.exists(this.srv_uri) && Files.exists(this.srv_zip)
        const valid = this.expires == 0 || this.expires >= Date.now()

        return exists && valid
    }

    /*
     * Área de gerenciamento do backup
     */

    async create() {
        try {
            this.stored = await Files.zip(this.srv_uri, this.srv_zip)
        } catch (error) {
            throw error
        }
    }

    async delete() {
        try {
            this.stored = await Files.delete(this.srv_zip)
        } catch (error) {
            throw error
        }
    }

    async export() {
        if (this.srv.state_blocked || this.srv.state_suspended || this.srv.state !== State.OFFLINE) {
            throw new Error('o servidor recusou esta operação, tente novamente em breve.')
        }

        try {
            this.srv.state_blocked = true

            await Files.unzip(this.srv_zip, this.srv_uri)

            this.srv.state_blocked = false
        } catch (error) {
            this.srv.state_blocked = false
            throw error
        }
    }
}

module.exports = BackupModel