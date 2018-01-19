import 'isomorphic-fetch';

export function request(url, data = {}) {
    const { body, headers = {}, ...rest } = data;
    const defaultContentTypeHeader = 'application/x-www-form-urlencoded; charset=utf-8';

    const allHeaders = Object.keys(headers).map((h) => h.toLowerCase());

    if (allHeaders.indexOf('content-type') === -1) {
        headers['Content-Type'] = defaultContentTypeHeader;
    }

    const options = {
        method: 'GET',
        headers,
        credentials: 'include',
        ...rest
    };
    const lowercase = options.method.toLowerCase();

    if (body && Object.keys(body).length) {
        if (lowercase !== 'get' && lowercase !== 'head') {
            options.body = JSON.stringify(body);

            if (options.headers['Content-Type'] === defaultContentTypeHeader) {
                options.body = Object.keys(body).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`).join('&');
            }
        }
    }

    // Allow for relative urls to be fetched on server
    if (typeof window === 'undefined' && url.match(/^\/\w+/)) {
        url = `http://localhost:${process.env.PORT || 4000}${url}`;
    }

    return fetch(url, options).then((response) => {
        return Promise.all([
            response.status,
            // Not using response.json() here because some requests
            // like OPTIONS requests return a non JSON response. Maybe
            // if we wanted to make things cleaner here, we could check
            // the request headers for application/json and return
            // response.json() specifically for that case, otherwise .text()
            response.text()
        ]);
    }).then(([status, text]) => {
        let ret = text;

        try {
            ret = JSON.parse(text);
        }
        catch (e) {} // eslint-disable-line no-empty

        if (status >= 200 && status < 300) {
            return ret;
        }

        throw ret;
    });
}

// https://stackoverflow.com/a/13052187/1048847
export function today() {
    const local = new Date();

    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());

    return local.toJSON().slice(0, 10);
}

export function encodePostBody(body) {
    return Object.keys(body).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`).join('&');
}

export function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

export function wait(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

export function randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
