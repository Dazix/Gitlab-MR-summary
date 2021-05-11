import * as React from "react";
import {FC} from "react";
import {DomainT} from "../../@types/domains";
import {DomainRow} from "./DomainRow";
import {obfuscateToken} from "../helper";

type Props = {
    domainsData: DomainT[];
    domainAttrsChangeHandler: (domainUrl: string, key: string, value: string|boolean, state?: boolean) => void;
    removeDomainHandler: (domainUrl: string) => void;
};

export const DomainsList: FC<Props> = ({ domainsData, domainAttrsChangeHandler, removeDomainHandler }) => {

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
                {domainsData && domainsData.map(data => (
                    <DomainRow key={data.url} fixtures={data.fixtures} cacheTime={data.cacheTime} dummyUsersId={data.dummyUsersId}
                               removeActualUserFromParticipantsView={data.removeActualUserFromParticipantsView}
                               url={data.url} type={data.auth.type} token={obfuscateToken(data.auth.token)}
                               domainAttrsChangeHandler={domainAttrsChangeHandler} removeDomainHandler={removeDomainHandler}/>
                    )
                )}
                </tbody>
            </table>
        </form>
    );
};
