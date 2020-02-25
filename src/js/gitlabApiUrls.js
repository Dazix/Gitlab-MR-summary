export default class GitlabApiUrls {
    user = `${window.location.origin}/api/v4/user`;
    groups = `${window.location.origin}/api/v4/groups`;
    projects = `${window.location.origin}/api/v4/projects`;
    projectMRs = `${window.location.origin}/api/v4/projects/:project_id:/merge_requests?state=opened`;
    projectMRsParticipants = `${window.location.origin}/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/participants`;
    mergeRequestApprovals = `${window.location.origin}/api/v4/projects/:project_id:/merge_requests/:merge_request_iid:/approvals`;
}
