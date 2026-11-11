
const test = require("node:test");
const assert = require("node:assert");
const express = require("express");
const request = require("supertest");

const {
    sunsetTrack,
    registerRoute,
    getRouteStats,
    clearRegistry,
    resetStats
} = require("../src");

test("should attach headers and track deprecated route", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        successor: "/api/v2/users",
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack());

    app.get("/api/v1/users", (req, res) => {
        res.json({ message: "Old API" });
    });

    const response = await request(app)
        .get("/api/v1/users")
        .set("X-API-Client-ID", "client-1");

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.deprecation);
    assert.ok(response.headers.sunset);
    assert.ok(response.headers.link);

    const stats = getRouteStats("GET", "/api/v1/users");

    assert.strictEqual(stats.totalRequests, 1);
    assert.strictEqual(stats.clients["client-1"], 1);
});

test("should not track a non-deprecated route", async () => {
    clearRegistry();
    resetStats();

    const app = express();

    app.use(sunsetTrack());

    app.get("/api/v2/users", (req, res) => {
        res.json({ message: "New API" });
    });

    const response = await request(app)
        .get("/api/v2/users");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.deprecation, undefined);
});

test("should allow custom client ID header", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/products",
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack({
        clientIdHeader: "X-Custom-Client"
    }));

    app.get("/api/v1/products", (req, res) => {
        res.json({ message: "Products" });
    });

    await request(app)
        .get("/api/v1/products")
        .set("X-Custom-Client", "custom-client");

    const stats = getRouteStats(
        "GET",
        "/api/v1/products"
    );

    assert.strictEqual(stats.clients["custom-client"], 1);
});

test("should support mounted Express routers", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01"
    });

    const app = express();
    const router = express.Router();

    router.use(sunsetTrack());

    router.get("/v1/users", (req, res) => {
        res.json({ message: "Users" });
    });

    app.use("/api", router);

    const response = await request(app)
        .get("/api/v1/users");

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.deprecation);

    const stats = getRouteStats(
        "GET",
        "/api/v1/users"
    );

    assert.strictEqual(stats.totalRequests, 1);
});

test("should support dynamic route parameters", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id",
        successor: "/api/v2/users/:id",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack());

    app.get("/api/v1/users/:id", (req, res) => {
        res.json({ userId: req.params.id });
    });

    const response = await request(app)
        .get("/api/v1/users/42")
        .set("X-API-Client-ID", "dynamic-client");

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.deprecation);

    assert.deepStrictEqual(response.body, {
        userId: "42"
    });

    const stats = getRouteStats(
        "GET",
        "/api/v1/users/:id"
    );

    assert.strictEqual(stats.totalRequests, 1);
    assert.strictEqual(stats.clients["dynamic-client"], 1);
});

test("should support optional route parameters", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id?",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack());

    app.get("/api/v1/users/:id?", (req, res) => {
        res.json({
            userId: req.params.id || null
        });
    });

    const withoutId = await request(app)
        .get("/api/v1/users");

    const withId = await request(app)
        .get("/api/v1/users/42");

    assert.strictEqual(withoutId.status, 200);
    assert.ok(withoutId.headers.deprecation);

    assert.strictEqual(withId.status, 200);
    assert.ok(withId.headers.deprecation);

    const stats = getRouteStats(
        "GET",
        "/api/v1/users/:id?"
    );

    assert.strictEqual(stats.totalRequests, 2);
});

test("should support multiple dynamic route parameters", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:userId/posts/:postId",
        successor: "/api/v2/users/:userId/posts/:postId",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack());

    app.get(
        "/api/v1/users/:userId/posts/:postId",
        (req, res) => {
            res.json({
                userId: req.params.userId,
                postId: req.params.postId
            });
        }
    );

    const response1 = await request(app)
        .get("/api/v1/users/10/posts/25");

    const response2 = await request(app)
        .get("/api/v1/users/42/posts/99");

    assert.strictEqual(response1.status, 200);
    assert.strictEqual(response2.status, 200);

    assert.deepStrictEqual(response1.body, {
        userId: "10",
        postId: "25"
    });

    assert.deepStrictEqual(response2.body, {
        userId: "42",
        postId: "99"
    });

    const stats = getRouteStats(
        "GET",
        "/api/v1/users/:userId/posts/:postId"
    );

    assert.strictEqual(stats.totalRequests, 2);
});

test("should prioritize exact routes over dynamic routes", async () => {
    clearRegistry();
    resetStats();

    // Register dynamic route first in SunsetTrack
    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    // Register exact route second in SunsetTrack
    registerRoute({
        method: "GET",
        path: "/api/v1/users/admin",
        successor: "/api/v2/admin",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    const app = express();

    app.use(sunsetTrack());

    // Register exact Express handler first
    app.get("/api/v1/users/admin", (req, res) => {
        res.json({ route: "admin" });
    });

    // Register dynamic Express handler second
    app.get("/api/v1/users/:id", (req, res) => {
        res.json({ route: "dynamic" });
    });

    const response = await request(app)
        .get("/api/v1/users/admin");

    assert.strictEqual(response.status, 200);

    assert.deepStrictEqual(response.body, {
        route: "admin"
    });

    const dynamicStats = getRouteStats(
        "GET",
        "/api/v1/users/:id"
    );

    const adminStats = getRouteStats(
        "GET",
        "/api/v1/users/admin"
    );

    assert.strictEqual(dynamicStats, null);
    assert.strictEqual(adminStats.totalRequests, 1);
});

test("should not match paths beyond the registered route pattern", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/:id/posts", (req, res) => {
        res.json({ message: "User posts" });
    });

    const response = await request(app)
        .get("/api/v1/users/42/posts");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.deprecation, undefined);

    const stats = getRouteStats(
        "GET",
        "/api/v1/users/:id"
    );

    assert.strictEqual(stats, null);
});
