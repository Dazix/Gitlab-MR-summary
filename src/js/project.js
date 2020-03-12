export default class Project {
    /** @type {number} */
    id;
    /** @type {string} */
    pathWithNamespace;
    /** @type {string} */
    nameWithNamespace;

    /**
     * @param {{nameWithNamespace: string, id: number, pathWithNamespace: string}} data
     */
    constructor(data = {}) {
        Object.keys(this).forEach(classProperty => {
            this[classProperty] = data[classProperty];
        });
    }

    /**
     * @return {{nameWithNamespace: string, id: number, pathWithNamespace: string}}
     */
    getAsSimpleDataObject() {
        let data = {};
        Object.entries(this).forEach(entry => {
            data[entry[0]] = entry[1];
        });
        return data;
    }
}
