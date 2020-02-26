import User from './user'


chrome.runtime.onInstalled.addListener((details) => {
    let a = new User();
    a.test = 1;
    chrome.storage.local.get(['options_shown'], res => {
        if (!res['options_shown']) {
            chrome.runtime.openOptionsPage();
        }
    });
});

chrome.webNavigation.onDOMContentLoaded.addListener(async details => {
    let tabUrl = new URL(details.url);
    let data = null;
    try {
        data = await getDomainData(tabUrl.origin + '/');
        if (data) {
            await executeScript(details.tabId, 'gitlab-mr-summary.js')
                .then(() => insertCss(details.tabId, 'gitlab-mr-summary.css'))
        }
    } catch (e) {
        console.debug(e);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.command) {
        if (message.command === 'gitlabOauth') {
            let url = new URL(sender.url);
            if (url.pathname.indexOf('oauth/authorize') !== -1) {
                // ignore endpoint oauth/authorize (prevent auth cycling)
                sendResponse({authPending: true});
                return false;
            }
            getDomainData(url.origin + '/')
                .then(domainData => {
                    if (domainData.authType === 'private') {
                        return {
                            token: domainData.token,
                            type: domainData.authType,
                        };
                    } else {
                        let redirectUri = chrome.identity.getRedirectURL(),
                            appID = domainData.token,
                            authUrl = `${domainData.url}/oauth/authorize?client_id=${appID}&redirect_uri=${redirectUri}&response_type=token&state=YOUR_UNIQUE_STATE_HASH`;
                        return gitlabOAuthAuthentication(authUrl);
                    }
                })
                .then(accessToken => sendResponse(accessToken))
                .catch(message => sendResponse({message: message}));
        }
    }
    return true;
});

function executeScript(tabId, filePath) {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(tabId, {file: filePath}, () => {
            resolve()
        });
    });
}

function insertCss(tabId, filePath) {
    return new Promise((resolve, reject) => {
        chrome.tabs.insertCSS(tabId, {file: filePath}, () => {
            resolve()
        });
    });
}

function getDomainData(domainUrl) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['domains'], result => {
            if (result['domains']) {
                for (let domain of result['domains']) {
                    if (domain.url === domainUrl) {
                        resolve(domain);
                    }
                }
                reject('No data for domain: ' + domainUrl);
            }
        });
    });
}

function gitlabOAuthAuthentication(authUrl) {
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
                    redirectUrl => {
                        if (!redirectUrl) {
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        let url = new URL(redirectUrl),
                            urlParams = new URLSearchParams(url.hash.substr(1)),
                            accessToken = urlParams.get('access_token'),
                            expiresIn = urlParams.get('expires_in');

                        if (accessToken) {
                            chrome.storage.local.set(
                                {
                                    [gitlabAccessTokenKey]: {
                                        token: accessToken,
                                        expireAt: Date.now() + expiresIn * 1000
                                    }
                                });

                            resolve({token: accessToken, type: 'oauth',});
                        } else {
                            reject('Authentication failed.');
                        }
                    });
            }
        });
    });
}
