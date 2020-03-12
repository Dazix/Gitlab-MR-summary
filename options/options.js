import StorageManagerObject from "../src/js/storageManagerObject";
import PermissionsManager from "../src/js/permissions-manager";

class Options {

    /**
     * @param {StorageManagerObject} storage
     * @param {PermissionsManager} permissionManager
     */
    constructor(storage, permissionManager) {
        this.storage = storage;
        this.permissionManager = permissionManager;
        this._init();
        this._insertRedirectUrl();
        this._observeAdd();
        this._observeUpdate();
        
        for (let input of document.querySelectorAll('.js-auth-type-input')) {
            input.addEventListener('change', evt => {
                for (let label of document.querySelectorAll('.js-auth-type-token-label')) {
                    if (label.dataset.type === evt.target.value) {
                        label.classList.add('is-active');
                    } else {
                        label.classList.remove('is-active');
                    }
                }
            });
        }
    }

    async _init() {
        try {
            this._cleanRows();
            let data = await this._loadData();
            if (data.message) return;

            for (let [index, domainSettings] of Object.entries(data)) {
                this._insertRow(
                    index,
                    domainSettings.url,
                    domainSettings.auth.type === 'private' ? 'Private token' : 'Gitlab OAuth',
                    this._obfuscateToken(domainSettings.auth.token),
                    domainSettings.dummyUsersId,
                    domainSettings.cacheTime,
                );
            }
        } catch (e) {
            console.error(e);
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
                    .catch(err => console.error(err));
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
                let showInfoRow = (message, type = 'success') => {
                    let colSpanNum = row.children.length;
                    let newRow = document.createElement('tr');
                    newRow.classList.add(`c-actual-domains__info-row`, `c-actual-domains__info-row--${type}`);
                    newRow.innerHTML = `<td colspan="${colSpanNum}" class="u-bold">${message}</td>`;

                    row.insertAdjacentElement('beforebegin', newRow);
                    setTimeout(() => newRow.remove(), 2000);
                };
                this._saveNewOrUpdateDomain(
                    evt.target.value,
                    null,
                    null,
                    dummyUsersId,
                    cacheTime
                ).then(() => {
                    showInfoRow('Successfully updated.');
                }).catch(() => {
                    showInfoRow('Failed to update values.', 'error');
                });
            }
        });
    }

    _cleanRows() {
        let tableBody = document.querySelector('.js-sites-table__body');
        tableBody.innerHTML = '';
    }

    _insertRow(index, domain, authType, token, dummyUsersId, cacheTime) {
        let tableBody = document.querySelector('.js-sites-table__body');
        tableBody.insertAdjacentHTML('afterbegin', this._renderRow(index, domain, authType, token, dummyUsersId, cacheTime));
    }

    _renderRow(index, domain, authType, token, dummyUsersId, cacheTime, fixturesArr) {
        return `<tr>
                    <td>${domain}</td>
                    <td>${authType}</td>
                    <td>${token}</td>
                    <td><input class="js-input-dummy-user-id e-input" type="text" value="${dummyUsersId ? dummyUsersId.join(',') : ''}" pattern="^(\d+,?)*$"></td>
                    <td><input class="c-actual-domains__cache-time js-input-cache-time e-input" type="number" min="1" size="3" value="${cacheTime}"></td>
                    <td class="c-hover-popup">
                        <span class="e-action">select</span>
                        <div class="c-hover-popup__content">
                            <div class="c-form-cell c-form-cell--inline">
                                <input class="e-input" id="fixture__commits-count-${index}" type="checkbox" value="commits-count" name="fixtures">
                                <label for="fixture__commits-count-${index}" class="e-input e-input--faux" aria-hidden="true"></label>
                                <label for="fixture__commits-count-${index}" class="u-text-no-wrap c-form-cell__label u-epsilon">Show commits count in merge button</label>
                            </div>
                            <div class="c-form-cell c-form-cell--inline">
                                <input class="e-input" id="fixture__ci-cd-textarea-${index}" type="checkbox" value="ci-cd-textarea" name="fixtures">
                                <label for="fixture__ci-cd-textarea-${index}" class="e-input e-input--faux" aria-hidden="true"></label>
                                <label for="fixture__ci-cd-textarea-${index}" class="u-text-no-wrap c-form-cell__label u-epsilon">Expand CI/CD secrets textarea</label>
                            </div>
                            <div class="c-form-cell c-form-cell--inline">
                                <input class="e-input" id="fixture__auto-check-delete-branch-${index}" type="checkbox" value="auto-check-merge" name="fixtures">
                                <label for="fixture__auto-check-delete-branch-${index}" class="e-input e-input--faux" aria-hidden="true"></label>
                                <label for="fixture__auto-check-delete-branch-${index}" class="u-text-no-wrap c-form-cell__label u-epsilon">Automatically check delete source branch in new-mergerequest page</label>
                            </div>
                        </div>
                    </td>
                    <td class="c-actual-domains__buttons">
                        <button class="c-actual-domains__button js-update-button e-button e-button--positive" name="update" value="${domain}">UPDATE</button>
                        <button class="c-actual-domains__button js-del-button e-button e-button--negative" name="del" value="${domain}">DELETE</button>
                    </td>
                </tr>`;
    }

    _obfuscateToken(token) {
        return token.substr(0, 2) + '*****' + token.substr(token.length - 2, token.length);
    }

    async _saveNewOrUpdateDomain(domain, authType, token, dummyUsersId, cacheTime) {
        try {
            let data = {};
            let auth = {};
            if (authType || token) {
                authType && (auth.type = authType);
                token && (auth.token = token);
                data.auth = auth;
            }
            data.dummyUsersId = dummyUsersId;
            data.cacheTime = cacheTime;
            data.url = domain;
            
            await this._saveData(domain, data);
        } catch (e) {
            console.error(e);
        }
    }

    async _deleteDomain(domain) {
        return await this.storage.remove(this.storage.getKeyFromUrl(domain));
    }
    
    async _loadData() {
        let domains = [];
        try {
            domains = await this.storage.getDomainData();
        } catch (e) {}
        
        return domains;
    }

    async _saveData(url, data) {
        await this.storage.setDomainData(url, data);
    }

}

let storage = new StorageManagerObject();
new Options(storage, new PermissionsManager());

storage.set({options_shown: true});
