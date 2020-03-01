import Messenger from "./messenger";
import Downloader from "./downloader";
import StatusCodes from "./statusCodes";
import {LockAlreadySetError, OAuthAuthenticationFailedError} from "./errors";
import Lock from "./lock";
import StorageManagerObject from "./storageManagerObject";
import Data from "./data";


chrome.runtime.onInstalled.addListener((details) => {
    let storage = new StorageManagerObject();
    if (details.reason === 'update') {
        storage.get('domains')
            .then(domains => {
                if (domains.length) {
                    let data = {};
                    for (let domain of domains) {
                        domain.cacheTime = 5;
                        data[storage.getKeyFromUrl(domain.url)] = domain;
                    }
                    return data;
                }
            })
            .then(newDomainsData => storage.set(newDomainsData))
            .then(() => storage.remove('domains'))
            .catch((err) => {
                console.debug(err);
            });
    }
    storage.get('options_shown')
        .catch(e => {
            if (e.statusCode === StatusCodes.NO_DATA) {
                chrome.runtime.openOptionsPage();
            }
        });
});

chrome.webNavigation.onDOMContentLoaded.addListener(async details => {
    let data = null;
    try {
        data = await getDomainData(details.url);
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
        switch (message.command) {
            case Messenger.GET_DOMAIN_DATA:
                getDomainData(sender.url).then(domainData => {
                    // send only metadata not token etc.
                    sendResponse(domainData.data);
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
                            sendResponse(downloadedData.getAsSimpleDataObject());
                            sendUpdatedDataToTabs(sender.url, downloadedData);
                        }).catch(e => {
                            if (e instanceof LockAlreadySetError) {
                                sendResponse({
                                    message: 'Download already in progress.',
                                    statusCode: StatusCodes.DOWNLOAD_ALREADY_IN_PROGRESS,
                                });
                            } else {
                                throw e;
                            }
                        }).finally(async () => {
                            await lock.unset(url.origin + '_data_download');
                        });
                });
                break;
            case Messenger.SYNC_DATA_OVER_TABS:
                sendUpdatedDataToTabs(sender.url, message.data);
                sendResponse(true);
                break;
        }
    }
    return true;
});

/**
 * @param {string} url
 * @param {Data|{mergeRequests: (*[]), user: ({groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}), age: (string)}} data
 */
function sendUpdatedDataToTabs(url, data) {
    let urlObject = new URL(url);
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            // send data only to tabs that begins with given url
            if (tab.url && tab.url.indexOf(urlObject.origin) === 0) {
                chrome.tabs.sendMessage(tab.id, {mergeRequestsDataForUpdate: (data instanceof Data ? data.getAsSimpleDataObject() : data)});
            }
        }
    });
}

async function getDomainData(usersUrl) {
    let storage = new StorageManagerObject();
    if (usersUrl.indexOf('oauth/authorize') !== -1) {
        // ignore endpoint oauth/authorize (prevent auth cycling)
        return {authPending: true};
    }
    let domainData = await storage.getDomainData(usersUrl);
        
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

async function gitlabOAuthAuthentication(domainData) {
    let redirectUrl = chrome.identity.getRedirectURL();
    let authUrl = `${domainData.url}/oauth/authorize?client_id=${domainData.token}&redirect_uri=${redirectUrl}&response_type=token&state=YOUR_UNIQUE_STATE_HASH`;
    let gitlabAccessTokenKey = 'gitlab-access-token_' + authUrl;
    let storage = new StorageManagerObject();
    
    if (domainData.oAuth && domainData.oAuth.expireAt >= Date.now()) {
        return domainData.oAuth.token;
    } else {
        let authFlowRedirectUrl = await new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({url: authUrl, interactive: true}, authFlowRedirectUrl => {
                if (!authFlowRedirectUrl) {
                    reject({message: chrome.runtime.lastError, statusCode: StatusCodes.RUNTIME_LAST_ERROR});
                } else {
                    resolve(authFlowRedirectUrl);
                }
            });
        });

        let url = new URL(authFlowRedirectUrl),
            urlParams = new URLSearchParams(url.hash.substr(1)),
            accessToken = urlParams.get('access_token'),
            expiresIn = urlParams.get('expires_in');

        if (accessToken) {
            domainData.oAuth = {
                token: accessToken,
                expireAt: Date.now() + expiresIn * 1000,
            };
            await storage.set(domainData);
            
            return {token: accessToken, type: 'oauth'};
        } else {
            throw new OAuthAuthenticationFailedError('Authentication failed.')
        }
        
        
    }
    
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
