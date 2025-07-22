import { Hono } from "jsr:@hono/hono";
import { LogsService } from "./logs-service.ts";
import html from "./ui.html" with { type: "text" };

const app = new Hono();
const logsService = new LogsService();

// Serve the UI on the root path
app.get("/", (c) => {
    return c.html(html);
});

// API endpoint to get available loggers
app.get("/api/loggers", async (c) => {
    try {
        const loggers = await logsService.getLoggers();
        return c.json(Array.from(loggers));
    } catch (_error) {
        return c.json({ error: "Failed to load loggers" }, 500);
    }
});

// API endpoint to get available hosts for a logger
app.get("/api/hosts", async (c) => {
    const logger = c.req.query("logger");
    try {
        const hosts = await logsService.getHosts(logger);
        return c.json(Array.from(hosts));
    } catch (_error) {
        return c.json({ error: "Failed to load hosts" }, 500);
    }
});

// API endpoint to get available apps for a logger
app.get("/api/apps", async (c) => {
    const logger = c.req.query("logger");
    try {
        const apps = await logsService.getApps(logger);
        return c.json(Array.from(apps));
    } catch (_error) {
        return c.json({ error: "Failed to load apps" }, 500);
    }
});

// API endpoint to get available schedules for cron logger
app.get("/api/schedules", async (c) => {
    const logger = c.req.query("logger");
    try {
        const schedules = await logsService.getSchedules(logger);
        return c.json(Array.from(schedules));
    } catch (_error) {
        return c.json({ error: "Failed to load schedules" }, 500);
    }
});

app.get("/logs", (c) => {
    const logger = c.req.query("logger");
    if (!logger) {
        return c.text("Unsupported logger type", 400);
    }

    // Parse filter parameters (e.g., request.host=example.com, request.path=/api)
    const filters = new Map<string, string>();
    for (const [key, value] of Object.entries(c.req.query())) {
        if (key !== "logger" && value) {
            filters.set(key, value);
        }
    }

    // Set headers for JSON streaming
    c.header('Content-Type', 'application/x-ndjson');
    c.header('Cache-Control', 'no-cache');

    const stream = logsService.createFilteredStream(logger, filters);
    return new Response(stream);
});

export default {
    fetch: app.fetch,
    async run(_args: string[]) {
        const logs = await Deno.open("data/logs.jsonl", { read: true });
        await logs.readable.pipeTo(Deno.stdout.writable);
    }
};
