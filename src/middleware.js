
const { findMatchingRoute } = require("./registry");
const { generateHeaders } = require("./headers");
const { trackRequest } = require("./tracker");

function sunsetTrack(options = {}) {
    const headerName =
        options.clientIdHeader || "X-API-Client-ID";

    return function (req, res, next) {
        // Include router mount prefixes
        const fullPath = `${req.baseUrl || ""}${req.path}`;

        // Match both static and dynamic registered routes
        const route = findMatchingRoute(req.method, fullPath);

        if (!route) {
            return next();
        }

        const clientId = req.get(headerName) || "unknown";

        // Track deprecated endpoint usage
        trackRequest(req.method, route.path, clientId);

        // Generate and attach deprecation headers
        const headers = generateHeaders(route);

        Object.entries(headers).forEach(([name, value]) => {
            res.setHeader(name, value);
        });

        next();
    };
}

module.exports = { sunsetTrack };
