const control = require("./server/server.controller");
const modules = [
    require('./images/image.controller'),
    require('./server/server.controller'),
    require('./backup/backup.controller'),
    require('./routes/http.controller')
]

async function start() {
    console.info('.                                                            .')
    console.info('.                       CLUSTER v1.0.0                       .')
    console.info('.                       @srwesleyramos                       .')
    console.info('.                                                            .')

    for (const module of modules) {
        await module.initialize()
    }

    console.info('.                                                            .')
}

async function test() {
    setTimeout(async () => {
        const control = require('./server/server.controller')

        const server = await control.createServer({
            uuid: 'aa416e71-c6b7-44c8-913d-9cfb2c8d391b',

            cpu_limit: 1024,
            ram_limit: 1024,
            net_limit: 1024,

            backup_limit: 0,
            volume_limit: 43634868464,

            image_detector: '',
            image_environment: 'test=true',
            image_uuid: '7ccf6d12-1c64-41d0-b658-3aee6e3f9f0e',

            state_suspend: false
        })

        await server.start()
    }, 5000)
}

start().then(test)