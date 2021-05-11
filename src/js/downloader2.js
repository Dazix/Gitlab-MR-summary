import {MERGE_REQUESTS_QUERY} from "./queries.js";
import {getDomainData} from "./backgroundHelper.js";
import {GraphQLClient} from "graphql-request";
import GitlabApiUrls from "./gitlabApiUrls.js";

let _client;
const getClient = async (userUrl) => {
    if (_client) return _client;

    const domainData = await getDomainData(userUrl)
    const urls = new GitlabApiUrls(domainData.data.url);
    
    const headers = new Headers();
    if (domainData.authType === 'private') {
        headers.append('Private-Token', domainData.token);
    } else {
        headers.append('Authorization', `Bearer ${domainData.token}`)
    }

    headers.append('Request-Identification', 'GitlabMRSummary-BrowserExtension/https://github.com/Dazix/Gitlab-MR-summary');


    _client = new GraphQLClient(urls.graphQLEndpoint, {
        headers: headers
    });
    
    return _client;
};
export const getMergeRequestsData = async (userUrl) => {
    const client = await getClient(userUrl);
    let data = [];
    let queryVariables = {};
    let response;
    do {
        response = await client.request(MERGE_REQUESTS_QUERY, queryVariables);
        data = [...data, ...response.projects.nodes]
        queryVariables.after = response.projects.pageInfo.endCursor;
    } while (response.projects.pageInfo.hasNextPage);

    return data;
}
