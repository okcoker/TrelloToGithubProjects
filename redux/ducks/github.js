import { request } from '../../utils/index';
import { requestSuffix, failSuffix } from '../utils/index';

const PREFIX = 'ttp/github/';
const SET_PERSONAL_TOKEN = `${PREFIX}SET_PERSONAL_TOKEN`;
const VALIDATE_CREDENTIALS = `${PREFIX}VALIDATE_CREDENTIALS`;
const GET_ORGANIZATIONS = `${PREFIX}GET_ORGANIZATIONS`;
const SET_ORGANIZATION_ID = `${PREFIX}SET_ORGANIZATION_ID`;
const GET_PROJECTS = `${PREFIX}GET_PROJECTS`;
const SET_PROJECT_ID = `${PREFIX}SET_PROJECT_ID`;
const ADD_NEW_PROJECT = `${PREFIX}ADD_NEW_PROJECT`;
const PERFORM_MIGRATION = `${PREFIX}PERFORM_MIGRATION`;
const GET_REPOS = `${PREFIX}GET_REPOS`;
const SET_REPO_ID = `${PREFIX}SET_REPO_ID`;

export const CREATE_ISSUE_FROM_CARD_ID = `${PREFIX}CREATE_ISSUE_FROM_CARD_ID`;

// May eventuall split these reducers up
const defaultState = {
    // Validation
    token: null,
    isValidatingCredentials: false,
    hasValidCredentials: false,
    hasValidationError: false,

    // Orgs
    isOrganizationLoading: false,
    hasOrgazniationError: false,
    currentOrganizationId: '',
    organizations: [],

    // Projects
    isProjectsLoading: false,
    hasProjectError: false,
    currentProjectId: '',
    projects: [],

    // Repos
    isReposLoading: false,
    hasRepoError: false,
    currentRepoId: '',
    repos: [],

    // Migration
    isMigrating: false
};

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case SET_PERSONAL_TOKEN:
            return {
                ...state,
                token: action.token
            };

        case requestSuffix(VALIDATE_CREDENTIALS):
            return {
                ...state,
                isValidatingCredentials: true,
                hasValidationError: false
            };

        case failSuffix(VALIDATE_CREDENTIALS):
            return {
                ...state,
                isValidatingCredentials: false,
                hasValidationError: true
            };

        case VALIDATE_CREDENTIALS:
            return {
                ...state,
                hasValidCredentials: true,
                isValidatingCredentials: false
            };

        case requestSuffix(GET_ORGANIZATIONS):
            return {
                ...state,
                isOrganizationLoading: true,
                hasOrgazniationError: false
            };

        case failSuffix(GET_ORGANIZATIONS):
            return {
                ...state,
                isOrganizationLoading: false,
                hasOrgazniationError: true
            };

        case GET_ORGANIZATIONS: {
            let currentOrganizationId = state.currentOrganizationId;

            if (!currentOrganizationId) {
                currentOrganizationId = action.resolved.data[0].id;
            }

            return {
                ...state,
                organizations: action.resolved.data,
                currentOrganizationId,
                isOrganizationLoading: false
            };
        }

        case SET_ORGANIZATION_ID:
            return {
                ...state,
                currentOrganizationId: action.organizationId
            };

        case requestSuffix(GET_PROJECTS):
            return {
                ...state,
                isProjectsLoading: true,
                hasProjectError: false
            };

        case failSuffix(GET_PROJECTS):
            return {
                ...state,
                isProjectsLoading: false,
                hasProjectError: true
            };

        case GET_PROJECTS: {
            return {
                ...state,
                projects: action.resolved.data,
                isProjectsLoading: false
            };
        }

        case SET_PROJECT_ID:
            return {
                ...state,
                currentProjectId: action.projectId
            };

        case ADD_NEW_PROJECT: {
            const projects = Array.from(state.projects).filter((project) => {
                return project.id !== 'new';
            });

            return {
                ...state,
                projects: projects.concat({
                    name: action.name,
                    id: 'new'
                }),
                currentProjectId: 'new'
            };
        }

        case requestSuffix(PERFORM_MIGRATION):
            return {
                ...state,
                isMigrating: true
            };

        case failSuffix(PERFORM_MIGRATION):
            return {
                ...state,
                isMigrating: false
            };

        case PERFORM_MIGRATION: {
            return {
                ...state,
                isMigrating: false
            };
        }

        case requestSuffix(GET_REPOS):
            return {
                ...state,
                isReposLoading: true,
                hasRepoError: false
            };

        case failSuffix(GET_REPOS):
            return {
                ...state,
                isReposLoading: false,
                hasRepoError: true
            };

        case GET_REPOS: {
            const repos = action.resolved.data.sort((x, y) => {
                return x.full_name.localeCompare(y.full_name);
            });
            let currentRepoId = state.currentRepoId;

            if (!currentRepoId) {
                currentRepoId = repos[0].id;
            }

            return {
                ...state,
                repos,
                isReposLoading: false,
                currentRepoId
            };
        }

        case SET_REPO_ID:
            return {
                ...state,
                currentRepoId: action.repoId
            };

        default:
            return state;
    }
}

export function setPersonalToken(token) {
    return {
        type: SET_PERSONAL_TOKEN,
        token
    };
}

export function validateCredentials(token) {
    return {
        type: VALIDATE_CREDENTIALS,
        promise: request('/api/verifyGithub', {
            method: 'POST',
            body: {
                token
            }
        })
    };
}

export function getOrganizations() {
    return {
        type: GET_ORGANIZATIONS,
        promise: request('/api/organizations')
    };
}

export function setOrganizationId(organizationId) {
    return {
        type: SET_ORGANIZATION_ID,
        organizationId: parseInt(organizationId, 10)
    };
}

export function getProjects(org) {
    return {
        type: GET_PROJECTS,
        promise: request(`/api/projects?organization=${org}`)
    };
}

export function getRepos() {
    return {
        type: GET_REPOS,
        promise: request('/api/repos')
    };
}

export function setRepoId(repoId) {
    return {
        type: SET_REPO_ID,
        repoId: parseInt(repoId, 10)
    };
}

export function setProjectId(projectId) {
    return {
        type: SET_PROJECT_ID,
        projectId: parseInt(projectId, 10)
    };
}

export function addNewProject(name) {
    return {
        type: ADD_NEW_PROJECT,
        name
    };
}

export function createIssueFromCardId(cardId, owner, name) {
    return {
        type: CREATE_ISSUE_FROM_CARD_ID,
        promise: request('/api/createIssue', {
            method: 'POST',
            body: {
                cardId,
                owner,
                name
            }
        })
    };
}

export function performMigration(data) {
    return {
        type: PERFORM_MIGRATION,
        promise: request('/api/migrate', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: data
        })
    };
}
