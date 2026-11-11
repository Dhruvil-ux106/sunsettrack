
const {
    findMatchingRoute,
    extractRouteParams
} = require("./registry");

const { generateHeaders } = require("./headers");
const { trackRequest } = require("./tracker");

function sunsetTrack(options = {}) {
    const headerName =
        options.clientIdHeader || "X-API-Client-ID";

    return function (req, res, next) {
        // Include router mount prefixes
        const fullPath = `${req.baseUrl || ""}${req.path}`;

        // Find matching registered route
        const route = findMatchingRoute(
            req.method,
            fullPath
        );

        if (!route) {
            return next();
        }

        // Identify API client
        const clientId = req.get(headerName) || "unknown";

        // Track against registered route pattern
        trackRequest(
            req.method,
            route.path,
            clientId
        );

        // Extract parameters from the actual request path
        const requestParams = extractRouteParams(
            route.path,
            fullPath
        );

        // Generate headers using extracted parameters
        const headers = generateHeaders(
            route,
            requestParams
        );

        Object.entries(headers).forEach(([name, value]) => {
            res.setHeader(name, value);
        });

        next();
    };
}

module.exports = { sunsetTrack };
