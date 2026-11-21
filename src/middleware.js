
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
        try {
            const fullPath = `${req.baseUrl || ""}${req.path}`;

            const route = findMatchingRoute(
                req.method,
                fullPath
            );

            if (!route) {
                return next();
            }

            const clientId = req.get(headerName) || "unknown";

            const requestParams = extractRouteParams(
                route.path,
                fullPath
            );

            const headers = generateHeaders(
                route,
                requestParams
            );

            trackRequest(
                req.method,
                route.path,
                clientId
            );

            Object.entries(headers).forEach(([name, value]) => {
                res.setHeader(name, value);
            });

            return next();
        } catch (error) {
            return next(error);
        }
    };
}


module.exports = { sunsetTrack };
