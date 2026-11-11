const test = require("node:test");
const assert = require("node:assert");
const { generateHeaders } = require("../src/headers");

test("should generate all deprecation headers", () => {
    const headers = generateHeaders({
        deprecatedAt: "2026-11-11",
        sunsetAt: "2027-01-01",
        successor: "/api/v2/users"
    });

    assert.ok(headers.Deprecation);
    assert.strictEqual(
        headers.Sunset,
        "Fri, 01 Jan 2027 00:00:00 GMT"
    );
    assert.strictEqual(
        headers.Link,
        '</api/v2/users>; rel="successor-version"'
    );
});

test("should omit headers when route has no policy values", () => {
    const headers = generateHeaders({});

    assert.deepStrictEqual(headers, {});
});