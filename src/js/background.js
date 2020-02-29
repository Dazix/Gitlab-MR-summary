import User from './user'
import Messenger from "./messenger";
import Downloader from "./downloader";
import ErrorCodes from "./errorCodes";
import {LockAlreadySetError} from "./errors";
import Lock from "./lock";


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
        data = await getStoredDomainData(tabUrl.origin + '/');
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
        let domainData = null;
        switch (message.command) {
            case Messenger.GET_DOMAIN_DATA:
                getDomainData(sender.url).then(domainData => {
                    // send only metadata not token etc.
                    sendResponse({data: domainData.data});
                });
                break;
            case Messenger.DOWNLOAD_DATA:
                getDomainData(sender.url).then(domainData => {
                    let url = new URL(sender.url),
                        lock  = new Lock(),
                        downloader = new Downloader(domainData);
                    
                    lock.set(url.origin + '_data_download')
                        .then(() => downloader.getData())
                        .then(downloadedData => {
                            return lock.unset(url.origin + '_data_download')
                                .then(() => {
                                    sendResponse(downloadedData.getAsSimpleDataObject());
                                    sendUpdatedDataToTabs(sender.url, downloadedData);
                                });
                        }).catch(e => {
                            if (e instanceof LockAlreadySetError) {
                                sendResponse({
                                    message: 'Download already in progress.',
                                    code: ErrorCodes.DOWNLOAD_ALREADY_IN_PROGRESS,
                                });
                            } else {
                                throw e;
                            }
                        }).finally(async () => {
                            await lock.unset(url.origin + '_data_download');
                        });
                });
                break;
        }
    }
    return true;
});

/**
 * @param {string} url
 * @param {Data} data
 */
function sendUpdatedDataToTabs(url, data) {
    let urlObject = new URL(url);
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            // send data only to tabs that begins with given url
            if (tab.url && tab.url.indexOf(urlObject.origin) === 0) {
                chrome.tabs.sendMessage(tab.id, {mergeRequestsDataForUpdate: data.getAsSimpleDataObject()});
            }
        }
    });
}

async function getDomainData(usersUrl) {
    let url = new URL(usersUrl);
    if (url.pathname.indexOf('oauth/authorize') !== -1) {
        // ignore endpoint oauth/authorize (prevent auth cycling)
        return {authPending: true};
    }
    let domainData = await getStoredDomainData(url.origin + '/');
        
    let authType = domainData.authType;
    let token = domainData.token;

    delete domainData['token'];
    delete domainData['authType'];

    let returnData = {
        token: null,
        type: null,
        data: domainData,
    };

    if (authType === 'private') {
        returnData.token = token;
        returnData.type = authType;
    } else {
        let redirectUri = chrome.identity.getRedirectURL(),
            appID = token,
            authUrl = `${domainData.url}/oauth/authorize?client_id=${appID}&redirect_uri=${redirectUri}&response_type=token&state=YOUR_UNIQUE_STATE_HASH`;
        let oAuthData = await gitlabOAuthAuthentication(authUrl);
        Object.assign(returnData, oAuthData);
    }

    return returnData;
}

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

function getStoredDomainData(domainUrl) {
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
                            resolve({token: accessToken, type: 'oauth'});
                        } else {
                            reject('Authentication failed.');
                        }
                    });
            }
        });
    });
}
