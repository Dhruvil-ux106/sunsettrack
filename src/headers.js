
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

        const parameterNames = [
            ...successorPath.matchAll(/:([a-zA-Z0-9_]+)/g)
        ].map(match => match[1]);

        for (const name of parameterNames) {
            if (
                requestParams[name] === undefined ||
                requestParams[name] === null
            ) {
                throw new Error(
                    `Missing successor URL parameter: ${name}`
                );
            }

            const escapedName = name.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const parameterPattern = new RegExp(
                `:${escapedName}(?=/|\\?|$)`,
                "g"
            );

            successorPath = successorPath.replace(
                parameterPattern,
                encodeURIComponent(String(requestParams[name]))
            );
        }

        headers.Link =
            `<${successorPath}>; rel="successor-version"`;
    }

    return headers;
}

module.exports = { generateHeaders };
