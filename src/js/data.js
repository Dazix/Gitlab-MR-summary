import User from "./user";
import MergeRequest from "./mergeRequest";

export default class Data {

    /** @type Date */
    age;

    /** @type {User} */
    user;

    /** @type {MergeRequest[]} */
    mergeRequests;
    
    /** @type {string} */
    errorMessage;

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
            age: this.age ? this.age.toUTCString() : this.age,
            user: this.user ? this.user.getAsSimpleDataObject() : this.user,
            mergeRequests: this.mergeRequests ? this.mergeRequests.map(mergeRequest => mergeRequest.getAsSimpleDataObject()) : this.mergeRequests,
        };
    }

}
