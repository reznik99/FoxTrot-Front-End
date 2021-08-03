
export function humanTime(lastTime) {
    if (!lastTime)
        return null;

    let now = Date.now();
    let diff = now - new Date(lastTime).valueOf();

    return diff / 1000 > 60
        ? diff / 1000 / 60 > 60
            ? diff / 1000 / 60 / 60 > 24
                ? `${parseInt(diff / 1000 / 60 / 60 / 24)} days ago`
                : `${parseInt(diff / 1000 / 60 / 60)} h ago`
            : `${parseInt(diff / 1000 / 60)} m ago`
        : 'just now';
}