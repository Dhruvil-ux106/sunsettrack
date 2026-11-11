function generateHeaders(route) {
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
        headers.Link = `<${route.successor}>; rel="successor-version"`;
    }

    return headers;
}

module.exports = { generateHeaders };