import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';

import promiseMiddleware from './middleware/promiseMiddleware';
import rootReducer from './reducer';

export function configureStore(initialState) {
    const middlewares = [
        thunkMiddleware,
        promiseMiddleware
    ];

    if (process.env.NODE_ENV === 'development') {
        // Dont show in CLI
        if (typeof window !== 'undefined') {
            const { createLogger } = require('redux-logger');
            const logger = createLogger();

            middlewares.push(logger);
        }
    }

    // Redux DevTools Configuration
    const actionCreators = {
    };

    // If Redux DevTools Extension is installed use it, otherwise use Redux compose
    /* eslint-disable no-underscore-dangle */
    const composeEnhancers = typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            // Options: http://zalmoxisus.github.io/redux-devtools-extension/API/Arguments.html
            actionCreators
        })
        : compose;

    const store = createStore(
        rootReducer,
        initialState,
        composeEnhancers(
            applyMiddleware(...middlewares)
        )
    );

    return store;
}
