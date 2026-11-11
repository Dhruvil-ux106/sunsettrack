
# SunsetTrack

SunsetTrack is an Express.js middleware package for managing API deprecation lifecycles, tracking legacy endpoint usage, and generating migration reports.

## Features

- Register deprecated API endpoints.
- Automatically attach Deprecation, Sunset, and successor Link headers.
- Track requests made to deprecated endpoints.
- Identify API clients using a configurable request header.
- Support static, dynamic, and optional route parameters.
- Support mounted Express routers.
- Generate API migration reports and usage summaries.
- Track lifecycle status and remaining days until sunset.

## Installation

```bash
npm install sunsettrack
```

Express must also be installed in your application:

```bash
npm install express
```

## Basic Usage

```javascript
const express = require("express");

const {
    sunsetTrack,
    registerRoute,
    generateReport,
    getSummary
} = require("sunsettrack");

const app = express();

registerRoute({
    method: "GET",
    path: "/api/v1/users",
    successor: "/api/v2/users",
    deprecatedAt: "2026-11-01",
    sunsetAt: "2027-01-01"
});

app.use(sunsetTrack());

app.get("/api/v1/users", (req, res) => {
    res.json({ message: "Old users API" });
});

app.get("/api/v2/users", (req, res) => {
    res.json({ message: "New users API" });
});

app.get("/sunset-report", (req, res) => {
    res.json({
        summary: getSummary(),
        routes: generateReport()
    });
});

app.listen(3000);
```

## API Reference

### registerRoute(config)

Registers an API endpoint for deprecation tracking.

```javascript
registerRoute({
    method: "GET",
    path: "/api/v1/users",
    successor: "/api/v2/users",
    deprecatedAt: "2026-11-01",
    sunsetAt: "2027-01-01"
});
```

Configuration:

| Property | Description |
|---|---|
| method | HTTP method |
| path | Registered endpoint path |
| successor | Replacement endpoint |
| deprecatedAt | Deprecation date |
| sunsetAt | Planned removal date |

### sunsetTrack(options)

Creates Express middleware that matches registered routes, adds deprecation headers, and tracks usage.

```javascript
app.use(sunsetTrack());
```

Custom client identification header:

```javascript
app.use(sunsetTrack({
    clientIdHeader: "X-Custom-Client"
}));
```

By default, SunsetTrack identifies clients through `X-API-Client-ID`.

### generateReport()

Generates a migration report containing registered routes, lifecycle status, usage statistics, and client information.

### getSummary()

Returns aggregated lifecycle and usage statistics.

### getRouteStats(method, path)

Returns usage statistics for a registered route, including total requests and client counts.

### getAllStats()

Returns usage statistics for all tracked routes.

### getAllRoutes()

Returns all registered deprecated routes.

### getRoute(method, path)

Retrieves a registered route using its HTTP method and path.

### findMatchingRoute(method, requestPath)

Finds a registered route matching a request path, including dynamic route parameters.

### removeRoute(method, path)

Removes a registered route.

### clearRegistry()

Removes all registered routes.

### resetStats()

Resets all usage statistics.

### getLifecycleStatus(route, currentDate)

Returns the lifecycle status of a route:

- `NO_SUNSET`
- `DEPRECATED`
- `SUNSET_DUE`

### getRemainingDays(route, currentDate)

Returns the number of days remaining until the sunset date, or `null` if no sunset date exists.

## Dynamic Routes

SunsetTrack supports Express-style dynamic route patterns.

```javascript
registerRoute({
    method: "GET",
    path: "/api/v1/users/:id",
    deprecatedAt: "2026-11-01",
    sunsetAt: "2027-01-01"
});
```

A request to `/api/v1/users/42` will match this registered route.

Optional parameters are supported:

```javascript
/api/v1/users/:id?
```

Multiple parameters are supported:

```javascript
/api/v1/users/:userId/posts/:postId
```

Exact registered routes are checked before dynamic route patterns.

## Deprecation Headers

SunsetTrack generates standard HTTP headers:

- `Deprecation`: Indicates when the endpoint was deprecated.
- `Sunset`: Indicates the planned date when the endpoint will become unavailable.
- `Link`: Identifies the successor endpoint using the `successor-version` relation.

Example:

```http
Deprecation: @1793491200
Sunset: Fri, 01 Jan 2027 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

Headers are generated only when their corresponding route configuration values are provided.

## Usage Tracking

SunsetTrack records:

- HTTP method
- Registered route path
- Total request count
- Requests grouped by client ID

Usage statistics are maintained in memory and reset when the application restarts.

## Testing

Run the automated test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Requirements

- Node.js 18 or later
- Express.js 4.18 or later

## License

MIT
