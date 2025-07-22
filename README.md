# Logs Viewer

An interactive web application for viewing and filtering HTTP request logs. Built with Deno, Hono, and vanilla JavaScript.

## Features

- **Interactive UI**: Clean, modern interface for viewing logs
- **Real-time Filtering**: Filter logs by logger, host, method, path, status code, and log level
- **Streaming Support**: Efficient streaming of log data for large log files
- **Modular Architecture**: Clean separation of concerns with TypeScript modules

## Installation

```sh
# Clone the repository in the `logs` app directory
git clone https://github.com/pomdtr/smallweb-log-viewer ~/smallweb/logs

# configure smallweb to emit logs to ~/smallweb/logs/data/logs.jsonl
smallweb up --log-output ~/smallweb/logs/data/logs.jsonl
```

## Architecture

The application is split into several modules for maintainability:

- `main.ts` - Main HTTP server and API endpoints
- `logs-service.ts` - Business logic for log processing and filtering
- `types.ts` - TypeScript type definitions
- `ui.html` - Interactive web interface

## API Endpoints

### GET /
Serves the interactive UI for viewing and filtering logs.

### GET /api/loggers
Returns a list of available loggers from the log file.

**Response:**
```json
["http", "console", "smtp"]
```

### GET /api/hosts?logger={logger}
Returns a list of available hosts for a specific logger.

**Parameters:**
- `logger` (required) - The logger name to filter by

**Response:**
```json
["www.smallweb.run", "auth.smallweb.run", "api.smallweb.run"]
```

### GET /logs?logger={logger}&...filters
Streams filtered log entries as NDJSON.

**Parameters:**
- `logger` (required) - The logger to filter by
- `request.host` (optional) - Filter by request host
- `request.method` (optional) - Filter by HTTP method
- `request.path` (optional) - Filter by request path
- `response.status` (optional) - Filter by response status code
- `level` (optional) - Filter by log level

**Response:** NDJSON stream of log entries

## Data Format

The application expects log entries in JSONL format with the following structure:

```typescript
type LogEntry = {
    time: string; // ISO timestamp
    level: "INFO" | "ERROR" | "DEBUG" | "WARN" | string;
    msg: string;
    logger: string;
    request: {
        time: string; // ISO timestamp
        method: string;
        host: string;
        path: string;
        query: string;
        ip: string;
        referer: string;
        length: number;
    };
    response: {
        time: string; // ISO timestamp
        latency: number; // nanoseconds
        status: number;
        length: number;
    };
};
```

## Usage

### Development

```bash
# Start the server
deno serve --allow-read main.ts

# The application will be available at http://localhost:8000
```

### Production

```bash
# With custom port
deno serve --allow-read --port 3000 main.ts
```

## Log File

The application reads logs from `data/logs.jsonl`. Make sure this file exists and contains valid JSONL data.

## UI Features

### Filtering
- **Logger Selection**: Choose from available loggers in the system
- **Host Filtering**: Filter by specific hosts (dynamically loaded based on selected logger)
- **Method Filtering**: Filter by HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Path Filtering**: Search for requests containing specific path patterns
- **Status Code Filtering**: Filter by common HTTP status codes
- **Log Level Filtering**: Filter by log levels (INFO, ERROR, DEBUG, WARN)

### Display
- **Request Overview**: Method, status code, host, and path prominently displayed
- **Timing Information**: Request timestamp and response latency
- **Request Details**: IP address, referer, request/response sizes
- **Color Coding**: Status codes and HTTP methods are color-coded for easy identification

### Interaction
- **Real-time Loading**: Logs are streamed and displayed as they're processed
- **Clear Filters**: Easy reset of all filters
- **Responsive Design**: Works on desktop and mobile devices

## Browser Support

The application uses modern JavaScript features and works in all modern browsers that support:
- Fetch API with ReadableStream
- ES2020+ features
- CSS Grid and Flexbox
