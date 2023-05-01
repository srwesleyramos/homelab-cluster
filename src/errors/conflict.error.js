class ConflictError extends Error {

    constructor(error = "Already Created", status = 409) {
        super(error.reason ?? error.message ?? error)

        this.status = status
    }
}

module.exports = ConflictError