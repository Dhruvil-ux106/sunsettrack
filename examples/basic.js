
const express = require("express");

const {
    sunsetTrack,
    registerRoute,
    generateReport,
    getSummary
} = require("../src");

const app = express();

// Register deprecated API
registerRoute({
    method: "GET",
    path: "/api/v1/users",
    successor: "/api/v2/users",
    deprecatedAt: "2026-11-01",
    sunsetAt: "2027-01-01"
});

// Activate SunsetTrack middleware
app.use(sunsetTrack());

// Old API
app.get("/api/v1/users", (req, res) => {
    res.json({
        message: "This is the old users API"
    });
});

// New API
app.get("/api/v2/users", (req, res) => {
    res.json({
        message: "This is the new users API"
    });
});

// Migration report
app.get("/sunset-report", (req, res) => {
    res.json({
        summary: getSummary(),
        routes: generateReport()
    });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
