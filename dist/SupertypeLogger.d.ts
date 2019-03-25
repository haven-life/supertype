declare type LoggerFunction = (logLevel: string, logObject: any, ...rawLogData: any[]) => void;
export declare class SupertypeLogger {
    context: any;
    granularLevels: any;
    level: any;
    constructor();
    fatal(...data: any[]): void;
    error(...data: any[]): void;
    warn(...data: any[]): void;
    info(...data: any[]): void;
    debug(...data: any[]): void;
    trace(...data: any[]): void;
    /**
     * assign a custom send to log functionality.
     * @param {(level: string, data: any) => void} loggerFunction
     */
    setLogger(loggerFunction: LoggerFunction): void;
    private log;
    startContext(context: any): void;
    setContextProps(context: any): {};
    setLevel(level: any): void;
    clearContextProps(contextToClear: any): void;
    createChildLogger(context: any): SupertypeLogger;
    formatDateTime(date: any): string;
    /**
     * this function is designed to be replaced by the consumer of this class.
     *
     * @param logLevel - log level
     * @param logObject - formatted log object, passed in from consumer
     * @param rawLogData - unformatted and unprocessed version of "logObject" param
     */
    protected sendToLog(logLevel: any, logObject: any, ...rawLogData: any[]): void;
    prettyPrint(level: any, json: any): string;
    private split;
    private isEnabled;
}
export {};
