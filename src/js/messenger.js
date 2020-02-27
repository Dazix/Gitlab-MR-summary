export default class Messenger {

    static GET_DOMAIN_DATA = 'get_domain_data';
    static DOWNLOAD_DATA = 'download_data';
    
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
}
