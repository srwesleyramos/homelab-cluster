const modules = [
    require('./image/image.controller.js'),
    require('./server/server.controller.js'),
    require('./backup/backup.controller.js'),
    require('./http/http.controller.js'),
]

async function start() {
    console.info('-------------------------------------------------------------')
    console.info('                                                             ')
    console.info('                       HOME LAB v1.0.0                       ')
    console.info('                      by @srwesleyramos                      ')
    console.info('                                                             ')

    for (const module of modules) {
        await module.initialize()
    }

    console.info('                                                             ')
    console.info('-------------------------------------------------------------')
    console.info('                                                             ')
}

start()