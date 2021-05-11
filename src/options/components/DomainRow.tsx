import * as React from 'react';
import {FC} from 'react';
import {AuthT, DomainT} from "../../@types/domains";
import {AVAILABLE_FIXTURES} from "../../js/fixtures";
import {FixtureInput} from "./FixtureInput";
import {FixtureT} from "../../@types/fixture";

type Props =
    Pick<DomainT, 'url' | 'removeActualUserFromParticipantsView' | 'cacheTime' | 'fixtures'>
    & Pick<AuthT, 'type'>
    & {
    token: string;
    dummyUsersId: number[];
    domainAttrsChangeHandler: (domainUrl: string, key: string, value: string|boolean, state?: boolean) => void;
    removeDomainHandler: (domainUrl: string) => void;
};

export const DomainRow: FC<Props> = ({
                                         url,
                                         type: authType,
                                         token,
                                         dummyUsersId,
                                         removeActualUserFromParticipantsView,
                                         cacheTime,
                                         fixtures,
                                         domainAttrsChangeHandler,
                                         removeDomainHandler
                                     }) => {
    const uniqueId = new Date().getTime();
    
    const deleteHandler = (e: React.MouseEvent<HTMLButtonElement>, url: string) => {
        e.preventDefault();
        
        removeDomainHandler(url);
    };
    
    return (
        <tr>
            <td>{url}</td>
            <td>{authType}</td>
            <td>{token}</td>
            <td>
                <input className="e-input" type="text" value={dummyUsersId.join(',')} pattern="^(\d+,?)*$" onChange={e => domainAttrsChangeHandler(url, 'dummyUsersId', e.target.value)}/>
            </td>
            <td>
                <div className="u-align-center">
                    <input className="e-input" id={`remove-actual-user-from-participants-${uniqueId}`} type="checkbox"
                           value="1" name="remove-actual-user-from-participants"
                           defaultChecked={removeActualUserFromParticipantsView} onChange={e => domainAttrsChangeHandler(url, 'removeActualUserFromParticipantsView', e.target.checked)}/>
                    <label htmlFor={`remove-actual-user-from-participants-${uniqueId}`}
                           className="e-input e-input--faux" aria-hidden="true"/>
                </div>
            </td>
            <td><input className="c-actual-domains__cache-time js-input-cache-time e-input" type="number" min="1"
                       size={3} value={cacheTime} onChange={e => domainAttrsChangeHandler(url, 'cacheTime', e.target.value)}/>
            </td>
            <td className="c-hover-popup">
                <span className="e-action">select</span>
                <div className="c-hover-popup__content">
                    {AVAILABLE_FIXTURES.map((fixture: FixtureT, index: number) => <FixtureInput key={index}
                                                                                                fixture={fixture}
                                                                                                checked={fixtures.includes(fixture.value)}
                                                                                                disableTextWrap={true}
                                                                                                changeHandler={(state: boolean) => domainAttrsChangeHandler(url, 'fixtures', fixture.value, state)}/>)}
                </div>
            </td>
            <td className="c-actual-domains__buttons">
                <button className="c-actual-domains__button e-button e-button--negative" onClick={event => deleteHandler(event, url)}>
                    DELETE
                </button>
            </td>
        </tr>
    )
};

