import * as React from "react";
import StorageManagerObject from "../js/storageManagerObject";
import {AddForm} from "./components/AddForm";
import {DomainsList} from "./components/DomainsList";
import {useEffect, useState} from "react";
import {DomainT} from "../@types/domains";
import {saveNewDomain, updateDomain} from "./helper";

export const Options = () => {
    const storage = new StorageManagerObject();

    storage.set({options_shown: true});
    
    const [domainsData, setDomainsData] = useState<DomainT[]>([]);
    
    const handleAddDomain = (formData: FormData) => {
        // @ts-ignore
        let domainUrl = (new URL(formData.get('domain'))).toString();
        let dummyUsersId = formData.get('dummy-users-id') ? formData.get('dummy-users-id')?.toString().split(',').map(id => parseInt(id)) : [];

        return saveNewDomain(
            domainUrl,
            formData.get('auth_type')?.toString(),
            formData.get('token')?.toString(),
            dummyUsersId,
            parseInt(formData.get('cache-time')?.toString() || '0'),
            Array.from(formData.getAll('fixtures'), (v):string => v.toString()),
            !!formData.get('remove-actual-user-from-participants')
        )
            .then(data => {
                domainsData.push(data);
                setDomainsData(domainsData);
            })
            .catch(err => console.error(err));
    };
    
    const handleDomainAttrChange = (domainUrl: string, key: string, value: string|boolean, state?: boolean) => {
        let _value;
        switch (key) {
            case 'dummyUsersId':
                _value = value.toString().split(',').map((strNumber: string) => parseInt(strNumber));
                break;
            case 'fixtures':
                let _fixtures = domainsData.find(domainData => domainData.url === storage.getKeyFromUrl(domainUrl))?.fixtures || [];
                if (state) {
                    _fixtures.push(value.toString())
                } else {
                    _fixtures = _fixtures.filter(v => v !== value.toString());
                }
                _value = _fixtures;
                break;
            case 'cacheTime':
                _value = parseInt(value.toString());
                break;
            default:
                _value = value;
        }
        
        // @ts-ignore
        updateDomain({domain: domainUrl, [key]: _value})
            .then(data => setDomainsData(
                domainsData.map(domainData => (domainData.url === storage.getKeyFromUrl(domainUrl)) ? data : domainData))
            )
            .catch(err => console.error(err));
    };
    
    const handleRemoveDomain = (domainUrl: string) => {
        storage.remove(storage.getKeyFromUrl(domainUrl))
            .then(() => setDomainsData(
                domainsData.filter(domainData => domainData.url !== storage.getKeyFromUrl(domainUrl)))
            );
    };
    
    useEffect(() => {
        const loadData = async () => {
            const data = await storage.getDomainData();
            setDomainsData(data)
        }
        loadData();
    }, [JSON.stringify(domainsData)]);

    return (
        <>
            <AddForm handleSubmit={handleAddDomain} />
            <DomainsList domainsData={domainsData} 
                         domainAttrsChangeHandler={handleDomainAttrChange}
                         removeDomainHandler={handleRemoveDomain}/>
        </>
    );
};
