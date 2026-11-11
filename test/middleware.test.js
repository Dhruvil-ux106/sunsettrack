
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

// 1. Attach deprecation headers and track requests
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

    const response = await request(app).get("/api/v1/users");

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.deprecation);
    assert.ok(response.headers.sunset);
    assert.strictEqual(
        response.headers.link,
        '</api/v2/users>; rel="successor-version"'
    );

    const stats = getRouteStats("GET", "/api/v1/users");
    assert.strictEqual(stats.totalRequests, 1);
});

// 2. Do not track a route that is not registered
test("should not track a non-deprecated route", async () => {
    clearRegistry();
    resetStats();

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v2/users", (req, res) => {
        res.json({ message: "New API" });
    });

    const response = await request(app).get("/api/v2/users");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.deprecation, undefined);
    assert.strictEqual(
        getRouteStats("GET", "/api/v2/users"),
        null
    );
});

// 3. Support a custom client ID header
test("should allow custom client ID header", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    app.use(sunsetTrack({
        clientIdHeader: "X-Custom-Client"
    }));

    app.get("/api/v1/users", (req, res) => {
        res.json({ message: "Old API" });
    });

    await request(app)
        .get("/api/v1/users")
        .set("X-Custom-Client", "client-123");

    const stats = getRouteStats("GET", "/api/v1/users");

    assert.strictEqual(stats.totalRequests, 1);
    assert.strictEqual(stats.clients["client-123"], 1);
});

// 4. Support mounted Express routers
test("should support mounted Express routers", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    const router = express.Router();

    router.use(sunsetTrack());

    router.get("/v1/users", (req, res) => {
        res.json({ message: "Old API" });
    });

    app.use("/api", router);

    const response = await request(app).get("/api/v1/users");

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.deprecation);

    const stats = getRouteStats("GET", "/api/v1/users");
    assert.strictEqual(stats.totalRequests, 1);
});

// 5. Support dynamic route parameters
test("should support dynamic route parameters", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/:id", (req, res) => {
        res.json({ userId: req.params.id });
    });

    const response = await request(app).get("/api/v1/users/42");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { userId: "42" });

    const stats = getRouteStats("GET", "/api/v1/users/:id");
    assert.strictEqual(stats.totalRequests, 1);
});

// 6. Support optional route parameters
test("should support optional route parameters", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id?",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/:id?", (req, res) => {
        res.json({ userId: req.params.id || null });
    });

    const response = await request(app).get("/api/v1/users");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { userId: null });

    const stats = getRouteStats("GET", "/api/v1/users/:id?");
    assert.strictEqual(stats.totalRequests, 1);
});

// 7. Support multiple dynamic route parameters
test("should support multiple dynamic route parameters", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:userId/posts/:postId",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/:userId/posts/:postId", (req, res) => {
        res.json({
            userId: req.params.userId,
            postId: req.params.postId
        });
    });

    const response = await request(app)
        .get("/api/v1/users/42/posts/7");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
        userId: "42",
        postId: "7"
    });

    const stats = getRouteStats(
        "GET",
        "/api/v1/users/:userId/posts/:postId"
    );

    assert.strictEqual(stats.totalRequests, 1);
});

// 8. Exact routes should take priority over dynamic routes
test("should prioritize exact routes over dynamic routes", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id",
        deprecatedAt: "2026-11-01"
    });

    registerRoute({
        method: "GET",
        path: "/api/v1/users/me",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/me", (req, res) => {
        res.json({ user: "current" });
    });

    const response = await request(app).get("/api/v1/users/me");

    assert.strictEqual(response.status, 200);

    const exactStats = getRouteStats("GET", "/api/v1/users/me");
    const dynamicStats = getRouteStats("GET", "/api/v1/users/:id");

    assert.strictEqual(exactStats.totalRequests, 1);
    assert.strictEqual(dynamicStats, null);
});

// 9. Do not match paths beyond the registered route pattern
test("should not match paths beyond the registered route pattern", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        deprecatedAt: "2026-11-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/:id/profile", (req, res) => {
        res.json({ userId: req.params.id });
    });

    const response = await request(app)
        .get("/api/v1/users/42/profile");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
        getRouteStats("GET", "/api/v1/users"),
        null
    );
});

// 10. Substitute dynamic parameters in successor Link header
test("should substitute dynamic parameters in successor Link header", async () => {
    clearRegistry();
    resetStats();

    registerRoute({
        method: "GET",
        path: "/api/v1/users/:id",
        successor: "/api/v2/users/:id",
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01"
    });

    const app = express();
    app.use(sunsetTrack());

    app.get("/api/v1/users/:id", (req, res) => {
        res.json({ userId: req.params.id });
    });

    const response = await request(app).get("/api/v1/users/42");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { userId: "42" });
    assert.strictEqual(
        response.headers.link,
        '</api/v2/users/42>; rel="successor-version"'
    );

    const stats = getRouteStats("GET", "/api/v1/users/:id");
    assert.strictEqual(stats.totalRequests, 1);
});
