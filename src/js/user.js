
export default class User {

    /** @type {number} */
    id;
    /** @type {URL} */
    avatarUrl;
    /** @type {string} */
    name;
    /** @type {number[]} */
    groupsId;
    /** @type {boolean} */
    approved;

    /**
     * @param {{groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}} data
     */
    constructor(data = {}) {
        this.id = data.id;
        this.avatarUrl = data.avatarUrl ? new URL(data.avatarUrl) : undefined;
        this.name = data.name;
        this.groupsId = data.groupsId;
        this.approved = data.approved;
    }

    /**
     * @return {{groupsId: number[], approved: boolean, avatarUrl: string, name: string, id: number}}
     */
    getAsSimpleDataObject() {
        return {
            id: this.id,
            avatarUrl: this.avatarUrl ? this.avatarUrl.toString() : undefined,
            name: this.name,
            groupsId: this.groupsId,
            approved: this.approved,
        };
    }
}