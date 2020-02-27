export class LockAlreadySetError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.name = "LockAlreadySetError";
    }
}

export class DownloadAlreadyInProgressError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.name = "DownloadAlreadyInProgressError";
    }
}
