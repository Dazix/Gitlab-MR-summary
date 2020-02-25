import User from "./user";
import Project from "./project";

export default class MergeRequest {

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
            createdAt: this.createdAt.toUTCString(),
            project: this.project.getAsSimpleDataObject(),
            participants: this.participants.map(participant => participant.getAsSimpleDataObject()),
            approvers: this.approvers.map(approver => approver.getAsSimpleDataObject()),
            approverGroupsId: this.approverGroupsId,
            workInProgress: this.workInProgress,
            approvedByUser: this.approvedByUser,
        }
    }

}
