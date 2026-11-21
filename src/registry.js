
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

// Validate a real calendar date
function isValidCalendarDate(year, month, day) {
    const date = new Date(0);

    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

// Validate YYYY-MM-DD or ISO 8601 date-time
function isValidDate(value) {
    if (
        typeof value !== "string" ||
        value.trim() !== value
    ) {
        return false;
    }

    const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateOnlyMatch = value.match(dateOnlyPattern);

    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;

        return isValidCalendarDate(
            Number(year),
            Number(month),
            Number(day)
        );
    }

    const dateTimePattern =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

    const dateTimeMatch = value.match(dateTimePattern);

    if (!dateTimeMatch) {
        return false;
    }

    const [
        ,
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        timezone
    ] = dateTimeMatch;

    if (
        !isValidCalendarDate(
            Number(year),
            Number(month),
            Number(day)
        )
    ) {
        return false;
    }

    if (
        Number(hours) > 23 ||
        Number(minutes) > 59 ||
        Number(seconds) > 59
    ) {
        return false;
    }

    if (timezone !== "Z") {
        const [, offsetHours, offsetMinutes] =
            timezone.match(/[+-](\d{2}):(\d{2})/);

        if (
            Number(offsetHours) > 23 ||
            Number(offsetMinutes) > 59
        ) {
            return false;
        }
    }

    return !Number.isNaN(Date.parse(value));
}

// Validate route configuration
function validateRoute(route) {
    if (
        !route ||
        typeof route !== "object" ||
        Array.isArray(route)
    ) {
        throw new Error("configuration must be an object");
    }

    if (
        typeof route.method !== "string" ||
        !ALLOWED_METHODS.includes(route.method.toUpperCase())
    ) {
        throw new Error("Invalid HTTP method");
    }

    if (
        typeof route.path !== "string" ||
        !route.path.startsWith("/")
    ) {
        throw new Error("valid absolute route path");
    }

    // Reject empty parameter names such as /users/:
    if (/:($|[^a-zA-Z0-9_])/.test(route.path)) {
        throw new Error("Invalid route pattern");
    }

    // Compile the pattern to detect malformed expressions
    try {
        pathToRegexp(route.path, []);
    } catch (error) {
        throw new Error("Invalid route pattern");
    }

    if (
        route.successor !== undefined &&
        (
            typeof route.successor !== "string" ||
            !route.successor.startsWith("/")
        )
    ) {
        throw new Error(
            "Successor must be a valid absolute route path"
        );
    }

    if (
        route.deprecatedAt !== undefined &&
        !isValidDate(route.deprecatedAt)
    ) {
        throw new Error("Invalid deprecation date");
    }

    if (
        route.sunsetAt !== undefined &&
        !isValidDate(route.sunsetAt)
    ) {
        throw new Error("Invalid sunset date");
    }

    if (
        route.deprecatedAt &&
        route.sunsetAt &&
        new Date(route.sunsetAt) < new Date(route.deprecatedAt)
    ) {
        throw new Error(
            "Sunset date cannot be before deprecation date"
        );
    }
}

// Register a route
function registerRoute(route) {
    validateRoute(route);

    const method = route.method.toUpperCase();
    const key = `${method}:${route.path}`;

    if (routes.has(key)) {
        throw new Error("Route is already registered");
    }

    const normalizedRoute = {
        ...route,
        method
    };

    routes.set(key, normalizedRoute);

    return normalizedRoute;
}

// Retrieve a registered route
function getRoute(method, path) {
    const key = `${method.toUpperCase()}:${path}`;

    return routes.get(key) || null;
}

// Extract dynamic route parameters
function extractRouteParams(routePath, requestPath) {
    const keys = [];

    const regex = pathToRegexp(routePath, keys);
    const match = regex.exec(requestPath);

    if (!match) {
        return {};
    }

    const params = {};

    keys.forEach((key, index) => {
        params[key.name] = decodeURIComponent(match[index + 1]);
    });

    return params;
}

// Find matching route
function findMatchingRoute(method, requestPath) {
    const normalizedMethod = method.toUpperCase();

    // Exact match gets priority
    const exactRoute = getRoute(normalizedMethod, requestPath);

    if (exactRoute) {
        return exactRoute;
    }

    // Check dynamic routes
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

    return null;
}

// Return all registered routes
function getAllRoutes() {
    return Array.from(routes.values());
}

// Remove a registered route
function removeRoute(method, path) {
    const key = `${method.toUpperCase()}:${path}`;

    return routes.delete(key);
}

// Clear registry
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
