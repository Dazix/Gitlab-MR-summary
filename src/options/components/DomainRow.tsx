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
};

export const DomainRow: FC<Props> = ({
                                         url,
                                         type: authType,
                                         token,
                                         dummyUsersId,
                                         removeActualUserFromParticipantsView,
                                         cacheTime,
                                         fixtures
                                     }) => {
    const uniqueId = new Date().getTime();
    return (
        <tr>
            <td>{url}</td>
            <td>{authType}</td>
            <td>{token}</td>
            <td>
                <input className="e-input" type="text" value={dummyUsersId.join(',')} pattern="^(\d+,?)*$"/>
            </td>
            <td>
                <div className="u-align-center">
                    <input className="e-input" id={`remove-actual-user-from-participants-${uniqueId}`} type="checkbox"
                           value="1" name="remove-actual-user-from-participants"
                           defaultChecked={removeActualUserFromParticipantsView}/>
                    <label htmlFor={`remove-actual-user-from-participants-${uniqueId}`}
                           className="e-input e-input--faux" aria-hidden="true"/>
                </div>
            </td>
            <td><input className="c-actual-domains__cache-time js-input-cache-time e-input" type="number" min="1"
                       size={3} value={cacheTime}/>
            </td>
            <td className="c-hover-popup">
                <span className="e-action">select</span>
                <div className="c-hover-popup__content">
                    {AVAILABLE_FIXTURES.map((fixture: FixtureT, index: number) => <FixtureInput key={index}
                                                                                                fixture={fixture}
                                                                                                checked={fixtures.includes(fixture.value)}
                                                                                                disableTextWrap={true}/>)}
                </div>
            </td>
            <td className="c-actual-domains__buttons">
                <button className="c-actual-domains__button js-update-button e-button e-button--positive" name="update"
                        value={url}>
                    UPDATE
                </button>
                <button className="c-actual-domains__button js-del-button e-button e-button--negative" name="del"
                        value={url}>DELETE
                </button>
            </td>
        </tr>
    )
};

