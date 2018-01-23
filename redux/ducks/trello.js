import { request } from '../../utils/index';
import { requestSuffix, failSuffix } from '../utils/index';
import { CREATE_ISSUE_FROM_CARD_ID } from './github';

const PREFIX = 'ttp/trello/';
const SET_KEY = `${PREFIX}SET_KEY`;
const SET_SECRET = `${PREFIX}SET_SECRET`;
const VALIDATE_CREDENTIALS = `${PREFIX}VALIDATE_CREDENTIALS`;
const GET_BOARDS = `${PREFIX}GET_BOARDS`;
const SET_CURRENT_BOARD_ID = `${PREFIX}SET_CURRENT_BOARD_ID`;
const GET_LISTS = `${PREFIX}GET_LISTS`;
const SET_LIST_CHECK_STATE = `${PREFIX}SET_LIST_CHECK_STATE`;
const RESET_LIST_DESTINATION_NAMES = `${PREFIX}RESET_LIST_DESTINATION_NAMES`;
const SET_LIST_DESTINATION_NAME_INDEX = `${PREFIX}SET_LIST_DESTINATION_NAME_INDEX`;
const ADD_NEW_DESTINATION_LIST = `${PREFIX}ADD_NEW_DESTINATION_LIST`;
const GET_CARDS = `${PREFIX}GET_CARDS`;
const GET_CARD_MARKDOWN = `${PREFIX}GET_CARD_MARKDOWN`;

// May eventuall split these reducers up
const defaultState = {
    // Validation
    key: null,
    secret: null,
    isValidatingCredentials: false,
    hasValidCredentials: false,
    hasValidationError: false,

    // Boards
    isBoardsLoading: false,
    hasBoardsError: false,
    currentBoardId: '',
    boards: [],

    // Lists
    isListsLoading: false,
    hasListError: false,
    lists: [],
    destinationListNames: [],

    // Cards
    isCardsLoading: false,
    hasCardError: false,
    cards: [],

    isMarkdownLoading: false
};

export default function reducer(state = defaultState, action) {
    switch (action.type) {
        case SET_KEY:
            return {
                ...state,
                key: action.key
            };

        case SET_SECRET:
            return {
                ...state,
                secret: action.secret
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

        case requestSuffix(GET_BOARDS):
            return {
                ...state,
                isBoardsLoading: true,
                hasBoardsError: false
            };

        case failSuffix(GET_BOARDS):
            return {
                ...state,
                isBoardsLoading: false,
                hasBoardsError: true
            };

        case GET_BOARDS: {
            let currentBoardId = state.currentBoardId;

            if (!currentBoardId) {
                currentBoardId = action.resolved[0].id;
            }

            return {
                ...state,
                boards: action.resolved,
                currentBoardId,
                isBoardsLoading: false
            };
        }

        case SET_CURRENT_BOARD_ID:
            return {
                ...state,
                currentBoardId: action.boardId
            };

        case requestSuffix(GET_LISTS):
            return {
                ...state,
                isListsLoading: true,
                hasListError: false
            };

        case failSuffix(GET_LISTS):
            return {
                ...state,
                isListsLoading: false,
                hasListError: true
            };

        case GET_LISTS: {
            return {
                ...state,
                lists: action.resolved.map((item, i) => {
                    return {
                        ...item,
                        destinationListNameIndex: i,
                        checked: true
                    };
                }),
                destinationListNames: action.resolved.map((item) => {
                    return item.name;
                }),
                isListsLoading: false
            };
        }

        case RESET_LIST_DESTINATION_NAMES:
            return {
                ...state,
                destinationListNames: state.lists.map((list) => {
                    return list.name;
                }),
                lists: state.lists.map((item, i) => {
                    return {
                        ...item,
                        destinationListNameIndex: i
                    };
                })
            };

        case SET_LIST_CHECK_STATE:
            return {
                ...state,
                lists: state.lists.map((item) => {
                    const isItem = action.listId === item.id;

                    return {
                        ...item,
                        checked: isItem ? action.checked : item.checked
                    };
                })
            };


        case SET_LIST_DESTINATION_NAME_INDEX: {
            return {
                ...state,
                lists: state.lists.map((item, i) => {
                    const isItem = i === action.listIndex;

                    return {
                        ...item,
                        destinationListNameIndex: isItem ? action.destinationNameIndex : item.destinationListNameIndex
                    };
                })
            };
        }

        case ADD_NEW_DESTINATION_LIST: {
            const names = Array.from(state.destinationListNames);

            names.push(action.name);

            return {
                ...state,
                destinationListNames: names
            };
        }

        case requestSuffix(GET_CARDS):
            return {
                ...state,
                isCardsLoading: true,
                hasCardError: false
            };

        case failSuffix(GET_CARDS):
            return {
                ...state,
                isCardsLoading: false,
                hasCardError: true
            };

        case GET_CARDS: {
            return {
                ...state,
                cards: action.resolved,
                isCardsLoading: false
            };
        }

        case requestSuffix(GET_CARD_MARKDOWN):
            return {
                ...state,
                cards: state.cards.map((card) => {
                    if (card.id === action.cardId) {
                        return {
                            ...card,
                            isMarkdownLoading: true
                        };
                    }

                    return card;
                })
            };

        case failSuffix(GET_CARD_MARKDOWN):
            return {
                ...state,
                cards: state.cards.map((card) => {
                    if (card.id === action.cardId) {
                        return {
                            ...card,
                            isMarkdownLoading: false
                        };
                    }

                    return card;
                })
            };

        case GET_CARD_MARKDOWN: {
            return {
                ...state,
                cards: state.cards.map((card) => {
                    if (card.id === action.cardId) {
                        return {
                            ...card,
                            isMarkdownLoading: false,
                            markdown: action.resolved.markdown
                        };
                    }

                    return card;
                })
            };
        }

        case requestSuffix(CREATE_ISSUE_FROM_CARD_ID):
            return {
                ...state,
                cards: state.cards.map((card) => {
                    if (card.id === action.cardId) {
                        return {
                            ...card,
                            isCreatingIssue: true
                        };
                    }

                    return card;
                })
            };

        case failSuffix(CREATE_ISSUE_FROM_CARD_ID):
            return {
                ...state,
                cards: state.cards.map((card) => {
                    if (card.id === action.cardId) {
                        return {
                            ...card,
                            isCreatingIssue: false
                        };
                    }

                    return card;
                })
            };

        case CREATE_ISSUE_FROM_CARD_ID: {
            return {
                ...state,
                cards: state.cards.map((card) => {
                    if (card.id === action.cardId) {
                        return {
                            ...card,
                            isCreatingIssue: false,
                            issue: action.resolved.data
                        };
                    }

                    return card;
                })
            };
        }

        default:
            return state;
    }
}

export function setKey(key) {
    return {
        type: SET_KEY,
        key
    };
}

export function setSecret(secret) {
    return {
        type: SET_SECRET,
        secret
    };
}

export function validateCredentials(key, secret) {
    return {
        type: VALIDATE_CREDENTIALS,
        promise: request('/api/verifyTrello', {
            method: 'POST',
            body: {
                key,
                secret
            }
        })
    };
}

export function getBoards() {
    return {
        type: GET_BOARDS,
        promise: request('/api/boards')
    };
}

export function setCurrentBoardId(boardId) {
    return {
        type: SET_CURRENT_BOARD_ID,
        boardId
    };
}

export function getLists(boardId) {
    return {
        type: GET_LISTS,
        promise: request(`/api/lists?boardId=${boardId}`)
    };
}

export function setListCheckState(listId, checked) {
    return {
        type: SET_LIST_CHECK_STATE,
        listId,
        checked
    };
}

export function resetListDestinationNames() {
    return {
        type: RESET_LIST_DESTINATION_NAMES
    };
}

export function setListDestinationNameIndex(listIndex, destinationNameIndex) {
    return {
        type: SET_LIST_DESTINATION_NAME_INDEX,
        listIndex: parseInt(listIndex, 10),
        destinationNameIndex: parseInt(destinationNameIndex, 10)
    };
}

export function addNewDestinationList(name) {
    return {
        type: ADD_NEW_DESTINATION_LIST,
        name
    };
}

export function getCards(boardId) {
    return {
        type: GET_CARDS,
        promise: request(`/api/cards?boardId=${boardId}`)
    };
}

export function getMarkdownForCard(cardId) {
    return {
        type: GET_CARD_MARKDOWN,
        cardId,
        promise: request(`/api/markdown?cardId=${cardId}`)
    };
}
