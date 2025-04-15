export enum LogLevel {
    DEBUG = 0, INFO, WARN, ERROR,
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.DEBUG;

  // Allows dynamic log level changes
  public static setLevel(level: LogLevel): void {
    Logger.currentLevel = level;
  }

  public static debug(msg: string, ...params: unknown[]): void {
    Logger.log(LogLevel.DEBUG, "DEBUG", msg, ...params);
  }

  public static info(msg: string, ...params: unknown[]): void {
    Logger.log(LogLevel.INFO, "INFO", msg, ...params);
  }

  public static warn(msg: string, ...params: unknown[]): void {
    Logger.log(LogLevel.WARN, "WARN", msg, ...params);
  }

  public static error(msg: string, ...params: unknown[]): void {
    Logger.log(LogLevel.ERROR, "ERROR", msg, ...params);
  }

  private static log(level: LogLevel, label: string, msg: string, ...params: unknown[]): void {
    if (Logger.currentLevel <= level) {
      const timestamp = new Date().toISOString();
      // By skipping Logger.log, we capture the caller one level above log()
      const callerInfo = Logger.getCallerInfo();
      console.log(`[${timestamp}] ${label}: ${msg} ${callerInfo}`, ...params);
    }
  }

  private static getCallerInfo(): string {
    const stack = (Error as any).captureStackTrace ?
      ((() => {
        const obj: { stack?: string } = {}; (Error as any).captureStackTrace(obj, Logger.log); return obj.stack;
      })()) :
      new Error().stack;

    if (!stack) return "";

    const lines = stack.split("\n");
    // Start from index 2 to skip the error message and Logger.log frame.
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) return `(${line})`;
    }
    return "";
  }
}
