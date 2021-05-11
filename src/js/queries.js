import {gql} from 'graphql-request';


export const USER_FIELDS_FRAGMENT = gql`
    fragment userFields on User {
        name,
        id,
        avatarUrl
    }
`;

export const CURRENT_USER_QUERY = gql`
    query CurrentUser {
        currentUser {
            ...userFields
        }
    }
    
    ${USER_FIELDS_FRAGMENT}
`;

export const MERGE_REQUESTS_QUERY = gql`
    query MergeRequests($after: String) {
        projects(membership: true, after: $after) {
            pageInfo {hasNextPage, endCursor}
            nodes {
                nameWithNamespace,
                fullPath,
                id,
                mergeRequests(state: opened) {
                    nodes {
                        author {
                            ...userFields
                        },
                        title,
                        createdAt,
                        iid,
                        participants {
                            nodes {
                                ...userFields
                            }
                        },
                        sourceBranch,
                        targetBranch,
                        webUrl,
                        workInProgress,
                        approvedBy {
                            nodes {
                                ...userFields
                            }
                        }
                    }
                }
            }
        }
    }
    
    ${USER_FIELDS_FRAGMENT}
`;
