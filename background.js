chrome.runtime.onInstalled.addListener((details) => {
    chrome.storage.local.get(['options_shown'], (res) => {
        if (!res['options_shown']) {
            chrome.runtime.openOptionsPage();
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.command) {
        if (message.command === 'gitlabOauth') {
            let redirectUri = 'https://nafdpejedjnkfnophlmfhacmcdajfdeh.chromiumapp.org',
                appID = 'c84910d463b3870111cdf0adb70bebfbfcae7ea34c21f5bed21676e1b2e62d9f',
                authUrl = `https://gitlab.heu.cz/oauth/authorize?client_id=${appID}&redirect_uri=${redirectUri}&response_type=token&state=YOUR_UNIQUE_STATE_HASH`;
            gitlabAuthentication(authUrl)
                .then(accessToken => sendResponse({data: accessToken}))
                .catch(message => sendResponse({message: message}));
        }
    }
    return true;
});

function gitlabAuthentication(authUrl) {
    let gitlabAccessTokenKey = 'gitlab-access-token_' + authUrl,
        validTimeTimestamp = 1000 * 60 * 60 * 24 * 2; // 2 days

    return new Promise((resolve, reject) => {
        chrome.storage.local.get([gitlabAccessTokenKey], (res) => {
            if (res.hasOwnProperty(gitlabAccessTokenKey) && res[gitlabAccessTokenKey].expireAt >= Date.now()) {
                resolve(res[gitlabAccessTokenKey].token);
            } else {
                chrome.identity.launchWebAuthFlow(
                    {
                        url: authUrl,
                        interactive: true
                    },
                    function (redirectUrl) {
                        let url = new URL(redirectUrl),
                            urlParams = new URLSearchParams(url.hash.substr(1)),
                            accessToken = urlParams.get('access_token');

                        if (accessToken) {
                            chrome.storage.local.set(
                                {
                                    [gitlabAccessTokenKey]: {
                                        token: accessToken,
                                        expireAt: Date.now() + validTimeTimestamp
                                    }
                                });

                            resolve(accessToken);
                        } else {
                            reject('Authentication failed.');
                        }
                    });
            }
        });
    });
}