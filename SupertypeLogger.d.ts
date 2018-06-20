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
    log(level: number, ...data: any[]): void;
    startContext(context: any): void;
    setContextProps(context: any): {};
    setLevel(level: any): void;
    clearContextProps(contextToClear: any): void;
    createChildLogger(context: any): SupertypeLogger;
    formatDateTime(date: any): string;
    sendToLog(level: any, json: any): void;
    prettyPrint(level: any, json: any): string;
    private split;
    private isEnabled;
}
