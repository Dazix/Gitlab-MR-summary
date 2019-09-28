var OptionsManager = OptionsManager || class {

    constructor() {
        this.optionPrefix = 'opt';
    }

    /**
     *
     * @param {String} category
     * @param {String} name
     * @param {String|Number|Boolean} value
     *
     * @returns Promise
     */
    saveOption(category, name, value) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this._getOptionKey(category, name)]: value }, () => {
                if (chrome.runtime.lastError) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * @param {String} category
     * @param {String} name
     *
     * @returns Promise<String|Number|Boolean>
     */
    getOption(category, name) {
        return new Promise(resolve => {
            chrome.storage.local.get([this._getOptionKey(category, name)], res => {
                resolve(res.hasOwnProperty(this._getOptionKey(category, name)) ? res[this._getOptionKey(category, name)] : null);
            });
        })
    }

    /**
     *
     * @param {String} category
     * @param {String} name
     *
     * @returns String
     */
    _getOptionKey(category, name) {
        return `${this.optionPrefix}-${category}__${name}`;
    }
};