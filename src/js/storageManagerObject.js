import StatusCodes from "./statusCodes.js";
import {mergeDeep} from "./utils";

export default class StorageManagerObject {

    #storage;

    constructor(storage = chrome.storage.local) {
        this.#storage = storage;
    }

    /**
     * @param {string} key
     * @return {Promise<{}>}
     */
    get(key) {
        return new Promise((resolve, reject) => {
            this.#storage.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject({
                        message: chrome.runtime.lastError,
                        statusCode: StatusCodes.RUNTIME_LAST_ERROR,
                    });
                } else if (result[key]) {
                    resolve(result[key]);
                } else {
                    reject({
                        message: 'No data for key: ' + key,
                        statusCode: StatusCodes.NO_DATA,
                    });
                }
            });
        });
    }

    /**
     * @param {string|null} domainUrl
     */
    getDomainData(domainUrl= null) {
        let urlKey = domainUrl ? this.getKeyFromUrl(domainUrl) : null;
        let query = urlKey ? [urlKey] : null;
        return new Promise((resolve, reject) => {
            this.#storage.get(query, result => {
                if (chrome.runtime.lastError) {
                    reject({
                        message: chrome.runtime.lastError,
                        statusCode: StatusCodes.RUNTIME_LAST_ERROR,
                    });
                } else if (!query) {
                    let domains = Object.values(result).filter(item => typeof item === 'object' && 'url' in item && 'type' in item.auth);
                    if (domains.length) {
                        resolve(domains);
                    } else {
                        reject({
                            message: 'No domain data.',
                            statusCode: StatusCodes.NO_DATA,
                        });
                    }
                } else if (result[urlKey]) {
                    resolve(result[urlKey])
                } else {
                    reject({
                        message: 'No data for domain: ' + domainUrl,
                        statusCode: StatusCodes.NO_DATA,
                    });
                }
            });
        });
    }

    /**
     * @param {{}} data
     * @return {Promise<>}
     */
    set(data) {
        return new Promise((resolve, reject) => {
            this.#storage.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject({
                        message: chrome.runtime.lastError,
                        statusCode: StatusCodes.RUNTIME_LAST_ERROR,
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    setByKey(key, value) {
        return new Promise((resolve, reject) => {
            this.#storage.set({[key]: value}, () => {
                if (chrome.runtime.lastError) {
                    reject({
                        message: chrome.runtime.lastError,
                        statusCode: StatusCodes.RUNTIME_LAST_ERROR,
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * @param {string} url
     * @param {{}} data
     * @return {Promise<>}
     */
    setDomainData(url, data) {
        let urlKey = this.getKeyFromUrl(url);
        return new Promise(async (resolve, reject) => {
            let domainData = {};
            try {
                domainData = await this.getDomainData(urlKey);
            } catch (e) {
                if (e.statusCode !== StatusCodes.NO_DATA) {
                    reject(e);
                }
            }
            
            mergeDeep(domainData, data);
            
            try {
                await this.setByKey(urlKey, domainData);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
    
    remove(key) {
        return new Promise((resolve, reject) => {
            this.#storage.remove(key, () => {
                if (chrome.runtime.lastError) {
                    reject({
                        message: chrome.runtime.lastError,
                        statusCode: StatusCodes.RUNTIME_LAST_ERROR,
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * @param url
     * @return string
     */
    getKeyFromUrl(url) {
        let urlObject = new URL(url);
        return urlObject.origin + '/';
    }
}
