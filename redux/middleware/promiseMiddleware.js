export default function promiseMiddleware() {
    return (next) => (action) => {
        const { promise, type, ...rest } = action;

        if (!promise) {
            return next(action);
        }

        const SUCCESS = type;

        const REQUEST = `${type}_REQUEST`;
        const FAILURE = `${type}_FAILURE`;

        next({ ...rest, type: REQUEST }); // eslint-disable-line callback-return

        let returnPromise = promise.then((resolved) => {
            let promiseAllError = false;

            if (Array.isArray(resolved) && resolved.some((obj) => obj.errorcode)) {
                promiseAllError = true;
            }

            if (resolved && (resolved.errorcode || promiseAllError)) {
                throw JSON.stringify(resolved);
            }

            return next({ ...rest, resolved, type: SUCCESS });
        }).catch((error) => {
            console.info('Promise middleware error from type:', type, 'action:', action);
            // make sure `error` here is an array of errors or
            // a single error that can be used in the reducer.
            // We shouldn't need to do any JSON.parse()
            // calls in the reducer. The middleware here should do all
            // the heavy lifting and just give us what we need in the reducers
            return next({ ...rest, error, type: FAILURE });
        });

        // If node we don't want to throw an error when fetching data on the server
        // because it will cause a 500 error
        if (typeof window !== 'undefined') {
            returnPromise = returnPromise.then((actionObj) => {
                // After `type_FAILURE` is handled by redux, lets throw the error
                // so that any dispatch().then() call will appropriately go straight
                // to the catch block
                if (actionObj.error) {
                    throw actionObj.error;
                }

                return actionObj;
            });
        }

        return returnPromise;
    };
}
