import User from "./user";
import Data from "./data";
import GitlabApiUrls from "./gitlabApiUrls";
import MergeRequest from "./mergeRequest";

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
            if (this._gitlabAccessData.authType === 'private') {
                headers.append('Private-Token', this._gitlabAccessData.token);
            } else {
                headers.append('Authorization', `Bearer ${this._gitlabAccessData.token}`)
            }

            headers.append('User-Agent', 'GitlabMRSummary-BrowserExtension/https://github.com/Dazix/Gitlab-MR-summary');

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
