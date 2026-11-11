
const { getRoute } = require("./registry");
const { generateHeaders } = require("./headers");
const { trackRequest } = require("./tracker");


function sunsetTrack(options = {}) {
    const headerName = options.clientIdHeader || "X-API-Client-ID";

    return function (req, res, next) {
        const route = getRoute(req.method, req.path);

        if (!route) {
            return next();
        }

        const clientId = req.get(headerName) || "unknown";

        // Track usage of the deprecated endpoint
        trackRequest(req.method, req.path, clientId);

        // Generate and attach deprecation headers
        const headers = generateHeaders(route);

        Object.entries(headers).forEach(([name, value]) => {
            res.setHeader(name, value);
        });

        next();
    };
}

module.exports = { sunsetTrack };
