import { JsonParseStream } from "jsr:@std/json/parse-stream";
import { TextLineStream } from "jsr:@std/streams/text-line-stream";
import type { ConsoleLogEntry, CronLogEntry, HttpLogEntry, LogEntry, SshLogEntry } from "./types.ts";

export class LogsService {
    private readonly logFilePath = "data/logs.jsonl";

    async getLoggers(): Promise<Set<string>> {
        const loggers = new Set<string>();

        try {
            const file = await Deno.open(this.logFilePath, { read: true });
            const readable = file.readable
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new TextLineStream())
                .pipeThrough(new JsonParseStream());

            for await (const chunk of readable) {
                if (typeof chunk === "object" && chunk !== null && "logger" in chunk) {
                    loggers.add(chunk.logger as string);
                }
            }
        } catch (error) {
            console.error("Error reading log file:", error);
        }

        return loggers;
    }

    async getHosts(logger?: string): Promise<Set<string>> {
        const hosts = new Set<string>();

        try {
            const file = await Deno.open(this.logFilePath, { read: true });
            const readable = file.readable
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new TextLineStream())
                .pipeThrough(new JsonParseStream());

            for await (const chunk of readable) {
                if (typeof chunk === "object" && chunk !== null && "logger" in chunk) {
                    const logEntry = chunk as LogEntry;

                    // Filter by logger if specified
                    if (logger && logEntry.logger !== logger) {
                        continue;
                    }

                    if (logEntry.logger === "http" && "request" in logEntry) {
                        const httpEntry = logEntry as HttpLogEntry;
                        if (httpEntry.request?.host) {
                            hosts.add(httpEntry.request.host);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error reading log file:", error);
        }

        return hosts;
    }

    async getApps(logger?: string): Promise<Set<string>> {
        const apps = new Set<string>();

        try {
            const file = await Deno.open(this.logFilePath, { read: true });
            const readable = file.readable
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new TextLineStream())
                .pipeThrough(new JsonParseStream());

            for await (const chunk of readable) {
                if (typeof chunk === "object" && chunk !== null && "logger" in chunk) {
                    const logEntry = chunk as LogEntry;

                    // Filter by logger if specified
                    if (logger && logEntry.logger !== logger) {
                        continue;
                    }

                    if ((logEntry.logger === "console" || logEntry.logger === "cron") && "app" in logEntry) {
                        const appEntry = logEntry as ConsoleLogEntry | CronLogEntry;
                        if (appEntry.app) {
                            apps.add(appEntry.app);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error reading log file:", error);
        }

        return apps;
    }

    async getUsers(logger?: string): Promise<Set<string>> {
        const users = new Set<string>();

        try {
            const file = await Deno.open(this.logFilePath, { read: true });
            const readable = file.readable
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new TextLineStream())
                .pipeThrough(new JsonParseStream());

            for await (const chunk of readable) {
                if (typeof chunk === "object" && chunk !== null && "logger" in chunk) {
                    const logEntry = chunk as LogEntry;

                    // Filter by logger if specified
                    if (logger && logEntry.logger !== logger) {
                        continue;
                    }

                    if (logEntry.logger === "ssh" && "user" in logEntry) {
                        const sshEntry = logEntry as SshLogEntry;
                        if (sshEntry.user) {
                            users.add(sshEntry.user);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error reading log file:", error);
        }

        return users;
    }

    async getRemoteAddresses(logger?: string): Promise<Set<string>> {
        const addresses = new Set<string>();

        try {
            const file = await Deno.open(this.logFilePath, { read: true });
            const readable = file.readable
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new TextLineStream())
                .pipeThrough(new JsonParseStream());

            for await (const chunk of readable) {
                if (typeof chunk === "object" && chunk !== null && "logger" in chunk) {
                    const logEntry = chunk as LogEntry;

                    // Filter by logger if specified
                    if (logger && logEntry.logger !== logger) {
                        continue;
                    }

                    if (logEntry.logger === "ssh" && "remote addr" in logEntry) {
                        const sshEntry = logEntry as SshLogEntry;
                        if (sshEntry["remote addr"]) {
                            // Extract just the IP address (without port)
                            const ip = sshEntry["remote addr"].split(':')[0];
                            addresses.add(ip);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error reading log file:", error);
        }

        return addresses;
    }

    createFilteredStream(logger: string, filters: Map<string, string>): ReadableStream<Uint8Array> {
        const matchesFilters = this.matchesFilters.bind(this);
        return new ReadableStream({
            async start(controller) {
                try {
                    const file = await Deno.open("data/logs.jsonl", { read: true });
                    const readable = file.readable
                        .pipeThrough(new TextDecoderStream())
                        .pipeThrough(new TextLineStream())
                        .pipeThrough(new JsonParseStream());

                    for await (const chunk of readable) {
                        if (
                            typeof chunk !== "object" ||
                            chunk === null ||
                            !("logger" in chunk) ||
                            chunk.logger !== logger
                        ) {
                            continue;
                        }

                        const logEntry = chunk as LogEntry;

                        if (!matchesFilters(logEntry, filters)) {
                            continue;
                        }

                        // Stream each log entry as JSON
                        const jsonLine = JSON.stringify(logEntry) + '\n';
                        controller.enqueue(new TextEncoder().encode(jsonLine));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });
    }

    private matchesFilters(logEntry: LogEntry, filters: Map<string, string>): boolean {
        for (const [path, expectedValue] of filters) {
            if (path === 'msg') {
                // Special handling for message search (contains)
                if (logEntry.msg && !logEntry.msg.toLowerCase().includes(expectedValue.toLowerCase())) {
                    return false;
                }
            } else if (path === 'request.path') {
                // Special handling for path search (contains)
                if (logEntry.logger === 'http' && 'request' in logEntry) {
                    const httpEntry = logEntry as HttpLogEntry;
                    if (httpEntry.request?.path && !httpEntry.request.path.toLowerCase().includes(expectedValue.toLowerCase())) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (path === 'request.ip') {
                // Special handling for IP search (contains)
                if (logEntry.logger === 'http' && 'request' in logEntry) {
                    const httpEntry = logEntry as HttpLogEntry;
                    if (httpEntry.request?.ip && !httpEntry.request.ip.includes(expectedValue)) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (path === 'response.minLatency') {
                // Special handling for minimum latency filter
                if (logEntry.logger === 'http' && 'response' in logEntry) {
                    const httpEntry = logEntry as HttpLogEntry;
                    const minLatencyMs = parseInt(expectedValue);
                    const logLatencyMs = httpEntry.response.latency / 1000000; // Convert nanoseconds to milliseconds
                    if (logLatencyMs < minLatencyMs) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (path === 'response.status') {
                // Special handling for status code (convert string to number for comparison)
                if (logEntry.logger === 'http' && 'response' in logEntry) {
                    const httpEntry = logEntry as HttpLogEntry;
                    const expectedStatusCode = parseInt(expectedValue);
                    if (httpEntry.response.status !== expectedStatusCode) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (path === 'remote-addr') {
                // Special handling for SSH remote address filtering (by IP only)
                if (logEntry.logger === 'ssh' && 'remote addr' in logEntry) {
                    const sshEntry = logEntry as SshLogEntry;
                    const remoteAddr = sshEntry['remote addr'];
                    if (remoteAddr) {
                        const ip = remoteAddr.split(':')[0]; // Extract IP without port
                        if (ip !== expectedValue) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (path === 'command') {
                // Special handling for SSH command search (contains)
                if (logEntry.logger === 'ssh' && 'command' in logEntry) {
                    const sshEntry = logEntry as SshLogEntry;
                    if (sshEntry.command && Array.isArray(sshEntry.command)) {
                        const commandText = sshEntry.command.join(' ').toLowerCase();
                        if (!commandText.includes(expectedValue.toLowerCase())) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                // Standard exact match
                const actualValue = this.getNestedValue(logEntry as Record<string, unknown>, path);
                if (actualValue !== expectedValue) {
                    return false;
                }
            }
        }
        return true;
    }

    private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce((current, key) => {
            if (current && typeof current === 'object') {
                return (current as Record<string, unknown>)[key];
            }
            return undefined;
        }, obj as unknown);
    }
}
