class Options {

    /**
     * @param storage
     * @param {PermissionsManagerClass} permissionManager
     */
    constructor(storage, permissionManager) {
        this.storage = storage;
        this.permissionManager = permissionManager;
        this._init();
        this._insertRedirectUrl();
        this._observeAdd();
        this._observeDel();
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
                    this._obfuscateToken(domainSettings.token)
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
                this.permissionManager.check([], [domainUrl])
                    .then(res => {
                        if (res.origin.required.length) {
                            return this.permissionManager.request([], res.origin.required);
                        }
                        return Promise.resolve();
                    }).then(this._saveNewDomain.call(this, domainUrl, formData.get('auth_type'), formData.get('token')))
                    .then(this._init.bind(this))
                    .then(() => form.reset())
                    .catch(err => console.debug(err))
//                 form.reset();
            }
        });
    }

    _observeDel() {
        let form = document.querySelector('.js-form-del');
        form.addEventListener('click', evt => {
            if (evt.target.classList.contains('js-del-button')) {
                evt.preventDefault();
                this._deleteDomain(evt.target.value)
                    .then(this.permissionManager.remove.call(this, [], [evt.target.value]))
                    .then(this._init.bind(this));
            }
        });
    }

    _cleanRows() {
        let tableBody = document.querySelector('.js-sites-table__body');
        tableBody.innerHTML = '';
    }

    _insertRow(domain, authType, token) {
        let tableBody = document.querySelector('.js-sites-table__body');
        tableBody.insertAdjacentHTML('afterbegin', this._renderRow(domain, authType, token));
    }

    _renderRow(domain, authType, token) {
        return `<tr>
                    <td>${domain}</td>
                    <td>${authType}</td>
                    <td>${token}</td>
                    <td><button class="js-del-button e-button e-button--negative" name="del" value="${domain}">delete</button></td>
                </tr>`;
    }

    _obfuscateToken(token) {
        return token.substr(0, 4) + '*****' + token.substr(token.length - 4, token.length);
    }

    _saveNewDomain(domain, authType, token) {
        return this._loadData()
            .then(data => {
                let updated = false;
                for (let domainData of data) {
                    if (domainData.url === domain) {
                        domainData.token = token;
                        domainData.authType = authType;
                        updated = true;
                    }
                }

                if (!updated) {
                    data.push({
                        url: domain,
                        authType: authType,
                        token: token,
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

let options = new Options(chrome.storage.local, PermissionsManager);

chrome.storage.local.set({options_shown: true});
