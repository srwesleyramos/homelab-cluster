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

start()