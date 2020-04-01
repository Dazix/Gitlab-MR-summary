import Data from "./data";

export default class HTMLContent {

    
    getSkeleton() {
        return `
            <div class="c-dropdown js-dropdown scope-essentials-v1.50.0 dropdown-menu dropdown-menu-right hidden">
                <div class="c-merge-requests-cont">
                    <header class="c-merge-requests-cont__header">
                        <div class="c-merge-requests-cont__info-cont js-merge-requests-cont__info-cont">${this.getMessage('Downloading...')}</div>
                        <input type="text" placeholder="Search..." class="c-merge-requests-cont__search e-input js-merge-requests-cont__search">
                        <div class="c-age e-note u-align-right">
                            Last update:<span class="c-age__time js-merge-requests-cont__last-update">?</span><button class="c-age__refresh u-gamma js-refresh-button">&#8635;</button>
                        </div>
                    </header>
                    <section class="c-merge-requests-cont__list js-merge-requests-cont__list"></section>
                </div>
            </div>
        `;
    }
    
    /**
     * @param {Data} data
     * @return {{lastUpdate: string, mergeRequestsOverview: string}}
     */
    renderList(data) {
        return {
            lastUpdate: `${data.age.toLocaleTimeString()} ${data.age.toDateString()}`,
            mergeRequestsOverview: 
                `<h3 class="e-heading u-bold u-delta">To review</h3>
                ${this._getSimpleMRsList(Data.sortByAlreadyApprovedAndByDate(data.nonUsersMergeRequests))}
                <h3 class="e-heading u-bold u-delta">Created</h3>
                ${this._getSimpleMRsList(Data.sortByDate(data.usersMergeRequests))}`,
        };
    }

    /**
     * @param {string} text
     * @param {string} type
     * @return {string}
     */
    getMessage(text, type = 'info') {
        return `<div class="c-notice c-notice--small c-notice--${type}">
                    <p class="c-notice__content">${text}</p>
                </div>`;
    }

    /**
     * @param {MergeRequest[]} mergeRequests
     * @return {string}
     * @private
     */
    _getSimpleMRsList(mergeRequests) {
        let listItemsMRsToReview = '';
        for (let mergeRequest of mergeRequests) {
            // sort participants alphabetically
            let participants = mergeRequest.participants.sort((a,b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
            listItemsMRsToReview +=
                `<li class="c-merge-request${mergeRequest.approvedByUser ? ' c-merge-request--approved-by-me' : ''} js-merge-request" data-merge-request-unique-id="${mergeRequest.uniqueId}">
                    <div class="c-avatar c-merge-request__col c-merge-request__col--first">
                        <img src="${mergeRequest.author.avatarUrl}" alt="${mergeRequest.author.name}" title="${mergeRequest.author.name}" class="c-avatar__img">
                    </div>
                    <div class="c-merge-request__col c-merge-request__col--second">
                        <a class="js-link-merge-request e-link" href="${mergeRequest.webUrl}">${mergeRequest.title}</a>
                        <small class="e-note">${mergeRequest.project.nameWithNamespace}</small> 
                        <small class="e-note">${mergeRequest.sourceBranch} ⮕ ${mergeRequest.targetBranch}</small> 
                    </div>
                    <div class="c-merge-request__col c-merge-request__col--third">
                        ${participants.map(user => `<div class="c-avatar${user.approved ? ' is-approved': ''}"><img class="c-avatar__img c-avatar__img--small" src="${user.avatarUrl}" alt="${user.name}" title="${user.name} (ID ${user.id})"></div>`).join('')}
                    </div>
                 </li>`
        }

        return `<ul class="o-block-list o-block-list--tight">${listItemsMRsToReview}</ul>`;


    }

    update() {

    }

}
