const levelToStr = { 60: 'fatal', 50: 'error', 40: 'warn', 30: 'info', 20: 'debug', 10: 'trace' };
const strToLevel = { 'fatal': 60, 'error': 50, 'warn': 40, 'info': 30, 'debug': 20, 'trace': 10 };

function isObject(obj) {
    return obj != null
        && typeof (obj) === 'object'
        && !(obj instanceof Array)
        && !(obj instanceof Date)
        && !(obj instanceof Error);
}

type LogObject = {
    level: string;
    time: string;
    msg: string;
    module?: any;
    activity?: any;
};

class SupertypeLogger {
    context: any;
    granularLevels: any;
    level: any;
    setLevel(number): void;
    startContext(context: any): void;
    setContextProps(context: any): void;
    clearContextProps(context: any): void;
    createChildLogger(context: any): SupertypeLogger;
    prettyPrint(level: number, ...data: any[]): string;

    // for overriding
    sendToLog: Function;
    formatDateTime: Function;

    constructor() {
        this.context = {};
        this.granularLevels = {};
        this.level = 'info';
    }


    fatal(...data: any[]): void {
        this.log(60, ...data);
    }

    error(...data: any[]): void {
        this.log(50, ...data);
    }

    warn(...data: any[]): void {
        this.log(40, ...data);
    }

    info(...data: any[]): void {
        this.log(30, ...data);
    }
    debug(...data: any[]): void {
        this.log(20, ...data);
    }
    trace(...data: any[]): void {
        this.log(10, ...data);
    }

    // Log all arguments assuming the first one is level and the second one might be an object (similar to banyan)
    log(level: number, ...data: any[]): void {
        let msg = '';
        const obj: LogObject = {
            time: (new Date()).toISOString(),
            msg: '',
            level: 'info', //default info
        };

        for (const prop in this.context) {
            obj[prop] = this.context[prop];
        }

        for (let ix = 0; ix < arguments.length; ++ix) {
            const arg = arguments[ix];
            if (ix == 0) {
                obj.level = arg;
            }
            else if (ix == 1 && isObject(arg)) {
                for (const proper in arg) {
                    obj[proper] = arg[proper];
                }
            }
            else {
                msg += `${arg} `;
            }
        }

        if (obj.msg.length) {
            obj.msg += ' ';
        }

        if (msg.length) {
            if (obj.module && obj.activity) {
                obj.msg += `${obj.module}[${obj.activity}] - `;
            }

            obj.msg += msg;
        }
        else if (obj.module && obj.activity) {
            obj.msg += `${obj.module}[${obj.activity}]`;
        }

        if (this.isEnabled(levelToStr[obj.level], obj)) {
            this.sendToLog(levelToStr[obj.level], obj);
        }
    }

    startContext(context) {
        this.context = context;
    }

    // Save the properties in the context and return a new object that has the properties only so they can be cleared
    setContextProps(context) {
        const reverse = {};

        for (const prop in context) {
            reverse[prop] = true;
            this.context[prop] = context[prop];
        }

        return reverse;
    }

    // Logging is enabled if either the level threshold is met or the granular level matches
    private isEnabled(level, obj) {
        level = strToLevel[level];

        if (level >= strToLevel[this.level]) {
            return true;
        }

        if (this.granularLevels) {
            for (let levelr in this.granularLevels) {
                if (obj[levelr] && obj[levelr] == this.granularLevels[levelr]) {
                    return true;
                }
            }
        }
    }
}




function createLogger() {
    return createLogger();

    // Return a new logger object that has our api and a context
    function createLogger() {
        const logger = {
            fatal: function fatal() {
                this.log(...[60].concat(Array.prototype.slice.call(arguments)));
            },

            setLevel,
            sendToLog,
            formatDateTime,
            split,
            clearContextProps,
            createChildLogger,
            prettyPrint
        };

        return logger;
    }



    // Parse log levels such as warn.activity
    function setLevel(level) {
        const levels = level.split(';');

        for (const levela of levels) {
            if (levela.match(/:/)) {
                if (levels[ix].match(/(.*):(.*)/)) {
                    this.granularLevels[RegExp.$1] = this.granularLevels[RegExp.$1] || {};
                    this.granularLevels[RegExp.$1] = RegExp.$2;
                }
                else {
                    this.level = levels[ix];
                }
            }
            else {
                this.level = levela;
            }
        }
    }

    // Logging is enabled if either the level threshold is met or the granular level matches
    function isEnabled(level, obj) {
        level = strToLevel[level];

        if (level >= strToLevel[this.level]) {
            return true;
        }

        if (this.granularLevels) {
            for (const levelr in this.granularLevels) {
                if (obj[levelr] && obj[levelr] == this.granularLevels[levelr]) {
                    return true;
                }
            }
        }
    }


    // Remove any properties recorded by setContext
    function clearContextProps(contextToClear) {
        for (const prop in contextToClear) {
            delete this.context[prop];
        }
    }

    // Create a new logger and copy over it's context
    function createChildLogger(context) {
        const child = {};

        for (const prop in this) {
            child[prop] = this[prop];
        }

        child.context = context || {};

        for (const proper in this.context) {
            child.context[proper] = this.context[proper];
        }

        return child;
    }

    function formatDateTime(date) {
        return `${f(2, (date.getMonth() + 1), '/') + f(2, date.getDate(), '/') + f(4, date.getFullYear(), ' ') +
            f(2, date.getHours(), ':') + f(2, date.getMinutes(), ':') + f(2, date.getSeconds(), ':') +
            f(3, date.getMilliseconds())} GMT${0 - date.getTimezoneOffset() / 60}`;

        function f(z, d, s) {
            while (String(d).length < z) {
                d = `0${d}`;
            }

            return d + (s || '');
        }
    }

    function sendToLog(level, json) {
        console.log(this.prettyPrint(level, json));     // eslint-disable-line no-console
    }

    function prettyPrint(level, json) {
        const split = this.split(json, { time: 1, msg: 1, level: 1, name: 1 });

        return `${this.formatDateTime(new Date(json.time))}: ${level.toUpperCase()}: ${o(split[1].name, ': ')}${o(split[1].msg, ': ')}${xy(split[0])}`;

        function o(s, d) {
            if (s) {
                return s + d;
            }

            return '';
        }

        function xy(j) {
            let str = '';
            let sep = '';

            for (const prop in j) {
                str += `${sep + prop}=${JSON.stringify(j[prop])}`;
                sep = ' ';
            }

            if (str.length > 0) {
                return `(${str})`;
            }

            return '';
        }
    }

    function split(json, props) {
        const a = {};
        const b = {};

        for (const prop in json) {
            (props[prop] ? b : a)[prop] = json[prop];
        }

        return [a, b];
    }
};