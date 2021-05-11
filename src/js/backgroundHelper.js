import StorageManagerObject from "./storageManagerObject.js";
import StatusCodes from "./statusCodes.js";
import {OAuthAuthenticationFailedError} from "./errors.js";

/**
 * @param usersUrl
 * @return {Promise<{data: {url: string, dummyUsersId: number[], cacheTime: number, removeActualUserFromParticipantsView: boolean, mergeRequestsData: {mergeRequests: (*[]), user: ({groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}), age: (string)}}, type: string, token: string}|{authPending: boolean}>}
 */
export const getDomainData = async (usersUrl) => {
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
};

const gitlabOAuthAuthentication = async (domainUrl, authData) => {
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
