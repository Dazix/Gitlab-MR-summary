import * as React from "react";
import {useState} from "react";
import {AVAILABLE_FIXTURES} from "../../js/fixtures";
import {FixtureT} from "../../@types/fixture";
import {FixtureInput} from "./FixtureInput";
import PermissionsManager from "../../js/permissions-manager";

export const AddForm = ({ handleSubmit }: {handleSubmit: (formData: FormData) => void}) => {
    const [authType, setAuthType] = useState<string>('private');
    const [oauthUrlCopied, setOauthUrlCopied] = useState<boolean>(false);
    const oauthRedirectUrl = chrome.identity.getRedirectURL();
    const permissionManager = new PermissionsManager();

    const handleAuthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target;
        setAuthType(target.value);
    };
    
    const handleCopyOauthRedirectUrl = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        
        await navigator.clipboard.writeText(oauthRedirectUrl);
        
        setOauthUrlCopied(true);
        setTimeout(() => setOauthUrlCopied(false), 2000);
    };
    
    const handleAdd = (event: React.ChangeEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.target;
        const formIsValid = form.reportValidity();
        if (formIsValid) {
            const formData = new FormData(form);
            // @ts-ignore
            let domainUrl = (new URL(formData.get('domain'))).toString();
            permissionManager.request([], [domainUrl])
                .then(() => handleSubmit(formData))
                .then(() => form.reset());
        }
    };

    return (
        <form className="c-form" onSubmit={handleAdd}>
            <fieldset>
                <legend className="u-beta">Gitlab MR summary - <span
                    className="u-color-text-light">Gitlab settings</span></legend>
                <div className="c-notice">
                    <svg className="c-notice__icon e-icon e-icon--circle u-beta" aria-hidden="true">
                        <use xlinkHref="#info"/>
                    </svg>
                    <p className="c-notice__content">Extension require these scopes to be enabled for given
                        token: <span className="u-bold">read_user</span>, <span className="u-bold">read_api</span>.
                    </p>
                </div>
                <div className="c-form__inputs-cont">
                    <div className="c-form-cell c-form-cell--inline">
                        <label htmlFor="input1" className="c-form-cell__label u-epsilon">Domain:</label>
                        <input className="u-width-half@gtLine e-input" id="input1" name="domain" required={true}
                               type="url" placeholder="Gitlab domain..." defaultValue="https://"/>
                    </div>
                    <fieldset>
                        <legend className="u-text-no-wrap u-epsilon u-bold">Auth type:</legend>
                        <div className="c-form-cell c-form-cell--inline">
                            <input className="e-input" id="auth_type-private" type="radio" onChange={handleAuthChange}
                                   value="private" name="auth_type" checked={authType === 'private'}/>
                            <label htmlFor="auth_type-private" className="e-input e-input--faux"
                                   aria-hidden="true"/>
                            <label htmlFor="auth_type-private" className="c-form-cell__label u-epsilon">Private
                                token</label>
                        </div>
                        <div className="c-form-cell c-form-cell--inline">
                            <input className="e-input" id="auth_type-oauth" type="radio" onChange={handleAuthChange}
                                   value="oauth" name="auth_type" checked={authType === 'oauth'}/>
                            <label htmlFor="auth_type-oauth" className="e-input e-input--faux"
                                   aria-hidden="true"/>
                            <label htmlFor="auth_type-oauth" className="c-form-cell__label u-epsilon">Gitlab OAuth</label>
                            <span className="c-redirect-url">{oauthRedirectUrl}
                                <button type="button" className="c-copy-button e-button u-micro" onClick={handleCopyOauthRedirectUrl}>{oauthUrlCopied ? '✓ ': ''}COPY</button>
                            </span>
                        </div>
                        <div className="c-form-cell c-form-cell--inline">
                            <label htmlFor="input2" className="c-form-cell__label u-epsilon">
                                <span
                                    className="c-auth-type-token-label is-active u-text-no-wrap">{authType === 'private' ? 'Private token:' : 'App ID:'}</span>
                            </label>
                            <input className="u-width-half@gtLine e-input" id="input2"
                                   type="password" name="token" autoComplete="off" required={true}/>
                        </div>
                        <div className="o-layout o-layout--equal">
                            <fieldset className="o-layout__item">
                                <legend className="u-text-no-wrap u-gamma">Additional settings</legend>
                                <div>
                                    <div className="c-form-cell u-tight">
                                        <label htmlFor="dummy-users-id-input"
                                               className="c-form-cell__label u-epsilon">Dummy users ID: <span
                                            className="u-milli u-color-text-light">(comma separated list of IDs)</span></label>
                                        <div
                                            className="c-form-cell__error c-notice c-notice--small c-notice--point-bottom">
                                            <svg className="c-notice__icon e-icon e-icon--circle u-delta"
                                                 aria-hidden="true">
                                                <use xlinkHref="#info"/>
                                            </svg>
                                            <p className="c-notice__content">If for some reason you use some dummy
                                                users in groups, here you can exclude them from view.</p>
                                        </div>
                                        <input className="e-input" id="dummy-users-id-input" type="text"
                                               name="dummy-users-id" pattern="^(\d+,?)*$"
                                               placeholder="123456,123456,123456"/>
                                    </div>
                                    <div className="c-form-cell c-form-cell--inline">
                                        <input className="e-input" id="remove-actual-user-from-participants"
                                               type="checkbox" value="1" name="remove-actual-user-from-participants"
                                               defaultChecked={true}/>
                                        <label htmlFor="remove-actual-user-from-participants"
                                               className="e-input e-input--faux" aria-hidden="true"/>
                                        <label htmlFor="remove-actual-user-from-participants"
                                               className="c-form-cell__label u-epsilon">Remove actual user from
                                            participants view</label>
                                    </div>
                                </div>
                                <div className="c-form-cell">
                                    <label htmlFor="cache-time-input" className="c-form-cell__label u-epsilon">Cache
                                        time [minutes]: <span className="u-milli u-color-text-light">(set how long will be downloaded data cached before they will be downloaded again)</span></label>
                                    <input className="e-input" id="cache-time-input" type="number" min="1"
                                           defaultValue={8}
                                           name="cache-time"/>
                                </div>
                            </fieldset>
                            <fieldset className="o-layout__item">
                                <legend className="u-text-no-wrap u-gamma">Gitlab Fixtures</legend>
                                {AVAILABLE_FIXTURES.map((fixture: FixtureT, index: number) => <FixtureInput key={index}
                                                                                                            fixture={fixture}
                                                                                                            checked={false}
                                                                                                            disableTextWrap={true}
                                                                                                            changeHandler={() => {}}/>)}
                            </fieldset>
                        </div>
                    </fieldset>
                    <button className="e-button">Add settings</button>
                </div>
            </fieldset>
        </form>)
};
