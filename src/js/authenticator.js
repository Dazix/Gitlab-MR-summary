export default class Authenticator {

    /**
     * @returns Promise<{{ token: String, type: String }}>
     */
    static authenticate() {
        return new Promise((resolve, reject) => {
            let messageData = {
                command: 'gitlabOauth',
            };

            chrome.runtime.sendMessage(messageData, response => {
                if (response.token) {
                    resolve(response);
                } else if (response.authPending) {
                    // silently ignore
                } else {
                    reject(response.message);
                }
            });
        });
    }
}
