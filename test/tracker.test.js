const test = require("node:test");
const assert = require("node:assert");

const {
    trackRequest,
    getRouteStats,
    getAllStats,
    resetStats
} = require("../src/tracker");

test("should track requests for a deprecated route", () => {
    resetStats();

    trackRequest("GET", "/api/v1/users", "client-A");
    trackRequest("GET", "/api/v1/users", "client-A");
    trackRequest("GET", "/api/v1/users", "client-B");

    const stats = getRouteStats("GET", "/api/v1/users");

    assert.strictEqual(stats.totalRequests, 3);
    assert.strictEqual(stats.clients["client-A"], 2);
    assert.strictEqual(stats.clients["client-B"], 1);
});

test("should return null for an untracked route", () => {
    resetStats();

    assert.strictEqual(
        getRouteStats("GET", "/unknown"),
        null
    );
});

test("should reset all statistics", () => {
    resetStats();

    trackRequest("GET", "/api/v1/users", "client-A");
    resetStats();

    assert.strictEqual(getAllStats().length, 0);
});