export default class Storage {

    #storage;

    constructor(storage = chrome.storage.local) {
        this.#storage = storage;
    }

    get(key) {
        return new Promise((resolve, reject) => {
            this.#storage.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                try {
                    resolve(result[key]);
                } catch (e) {
                    reject(e.message);
                }
            });
        });
    }

    set(key, value) {
        return new Promise((resolve, reject) => {
            this.#storage.set({[key]: value}, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }
}
