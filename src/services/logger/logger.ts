import { dateManager } from "@/lib/date/date-manager";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: dateManager.now(),
      context,
      error,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    const errorStr = error ? ` ${error.stack || error.message}` : "";

    switch (level) {
      case "error":
        console.error(`[ERROR] ${message}${contextStr}${errorStr}`);
        break;
      case "warn":
        console.warn(`[WARN] ${message}${contextStr}`);
        break;
      case "debug":
        console.debug(`[DEBUG] ${message}${contextStr}`);
        break;
      default:
        console.log(`[INFO] ${message}${contextStr}`);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log("error", message, context, error);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
