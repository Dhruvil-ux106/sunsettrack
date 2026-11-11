
const test = require("node:test");
const assert = require("node:assert");
const express = require("express");
const request = require("supertest");

const {
    registerRoute,
    clearRegistry
} = require("../src/registry");

const {
    resetStats,
    getRouteStats
} = require("../src/tracker");

const { sunsetTrack } = require("../src/middleware");

test("should attach headers and track deprecated route", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        successor: "/api/v2/users",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack());

    app.get("/api/v1/users", (req, res) => {
        res.json({ message: "Users returned" });
    });

    const response = await request(app)
        .get("/api/v1/users")
        .set("X-API-Client-ID", "client-A");

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.deprecation);
    assert.ok(response.headers.sunset);
    assert.ok(response.headers.link);

    const stats = getRouteStats("GET", "/api/v1/users");

    assert.strictEqual(stats.totalRequests, 1);
    assert.strictEqual(stats.clients["client-A"], 1);
});

test("should not track a non-deprecated route", async () => {
    clearRegistry();
    resetStats();

    const app = express();

    app.use(sunsetTrack());

    app.get("/api/v2/users", (req, res) => {
        res.json({ message: "New endpoint" });
    });

    const response = await request(app).get("/api/v2/users");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.deprecation, undefined);
    assert.strictEqual(getRouteStats("GET", "/api/v2/users"), null);
});

test("should allow custom client ID header", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users"
    });

    const app = express();

    app.use(sunsetTrack({
        clientIdHeader: "X-Custom-Client"
    }));

    app.get("/api/v1/users", (req, res) => {
        res.send("OK");
    });

    const response = await request(app)
        .get("/api/v1/users")
        .set("X-Custom-Client", "client-B");

    assert.strictEqual(response.status, 200);

    const stats = getRouteStats("GET", "/api/v1/users");

    assert.strictEqual(stats.clients["client-B"], 1);
});
