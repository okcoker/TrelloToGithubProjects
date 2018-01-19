export function suffix(action, suf, separator = '_') {
    return `${action}${separator}${suf}`;
}

export function requestSuffix(action) {
    return suffix(action, 'REQUEST');
}

export function failSuffix(action) {
    return suffix(action, 'FAILURE');
}
