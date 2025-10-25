/**
 * Simple logging utility for the core layer
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogContext {
	[key: string]: any;
}

export class Logger {
	private static instance: Logger;
	private logLevel: LogLevel;

	private constructor() {
		// Set log level based on environment
		const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
		switch (envLogLevel) {
			case "DEBUG":
				this.logLevel = LogLevel.DEBUG;
				break;
			case "INFO":
				this.logLevel = LogLevel.INFO;
				break;
			case "WARN":
				this.logLevel = LogLevel.WARN;
				break;
			case "ERROR":
				this.logLevel = LogLevel.ERROR;
				break;
			default:
				this.logLevel = LogLevel.INFO;
		}
	}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel;
	}

	private formatMessage(
		level: string,
		message: string,
		context?: LogContext,
	): string {
		const timestamp = new Date().toISOString();
		const contextStr = context ? ` ${JSON.stringify(context)}` : "";
		return `[${timestamp}] [${level}] [CORE] ${message}${contextStr}`;
	}

	public debug(message: string, context?: LogContext): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			console.debug(this.formatMessage("DEBUG", message, context));
		}
	}

	public info(message: string, context?: LogContext): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.info(this.formatMessage("INFO", message, context));
		}
	}

	public warn(message: string, context?: LogContext): void {
		if (this.shouldLog(LogLevel.WARN)) {
			console.warn(this.formatMessage("WARN", message, context));
		}
	}

	public error(message: string, error?: Error, context?: LogContext): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			const errorContext = {
				...context,
				...(error && {
					error: {
						name: error.name,
						message: error.message,
						stack: error.stack,
					},
				}),
			};
			console.error(this.formatMessage("ERROR", message, errorContext));
		}
	}
}

// Export singleton instance
export const logger = Logger.getInstance();
