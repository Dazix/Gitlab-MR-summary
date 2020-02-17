class GitlabMRSummary {

    /**
     * @param {{accessToken: String}} accessData
     * @param {{user: String, groups: String, projects: String, projectMRs: String, projectMRsParticipants: String, mergeRequestApprovals: String}} gitlabUrls
     */
    constructor(accessData, gitlabUrls) {
        this.gitlabUrls = gitlabUrls;
        this.accessData = accessData;

        this.requestCount = 0;
        this.userInfo = {};
        this.userGroups = {groups: [], groupsIds: []};
        this.summaryIconCreated = false;
        this.menuInserted = false;
        this.projects = {};
        this.mergeRequests = {
            myMergeRequests: [],
            mergeRequestsAsReviewer: [],
        };
        this.listOfMyMergeRequestsElement = document.createElement('ul');
        this.listOfReviewingMergeRequestsElement = document.createElement('ul');

        this.errorMessageCont = document.createElement('div');
        this.errorMessageCont.classList.add('error-cont');

        this.apiError = false;

        this.loadMoreProjects = true;
    }

    async run() {
        this._createSpinnerIcon();
        await this._loadUsersData();

        let callback = async projects => {
            let mergeRequests = await this._getAllMergeRequests(
                projects.filter(project => project.merge_requests_enabled)
                    .map(project => {
                        this.projects[project.id] = project;

                        return project.id;
                    })
            );

            await this._updateMergeRequestsByParticipants(mergeRequests);
            await this._updateMergeRequestsByApprovals(mergeRequests);

            let {myMergeRequests, mergeRequestsAsReviewer} = this._filterMergeRequests(mergeRequests);

            this.mergeRequests.mergeRequestsAsReviewer = this.mergeRequests.mergeRequestsAsReviewer.concat(mergeRequestsAsReviewer);
            this.mergeRequests.myMergeRequests = this.mergeRequests.myMergeRequests.concat(myMergeRequests);

            this._createAnInsertIconWithMenu(
                this.mergeRequests.myMergeRequests.sort(this._mergeRequestsComparator),
                this.mergeRequests.mergeRequestsAsReviewer.sort(this._mergeRequestsComparator)
            );

            this._updateMergeRequestsCount(
                mergeRequestsAsReviewer.filter(
                    request =>
                        request.participants.filter(
                            participant => participant.id === this.userInfo.id && !participant.approved
                        ).length > 0
                        ||
                        (request.approvals.approvers.filter(
                                approver => approver.user.id === this.userInfo.id
                            ).length > 0
                            &&
                            request.approvals.approved_by.filter(
                                approved_by => approved_by.user.id === this.userInfo.id
                            ).length === 0
                        )
                ).length
            );
        };
        this._loadProjects(callback);
    }

    _mergeRequestsComparator(a, b) {
        let aDate = new Date(a.created_at),
            bDate = new Date(b.created_at);
        return aDate < bDate ? 1 : -1;
    }

    _createSpinnerIcon() {
        let iconToUpdate = document.querySelector('div.header-content > div.navbar-collapse.collapse > ul > li:nth-child(6)'),
            newIcon = iconToUpdate.cloneNode(true),
            link = newIcon.querySelector('a');

        newIcon.classList.add('heureka-mr-summary');
        newIcon.classList.remove('active');

        newIcon.querySelector('.todos-count').textContent = 0;

        link.classList.add('shortcuts-todos');
        link.dataset.toggle = 'tooltip';
        link.dataset.placement = 'bottom';
        link.dataset.container = 'body';
        link.dataset.originalTitle = 'MR Summary';
        link.title = 'MR Summary';
        link.href = '';

        newIcon.querySelector('svg').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve"><path opacity="0.2" fill="#000" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946 s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634 c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/><path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite"/></path></svg>`;
        newIcon.querySelector('svg').classList.add('spinner');
        iconToUpdate.after(newIcon);
    }

    /**
     * @param {Object[]} myMergeRequests
     * @param {Object[]} mergeRequestsAsReviewer
     */
    _createAnInsertIconWithMenu(myMergeRequests, mergeRequestsAsReviewer) {
        let icon = document.querySelector('.heureka-mr-summary');

        if (!this.summaryIconCreated
        //&& (myMergeRequests.length > 0 || mergeRequestsAsReviewer.length > 0)
        ) {
            this.summaryIconCreated = true;

            icon.querySelector('svg').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M216.2,151.9v69.2H147v37.7h69.2v69.2h37.7v-69.2h69.2v-37.7h-69.2v-69.2H216.2z"/><path d="M137.6,781h494.3v37.7H137.6V781z"/><path d="M137.6,668.8h494.3v37.7H137.6V668.8z"/><path d="M137.6,556.7h494.3v37.7H137.6V556.7z"/><path d="M137.6,444.6H368v37.7H137.6V444.6z"/><path d="M701.3,907.7c0,18.9-15.4,34.3-34.3,34.3H82c-18.9,0-34.3-15.4-34.3-34.3V92.3C47.7,73.4,63.1,58,82,58h584.9c18.9,0,34.3,15.4,34.3,34.3v65.8h37.7V92.3c0-39.7-32.3-72-72-72H82c-39.7,0-72,32.3-72,72v815.3c0,39.7,32.3,72,72,72h584.9c39.7,0,72-32.3,72-72V519.4h-37.7V907.7z"/><path d="M973.7,139c-15.5-21.4-39.3-34.2-63.5-34.2c-13.6,0-26.3,4.1-36.9,11.8L591,321.7c-15.2,11-24.4,28.1-25.9,48.2c-1.4,18.8,4.3,38.1,16.1,54.3c15.5,21.4,39.3,34.2,63.5,34.2c13.6,0,26.3-4.1,36.9-11.8L964,241.4c15.2-11,24.4-28.1,25.8-48.2C991.2,174.5,985.5,155.2,973.7,139z M941.8,211L659.5,416c-4.2,3-9.2,4.6-14.8,4.6c-12,0-24.7-7.1-33-18.6c-6.5-9-9.7-19.4-9-29.4c0.6-8.7,4.3-16,10.4-20.4l282.3-205.1c4.2-3,9.2-4.6,14.8-4.6c12,0,24.7,7.1,33,18.6c6.5,9,9.7,19.4,9,29.4C951.6,199.3,947.9,206.5,941.8,211z"/><path d="M580.3,474.1c-1.8-0.7-43-16.8-44.7-61.3l-2.6-68.8l-91.6,181.8l205.2-26.6L580.3,474.1z M503.1,482l10.5-20.7c3.9,6.7,8.5,12.6,13.2,17.7L503.1,482z"/></g>`;
            icon.querySelector('svg').classList.remove('spinner');
            icon.addEventListener('click', e => {
                !e.target.classList.contains('js-link-merge-request') && e.preventDefault();
                e.currentTarget.querySelector('.js-dropdown-summary').classList.toggle('hidden');
                e.currentTarget.querySelector('.js-dropdown-summary').classList.toggle('show');
            });
            document.addEventListener('click', e => {
                let summaryMenu = icon.querySelector('.js-dropdown-summary');
                if (!e.target.closest('.heureka-mr-summary') && summaryMenu.classList.contains('show')) {
                    summaryMenu.classList.toggle('hidden');
                    summaryMenu.classList.toggle('show');
                }
            });
        }

        this._generateOrUpdateMenu(myMergeRequests, mergeRequestsAsReviewer);
    }

    /**
     * @param {String|Number} count
     */
    _updateMergeRequestsCount(count) {
        let elm = document.querySelector('.heureka-mr-summary').querySelector('.todos-count');

        if (this.apiError) {
            elm.textContent = '!';
        } else {
            elm.textContent = parseInt(count) + parseInt(elm.textContent);
        }
        elm.classList.remove('hidden');
    }

    /**
     * @param {Object[]} myMergeRequests
     * @param {Object[]} mergeRequestsAsReviewer
     */
    _generateOrUpdateMenu(myMergeRequests, mergeRequestsAsReviewer) {
        let cont = document.createElement('div');

        cont.classList.add('js-dropdown-summary', 'dropdown-menu', 'dropdown-menu-right', 'hidden');

        /**
         * @param {Object[]} mergeRequests
         * @param {HTMLUListElement} listContainer
         */
        let generateList = (mergeRequests, listContainer) => {
            let appendToEnd = [];

            listContainer.innerHTML = '';

            for (let request of mergeRequests) {
                let approvedByMe = false,
                    mergeRequestsProject = this.projects[request.project_id].name_with_namespace,
                    item = document.createElement('li'),
                    link = document.createElement('a'),
                    descriptionFirstLine = document.createElement('small'),
                    descriptionSecondLine = document.createElement('small'),
                    authorImage = document.createElement('img'),
                    firstColCont = document.createElement('div'),
                    secondColCont = document.createElement('div'),
                    thirdColCont = document.createElement('div');

                item.classList.add('merge-request');

                authorImage.src = request.author.avatar_url;
                authorImage.alt = 'Author avatar';
                authorImage.classList.add('author-avatar');
                authorImage.title = request.author.name;
                firstColCont.appendChild(authorImage);
                item.appendChild(firstColCont);

                link.href = request.web_url;
                link.textContent = request.title;
                link.classList.add('js-link-merge-request');
                descriptionFirstLine.innerText = mergeRequestsProject;
                descriptionSecondLine.innerText = request.source_branch + ' ⮕ ' + request.target_branch;
                secondColCont.appendChild(link);
                secondColCont.appendChild(descriptionFirstLine);
                secondColCont.appendChild(descriptionSecondLine);
                item.appendChild(secondColCont);

                for (let participant of request.participants) {
                    if (request.author.id === participant.id) continue;

                    let participantImg = document.createElement('img'),
                        cont = document.createElement('div');

                    cont.classList.add('author-avatar-cont');

                    participantImg.src = participant.avatar_url;
                    participantImg.alt = participantImg.title = participant.name;
                    participantImg.classList.add('author-avatar', 'author-avatar--smaller');
                    if (participant.approved) {
                        cont.classList.add('approved');

                        if (participant.id === this.userInfo.id) {
                            approvedByMe = true;
                        }

                    }
                    cont.appendChild(participantImg);

                    thirdColCont.appendChild(cont);
                }

                item.appendChild(thirdColCont);

                if (approvedByMe) {
                    item.classList.add('merge-request--approved-by-me');
                    appendToEnd.push(item);
                } else {
                    listContainer.appendChild(item);
                }
            }

            for (let item of appendToEnd) {
                listContainer.appendChild(item);
            }
        };

        generateList(myMergeRequests, this.listOfMyMergeRequestsElement);
        generateList(mergeRequestsAsReviewer, this.listOfReviewingMergeRequestsElement);

        if (!this.menuInserted) {
            this.menuInserted = true;

            cont.appendChild(this.errorMessageCont);

            cont.insertAdjacentHTML('beforeend', `<h5>Reviewing</h5>`);
            cont.appendChild(this.listOfReviewingMergeRequestsElement);

            cont.insertAdjacentHTML('beforeend', `<h5>Created</h5>`);
            cont.appendChild(this.listOfMyMergeRequestsElement);

            document.querySelector('.heureka-mr-summary').appendChild(cont);
        }

        if (this.apiError) {
            this.errorMessageCont.innerHTML =
                `<div class="error-cont__message">One or more api requests failed. Try again later</div>`;
        }

        //console.log('Requests made: ' + this.requestCount);
    }

    /**
     * @param {Object} mergeRequests
     *
     * @returns {{myMergeRequests: Object[], mergeRequestsAsReviewer: Object[]}}
     */
    _filterMergeRequests(mergeRequests) {
        let myRequests = [],
            asReviewerRequests = [];

        for (let request of mergeRequests) {
            if (request.author.username === this.userInfo.username) {
                myRequests.push(request);
            } else if (
                request.participants
                    .filter(participant => participant.username === this.userInfo.username)
                    .length > 0
                ||
                request.approvals.approvers
                    .filter(approver => approver.user.id === this.userInfo.id)
                    .length > 0
                ||
                request.approvals.approver_groups
                    .map(groupItem => groupItem.group.id)
                    .filter(groupId => this.userGroups.groupsIds.indexOf(groupId) !== -1)
                    .length > 0
            ) {
                asReviewerRequests.push(request);
            }
        }

        return {
            myMergeRequests: myRequests,
            mergeRequestsAsReviewer: asReviewerRequests,
        }
    }

    /**
     * @param {Object[]} mergeRequests
     *
     * @returns Promise<Object[]>
     */
    _updateMergeRequestsByParticipants(mergeRequests) {
        let requests = [];

        for (let mergeRequest of mergeRequests) {
            requests.push(this._sendRequest(
                this.gitlabUrls.projectMRsParticipants
                    .replace(':project_id:', mergeRequest.project_id)
                    .replace(':merge_request_iid:', mergeRequest.iid)
                )
                    .then(data => data.filter(participant => participant.id !== 38)) // remove dummy group owner
                    .then(data => mergeRequest.participants = data)
            );
        }

        return Promise.all(requests);
    }

    /**
     * @param {Object[]} mergeRequests
     */
    async _updateMergeRequestsByApprovals(mergeRequests) {
        let requests = [],
            mergeRequestsApprovals;
        for (let mergeRequest of mergeRequests) {
            requests.push(
                this._sendRequest(
                    this.gitlabUrls.mergeRequestApprovals
                        .replace(':project_id:', mergeRequest.project_id)
                        .replace(':merge_request_iid:', mergeRequest.iid)
                )
            );
        }

        mergeRequestsApprovals = await Promise.all(requests);

        for (let approvals of mergeRequestsApprovals) {
            for (let request of mergeRequests) {
                if (request.id === approvals.id
                    && request.iid === approvals.iid
                    && request.project_id === approvals.project_id
                ) {
                    request.approvals = approvals;
                    for (let approver of approvals.approved_by) {
                        for (let participant of request.participants) {
                            if (participant.id === approver.user.id) {
                                participant.approved = true;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @return {Promise}
     * @private
     */
    async _loadUsersData() {
        return Promise.all([this._getActualUser(), this._getUsersGroups()])
            .then(values => {
                this.userInfo = values[0];
                this.userGroups.groups = values[1];
                this.userGroups.groupsIds = values[1].map(group => group.id);
            });
    }

    /**
     * @returns Promise<Object>
     */
    _getActualUser() {
        return this._sendRequest(this.gitlabUrls.user);
    }

    /**
     * @return {Promise<Object>}
     * @private
     *
     * @see https://docs.gitlab.com/ee/api/members.html for access levels
     */
    _getUsersGroups() {
        // 30 = developer access
        return this._sendRequest(this.gitlabUrls.groups + '?min_access_level=30');
    }

    /**
     * @param {function} callback
     */
    async _loadProjects(callback) {
        let page = 1,
            perPage = 10,
            maxTries = 50,
            url = new URL(this.gitlabUrls.projects);

        url.searchParams.set('per_page', perPage);

        do {
            url.searchParams.set('page', page);

            this._sendRequest(url.href)
                .then(data => {
                    this.loadMoreProjects = perPage === data.length;
                    callback(data);
                });

            await this._sleep(10);

            page++;
        } while (page < maxTries && this.loadMoreProjects);
    }

    /**
     * @param {Number} ms
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @param projectIDs
     *
     * @return {Promise<[[]]>}
     */
    _getAllMergeRequests(projectIDs) {
        let requests = [];
        for (let projectID of projectIDs) {
            requests.push(this._sendRequest(this.gitlabUrls.projectMRs.replace(':project_id:', projectID)));
        }

        return Promise.all(requests).then(mergeRequests => {
            return mergeRequests
                .filter(item => item.length > 0)
                .reduce((acc, val) => acc.concat(val), []); // make array of arrays flat
        });
    }

    /**
     * @param {string} url
     * @param {number} n
     *
     * @returns Promise<Object>
     */
    async _sendRequest(url, n = 5) {
        this.requestCount++;
        try {
            let headers = new Headers();
            if (this.accessData.type === 'private') {
                headers.append('Private-Token', this.accessData.token);
            } else {
                headers.append('Authorization', `Bearer ${this.accessData.token}`)
            }
            return await fetch(
                url,
                {
                    headers: headers
                }
            ).then(body => body.json());
        } catch (err) {
            if (n === 1) {
                this.apiError = true;
                throw err;
            }
            await this._sleep(10);
            console.warn(`download attempt (${n}) ${url}`);
            return await this._sendRequest(url, n - 1);
        }
    }

}


class Downloader {
    _gitlabAccessData;
    
    constructor(gitlabAccessData) {
        this._gitlabAccessData = gitlabAccessData;
        
        /** @type Data */
        this._downloadedData = new Data();
        
        this.urls = new GitlabApiUrls();
    }
    
    getData() {
        Promise.all([
            this.#loadUsersData(),
            this.#loadProjects,
        ]).then()
    }

    async #loadUsersData() {
        return Promise.all([this.#getActualUser(), this.#getUsersGroups()])
            .then(values => {
                this._downloadedData.user.id = values[0].id;
                this._downloadedData.user.groupsId = values[1].map(group => group.id);
            });
    }

    async #loadProjects() {
        let page = 1,
            perPage = 10,
            maxTries = 50,
            url = new URL(this.urls.projects),
            projects = [],
            loadMoreProjects = true;

        url.searchParams.set('per_page', perPage.toString());

        do {
            url.searchParams.set('page', page.toString());

            let ret = await this.#sendRequest(url.href);
            projects = projects.concat(ret);

            await this._sleep(10);
            loadMoreProjects = ret.length === perPage;

            page++;
        } while (page < maxTries && loadMoreProjects);
        
        return projects;
    }

    /**
     * @returns Promise<Object>
     */
    #getActualUser() {
        return this.#sendRequest(this.urls.user);
    }

    /**
     * @return {Promise<Object>}
     * @private
     *
     * @see https://docs.gitlab.com/ee/api/members.html for access levels
     */
    #getUsersGroups() {
        // 30 = developer access
        return this.#sendRequest(this.urls.groups + '?min_access_level=30');
    }

    async #sendRequest(url, n = 5) {
        try {
            let headers = new Headers();
            if (this._gitlabAccessData.type === 'private') {
                headers.append('Private-Token', this._gitlabAccessData.token);
            } else {
                headers.append('Authorization', `Bearer ${this._gitlabAccessData.token}`)
            }
            return await fetch(
                url,
                {
                    headers: headers
                }
            ).then(body => body.json());
        } catch (err) {
            if (n === 1) {
                throw err;
            }
            await this._sleep(10);
            console.warn(`download attempt (${n}) ${url}`);
            return await this.#sendRequest(url, n - 1);
        }
    }

    /**
     * @param {Number} ms
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
}

class GitlabApiUrls {
    user = `${window.location.origin}/api/v4/user`;
    groups = `${window.location.origin}/api/v4/groups`;
    projects = `${window.location.origin}/api/v4/projects`;
    projectMRs = `${window.location.origin}/api/v4/projects/:project_id:/merge_requests?state=opened`;
    projectMRsParticipants = `${window.location.origin}/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/participants`;
    mergeRequestApprovals = `${window.location.origin}/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/approvals`;
}

class Data {
    /** @type {User} */
    user;
    /** @type {{string: MergeRequest}} */
    #mergeRequests = {};

    /**
     * @param {MergeRequest} mergeRequestObj
     */
    set mergeRequest(mergeRequestObj) {
        this.#mergeRequests[this.#getMergeRequestUniqueId(mergeRequestObj)] = mergeRequestObj;
    }

    /**
     * @return {{string: MergeRequest}}
     */
    get mergeRequests() {
        return this.#mergeRequests
    }

    /**
     * @return {{string: MergeRequest}}
     */
    get usersMergeRequests() {
        let filterFunction = id => id === this.user.id;
        return this.#filterMergeRequests(filterFunction)
    }

    /**
     * @return {{string: MergeRequest}}
     */
    get nonUsersMergeRequests() {
        let filterFunction = id => id !== this.user.id;
        return this.#filterMergeRequests(filterFunction)
    }

    /**
     * @param {function} filterFunction
     * @return {{string: MergeRequest}}
     */
    #filterMergeRequests(filterFunction) {
        return Object.keys(this.#mergeRequests)
            .filter(mrId => filterFunction(this.#mergeRequests[mrId].author.id))
            .reduce((res, key) => Object.assign(res, { [key]: this.#mergeRequests[key] }), {});
    }

    /**
     * @param {MergeRequest} mergeRequest
     * @return {string}
     */
    #getMergeRequestUniqueId(mergeRequest) {
        return mergeRequest.project.nameWithNamespace + mergeRequest.id;
    }
}

class MergeRequest {

    /** @type {User} */
    author;
    
    /** @type {number} */
    id;
    
    /** @type {URL} */
    webUrl;

    /** @type {string} */
    title;

    /** @type {string} */
    source_branch;

    /** @type {string} */
    target_branch;

    /** @type {number} */
    comments_sum;

    /** @type {string} */
    created_at;

    /** @type {Project} */
    project;

    /** @type {User[]} */
    participants;

}

class User {
    /** @type {number} */
    id;
    /** @type {URL} */
    avatarUrl;
    /** @type {string} */
    name;
    /** @type {number[]} */
    groupsId;
}

class Project {
    /** @type {number} */
    id;
    /** @type {string} */
    nameWithNamespace;
}


class List {
    
    render() {
        
    }
    
    update() {
        
    }
    
}


Authenticator.authenticate().then(accessData => {
    let setDomain = (urls, domain) => {
        return Object.keys(urls).reduce((result, i) => {
            result[i] = urls[i].replace(':domain:', domain);
            return result;
        }, {});
    }, urls = {
        user: ':domain:/api/v4/user',
        groups: ':domain:/api/v4/groups',
        projects: ':domain:/api/v4/projects',
        projectMRs: ':domain:/api/v4/projects/:project_id:/merge_requests?state=opened',
        projectMRsParticipants: ':domain:/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/participants',
        mergeRequestApprovals: ':domain:/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/approvals',
    };
    (new GitlabMRSummary(
        accessData,
        setDomain(urls, window.location.origin)
    )).run();
}).catch(console.error);
