import PermissionsManager from "../js/permissions-manager.js";

class Options {

    /**
     * @param storage
     * @param {PermissionsManager} permissionManager
     */
    constructor(storage, permissionManager) {
        this.storage = storage;
        this.permissionManager = permissionManager;
        this._init();
        this._insertRedirectUrl();
        this._observeAdd();
        this._observeUpdate();
    }

    async _init() {
        try {
            this._cleanRows();
            let data = await this._loadData();
            if (data.message) return;

            for (let domainSettings of data) {
                this._insertRow(
                    domainSettings.url,
                    domainSettings.authType === 'private' ? 'Private token' : 'Gitlab OAuth',
                    this._obfuscateToken(domainSettings.token),
                    domainSettings.dummyUsersId,
                    domainSettings.cacheTime,
                );
            }
        } catch (e) {
            console.log(e);
        }
    }

    _insertRedirectUrl() {
        let redirectUrlElm = document.querySelector('.js-redirect-url');
        let redirectUrl = chrome.identity.getRedirectURL();
        redirectUrlElm.innerHTML = `${redirectUrl}<input type="text" class="u-visually-hide" value="${redirectUrl}"><button type="button" class="c-copy-button e-button u-micro">COPY</button>`;
        redirectUrlElm.querySelector('button').addEventListener('click', (evt) => {
            redirectUrlElm.querySelector('input').select();
            document.execCommand("copy");
        });
    }

    _observeAdd() {
        let form = document.querySelector('.js-form-add');
        form.addEventListener('submit', evt => {
            evt.preventDefault();
            let formData = new FormData(form);
            let domainInput = document.querySelector('.js-form-add__domain');
            let tokenInput = document.querySelector('.js-form-add__token');
            if (domainInput.checkValidity() && tokenInput.checkValidity()) {
                let domainUrl = (new URL(formData.get('domain'))).toString();
                let dummyUsersId = formData.get('dummy-users-id') ? formData.get('dummy-users-id').split(',').map(id => parseInt(id)) : [];
                let saveDomain = () => {
                    return this._saveNewOrUpdateDomain(
                        domainUrl,
                        formData.get('auth_type'),
                        formData.get('token'),
                        dummyUsersId,
                        parseInt(formData.get('cache-time'))
                    );
                };
                this.permissionManager.request([], [domainUrl])
                    .then(saveDomain.bind(this))
                    .then(this._init.bind(this))
                    .then(() => form.reset())
                    .catch(err => console.debug(err));
            }
        });
    }

    _observeUpdate() {
        let form = document.querySelector('.js-form-actual-settings');
        form.addEventListener('click', evt => {
            if (evt.target.classList.contains('js-del-button')) {
                evt.preventDefault();
                let remove = () => {
                    return this.permissionManager.remove([], [evt.target.value]);
                };
                this._deleteDomain(evt.target.value)
                    .then(remove.bind(this))
                    .then(this._init.bind(this));
            } else if (evt.target.classList.contains('js-update-button')) {
                evt.preventDefault();
                let row = evt.target.closest('tr');
                let dummyUsersId = row.querySelector('.js-input-dummy-user-id').value;
                dummyUsersId = dummyUsersId ? dummyUsersId.split(',').map(id => parseInt(id)) : [];
                let cacheTime = parseInt(row.querySelector('.js-input-cache-time').value);
                this._saveNewOrUpdateDomain(
                    evt.target.value,
                    null,
                    null,
                    dummyUsersId,
                    cacheTime
                ).then()
            }
        });
    }

    _cleanRows() {
        let tableBody = document.querySelector('.js-sites-table__body');
        tableBody.innerHTML = '';
    }

    _insertRow(domain, authType, token, dummyUsersId, cacheTime) {
        let tableBody = document.querySelector('.js-sites-table__body');
        tableBody.insertAdjacentHTML('afterbegin', this._renderRow(domain, authType, token, dummyUsersId, cacheTime));
    }

    _renderRow(domain, authType, token, dummyUsersId, cacheTime) {
        return `<tr>
                    <td>${domain}</td>
                    <td>${authType}</td>
                    <td>${token}</td>
                    <td><input class="js-input-dummy-user-id e-input" type="text" value="${dummyUsersId ? dummyUsersId.join(',') : ''}" pattern="^(\d+,?)*$"></td>
                    <td><input class="c-actual-domains__cache-time js-input-cache-time e-input" type="number" min="1" size="3" value="${cacheTime}"></td>
                    <td class="c-actual-domains__buttons">
                        <button class="c-actual-domains__button js-update-button e-button e-button--positive" name="update" value="${domain}">UPDATE</button>
                        <button class="c-actual-domains__button js-del-button e-button e-button--negative" name="del" value="${domain}">DELETE</button>
                    </td>
                </tr>`;
    }

    _obfuscateToken(token) {
        return token.substr(0, 4) + '*****' + token.substr(token.length - 4, token.length);
    }

    _saveNewOrUpdateDomain(domain, authType, token, dummyUsersId, cacheTime) {
        return this._loadData()
            .then(data => {
                let updated = false;
                for (let domainData of data) {
                    if (domainData.url === domain) {
                        if (token && authType) {
                            domainData.token = token;
                            domainData.authType = authType;
                        }
                        domainData.dummyUsersId = dummyUsersId;
                        domainData.cacheTime = cacheTime;
                        updated = true;
                    }
                }

                if (!updated) {
                    data.push({
                        url: domain,
                        authType: authType,
                        token: token,
                        dummyUsersId: dummyUsersId,
                        cacheTime: cacheTime,
                    });
                }

                return data;
            }).then(this._saveData.bind(this))
            .catch(err => console.error(err));
    }

    _deleteDomain(domain) {
        return this._loadData()
            .then(data => data.filter(domainData => domainData.url !== domain))
            .then(this._saveData.bind(this))
            .catch(err => console.error(err));
    }
    
    _loadData() {
        return new Promise((resolve, reject) => {
            this.storage.get(['domains'], result => {
                if (result['domains']) {
                    resolve(result['domains']);
                } else {
                    resolve([])
                }
            });
        });
    }

    _saveData(data) {
        return new Promise((resolve, reject) => {
            this.storage.set({domains: data}, res => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            })
        });
    }

}

new Options(chrome.storage.local, new PermissionsManager());

chrome.storage.local.set({options_shown: true});
