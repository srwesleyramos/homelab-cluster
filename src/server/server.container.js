const Docker = require('dockerode')
const State = require('./server.state')

const client = new Docker()

class ServerContainer {

    constructor(server) {
        this.server = server

        this.init()
    }

    init() {
        const container = client.getContainer(this.server.uuid)

        container.inspect((err, data) => {
            if (data?.State?.Running === true) {
                this.server.sendStatus(State.ONLINE)
            } else {
                this.server.sendStatus(State.OFFLINE)
            }
        })
    }

    /*
     * Área de gerenciamento do container
     */

    create() {
        return new Promise((resolve, reject) => {
            const Env = [
                `CPU_LIMIT=${this.server.cpu_limit}`,
                `DISK_LIMIT=${this.server.disk_limit}`,
                `FINISH_COMMAND=${this.server.image.finish_command}`,
                `RAM_LIMIT=${this.server.ram_limit}`,
                `STARTS_COMMAND=${this.server.image.starts_command}`,
                ...this.server.image_environment.split(',')
            ]

            const options = {
                AttachStderr: true,
                AttachStdin: true,
                AttachStdout: true,
                Env,

                HostConfig: {
                    BlkioWeight: 500,

                    CapDrop: [
                        'audit_write',
                        'dac_override',
                        'fowner',
                        'fsetid',
                        'mknod',
                        'net_bind_service',
                        'net_raw',
                        'setfcap',
                        'setpcap',
                        'sys_chroot'
                    ],

                    CpuPeriod: 100000,
                    CpuQuota: this.server.cpu_limit * 1000,
                    CpuShares: 1024,

                    Dns: [
                        '1.1.1.1',
                        '1.0.0.1'
                    ],

                    LogConfig: {
                        Type: 'none'
                    },

                    Memory: this.server.ram_limit * 1024 * 1024,
                    MemoryReservation: this.server.ram_limit * 1024 * 1024,
                    MemorySwap: 0,

                    Mounts: [
                        {
                            Target: '/home/container',
                            Source: `/etc/homelab/volumes/${this.server.uuid}`,
                            Type: 'bind'
                        }
                    ],

                    PidsLimit: 100,
                    OomKillDisable: false,
                    ReadonlyRootfs: true,

                    RestartPolicy: {
                        Name: 'no'
                    },

                    SecurityOpt: [
                        'no-new-privileges'
                    ],

                    Tmpfs: {
                        '/tmp': 'rw,exec,nosuid,size=100M'
                    }
                },

                Hostname: this.server.uuid,
                Image: this.server.image.name,
                name: this.server.uuid,
                OpenStdin: true,
                Tty: true
            }

            client.createContainer(options, (err) => {
                err ? reject(err) : resolve()
            })
        })
    }

    delete() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve, reject) => {
            container.remove({force: true}, (err) => {
                err ? reject(err) : resolve()
            })
        })
    }

    start() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve, reject) => {
            container.start((err) => {
                if (err?.reason === 'container already started') {
                    return resolve()
                }

                err ? reject(err) : resolve()
            })
        })
    }

    stop() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve, reject) => {
            container.stop((err) => {
                if (err.reason === 'container already stopped') {
                    return resolve()
                }

                err ? reject(err) : resolve()
            })
        })
    }

    kill() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve, reject) => {
            container.kill({}, (err) => {
                if (err.message.includes('Cannot kill container')) {
                    return resolve()
                }

                err ? reject(err) : resolve()
            })
        })
    }

    /*
    * Área de interação com o container
    */

    attach() {
        const container = client.getContainer(this.server.uuid)

        if (this.attach_stream) {
            this.attach_stream = undefined
        }

        return new Promise((resolve, reject) => {
            const options = {
                stderr: true,
                stdin: true,
                stdout: true,
                stream: true
            }

            container.attach(options, (err, stream) => {
                if (err) return reject(err)

                this.attach_stream = stream

                this.attach_stream.on('data', (buffer) => {
                    const data = buffer.toString()

                    this.server.sendConsole(data)
                })

                this.attach_stream.on('end', () => {
                    this.attach_stream = undefined

                    this.server.sendCrashReport()
                })

                resolve()
            })
        })
    }

    stats() {
        const container = client.getContainer(this.server.uuid)

        if (this.stats_stream) {
            this.stats_stream = undefined
        }

        return new Promise((resolve, reject) => {
            const options = {
                stream: true
            }

            container.stats(options, (err, stream) => {
                if (err) return reject(err)

                this.stats_stream = stream

                this.stats_stream.on('data', (buffer) => {
                    const data = JSON.parse(buffer.toString())

                    this.server.sendHardware(data)
                })

                this.stats_stream.on('end', () => {
                    this.stats_stream = undefined

                    this.server.sendHardware({})
                })

                resolve()
            })
        })
    }

    write(command) {
        return new Promise((resolve, reject) => {
            if (!this.attach_stream) {
                return reject(new Error('Não foi possível se comunicar com o servidor.'))
            }

            try {
                this.attach_stream.write(`${command}\n`)
            } catch (err) {
                return reject(err)
            }

            resolve()
        })
    }

    /*
     * Área de utilidades gerais do container
     */

    exists() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve) => {
            container.inspect((err) => {
                resolve(err === null)
            })
        })
    }
}

module.exports = ServerContainer