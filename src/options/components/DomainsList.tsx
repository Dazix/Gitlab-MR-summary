import * as React from "react";
import {useEffect, useState} from "react";
import StorageManagerObject from "../../js/storageManagerObject";
import {DomainsT} from "../../@types/domains";
import {DomainRow} from "./DomainRow";
import {obfuscateToken} from "../helper";

export const DomainsList = () => {
    const storage = new StorageManagerObject();
    const [domainsData, setDomainsData] = useState<DomainsT | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const data = await storage.getDomainData();
            setDomainsData(data)
        }
        loadData();
    }, []);

    return (
        <form className="js-form-actual-settings">
            <table className="c-actual-domains o-table js-sites-table">
                <thead>
                <tr>
                    <th>Domain</th>
                    <th>Auth type</th>
                    <th className="u-align-center">App ID / Private<br/> token</th>
                    <th>Dummy users Id</th>
                    <th className="u-align-center">Remove actual<br/> user</th>
                    <th>Cache time</th>
                    <th>Fixtures</th>
                    <th/>
                </tr>
                </thead>
                <tbody className="js-sites-table__body">
                {domainsData && Object.entries(domainsData).map(([domain, data]) => (
                    <DomainRow key={domain} fixtures={data.fixtures} cacheTime={data.cacheTime} dummyUsersId={data.dummyUsersId}
                               removeActualUserFromParticipantsView={data.removeActualUserFromParticipantsView}
                               url={data.url} type={data.auth.type} token={obfuscateToken(data.auth.token)}/>))}
                </tbody>
            </table>
        </form>
    );
};
