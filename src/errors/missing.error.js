class MissingError extends Error {

    constructor(error = "Not Found", status = 404) {
        super(error.reason ?? error.message ?? error)

        this.status = status
    }
}

module.exports = MissingError