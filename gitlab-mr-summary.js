class GitlabMRSummary {

    #storageKey = 'mergeRequestsData';
    
    /** @type {Downloader} */
    #downloader;

    /** @type {HTMLContent} */
    #htmlGenerator;
    
    /** @type {Storage} */
    #storage;
    
    /**
     * @param {Downloader} downloader
     * @param {HTMLContent} htmlGenerator
     * @param {Storage} storage
     */
    constructor(downloader, htmlGenerator, storage) {
        this.#downloader = downloader;
        this.#htmlGenerator = htmlGenerator;
        this.#storage = storage;
    }

    async run() {
        this._createSpinnerIcon();
        /** @type Data */
        let data = await this.#storage.get(this.#storageKey);
        if (!data || data.age < new Date() - 1000 * 60 * 5) {
            data = await this.#downloader.getData();
            await this.#storage.set(this.#storageKey, data.getAsSimpleDataObject());
        } else {
            data = new Data(data);
        }
        
        data.mergeRequests = this._removeParticipantsFromMergeRequestsByIds(data.mergeRequests, [data.user.id]);
        
        let html = this.#htmlGenerator.renderList(data);
        this._replaceSpinnerIconByClassicIcon();
        this._updateMergeRequestsCount(data.nonUsersMergeRequestsNotApproved.length);
        
        document.querySelector('.js-gitlab-mr-summary').insertAdjacentHTML('beforeend', html);
        
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
    _createSpinnerIcon() {
        let iconToUpdate = document.querySelector('.shortcuts-todos').parentNode,
            newIcon = iconToUpdate.cloneNode(true),
            link = newIcon.querySelector('a');

        newIcon.classList.add('scope-gitlab-mr-summary');
        newIcon.classList.add('js-gitlab-mr-summary');
        newIcon.classList.remove('active');

        newIcon.querySelector('.todos-count').textContent = '0';

        link.dataset.toggle = 'tooltip';
        link.dataset.placement = 'bottom';
        link.dataset.container = 'body';
        link.dataset.originalTitle = 'MRs Summary';
        link.title = 'MRs Summary';
        link.href = '';

        newIcon.querySelector('svg').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve"><path opacity="0.2" fill="#000" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946 s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634 c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/><path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite"/></path></svg>`;
        newIcon.querySelector('svg').classList.add('c-spinner-icon');
        iconToUpdate.after(newIcon);
    }

    /**
     * Create classic icon 
     * @private
     */
    _replaceSpinnerIconByClassicIcon() {
        let icon = document.querySelector('.js-gitlab-mr-summary');
        
        icon.querySelector('svg').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M216.2,151.9v69.2H147v37.7h69.2v69.2h37.7v-69.2h69.2v-37.7h-69.2v-69.2H216.2z"/><path d="M137.6,781h494.3v37.7H137.6V781z"/><path d="M137.6,668.8h494.3v37.7H137.6V668.8z"/><path d="M137.6,556.7h494.3v37.7H137.6V556.7z"/><path d="M137.6,444.6H368v37.7H137.6V444.6z"/><path d="M701.3,907.7c0,18.9-15.4,34.3-34.3,34.3H82c-18.9,0-34.3-15.4-34.3-34.3V92.3C47.7,73.4,63.1,58,82,58h584.9c18.9,0,34.3,15.4,34.3,34.3v65.8h37.7V92.3c0-39.7-32.3-72-72-72H82c-39.7,0-72,32.3-72,72v815.3c0,39.7,32.3,72,72,72h584.9c39.7,0,72-32.3,72-72V519.4h-37.7V907.7z"/><path d="M973.7,139c-15.5-21.4-39.3-34.2-63.5-34.2c-13.6,0-26.3,4.1-36.9,11.8L591,321.7c-15.2,11-24.4,28.1-25.9,48.2c-1.4,18.8,4.3,38.1,16.1,54.3c15.5,21.4,39.3,34.2,63.5,34.2c13.6,0,26.3-4.1,36.9-11.8L964,241.4c15.2-11,24.4-28.1,25.8-48.2C991.2,174.5,985.5,155.2,973.7,139z M941.8,211L659.5,416c-4.2,3-9.2,4.6-14.8,4.6c-12,0-24.7-7.1-33-18.6c-6.5-9-9.7-19.4-9-29.4c0.6-8.7,4.3-16,10.4-20.4l282.3-205.1c4.2-3,9.2-4.6,14.8-4.6c12,0,24.7,7.1,33,18.6c6.5,9,9.7,19.4,9,29.4C951.6,199.3,947.9,206.5,941.8,211z"/><path d="M580.3,474.1c-1.8-0.7-43-16.8-44.7-61.3l-2.6-68.8l-91.6,181.8l205.2-26.6L580.3,474.1z M503.1,482l10.5-20.7c3.9,6.7,8.5,12.6,13.2,17.7L503.1,482z"/></g>`;
        icon.querySelector('svg').classList.remove('c-spinner-icon');
        icon.addEventListener('click', e => {
            !e.target.classList.contains('js-link-merge-request') && e.preventDefault();
            e.currentTarget.querySelector('.js-dropdown').classList.toggle('hidden');
            e.currentTarget.querySelector('.js-dropdown').classList.toggle('show');
        });
        document.addEventListener('click', e => {
            let dropdown = icon.querySelector('.js-dropdown');
            if (!e.target.closest('.js-gitlab-mr-summary') && dropdown.classList.contains('show')) {
                dropdown.classList.toggle('hidden');
                dropdown.classList.toggle('show');
            }
        });
    }

    /**
     * @param {String|Number} count
     */
    _updateMergeRequestsCount(count) {
        let elm = document.querySelector('.js-gitlab-mr-summary').querySelector('.todos-count');
        
        elm.textContent = count;
        elm.classList.remove('hidden');
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

    async getData() {
        await Promise.all([
            this._loadUsersData(),
            this._loadProjects(),
        ])
            .then(data => this._loadMergeRequests(data[1]))
            .then(data => this._enrichMergeRequestsByParticipants(data))
            .then(data => this._enrichMergeRequestsParticipantsByApprovalsAndApprovers(data))
            .then(data => this._removeNonRelevantMergeRequests(data))
            .then(data => {
                this._downloadedData.mergeRequests = data;
                this._downloadedData.age = new Date();
            });
        
        return this._downloadedData;
    }

    runQueue(queue, concurrency = 5) {
        let results = {};
        let _queueToExecute = [];
        let runTask = async () => {
            let taskArr = _queueToExecute.shift();
            if (taskArr) {
                let [key, task] = taskArr;
                results[key] = await task();
                await runTask();
            }
        };
        for (let [key, task] of Object.entries(queue)) {
            _queueToExecute.push([key, task]);
        }
        let runTaskQueue = [];
        for (let i = 0; i < concurrency; i++) {
            runTaskQueue.push(runTask());
        }

        return Promise.all(runTaskQueue).then(() => results);
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @return {Promise<MergeRequest[]>}
     * @private
     */
    async _enrichMergeRequestsParticipantsByApprovalsAndApprovers(mergeRequests) {
        let requests = [];
        for (let mergeRequest of mergeRequests) {
            requests.push(async () => 
                this._sendRequest(
                    this.urls.mergeRequestApprovals
                        .replace(':project_id:', mergeRequest.project.id.toString())
                        .replace(':merge_request_iid:', mergeRequest.iid.toString())
                ).then(approvalsData => {
                    mergeRequest.approvers = approvalsData.approvers.map(item => {
                        let approver = new User();
                        approver.id = item.user.id;
                        approver.name = item.user.name;
                        approver.avatarUrl = new URL(item.user.avatar_url);
                        return approver
                    });
                    mergeRequest.approverGroupsId = approvalsData.approver_groups.map(item => item.group.id);
                    if (approvalsData.approved_by.length) {
                        for (let participant of mergeRequest.participants) {
                            for (let data of approvalsData.approved_by) {
                                if (participant.id === data.user.id) {
                                    participant.approved = true;
                                    if (participant.id === this._downloadedData.user.id) {
                                        mergeRequest.approvedByUser = true;
                                    }
                                }
                            }
                        }
                    }
                })
            );
        }
        
        await this.runQueue(requests);
        
        return mergeRequests;
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @return {Promise<MergeRequest[]>}
     * @private
     */
    async _removeNonRelevantMergeRequests(mergeRequests) {
        let filteredMergeRequests = [];
        for (let request of mergeRequests) {
                // is user owner of merge request
            if (request.author.id === this._downloadedData.user.id
                // is user belongs to participants
                || request.participants
                    .filter(participant => participant.id === this._downloadedData.user.id)
                    .length > 0
                ||
                // is user belongs to approvers
                request.approvers
                    .filter(approver => approver.id === this._downloadedData.user.id)
                    .length > 0
                ||
                // is user belongs to any approving group
                request.approverGroupsId
                    .filter(groupId => this._downloadedData.user.groupsId.indexOf(groupId) !== -1)
                    .length > 0 
            ) {
                filteredMergeRequests.push(request);
            }
        }
        
        return filteredMergeRequests;
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @return {Promise<MergeRequest[]>}
     * @private
     */
    async _enrichMergeRequestsByParticipants(mergeRequests) {
        let requests = [];
        for (let mergeRequest of mergeRequests) {
            requests.push(async () => await this._sendRequest(
                this.urls.projectMRsParticipants
                    .replace(':project_id:', mergeRequest.project.id.toString())
                    .replace(':merge_request_iid:', mergeRequest.iid.toString())
                ).then(data => mergeRequest.participants = 
                    data.map(participant => {
                        let user = new User();
                        user.id = participant.id;
                        user.name = participant.name;
                        user.avatarUrl = participant.avatar_url;
                        return user;
                    })
                        // remove actual user (useless for display)
                        //.filter(participant => participant.id !== this._downloadedData.user.id)
                ));
        }
        
        await this.runQueue(requests);
        
        return mergeRequests;
    }

    async _loadMergeRequests(projects) {
        let projectsObj = {};
        
        for (let project of projects) {
            if (project.merge_requests_enabled) {
                projectsObj[project.id] = project;
            }
        }
        
        let requests = [];
        for (let projectID of Object.keys(projectsObj)) {
            requests.push(async () => await this._sendRequest(this.urls.projectMRs.replace(':project_id:', projectID)));
        }

        return [].concat(...Object.values(await this.runQueue(requests))).map(rawMR => {
            let mrObject = new MergeRequest();
            mrObject.author.id = rawMR.author.id;
            mrObject.author.name = rawMR.author.name;
            mrObject.author.avatarUrl = new URL(rawMR.author.avatar_url);
            mrObject.project.id = rawMR.project_id;
            mrObject.project.nameWithNamespace = projectsObj[rawMR.project_id].name_with_namespace;
            mrObject.project.pathWithNamespace = projectsObj[rawMR.project_id].path_with_namespace;

            mrObject.iid = rawMR.iid;
            mrObject.webUrl = new URL(rawMR.web_url);
            mrObject.workInProgress = rawMR.work_in_progress;
            mrObject.createdAt = new Date(rawMR.created_at);
            mrObject.sourceBranch = rawMR.source_branch;
            mrObject.targetBranch = rawMR.target_branch;
            mrObject.title = rawMR.title;
            mrObject.commentsSum = rawMR.title;

            return mrObject;
        });
    }

    async _loadUsersData() {
        return Promise.all([this._getActualUser(), this._getUsersGroups()])
            .then(values => {
                this._downloadedData.user.id = values[0].id;
                this._downloadedData.user.groupsId = values[1].map(group => group.id);
            });
    }

    async _loadProjects() {
        let page = 1,
            perPage = 10,
            maxTries = 50,
            url = new URL(this.urls.projects),
            projects = [],
            loadMoreProjects = true;

        url.searchParams.set('per_page', perPage.toString());

        do {
            url.searchParams.set('page', page.toString());

            let ret = await this._sendRequest(url.href);
            projects = projects.concat(ret);

            await this._sleep(10);
            loadMoreProjects = ret.length === perPage;

            page++;
        } while (page < maxTries && loadMoreProjects);

        return projects;
    }

    /**
     * @returns Promise<Object>
     * @private
     */
    _getActualUser() {
        return this._sendRequest(this.urls.user);
    }

    /**
     * @return {Promise<Object>}
     * @private
     *
     * @see https://docs.gitlab.com/ee/api/members.html for access levels
     */
    _getUsersGroups() {
        // 30 = developer access
        return this._sendRequest(this.urls.groups + '?min_access_level=30');
    }

    async _sendRequest(url, n = 5) {
        try {
            let headers = new Headers();
            if (this._gitlabAccessData.type === 'private') {
                headers.append('Private-Token', this._gitlabAccessData.token);
            } else {
                headers.append('Authorization', `Bearer ${this._gitlabAccessData.token}`)
            }
            
            headers.append('User-Agent', 'GitlabMRSummary-BrowserExtension');
            
            let response = await fetch(
                url,
                {headers: headers}
            );
            return await response.json();
        } catch (err) {
            if (n === 1) {
                throw err;
            }
            await this._sleep(10);
            console.warn(`download attempt (${n}) ${url}`);
            return await this._sendRequest(url, n - 1);
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
    
    /** @type Date */
    age;
    
    /** @type {User} */
    user;
    
    /** @type {MergeRequest[]} */
    mergeRequests;

    /**
     * @param {{mergeRequests: (*[]), user: ({groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}), age: (string)}} data
     */
    constructor(data = {}) {
        this.age = data.age ? new Date(data.age) : undefined;
        this.user = new User(data.user);
        this.mergeRequests = data.mergeRequests ? data.mergeRequests.map(mergeRequest => new MergeRequest(mergeRequest)) : [];
    }

    /**
     * @return {MergeRequest[]}
     */
    get usersMergeRequests() {
        let filterFunction = mr => mr.author.id === this.user.id;
        return this._filterMergeRequests(filterFunction)
    }

    /**
     * @return {MergeRequest[]}
     */
    get nonUsersMergeRequests() {
        let filterFunction = mr => mr.author.id !== this.user.id;
        return this._filterMergeRequests(filterFunction)
    }

    /**
     * @return {MergeRequest[]}
     */
    get nonUsersMergeRequestsNotApproved() {
        let filterFunction = mr => mr.approvedByUser;
        return this._filterMergeRequests(filterFunction, this.nonUsersMergeRequests)
    }

    /**
     * @param {function} filterFunction
     * @param {MergeRequest[]} mergeRequests
     * @return {MergeRequest[]}
     */
    _filterMergeRequests(filterFunction, mergeRequests = this.mergeRequests) {
        return mergeRequests.filter(mr => filterFunction(mr));
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @param {string} type set type of sort desc|asc
     */
    static sortByDate(mergeRequests, type = 'desc') {
        return mergeRequests.sort((a, b) => {
            if (type === 'desc') {
                return a.createdAt < b.createdAt ? 1 : -1;
            } else {
                return a.createdAt < b.createdAt ? -1 : 1; 
            }
        });
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @param {string} type
     * @param {boolean} approvedFirst
     * @return {MergeRequest[]}
     */
    static sortByAlreadyApprovedAndByDate(mergeRequests, type = 'desc', approvedFirst = false) {
        return mergeRequests.sort((a, b) => {
            if (a.approvedByUser === b.approvedByUser) {
                if (type === 'desc') {
                    return a.createdAt < b.createdAt ? 1 : -1;
                } else {
                    return a.createdAt < b.createdAt ? -1 : 1;
                }
            } else {
                if (approvedFirst) {
                    return a.approvedByUser ? -1 : 1;
                } else {
                    return a.approvedByUser ? 1 : -1;
                }
            }
        });
    }

    /**
     * @return {{mergeRequests: (*[]), user: ({groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}), age: (string)}}
     */
    getAsSimpleDataObject() {
        return {
            age: this.age ? this.age.toDateString() : this.age,
            user: this.user ? this.user.getAsSimpleDataObject() : this.user,
            mergeRequests: this.mergeRequests ? this.mergeRequests.map(mergeRequest => mergeRequest.getAsSimpleDataObject()) : this.mergeRequests,
        };
    }
    
}

class MergeRequest {

    /** @type {User} */
    author;

    /** @type {number} */
    iid;

    /** @type {URL} */
    webUrl;

    /** @type {string} */
    title;

    /** @type {string} */
    sourceBranch;

    /** @type {string} */
    targetBranch;

    /** @type {number} */
    commentsSum;

    /** @type {Date} */
    createdAt;

    /** @type {Project} */
    project;

    /** @type {User[]} */
    participants;

    /** @type {User[]} */
    approvers;

    /** @type {Number[]} */
    approverGroupsId;
    
    /** @type {boolean} */
    workInProgress;
    
    /** @type {boolean} */
    approvedByUser;

    /**
     * @param {{workInProgress: boolean, sourceBranch: string, iid: number, approverGroupsId: Number[], author: {groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}, project: {nameWithNamespace: string, id: number, pathWithNamespace: string}, approvers: {groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}[], title: string, createdAt: string, targetBranch: string, webUrl: string, commentsSum: number, participants: {groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}[], approvedByUser: boolean}} data
     */
    constructor(data= {}) {
        this.author = new User(data.author);
        this.iid = data.iid;
        this.webUrl = data.webUrl ? new URL(data.webUrl) : undefined;
        this.title = data.title;
        this.sourceBranch = data.sourceBranch;
        this.targetBranch = data.targetBranch;
        this.commentsSum = data.commentsSum;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.project = new Project(data.project);
        this.participants = data.participants ? data.participants.map(participant => new User(participant)) : [];
        this.approvers = data.approvers ? data.approvers.map(approver => new User(approver)) : [];
        this.approverGroupsId = data.approverGroupsId;
        this.workInProgress = data.workInProgress;
        this.approvedByUser = data.approvedByUser;
        this.project = new Project(data.project);
    }
    
    get uniqueId() {
        return `${this.project.pathWithNamespace}-${this.iid}`
    }

    /**
     * @return {{workInProgress: boolean, sourceBranch: string, iid: number, approverGroupsId: Number[], author: {groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}, project: {nameWithNamespace: string, id: number, pathWithNamespace: string}, approvers: {groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}[], title: string, createdAt: string, targetBranch: string, webUrl: string, commentsSum: number, participants: {groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}[], approvedByUser: boolean}}
     */
    getAsSimpleDataObject() {
        return {
            author: this.author.getAsSimpleDataObject(),
            iid: this.iid,
            webUrl: this.webUrl.toString(),
            title: this.title,
            sourceBranch: this.sourceBranch,
            targetBranch: this.targetBranch,
            commentsSum: this.commentsSum,
            createdAt: this.createdAt.toDateString(),
            project: this.project.getAsSimpleDataObject(),
            participants: this.participants.map(participant => participant.getAsSimpleDataObject()),
            approvers: this.approvers.map(approver => approver.getAsSimpleDataObject()),
            approverGroupsId: this.approverGroupsId,
            workInProgress: this.workInProgress,
            approvedByUser: this.approvedByUser,
        }
    }

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
    /** @type {boolean} */
    approved;

    /**
     * @param {{groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}} data
     */
    constructor(data = {}) {
        this.id = data.id;
        this.avatarUrl = data.avatarUrl ? new URL(data.avatarUrl) : undefined;
        this.name = data.name;
        this.groupsId = data.groupsId;
        this.approved = data.approved;
    }
    
    /**
     * @return {{groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}}
     */
    getAsSimpleDataObject() {
        return {
            id: this.id,
            avatarUrl: this.avatarUrl ? this.avatarUrl.toString() : undefined,
            name: this.name,
            groupsId: this.groupsId,
            approved: this.approved,
        };
    }
}

class Project {
    /** @type {number} */
    id;
    /** @type {string} */
    pathWithNamespace;
    /** @type {string} */
    nameWithNamespace;

    /**
     * @param {{nameWithNamespace: string, id: number, pathWithNamespace: string}} data
     */
    constructor(data = {}) {
        Object.keys(this).forEach(classProperty => {
            this[classProperty] = data[classProperty]; 
        });
    }

    /**
     * @return {{nameWithNamespace: string, id: number, pathWithNamespace: string}}
     */
    getAsSimpleDataObject() {
        let data = {};
        Object.entries(this).forEach(entry => {
            data[entry[0]] = entry[1];
        });
        return data;
    }
}

class HTMLContent {

    /**
     * @param {Data} data
     * @return {string}
     */
    renderList(data) {
        return `
            <div class="c-dropdown js-dropdown scope-essentials-v1.50.0 dropdown-menu hidden">
                <div class="c-dropdown__tab">
                    <h3 class="e-heading u-bold u-beta">To review</h3>
                    ${this._getSimpleMRsList(Data.sortByAlreadyApprovedAndByDate(data.nonUsersMergeRequests))}
                    <h3 class="e-heading u-bold u-beta">Created</h3>
                    ${this._getSimpleMRsList(Data.sortByDate(data.usersMergeRequests))}
                </div>
            </div>
        `;
    }
    
    /**
     * @param {MergeRequest[]} mergeRequests
     * @return {string}
     * @private
     */
    _getSimpleMRsList(mergeRequests) {
        let listItemsMRsToReview = '';
        for (let mergeRequest of mergeRequests) {
            // sort participants alphabetically
            let participants = mergeRequest.participants.sort((a,b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
            listItemsMRsToReview += 
                `<li class="c-merge-request${mergeRequest.approvedByUser ? ' c-merge-request--approved-by-me' : ''}" data-unique-id="${mergeRequest.uniqueId}">
                    <div class="c-avatar c-merge-request__col c-merge-request__col--first">
                        <img src="${mergeRequest.author.avatarUrl}" alt="${mergeRequest.author.name}" title="${mergeRequest.author.name}" class="c-avatar__img">
                    </div>
                    <div class="c-merge-request__col c-merge-request__col--second">
                        <a class="e-link" href="${mergeRequest.webUrl}">${mergeRequest.title}</a>
                        <small class="e-note">${mergeRequest.project.nameWithNamespace}</small> 
                        <small class="e-note">${mergeRequest.sourceBranch} ⮕ ${mergeRequest.targetBranch}</small> 
                    </div>
                    <div class="c-merge-request__col c-merge-request__col--third">
                        ${participants.map(user => `<div class="c-avatar${user.approved ? ' is-approved': ''}"><img class="c-avatar__img c-avatar__img--small" src="${user.avatarUrl}" alt="${user.name}" title="${user.name}"></div>`).join('')}
                    </div>
                 </li>`
        }
        
        return `<ul class="o-block-list o-block-list--tight">${listItemsMRsToReview}</ul>`;
        
        
    }

    update() {

    }

}

class Storage {
    
    #storage;
    
    constructor(storage = chrome.storage.local) {
        this.#storage = storage;
    }
    
    get(key) {
        return new Promise((resolve, reject) => {
            this.#storage.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                try {
                    resolve(result[key]);
                } catch (e) {
                    reject(e.message);
                }
            });
        });
    }
    
    set(key, value) {
        return new Promise((resolve, reject) => {
            this.#storage.set({[key]: value}, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }
}


Authenticator.authenticate().then(accessData => {
     new GitlabMRSummary(
         new Downloader(accessData),
         new HTMLContent(),
         new Storage(),
     ).run();
}).catch(err => console.debug(err));
