
export const milliseconds = {
    second: 1_000,
    minute: 60 * 1_000,
    hour: 24 * 60 * 1_000,
}

export function millisecondsSince(datetime: Date) {
    return Date.now() - datetime.getTime()
}

export function humanTime(lastTime: string) {
    if (!lastTime) { return null; }

    let now = Date.now();
    let diff = now - new Date(lastTime).valueOf();

    return diff / 1000 > 60
        ? diff / 1000 / 60 > 60
            ? diff / 1000 / 60 / 60 > 24
                ? `${new Date(lastTime).toLocaleDateString()}`
                : `${~~(diff / 1000 / 60 / 60)} h ago`
            : `${~~(diff / 1000 / 60)} m ago`
        : 'just now';
}


export function getAvatar(identifier: string | number) {
    return `https://robohash.org/${identifier}`;
    // let value = identifier
    // if(identifier?.length >= 2) value = `${identifier[0]}+${identifier[1]}`
    // return `https://ui-avatars.com/api/?background=random&name=${value}`
}
