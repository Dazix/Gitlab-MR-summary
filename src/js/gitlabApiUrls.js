export default class GitlabApiUrls {
    
    /** @type {string} */
    #domain;

    /**
     * @param {string|null} domain
     */
    constructor(domain = null) {
        this.#domain = domain ? domain : window.location.origin;
    }

    get user() {return `${this.#domain}/api/v4/user`;}
    get groups() {return `${this.#domain}/api/v4/groups`;}
    get projects() {return `${this.#domain}/api/v4/projects`;}
    get projectMRs() {return `${this.#domain}/api/v4/projects/:project_id:/merge_requests?state=opened`;}
    get projectMRsParticipants() {return `${this.#domain}/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/participants`;}
    get mergeRequestApprovals() {return `${this.#domain}/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/approvals`;}
}
