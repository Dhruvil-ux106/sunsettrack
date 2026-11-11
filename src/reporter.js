
const { getAllRoutes } = require("./registry");
const { getAllStats } = require("./tracker");
const {
    getLifecycleStatus,
    getRemainingDays
} = require("./lifecycle");

function generateReport(currentDate = new Date()) {
    const routes = getAllRoutes();
    const stats = getAllStats();

    return routes.map(route => {
        const usage = stats.find(item =>
            item.method === route.method &&
            item.path === route.path
        );

        return {
            method: route.method,
            path: route.path,
            successor: route.successor || null,
            deprecatedAt: route.deprecatedAt || null,
            sunsetAt: route.sunsetAt || null,
            status: getLifecycleStatus(route, currentDate),
            remainingDays: getRemainingDays(route, currentDate),
            totalRequests: usage ? usage.totalRequests : 0,
            clients: usage ? usage.clients : {}
        };
    });
}

function getSummary(currentDate = new Date()) {
    const report = generateReport(currentDate);

    return {
        totalDeprecatedRoutes: report.length,
        activeRoutes: report.filter(
            route => route.status === "DEPRECATED"
        ).length,
        sunsetDueRoutes: report.filter(
            route => route.status === "SUNSET_DUE"
        ).length,
        routesWithoutSunset: report.filter(
            route => route.status === "NO_SUNSET"
        ).length,
        totalRequests: report.reduce(
            (sum, route) => sum + route.totalRequests,
            0
        )
    };
}

module.exports = {
    generateReport,
    getSummary
};
