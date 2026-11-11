function getLifecycleStatus(route, currentDate = new Date()) {
    if (!route.sunsetAt) {
        return "NO_SUNSET";
    }

    const sunsetDate = new Date(route.sunsetAt);

    if (currentDate >= sunsetDate) {
        return "SUNSET_DUE";
    }

    return "DEPRECATED";
}

function getRemainingDays(route, currentDate = new Date()) {
    if (!route.sunsetAt) {
        return null;
    }

    const sunsetDate = new Date(route.sunsetAt);

    const difference = sunsetDate - currentDate;

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

module.exports = {
    getLifecycleStatus,
    getRemainingDays
};