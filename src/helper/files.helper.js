const Fs = require('fs')
const Path = require('path')
const Proc = require('child_process')

class FilesHelper {

    delete(...path) {
        return new Promise((resolve, reject) => {
            const stat = Fs.statSync(Path.join(...path))

            if (stat.isFile()) {
                Fs.rm(Path.join(...path), (err) => {
                    err ? reject(err) : resolve(0)
                })
            } else {
                Fs.rmdir(Path.join(...path), (err) => {
                    err ? reject(err) : resolve(0)
                })
            }
        })
    }

    exists(...path) {
        return Fs.existsSync(Path.join(...path))
    }

    mkdir(...path) {
        return new Promise((resolve, reject) => {
            const options = {
                recursive: true
            }

            Fs.mkdir(Path.join(...path), options, (err) => {
                err ? reject(err) : resolve()
            })
        })
    }

    size(...path) {
        return new Promise((resolve, reject) => {
            const folder = Path.join(...path)

            Fs.readdir(folder, {}, async (err, files) => {
                if (err) return reject(err)

                const size = await files.reduce(async (accumulatorPromise, file) => {
                    const accumulator = await accumulatorPromise
                    const name = Path.join(folder, file)
                    const stats = Fs.statSync(name)

                    if (stats.isFile()) {
                        return accumulator + stats.size
                    } else {
                        return accumulator + await this.size(name)
                    }
                }, 0)

                resolve(size)
            })
        })
    }

    zip(source, target) {
        return new Promise((resolve, reject) => {
            Proc.exec(`cd "${source}" && zip -r "${target}" *`, async (err) => {
                err ? reject(err) : resolve(await this.size(source))
            })
        })
    }

    unzip(source, target) {
        return new Promise((resolve, reject) => {
            Proc.exec(`unzip "${source}" -d "${target}"`, (err) => {
                err ? reject(err) : resolve()
            })
        })
    }
}

module.exports = new FilesHelper()