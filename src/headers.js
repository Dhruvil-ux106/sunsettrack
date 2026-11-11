
function generateHeaders(route, requestParams = {}) {
    const headers = {};

    if (route.deprecatedAt) {
        const timestamp = Math.floor(
            new Date(route.deprecatedAt).getTime() / 1000
        );

        headers.Deprecation = `@${timestamp}`;
    }

    if (route.sunsetAt) {
        headers.Sunset = new Date(route.sunsetAt).toUTCString();
    }

    if (route.successor) {
        let successorPath = route.successor;

        for (const [key, value] of Object.entries(requestParams)) {
            const escapedKey = key.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const parameterPattern = new RegExp(
                `:${escapedKey}(?=/|\\?|$)`,
                "g"
            );

            successorPath = successorPath.replace(
                parameterPattern,
                encodeURIComponent(String(value))
            );
        }

        headers.Link =
            `<${successorPath}>; rel="successor-version"`;
    }

    return headers;
}

module.exports = { generateHeaders };
