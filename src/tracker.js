const usage = new Map();

function trackRequest(method, path, clientId = "unknown") {
    const key = `${method.toUpperCase()}:${path}`;

    if (!usage.has(key)) {
        usage.set(key, {
            method: method.toUpperCase(),
            path,
            totalRequests: 0,
            clients: new Map()
        });
    }

    const route = usage.get(key);

    route.totalRequests++;

    route.clients.set(
        clientId,
        (route.clients.get(clientId) || 0) + 1
    );

    return route;
}

function getRouteStats(method, path) {
    const key = `${method.toUpperCase()}:${path}`;
    const route = usage.get(key);

    if (!route) return null;

    return {
        method: route.method,
        path: route.path,
        totalRequests: route.totalRequests,
        clients: Object.fromEntries(route.clients)
    };
}

function getAllStats() {
    return Array.from(usage.values()).map(route => ({
        method: route.method,
        path: route.path,
        totalRequests: route.totalRequests,
        clients: Object.fromEntries(route.clients)
    }));
}

function resetStats() {
    usage.clear();
}

module.exports = {
    trackRequest,
    getRouteStats,
    getAllStats,
    resetStats
};