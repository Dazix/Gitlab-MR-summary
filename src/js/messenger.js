export default class Messenger {

    static GET_DOMAIN_DATA = 'get_domain_data';
    static DOWNLOAD_DATA = 'download_data';
    static SYNC_DATA_OVER_TABS = 'sync_data_over_tabs';
    
    #callbacks;
    
    constructor() {
        this.#callbacks = [];
        chrome.runtime.onMessage.addListener(this._onMessage.bind(this));
    }
    
    /**
     * @returns Promise<>
     */
    static send(messageId, data = {}) {
        return new Promise((resolve, reject) => {
            let messageData = {
                command: messageId,
                data: data
            };

            chrome.runtime.sendMessage(messageData, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * @param {function} callback
     */
    set onMessageCallback(callback) {
        this.#callbacks.push(callback);
    }
    
    _onMessage(message, sender, sendResponse) {
        for (let callback of this.#callbacks) {
            if (typeof callback === 'function') {
                callback(message, sender, sendResponse);
            }
        }
    }
}
