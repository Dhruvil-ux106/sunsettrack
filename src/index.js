
const {
    registerRoute,
    getRoute,
    findMatchingRoute,
    getAllRoutes,
    removeRoute,
    clearRegistry
} = require("./registry");

const { sunsetTrack } = require("./middleware");

const {
    generateReport,
    getSummary
} = require("./reporter");

const {
    getRouteStats,
    getAllStats,
    resetStats
} = require("./tracker");

const {
    getLifecycleStatus,
    getRemainingDays
} = require("./lifecycle");

module.exports = {
    sunsetTrack,
    registerRoute,
    getRoute,
    findMatchingRoute,
    getAllRoutes,
    removeRoute,
    clearRegistry,
    generateReport,
    getSummary,
    getRouteStats,
    getAllStats,
    resetStats,
    getLifecycleStatus,
    getRemainingDays
};
