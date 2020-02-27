import Data from "./data";
import Downloader from "./downloader";
import HTMLContent from "./htmlContent";
import Storage from "./storage"
import Authenticator from "./authenticator";

class GitlabMRSummary {

    #storageKey = 'mergeRequestsData';
    
    /** @type {Downloader} */
    #downloader;

    /** @type {HTMLContent} */
    #htmlGenerator;
    
    /** @type {Storage} */
    #storage;
    
    /** @type {{token: string, type: string, data: {token: string, authType: string, url: string, dummyUsersId: number[], cacheTime: number}}} */
    #domainData;
    
    /**
     * @param {{token: string, type: string, data: {token: string, authType: string, url: string, dummyUsersId: number[], cacheTime: number}}} domainData
     * @param {Downloader} downloader
     * @param {HTMLContent} htmlGenerator
     * @param {Storage} storage
     */
    constructor(domainData, downloader, htmlGenerator, storage) {
        this.#downloader = downloader;
        this.#htmlGenerator = htmlGenerator;
        this.#storage = storage;
        this.#domainData = domainData;

        this._showSpinnerIcon();
        this._observeMenuActions();
    }

    async run() {
        let data = await this.getData();
        this._show(data);
        this._observeUsersActions();
    }

    /**
     * @param {Data} data
     * @private
     */
    _show(data) {
        data.mergeRequests = this._removeParticipantsFromMergeRequestsByIds(
            data.mergeRequests,
            [data.user.id].concat(this.#domainData.data.dummyUsersId),
        );

        let html = this.#htmlGenerator.renderList(data);
        this._getMenuEntry().querySelector('.js-gitlab-mr-summary__data-cont').innerHTML = html;

        this._showClassicIcon();
        this._updateMergeRequestsCount(data.nonUsersMergeRequestsNotApproved.length);
    }

    /**
     * @param forceLoad
     * @return {Data}
     */
    async getData(forceLoad = false) {
        /** @type Data */
        let data = await this.#storage.get(this.#storageKey);
        if (!data || forceLoad) {
            data = await this._loadData();
        } else {
            data = new Data(data);
            if (data.age < new Date() - 1000 * 60 * this.#domainData.data.cacheTime) {
                data = await this._loadData();
            }
        }
        
        return data;
    }
    
    async _loadData() {
        let data = await this.#downloader.getData();
        await this.#storage.set(this.#storageKey, data.getAsSimpleDataObject());

        return data;
    }

    _observeUsersActions() {
        document.body.addEventListener('click', async evt => {
            /** @type Element */
            let targetElm = evt.target;
            
            if (targetElm.classList.contains('js-refresh-button')) {
                this._showSpinnerIcon();
                let data = await this.getData(true);
                this._show(data);
            } else if (targetElm.dataset.qaSelector === 'approve_button') {
                if (targetElm.innerText === 'Approve') {
                    
                } else if (targetElm.innerText === 'Revoke approval') {
                    
                }
            }
        });
    }
    
    _observeMenuActions() {
        let menuEntry = this._getMenuEntry();
        
        menuEntry.addEventListener('click', e => {
            if (e.target.closest('.js-icon-link')) {
                e.preventDefault();
                e.currentTarget.querySelector('.js-dropdown').classList.toggle('hidden');
                e.currentTarget.querySelector('.js-dropdown').classList.toggle('show');
            }
        });
        document.addEventListener('click', e => {
            let dropdown = menuEntry.querySelector('.js-dropdown');
            if (!e.target.closest('.js-gitlab-mr-summary') && dropdown.classList.contains('show')) {
                dropdown.classList.toggle('hidden');
                dropdown.classList.toggle('show');
            }
        });
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @param {number[]} idsToRemove
     * @return {MergeRequest[]}
     * @private
     */
    _removeParticipantsFromMergeRequestsByIds(mergeRequests, idsToRemove) {
        return mergeRequests.map(mergeRequest => {
            mergeRequest.participants = mergeRequest.participants.filter(participant => idsToRemove.indexOf(participant.id) === -1);
            return mergeRequest;
        });
    }

    /**
     * Create loader icon
     * @private
     */
    _createMenuEntry() {
        let menuEntryToUpdate = document.querySelector('.shortcuts-todos').parentNode,
            newMenuEntry = menuEntryToUpdate.cloneNode(true),
            link = newMenuEntry.querySelector('a'),
            cont = document.createElement('div');

        cont.classList.add('js-gitlab-mr-summary__data-cont');
        newMenuEntry.appendChild(cont);

        newMenuEntry.classList.add('scope-gitlab-mr-summary');
        newMenuEntry.classList.add('js-gitlab-mr-summary');
        newMenuEntry.classList.remove('active');

        newMenuEntry.querySelector('.todos-count').textContent = '?';
        newMenuEntry.querySelector('.todos-count').classList.remove('hidden');

        link.dataset.toggle = 'tooltip';
        link.dataset.placement = 'bottom';
        link.dataset.container = 'body';
        link.dataset.originalTitle = 'MRs Summary';
        link.title = 'MRs Summary';
        link.href = '';
        link.classList.add('js-icon-link');

        menuEntryToUpdate.after(newMenuEntry);
        
        return newMenuEntry;
    }

    /**
     * @return {Element}
     * @private
     */
    _getMenuEntry() {
        let menuEntry = document.querySelector('.js-gitlab-mr-summary');
        if (!menuEntry) {
            menuEntry = this._createMenuEntry();
        }
        
        return  menuEntry;
    }
    
    _showSpinnerIcon() {
        let menuEntry = this._getMenuEntry();

        menuEntry.querySelector('svg').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve"><path opacity="0.2" fill="#000" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946 s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634 c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/><path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite"/></path></svg>`;
        menuEntry.querySelector('svg').classList.add('c-spinner-icon');
    }

    /**
     * Create classic icon 
     * @private
     */
    _showClassicIcon() {
        let menuEntry = this._getMenuEntry();
        
        menuEntry.querySelector('svg').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M216.2,151.9v69.2H147v37.7h69.2v69.2h37.7v-69.2h69.2v-37.7h-69.2v-69.2H216.2z"/><path d="M137.6,781h494.3v37.7H137.6V781z"/><path d="M137.6,668.8h494.3v37.7H137.6V668.8z"/><path d="M137.6,556.7h494.3v37.7H137.6V556.7z"/><path d="M137.6,444.6H368v37.7H137.6V444.6z"/><path d="M701.3,907.7c0,18.9-15.4,34.3-34.3,34.3H82c-18.9,0-34.3-15.4-34.3-34.3V92.3C47.7,73.4,63.1,58,82,58h584.9c18.9,0,34.3,15.4,34.3,34.3v65.8h37.7V92.3c0-39.7-32.3-72-72-72H82c-39.7,0-72,32.3-72,72v815.3c0,39.7,32.3,72,72,72h584.9c39.7,0,72-32.3,72-72V519.4h-37.7V907.7z"/><path d="M973.7,139c-15.5-21.4-39.3-34.2-63.5-34.2c-13.6,0-26.3,4.1-36.9,11.8L591,321.7c-15.2,11-24.4,28.1-25.9,48.2c-1.4,18.8,4.3,38.1,16.1,54.3c15.5,21.4,39.3,34.2,63.5,34.2c13.6,0,26.3-4.1,36.9-11.8L964,241.4c15.2-11,24.4-28.1,25.8-48.2C991.2,174.5,985.5,155.2,973.7,139z M941.8,211L659.5,416c-4.2,3-9.2,4.6-14.8,4.6c-12,0-24.7-7.1-33-18.6c-6.5-9-9.7-19.4-9-29.4c0.6-8.7,4.3-16,10.4-20.4l282.3-205.1c4.2-3,9.2-4.6,14.8-4.6c12,0,24.7,7.1,33,18.6c6.5,9,9.7,19.4,9,29.4C951.6,199.3,947.9,206.5,941.8,211z"/><path d="M580.3,474.1c-1.8-0.7-43-16.8-44.7-61.3l-2.6-68.8l-91.6,181.8l205.2-26.6L580.3,474.1z M503.1,482l10.5-20.7c3.9,6.7,8.5,12.6,13.2,17.7L503.1,482z"/></g>`;
        menuEntry.querySelector('svg').classList.remove('c-spinner-icon');
    }

    /**
     * @param {String|Number} count
     */
    _updateMergeRequestsCount(count) {
        let menuEntry = this._getMenuEntry();
        let elm = menuEntry.querySelector('.todos-count');
        
        elm.textContent = count;
    }

}


Authenticator.authenticate().then(accessData => {
     new GitlabMRSummary(
         accessData,
         new Downloader(accessData),
         new HTMLContent(),
         new Storage(),
     ).run();
}).catch(err => console.debug(err));
