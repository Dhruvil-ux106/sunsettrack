
const test = require("node:test");
const assert = require("node:assert");

const { generateHeaders } = require("../src/headers");

test("should generate all deprecation headers", () => {
    const route = {
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01",
        successor: "/api/v2/users"
    };

    const headers = generateHeaders(route);

    assert.strictEqual(
        headers.Deprecation,
        `@${Math.floor(new Date("2026-11-01").getTime() / 1000)}`
    );

    assert.strictEqual(
        headers.Sunset,
        new Date("2027-01-01").toUTCString()
    );

    assert.strictEqual(
        headers.Link,
        '</api/v2/users>; rel="successor-version"'
    );
});

test("should omit headers when route has no policy values", () => {
    const route = {};

    const headers = generateHeaders(route);

    assert.deepStrictEqual(headers, {});
});

test("should replace dynamic parameters in successor URL", () => {
    const route = {
        deprecatedAt: "2026-11-01",
        sunsetAt: "2027-01-01",
        successor: "/api/v2/users/:id"
    };

    const headers = generateHeaders(route, {
        id: "42"
    });

    assert.strictEqual(
        headers.Link,
        '</api/v2/users/42>; rel="successor-version"'
    );
});

test("should encode dynamic parameters in successor URL", () => {
    const route = {
        successor: "/api/v2/users/:id"
    };

    const headers = generateHeaders(route, {
        id: "john doe"
    });

    assert.strictEqual(
        headers.Link,
        '</api/v2/users/john%20doe>; rel="successor-version"'
    );
});

test("should replace multiple parameters in successor URL", () => {
    const route = {
        successor: "/api/v2/users/:userId/posts/:postId"
    };

    const headers = generateHeaders(route, {
        userId: "10",
        postId: "25"
    });

    assert.strictEqual(
        headers.Link,
        '</api/v2/users/10/posts/25>; rel="successor-version"'
    );
});
