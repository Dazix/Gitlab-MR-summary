import StorageManagerObject from "../js/storageManagerObject";

export const obfuscateToken = (token: string): string => token.substr(0, 2) + '*****' + token.substr(token.length - 2, token.length);

export const saveNewOrUpdateDomain = async (
    domain: string,
    authType: string | null = null,
    token: string | null = null,
    dummyUsersId: number[] = [],
    cacheTime: number = 8,
    fixtures: string[] = [],
    removeActualUserFromParticipantsView: boolean = false
) => {
    try {
        let data = {
            dummyUsersId: dummyUsersId,
            cacheTime: cacheTime,
            url: domain,
            fixtures: fixtures,
            removeActualUserFromParticipantsView: removeActualUserFromParticipantsView,
            ...(authType || token ? {auth: {...(authType ? {type: authType} : {}), ...(token ? {token: token} : {})}} : {})
        };

        await saveData(domain, data);
    } catch (e) {
        typeof console !== 'undefined' && console.error(e);
    }
};

const saveData = async (url: string, data: object) => {
    const storage = new StorageManagerObject();
    await storage.setDomainData(url, data);
}
