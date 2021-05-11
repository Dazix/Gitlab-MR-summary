import {BasicUserT, UserT} from "./user";
import {ProjectT} from "./project";

export type MergeRequestsT = {
    age: string; // "Mon, 29 Mar 2021 16:19:23 GMT"
    mergeRequests: MergeRequestT[]; 
    user: BasicUserT;
};

export type MergeRequestT = {
    author: UserT;
    commentsSum: string;
    createdAt: string; // "Tue, 23 Feb 2021 17:57:45 GMT"
    iid: number;
    participants: UserT[];
    project: ProjectT;
    sourceBranch: string;
    targetBranch: string;
    title: string;
    webUrl: string;
    workInProgress: boolean;
}
