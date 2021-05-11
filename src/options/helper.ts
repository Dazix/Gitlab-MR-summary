import StorageManagerObject from "../js/storageManagerObject";
import {DomainT} from "../@types/domains";

export const obfuscateToken = (token: string): string => token.substr(0, 2) + '*****' + token.substr(token.length - 2, token.length);

export const saveNewDomain = async (
    domain: string,
    authType?: string,
    token?: string,
    dummyUsersId?: number[],
    cacheTime?: number,
    fixtures?: string[],
    removeActualUserFromParticipantsView?: boolean
): Promise<DomainT> => {
    let data = {
        ...(dummyUsersId !== undefined ? {dummyUsersId: dummyUsersId.filter(v => Number.isInteger(v))} : {}),
        ...(cacheTime !== undefined ? {cacheTime: cacheTime} : {}),
        ...(domain !== undefined ? {url: domain} : {}),
        ...(fixtures !== undefined ? {fixtures: fixtures} : {}),
        ...(removeActualUserFromParticipantsView !== undefined ? {removeActualUserFromParticipantsView: removeActualUserFromParticipantsView} : {}),
        ...(authType || token ? {auth: {...(authType ? {type: authType} : {}), ...(token ? {token: token} : {})}} : {}),
    };

    return await saveData(domain, data);
};

type UpdateDomainT = {
    domain: string,
    authType?: string,
    token?: string,
    dummyUsersId?: number[],
    cacheTime?: number,
    fixtures?: string[],
    removeActualUserFromParticipantsView?: boolean
};
export const updateDomain = async (
    {
        domain,
        authType,
        token,
        dummyUsersId,
        cacheTime,
        fixtures,
        removeActualUserFromParticipantsView
    }: UpdateDomainT
): Promise<DomainT> => {
    return await saveNewDomain(domain, authType, token, dummyUsersId, cacheTime, fixtures, removeActualUserFromParticipantsView);
};

const saveData = async (url: string, data: object): Promise<DomainT> => {
    const storage = new StorageManagerObject();
    return await storage.setDomainData(url, data);
}
