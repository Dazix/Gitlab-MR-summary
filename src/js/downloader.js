import User from "./user";
import Data from "./data";
import GitlabApiUrls from "./gitlabApiUrls";
import MergeRequest from "./mergeRequest";
import {sleep} from "./utils";

export default class Downloader {
    _gitlabAccessData;

    constructor(gitlabAccessData) {
        this._gitlabAccessData = gitlabAccessData;

        /** @type Data */
        this._downloadedData = new Data();

        this.urls = new GitlabApiUrls(gitlabAccessData.data.url);
    }

    async getData() {
        await Promise.all([
            this._loadUserData(),
            this._loadProjects(),
        ])
            .then(data => this._loadMergeRequests(data[1]))
            .then(this._enrichMergeRequestsByParticipants.bind(this))
            .then(this._enrichMergeRequestsParticipantsByApproversAndByApprovals.bind(this))
            .then(this._removeNonRelevantMergeRequests.bind(this))
            .then(data => {
                this._downloadedData.mergeRequests = data;
                this._downloadedData.age = new Date();
            });

        return this._downloadedData;
    }

    /**
     * @param {string|number} projectId
     * @return {Promise<MergeRequest[]>}
     */
    async getMergeRequestsDataForProject(projectId) {
        return await Promise.all([
            this._loadUserData(), 
            this._getProject(projectId)
        ])
            .then(data => this._loadMergeRequests([data[1]]))
            .then(this._enrichMergeRequestsByParticipants.bind(this))
            .then(this._enrichMergeRequestsParticipantsByApproversAndByApprovals.bind(this))
            .then(this._removeNonRelevantMergeRequests.bind(this));
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
    async _enrichMergeRequestsParticipantsByApproversAndByApprovals(mergeRequests) {
        let requests = [];
        for (let mergeRequest of mergeRequests) {
            requests.push(async () =>
                this._sendRequest(
                    this.urls.mergeRequestApprovals
                        .replace(':project_id:', mergeRequest.project.id.toString())
                        .replace(':merge_request_iid:', mergeRequest.iid.toString())
                )
                    .then(approvalsData => {
                        if (approvalsData.approver_groups.length === 0) {
                            return approvalsData;
                        }
                        let promises = [];
                        for (let group of approvalsData.approver_groups) {
                            promises.push(this._getMembersOfGroup(group.group.id));
                        }
                        
                        return Promise.all(promises).then(values => {
                            values.forEach(users => {
                                approvalsData.approvers = [].concat(approvalsData.approvers, users.map(val => {return {user: val}}));
                            });

                            return approvalsData;
                        });
                    })
                    .then(approvalsData => {
                        mergeRequest.participants = mergeRequest.participants
                            .concat(approvalsData.approvers.map(item => {
                                let approver = new User();
                                approver.id = item.user.id;
                                approver.name = item.user.name;
                                approver.avatarUrl = new URL(item.user.avatar_url);
                                return approver;
                            }));

                        mergeRequest.participants = Object.values(
                            mergeRequest.participants.reduce((users, user) => {
                                if (!(user.id in users)) {
                                    users[user.id] = user;
                                }
                                return users;
                            }, {}));
                        
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
                        user.avatarUrl = new URL(participant.avatar_url);
                        return user;
                    })
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

    async _loadUserData() {
        return Promise.all([this._getActualUser(), this._getUserGroups()])
            .then(values => {
                this._downloadedData.user.id = values[0].id;
                this._downloadedData.user.groupsId = values[1].map(group => group.id);
            });
    }

    async _loadProjects() {
        return await this._loadPaginatedData(this.urls.projects);
    }
    
    async _loadPaginatedData(url, perPage = 10, maxTries = 100) {
        let page = 1,
            urlObject = new URL(url),
            data = [],
            loadMore = true;

        urlObject.searchParams.set('per_page', perPage.toString());

        do {
            urlObject.searchParams.set('page', page.toString());

            let ret = await this._sendRequest(urlObject.href);
            data = data.concat(ret);

            await sleep(10);
            loadMore = ret.length === perPage;

            page++;
        } while (page < maxTries && loadMore);

        return data;
    }

    /**
     * @param {string|number} projectId
     * @return {Promise<{}>}
     * @private
     */
    async _getProject(projectId) {
        if (typeof projectId === 'string') {
            projectId = encodeURIComponent(projectId);
        }
        
        return this._sendRequest(`${this.urls.projects}/${projectId}`);
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
    _getUserGroups() {
        // 30 = developer access
        return this._sendRequest(this.urls.groups + '?min_access_level=30');
    }
    
    async _getMembersOfGroup(groupId) {
        return await this._loadPaginatedData(this.urls.groupMembers.replace(':id:', groupId));
    }

    async _sendRequest(url, n = 5) {
        try {
            let headers = new Headers();
            if (this._gitlabAccessData.authType === 'private') {
                headers.append('Private-Token', this._gitlabAccessData.token);
            } else {
                headers.append('Authorization', `Bearer ${this._gitlabAccessData.token}`)
            }

            headers.append('Request-Identification', 'GitlabMRSummary-BrowserExtension/https://github.com/Dazix/Gitlab-MR-summary');

            let response = await fetch(
                url,
                {headers: headers}
            );
            return await response.json();
        } catch (err) {
            if (n === 1) {
                throw err;
            }
            await sleep(10);
            console.warn(`download attempt (${n}) ${url}`);
            return await this._sendRequest(url, n - 1);
        }
    }

}
