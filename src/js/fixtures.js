const AVAILABLE_FIXTURES = [
    {
        name: 'commits-count',
        value: 'commits-count',
        description: 'Show commits count in merge button',
        urlPathRegex: /^\/\S+\/-\/merge_requests\/\d+$/,
        scriptFile: 'commits-count.js',
    },
    {
        name: 'ci-cd-textarea',
        value: 'ci-cd-textarea',
        description: 'Expand CI/CD secrets textarea',
        urlPathRegex: /^\/\S+\/-\/settings\/ci_cd$/,
        scriptFile: 'ci-cd-textarea.js',
        styleFile: 'ci-cd-textarea.css',
    },
    {
        name: 'auto-check-delete-branch',
        value: 'auto-check-delete-branch',
        description: 'Automatically check delete source branch in new-mergerequest page',
        urlPathRegex: /^\/\S+\/-\/merge_requests\/new$/,
        scriptFile: 'auto-check-delete-branch.js',
    },
    {
        name: 'text-area-expand-new-pipeline',
        value: 'text-area-expand-new-pipeline',
        description: 'Expand textarea on new pipeline page',
        urlPathRegex: /^\/\S+\/pipelines\/new$/,
        styleFile: 'text-area-expand-new-pipeline.css',
    },
];

/**
 * @param {string[]} enabledFixtures
 * @param {string} url
 * @return {{scriptFile: string, styleFile: string}}
 */
export function getAvailableFixture(enabledFixtures, url) {
    let urlPath = new URL(url).pathname;
    return AVAILABLE_FIXTURES
        .filter(fixture => enabledFixtures.includes(fixture.value) && urlPath.match(fixture.urlPathRegex))
        .map(fixture => {return {scriptFile: fixture.scriptFile, styleFile: fixture.styleFile}});
}

/**
 * @param {string[]} selectedValues
 * @param {boolean} disableTextWrap
 * @return {string}
 */
export function renderFixtureInputs(selectedValues = [], disableTextWrap = false) {
    let uniqueId = Date.now();
    let ret = ``;
    for (let fixture of AVAILABLE_FIXTURES) {
        ret += `
            <div class="c-form-cell c-form-cell--inline">
                <input class="e-input" id="fixture__${fixture.name}-${uniqueId}" type="checkbox" name="fixtures" value="${fixture.value}"${selectedValues.includes(fixture.value) ? ' checked' : ''}>
                <label for="fixture__${fixture.name}-${uniqueId}" class="e-input e-input--faux" aria-hidden="true"></label>
                <label for="fixture__${fixture.name}-${uniqueId}" class="c-form-cell__label u-epsilon${disableTextWrap ? ' u-text-no-wrap' : ''}">
                    ${fixture.description}
                </label>
            </div>
        `;
    }
    return ret;
}
