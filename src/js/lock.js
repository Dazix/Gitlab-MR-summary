import Storage from "./storage";
import {LockAlreadySetError} from "./errors";

export default class Lock {
    LOCK_PREFIX = 'lock_';
    
    /** @type {Storage} */
    #storage;
    
    constructor() {
        this.#storage = new Storage();
    }

    /**
     * @param {string} key
     * @return {Promise<void>}
     */
    async set(key) {
        let lockData = await this.#storage.get(this.LOCK_PREFIX + key);
        if (lockData) {
            throw new LockAlreadySetError(`Already locked for key: ${key}`);
        }
        await this.#storage.set(this.LOCK_PREFIX + key, 1);
    }

    /**
     * @param {string} key
     * @return {Promise<void>}
     */
    async unset(key) {
        await this.#storage.remove(this.LOCK_PREFIX + key);
    }
    
}
