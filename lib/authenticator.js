class Authenticator {

    /**
     * @returns Promise<{{ accessToken: String }}>
     */
    static authenticate() {
        return new Promise((resolve, reject) => {
            let messageData = {
                command: 'gitlabOauth',
            };

            chrome.runtime.sendMessage(messageData, response => {
                if (response.data) {
                    resolve({ accessToken: response.data });
                } else {
                    reject(response.message);
                }
            });
        });
    }
}

export default Authenticator;