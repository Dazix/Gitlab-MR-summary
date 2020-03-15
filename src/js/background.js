import Messenger from "./messenger";
import Downloader from "./downloader";
import StatusCodes from "./statusCodes";
import {LockAlreadySetError, OAuthAuthenticationFailedError} from "./errors";
import Lock from "./lock";
import StorageManagerObject from "./storageManagerObject";
import Data from "./data";
import {sleep} from "./utils";
import {getAvailableFixture} from "./fixtures";


chrome.runtime.onInstalled.addListener((details) => {
    let storage = new StorageManagerObject();
    if (details.reason === 'update') {
        // fix compatibility with new version
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
        // end - fix compatibility with new version

        let newVersion = chrome.runtime.getManifest().version;
        storage.get(`changelog_shown`)
            .then(lastChangelogVersion => {
                let removeFixPart = version => version.substr(0, version.lastIndexOf('.')); 
                
                if (removeFixPart(newVersion) !== removeFixPart(lastChangelogVersion)) {
                    chrome.tabs.create({url: chrome.extension.getURL('changelog/index.html')});
                }
            })
            .catch(e => {
                if (e.statusCode === StatusCodes.NO_DATA) {
                    chrome.tabs.create({url: chrome.extension.getURL('changelog/index.html')});
                }
            })
            .finally(() => {
                storage.set({changelog_shown: newVersion});
            });
    }
    storage.get('options_shown')
        .catch(e => {
            if (e.statusCode === StatusCodes.NO_DATA) {
                chrome.runtime.openOptionsPage();
            }
        });
});

chrome.webRequest.onCompleted.addListener(webRequestsCallback, {urls: ['<all_urls>']});
chrome.webRequest.onBeforeRedirect.addListener(webRequestsCallback, {urls: ['<all_urls>']});

async function webRequestsCallback(details) {
    let domainData = null;
    try {
        domainData = await getDomainData(details.url);
        if (domainData.token) {
            let requestUrl = new URL(details.url);
            let downloader = new Downloader(domainData);
            let storage = new StorageManagerObject();
            let dataObject = new Data(domainData.data.mergeRequestsData);

            // create mergeRequest
            let matches = requestUrl.pathname.match(/^\/(\S+)\/-\/merge_requests$/);
            if (matches && matches[1] && details.method.toLowerCase() === 'post') {
                let projectNameWithPath = matches[1];
                let newMergeRequests = await downloader.getMergeRequestsDataForProject(projectNameWithPath);
                dataObject.updateMergeRequestsByNew(newMergeRequests);
                
                await storage.setDomainData(details.url, dataObject.getAsSimpleDataObject());
                await sleep(2000); // give some time to page load
                sendUpdatedDataToTabs(details.url, dataObject.getAsSimpleDataObject());
                
                return; 
            }
            
            // merge mergeRequest
            matches = requestUrl.pathname.match(/^\/(\S+)\/-\/merge_requests\/(\d+)\/merge$/);
            if (matches
                && details.method.toLowerCase() === 'post'
                && details.statusCode >= 200 && details.statusCode < 300
            ) {
                let [path, projectPathWithNamespace, mergeRequestIid] = matches;
                dataObject.mergeRequests = dataObject.mergeRequests
                    .filter(mergeRequest => mergeRequest.project.pathWithNamespace !== projectPathWithNamespace && mergeRequest.iid !== mergeRequestIid);
                
                await storage.setDomainData(details.url, dataObject.getAsSimpleDataObject());
                sendUpdatedDataToTabs(details.url, dataObject.getAsSimpleDataObject());
                
                return;
            }
            
            matches = requestUrl.pathname.match(/^\/api\/v4\/projects\/(\d+)\/merge_requests\/(\d+)\/(approve|unapprove)$/);
            if (matches
                && details.method.toLowerCase() === 'post'
                && details.statusCode >= 200 && details.statusCode < 300
            ) {
                let [path, projectId, mergeRequestIid, action] = matches;
                for (let mergeRequest of dataObject.mergeRequests) {
                    if (mergeRequest.project.id === parseInt(projectId)
                        && mergeRequest.iid === parseInt(mergeRequestIid)
                    ) {
                        mergeRequest.approvedByUser = action === 'approve';
                        break;
                    }
                }
                
                await storage.setDomainData(details.url, dataObject.getAsSimpleDataObject());
                sendUpdatedDataToTabs(details.url, dataObject.getAsSimpleDataObject());
                
                return;
            }
        }
    } catch (e) {
        console.debug(e);
    }
}

chrome.webNavigation.onDOMContentLoaded.addListener(async details => {
    let domainData = null;
    try {
        domainData = await getDomainData(details.url);
        if (domainData) {
            if (domainData.token) {
                await executeScript(details.tabId, 'gitlab-mr-summary.js')
                    .then(() => insertCss(details.tabId, 'gitlab-mr-summary.css'));
            }

            if (domainData.data.fixtures
                && domainData.data.fixtures.length
            ) {
                let fixturesToRun = getAvailableFixture(domainData.data.fixtures, details.url),
                    promises = [];
                for (let fileName of fixturesToRun) {
                    promises.push(executeScript(details.tabId, `fixtures/${fileName}`));
                }
                await Promise.all(promises);
            }
        }
    } catch (e) {
        console.debug(e);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.command) {
        let storage = new StorageManagerObject();
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
                            return storage.setDomainData(sender.url, {mergeRequestsData: downloadedData.getAsSimpleDataObject()});
                        })
                        .then()
                        .catch(e => {
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
                storage.setDomainData(sender.url, {mergeRequestsData: message.data})
                    .then(() => {
                        sendUpdatedDataToTabs(sender.url, message.data);
                        sendResponse(true);
                    });
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

/**
 * @param usersUrl
 * @return {Promise<{data: {url: string, dummyUsersId: number[], cacheTime: number, mergeRequestsData: {mergeRequests: (*[]), user: ({groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}), age: (string)}}, type: string, token: string}|{authPending: boolean}>}
 */
async function getDomainData(usersUrl) {
    let storage = new StorageManagerObject();
    if (usersUrl.indexOf('oauth/authorize') !== -1) {
        // ignore endpoint oauth/authorize (prevent auth cycling)
        return {authPending: true};
    }
    let domainData = await storage.getDomainData(usersUrl);
        
    let authData = domainData.auth;

    delete domainData['auth'];

    let returnData = {
        token: null,
        type: null,
        data: domainData,
    };

    if (authData.token) {
        if (authData.type === 'private') {
            returnData.token = authData.token;
            returnData.type = authData.type;
        } else {
            let oAuthData = await gitlabOAuthAuthentication(domainData.url, authData);
            Object.assign(returnData, oAuthData);
        }
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

async function gitlabOAuthAuthentication(domainUrl, authData) {
    let redirectUrl = chrome.identity.getRedirectURL();
    let authUrl = `${domainUrl}/oauth/authorize?client_id=${authData.token}&redirect_uri=${redirectUrl}&response_type=token&state=YOUR_UNIQUE_STATE_HASH`;
    let storage = new StorageManagerObject();
    let accessToken;
    
    if (authData && authData.expireAt >= Date.now()) {
        accessToken = authData.accessToken;
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
            _accessToken = urlParams.get('access_token');

        if (_accessToken) {
            Object.assign(authData, {
                accessToken: _accessToken,
                expireAt: Date.now() + 3600 * 1000,
            });
            await storage.setDomainData(domainUrl, {auth: authData});
            
            accessToken = _accessToken;
        } else {
            throw new OAuthAuthenticationFailedError('Authentication failed.')
        }
    }

    return {token: accessToken, type: authData.type};
}
