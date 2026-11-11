
const test = require("node:test");
const assert = require("node:assert");

const {
    registerRoute,
    clearRegistry
} = require("../src/registry");

const {
    trackRequest,
    resetStats
} = require("../src/tracker");

const {
    generateReport,
    getSummary
} = require("../src/reporter");

test("should generate a migration report", () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/products",
        successor: "/api/v2/products",
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01"
    });

    trackRequest("GET", "/api/v1/products", "client-A");
    trackRequest("GET", "/api/v1/products", "client-A");

    const report = generateReport(new Date("2026-12-01"));

    const route = report.find(
        item => item.path === "/api/v1/products"
    );

    assert.ok(route);
    assert.strictEqual(route.status, "DEPRECATED");
    assert.strictEqual(route.totalRequests, 2);
    assert.strictEqual(route.clients["client-A"], 2);
});

test("should generate a summary", () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/products",
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01"
    });

    trackRequest("GET", "/api/v1/products", "client-A");

    const summary = getSummary(new Date("2026-12-01"));

    assert.strictEqual(summary.totalDeprecatedRoutes, 1);
    assert.strictEqual(summary.activeRoutes, 1);
    assert.strictEqual(summary.sunsetDueRoutes, 0);
    assert.strictEqual(summary.routesWithoutSunset, 0);
    assert.strictEqual(summary.totalRequests, 1);
});
