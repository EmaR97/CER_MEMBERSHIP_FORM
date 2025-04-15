// Logger.ts

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export class Logger {
    // Set the log level you want. Only messages at this level or higher will be printed.
    private static currentLevel: LogLevel = LogLevel.DEBUG;

    // Allows dynamic log level changes at runtime
    public static setLevel(level: LogLevel) {
        Logger.currentLevel = level;
    }

    private static log(levelLabel: string, message: string, ...optionalParams: any[]) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${levelLabel}: ${message}`, ...optionalParams);
    }

    public static debug(message: string, ...optionalParams: any[]) {
        if (Logger.currentLevel <= LogLevel.DEBUG) {
            Logger.log("DEBUG", message, ...optionalParams);
        }
    }

    public static info(message: string, ...optionalParams: any[]) {
        if (Logger.currentLevel <= LogLevel.INFO) {
            Logger.log("INFO", message, ...optionalParams);
        }
    }

    public static warn(message: string, ...optionalParams: any[]) {
        if (Logger.currentLevel <= LogLevel.WARN) {
            Logger.log("WARN", message, ...optionalParams);
        }
    }

    public static error(message: string, ...optionalParams: any[]) {
        if (Logger.currentLevel <= LogLevel.ERROR) {
            Logger.log("ERROR", message, ...optionalParams);
        }
    }
}
