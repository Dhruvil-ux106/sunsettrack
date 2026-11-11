
const pathToRegexp = require("path-to-regexp");

const routes = new Map();

const ALLOWED_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
    "HEAD"
];

function isValidDate(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return false;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime());
}

function validateRoute(config) {
    if (
        !config ||
        typeof config !== "object" ||
        Array.isArray(config)
    ) {
        throw new Error("Route configuration must be an object");
    }

    const {
        method,
        path,
        successor,
        deprecatedAt,
        sunsetAt
    } = config;

    if (
        typeof method !== "string" ||
        !ALLOWED_METHODS.includes(method.toUpperCase())
    ) {
        throw new Error("Invalid HTTP method");
    }

    if (
        typeof path !== "string" ||
        !path.startsWith("/") ||
        path.trim() === ""
    ) {
        throw new Error("Path must be a valid absolute route path");
    }

    if (
        successor !== undefined &&
        (
            typeof successor !== "string" ||
            !successor.startsWith("/") ||
            successor.trim() === ""
        )
    ) {
        throw new Error("Successor must be a valid absolute route path");
    }

    if (deprecatedAt !== undefined && !isValidDate(deprecatedAt)) {
        throw new Error("Invalid deprecation date");
    }

    if (sunsetAt !== undefined && !isValidDate(sunsetAt)) {
        throw new Error("Invalid sunset date");
    }

    if (deprecatedAt && sunsetAt) {
        if (new Date(sunsetAt) < new Date(deprecatedAt)) {
            throw new Error("Sunset date cannot be before deprecation date");
        }
    }
}

function registerRoute(config) {
    validateRoute(config);

    const {
        method,
        path,
        successor,
        deprecatedAt,
        sunsetAt
    } = config;

    const key = `${method.toUpperCase()}:${path}`;

    if (routes.has(key)) {
        throw new Error("Route is already registered");
    }

    routes.set(key, {
        method: method.toUpperCase(),
        path,
        successor,
        deprecatedAt,
        sunsetAt
    });

    return routes.get(key);
}

function getRoute(method, path) {
    const key = `${method.toUpperCase()}:${path}`;
    return routes.get(key);
}

function findMatchingRoute(method, requestPath) {
    const normalizedMethod = method.toUpperCase();

    // First priority: exact route matches
    for (const route of routes.values()) {
        if (
            route.method === normalizedMethod &&
            route.path === requestPath
        ) {
            return route;
        }
    }

    // Second priority: dynamic route matches
    for (const route of routes.values()) {
        if (route.method !== normalizedMethod) {
            continue;
        }

        const keys = [];
        const regex = pathToRegexp(route.path, keys);

        if (regex.test(requestPath)) {
            return route;
        }
    }

    return undefined;
}

function extractRouteParams(routePath, requestPath) {
    const keys = [];
    const regex = pathToRegexp(routePath, keys);
    const match = regex.exec(requestPath);

    if (!match) {
        return {};
    }

    const params = {};

    keys.forEach((key, index) => {
        const value = match[index + 1];

        if (value !== undefined) {
            try {
                params[key.name] = decodeURIComponent(value);
            } catch {
                params[key.name] = value;
            }
        }
    });

    return params;
}

function getAllRoutes() {
    return Array.from(routes.values());
}

function removeRoute(method, path) {
    const key = `${method.toUpperCase()}:${path}`;
    return routes.delete(key);
}

function clearRegistry() {
    routes.clear();
}

module.exports = {
    registerRoute,
    getRoute,
    findMatchingRoute,
    extractRouteParams,
    getAllRoutes,
    removeRoute,
    clearRegistry
};
