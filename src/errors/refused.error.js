class RefusedError extends Error {

    constructor(error = "Operation Refused", status = 403) {
        super(error.reason ?? error.message ?? error)

        this.status = status
    }
}

module.exports = RefusedError