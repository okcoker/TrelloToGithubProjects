import { combineReducers } from 'redux';

import github from './ducks/github';
import trello from './ducks/trello';

export default combineReducers({
    github,
    trello
});
