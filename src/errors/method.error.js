class MethodError extends Error {

    constructor(error = "Body or Parameters Invalid", status = 400) {
        super(error.reason ?? error.message ?? error)

        this.status = status
    }
}

module.exports = MethodError