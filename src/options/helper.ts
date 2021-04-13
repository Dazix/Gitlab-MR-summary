import StorageManagerObject from "../js/storageManagerObject";
import {DomainsT} from "../@types/domains";

export const obfuscateToken = (token: string): string => token.substr(0, 2) + '*****' + token.substr(token.length - 2, token.length);

export const saveNewDomain = async (
    domain: string,
    authType: string | null = null,
    token: string | null = null,
    dummyUsersId: number[] = [],
    cacheTime: number = 8,
    fixtures: string[] = [],
    removeActualUserFromParticipantsView: boolean = false
): Promise<DomainsT> => {
    try {
        let data = {
            dummyUsersId: dummyUsersId,
            cacheTime: cacheTime,
            url: domain,
            fixtures: fixtures,
            removeActualUserFromParticipantsView: removeActualUserFromParticipantsView,
            ...(authType || token ? {auth: {...(authType ? {type: authType} : {}), ...(token ? {token: token} : {})}} : {})
        };

        return await saveData(domain, data);
    } catch (e) {
        typeof console !== 'undefined' && console.error(e);
        
        return {};
    }
};

type UpdateDomainT = {
    domain: string,
    authType: string | null,
    token: string | null,
    dummyUsersId: number[],
    cacheTime: number,
    fixtures: string[],
    removeActualUserFromParticipantsView: boolean
};
export const updateDomain = async (
    {
        domain,
        authType = null,
        token = null,
        dummyUsersId = [],
        cacheTime = 8,
        fixtures = [],
        removeActualUserFromParticipantsView = false
    }: UpdateDomainT
): Promise<DomainsT> => {
    return await saveNewDomain(domain, authType, token, dummyUsersId, cacheTime, fixtures, removeActualUserFromParticipantsView);
};

const saveData = async (url: string, data: object): Promise<DomainsT> => {
    const storage = new StorageManagerObject();
    return await storage.setDomainData(url, data);
}
