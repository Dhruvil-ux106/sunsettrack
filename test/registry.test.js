
const test = require("node:test");
const assert = require("node:assert");

const {
    registerRoute,
    getRoute,
    getAllRoutes,
    removeRoute,
    clearRegistry
} = require("../src/registry");

// Registration tests

test("should register a deprecated route", () => {
    clearRegistry();

    const route = registerRoute({
        method: "GET",
        path: "/api/v1/users",
        successor: "/api/v2/users",
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01"
    });

    assert.strictEqual(route.method, "GET");
    assert.strictEqual(route.path, "/api/v1/users");
});

test("should retrieve a registered route", () => {
    clearRegistry();

    registerRoute({
        method: "GET",
        path: "/api/v1/users",
        successor: "/api/v2/users"
    });

    const route = getRoute("GET", "/api/v1/users");

    assert.ok(route);
    assert.strictEqual(route.successor, "/api/v2/users");
});

test("should return all registered routes", () => {
    clearRegistry();

    registerRoute({
        method: "GET",
        path: "/api/v1/users"
    });

    registerRoute({
        method: "POST",
        path: "/api/v1/users"
    });

    assert.strictEqual(getAllRoutes().length, 2);
});

test("should remove a registered route", () => {
    clearRegistry();

    registerRoute({
        method: "GET",
        path: "/api/v1/users"
    });

    assert.strictEqual(
        removeRoute("GET", "/api/v1/users"),
        true
    );

    assert.strictEqual(getAllRoutes().length, 0);
});

test("should clear all registered routes", () => {
    clearRegistry();

    registerRoute({
        method: "GET",
        path: "/api/v1/users"
    });

    registerRoute({
        method: "POST",
        path: "/api/v1/products"
    });

    clearRegistry();

    assert.strictEqual(getAllRoutes().length, 0);
});

// Configuration validation tests

test("should reject missing configuration", () => {
    assert.throws(
        () => registerRoute(),
        /configuration must be an object/
    );
});

test("should reject invalid HTTP method", () => {
    assert.throws(
        () => registerRoute({
            method: "INVALID",
            path: "/api/v1/users"
        }),
        /Invalid HTTP method/
    );
});

test("should reject empty or invalid path", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: ""
        }),
        /valid absolute route path/
    );
});

test("should reject invalid successor path", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            successor: "api/v2/users"
        }),
        /Successor must be a valid absolute route path/
    );
});

test("should reject invalid deprecation date", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            deprecatedAt: "not-a-date"
        }),
        /Invalid deprecation date/
    );
});

test("should reject invalid sunset date", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            sunsetAt: "invalid-date"
        }),
        /Invalid sunset date/
    );
});

test("should reject sunset date before deprecation date", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            deprecatedAt: "2027-01-01",
            sunsetAt: "2026-01-01"
        }),
        /Sunset date cannot be before deprecation date/
    );
});

test("should reject duplicate routes", () => {
    clearRegistry();

    registerRoute({
        method: "GET",
        path: "/api/v1/users"
    });

    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users"
        }),
        /Route is already registered/
    );
});

test("should allow same path with different methods", () => {
    clearRegistry();

    registerRoute({
        method: "GET",
        path: "/api/v1/users"
    });

    registerRoute({
        method: "POST",
        path: "/api/v1/users"
    });

    assert.strictEqual(getAllRoutes().length, 2);
});

// Strict date validation tests

test("should accept a valid YYYY-MM-DD date", () => {
    clearRegistry();

    const route = registerRoute({
        method: "GET",
        path: "/api/v1/users",
        deprecatedAt: "2026-11-01"
    });

    assert.strictEqual(route.deprecatedAt, "2026-11-01");
});

test("should reject an impossible calendar date", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            deprecatedAt: "2026-02-30"
        }),
        /Invalid deprecation date/
    );
});

test("should reject an invalid month", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            deprecatedAt: "2026-13-01"
        }),
        /Invalid deprecation date/
    );
});

test("should reject ambiguous date formats", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            deprecatedAt: "11/01/2026"
        }),
        /Invalid deprecation date/
    );
});

test("should accept ISO date-time with explicit timezone", () => {
    clearRegistry();

    const route = registerRoute({
        method: "GET",
        path: "/api/v1/users",
        deprecatedAt: "2026-11-01T10:30:00Z"
    });

    assert.strictEqual(
        route.deprecatedAt,
        "2026-11-01T10:30:00Z"
    );
});

test("should reject date-time without explicit timezone", () => {
    assert.throws(
        () => registerRoute({
            method: "GET",
            path: "/api/v1/users",
            deprecatedAt: "2026-11-01T10:30:00"
        }),
        /Invalid deprecation date/
    );
});

test("should reject malformed route patterns", () => {
    assert.throws(() => {
        registerRoute({
            method: "GET",
            path: "/users/:id(",
            successor: "/api/v2/users",
        });
    });
});

test("should reject route patterns with empty parameter names", () => {
    assert.throws(() => {
        registerRoute({
            method: "GET",
            path: "/users/:",
            successor: "/api/v2/users",
        });
    });
});