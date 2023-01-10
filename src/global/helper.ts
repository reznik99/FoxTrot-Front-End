
export function humanTime(lastTime: string) {
    if (!lastTime)
        return null;

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