import * as React from 'react';
import classNames from 'classnames';
import {FC} from 'react';
import {FixtureT} from "../../@types/fixture";

type Props = {
    disableTextWrap: boolean;
    checked: boolean;
    fixture: FixtureT;
};

export const FixtureInput: FC<Props> = ({fixture, checked, disableTextWrap = false}) => {
    const uniqueId = new Date().getTime();
    return (
        <div className="c-form-cell c-form-cell--inline">
            <input className="e-input" id={`fixture__${fixture.name}-${uniqueId}`} type="checkbox" name="fixtures"
                   value={fixture.value} defaultChecked={checked} />
            <label htmlFor={`fixture__${fixture.name}-${uniqueId}`} className="e-input e-input--faux" aria-hidden="true"/>
            <label htmlFor={`fixture__${fixture.name}-${uniqueId}`}
                   className={classNames('c-form-cell__label', 'u-epsilon', {'u-text-no-wrap': disableTextWrap})}>
                {fixture.description}
            </label>
        </div>
    );
};
