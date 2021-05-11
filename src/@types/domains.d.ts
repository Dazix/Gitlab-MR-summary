import {MergeRequestsT} from "./mergeRequests";

export type DomainsT = {
    [key: string]: DomainT;
};

export type AuthT = {
    token: string;
    type: string;
};

export type DomainT = {
    auth: AuthT;
    cacheTime: number;
    dummyUsersId: number[]
    fixtures: string[];
    mergeRequestsData: MergeRequestsT
    removeActualUserFromParticipantsView: boolean;
    url: string;
};
