import StorageManagerObject from "./storageManagerObject";
import {LockAlreadySetError, RuntimeLastError} from "./errors";
import StatusCodes from "./statusCodes";

export default class Lock {
    LOCK_PREFIX = 'lock_';
    
    /** @type {StorageManagerObject} */
    #storage;
    
    constructor() {
        this.#storage = new StorageManagerObject();
    }

    /**
     * @param {string} key
     * @return {Promise<void>}
     */
    async set(key) {
        let lockData = null;
        try {
            lockData = await this.#storage.get(this.LOCK_PREFIX + key);
        } catch (e) {
            if (e.statusCode === StatusCodes.RUNTIME_LAST_ERROR) {
                throw new RuntimeLastError(e.message);
            }
        }
        if (lockData) {
            throw new LockAlreadySetError(`Already locked for key: ${key}`);
        }
        await this.#storage.setByKey(this.LOCK_PREFIX + key, 1);
    }

    /**
     * @param {string} key
     * @return {Promise<void>}
     */
    async unset(key) {
        await this.#storage.remove(this.LOCK_PREFIX + key);
    }
    
}
