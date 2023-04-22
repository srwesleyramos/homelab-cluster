const Docker = require('dockerode')
const State = require('./server.state.js')

const client = new Docker()

class ServerContainer {

    constructor(server) {
        this.server = server

        this.init()
    }

    init() {
        this.isRunning().then((running) => {
            const state = running ? State.ONLINE : State.OFFLINE

            this.server.sendStatus(state)
        })
    }

    /*
     * Área de gerenciamento do container
     */

    create() {
        return new Promise((resolve, reject) => {
            const Env = [
                `STARTS_COMMAND=${this.server.getStartsCommand()}`,
                `FINISH_COMMAND=${this.server.getFinishCommand()}`,
                ...this.server.image_environment.split(',')
            ]

            const options = {
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
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
                Image: this.server.getDockerImage()?.name,
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
            const options = {
                force: true
            }

            container.remove(options, (err) => {
                err ? reject(err) : resolve()
            })
        })
    }

    start() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve, reject) => {
            container.start((err) => {
                if (err.reason === 'container already started') {
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

        return new Promise((resolve, reject) => {
            const options = {
                stream: true,
                stdout: true,
                stderr: true,
                stdin: true
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

                    this.server.sendShutdown()
                })

                resolve()
            })
        })
    }

    stats() {
        const container = client.getContainer(this.server.uuid)

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
            try {
                this.attach_stream.write(`${command}\n`)
            } catch (error) {
                return reject(new Error('Não foi possível se comunicar com o servidor.'))
            }

            resolve()
        })
    }

    /*
     * Área de utilidades gerais do container
     */

    isCreated() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve) => {
            container.inspect((err) => {
                resolve(err === null)
            })
        })
    }

    isDeleted() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve) => {
            container.inspect((err) => {
                resolve(err !== null)
            })
        })
    }

    isRunning() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve) => {
            container.inspect((err, data) => {
                resolve(err === null && data?.State?.Running === true)
            })
        })
    }

    isStopped() {
        const container = client.getContainer(this.server.uuid)

        return new Promise((resolve) => {
            container.inspect((err, data) => {
                resolve(err === null && data?.State?.Status === 'exited')
            })
        })
    }
}

module.exports = ServerContainer