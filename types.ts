export type BaseLogEntry = {
    time: string; // ISO timestamp
    level: "INFO" | "ERROR" | "DEBUG" | "WARN" | string;
    msg: string;
    logger: string;
};

export type HttpLogEntry = BaseLogEntry & {
    logger: "http";
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

export type ConsoleLogEntry = BaseLogEntry & {
    logger: "console";
    app: string;
    stream: "stdout" | "stderr";
};

export type CronLogEntry = BaseLogEntry & {
    logger: "cron";
    app: string;
    args: string[];
    schedule: string;
};

export type SshLogEntry = BaseLogEntry & {
    logger: "ssh";
    user: string;
    "remote addr": string;
    command: string[];
};

export type LogEntry = HttpLogEntry | ConsoleLogEntry | CronLogEntry | SshLogEntry | BaseLogEntry;
