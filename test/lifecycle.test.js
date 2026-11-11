const test = require("node:test");
const assert = require("node:assert");

const {
    getLifecycleStatus,
    getRemainingDays
} = require("../src/lifecycle");

test("should identify deprecated endpoint", () => {
    const route = { sunsetAt: "2027-01-01" };

    assert.strictEqual(
        getLifecycleStatus(route, new Date("2026-12-01")),
        "DEPRECATED"
    );
});

test("should identify sunset due endpoint", () => {
    const route = { sunsetAt: "2026-11-01" };

    assert.strictEqual(
        getLifecycleStatus(route, new Date("2026-11-11")),
        "SUNSET_DUE"
    );
});

test("should identify endpoint without sunset date", () => {
    assert.strictEqual(
        getLifecycleStatus({}, new Date()),
        "NO_SUNSET"
    );
});

test("should calculate remaining days", () => {
    const route = { sunsetAt: "2027-01-01" };

    assert.strictEqual(
        getRemainingDays(route, new Date("2026-12-30")),
        2
    );
});