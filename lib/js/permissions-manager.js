var PermissionsManagerClass = PermissionsManagerClass || class PermissionsManagerClass {

    /**
     * @param {string[]} permissions
     * @param {string[]} origins
     *
     * @returns {Promise<{permission: {granted: String[], required: String[]}, origin: {granted: String[], required: String[]}}>}
     */
    check(permissions = [], origins = []) {
        return new Promise(resolve => {
            let promises = [];
            permissions.forEach(permission_string => {
                let promise = new Promise(resolve1 => {
                    chrome.permissions.contains({
                        permissions: [permission_string],
                        // origins: ['http://www.google.com/']
                    }, result => {
                        resolve1({
                            permission: permission_string,
                            enabled: !!result,
                            type: 'permission',
                        });
                    });
                });

                promises.push(promise);
            });
            origins.forEach(permission_string => {
                let promise = new Promise(resolve1 => {
                    chrome.permissions.contains({
                        // permissions: [permission_string],
                        origins: [permission_string]
                    }, result => {
                        resolve1({
                            permission: permission_string,
                            enabled: !!result,
                            type: 'origin',
                        });
                    });
                });

                promises.push(promise);
            });

            Promise.all(promises).then(results => {
                let returnData = {
                    permission: {
                        granted: [],
                        required: [],
                    },
                    origin: {
                        granted: [],
                        required: [],
                    }
                };
                results.forEach(result => {
                    if (result.enabled) {
                        returnData[result.type].granted.push(result.permission);
                    } else {
                        returnData[result.type].required.push(result.permission);
                    }
                });

                resolve(returnData);
            })
        });
    }

    /**
     * @param {string[]} permissions
     * @param {string[]} origins
     *
     * @returns {Promise<>}
     */
    request(permissions = [], origins = []) {
        return new Promise((resolve, reject) => {
            let requiredPermissions = {};
            if (permissions.length) {
                requiredPermissions.permissions = permissions;
            }
            if (origins.length) {
                requiredPermissions.origins = origins
            }
            chrome.permissions.request(
                requiredPermissions,
                granted => {
                    if (granted) {
                        resolve();
                    } else {
                        reject();
                    }
                });
        });
    }

    /**
     * @param {string[]} permissions
     * @param {string[]} origins
     *
     * @returns {Promise<>}
     */
    remove(permissions = [], origins = []) {
        return new Promise((resolve, reject) => {
            chrome.permissions.remove({
                permissions: permissions,
                origins: origins,
            }, removed => {
                if (removed) {
                    resolve(removed);
                } else {
                    reject({message: 'try to remove required permission.'})
                }
            });
        });
    }
};

var PermissionsManager = PermissionsManager || new PermissionsManagerClass();

