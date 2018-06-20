(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var levelToStr = { 60: 'fatal', 50: 'error', 40: 'warn', 30: 'info', 20: 'debug', 10: 'trace' };
    var strToLevel = { 'fatal': 60, 'error': 50, 'warn': 40, 'info': 30, 'debug': 20, 'trace': 10 };
    function isObject(obj) {
        return obj != null
            && typeof (obj) === 'object'
            && !(obj instanceof Array)
            && !(obj instanceof Date)
            && !(obj instanceof Error);
    }
    var SupertypeLogger = /** @class */ (function () {
        // for overriding
        // sendToLog: Function;
        // formatDateTime: Function;
        function SupertypeLogger() {
            this.context = {};
            this.granularLevels = {};
            this.level = 'info';
        }
        SupertypeLogger.prototype.fatal = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            this.log.apply(this, [60].concat(data));
        };
        SupertypeLogger.prototype.error = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            this.log.apply(this, [50].concat(data));
        };
        SupertypeLogger.prototype.warn = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            this.log.apply(this, [40].concat(data));
        };
        SupertypeLogger.prototype.info = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            this.log.apply(this, [30].concat(data));
        };
        SupertypeLogger.prototype.debug = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            this.log.apply(this, [20].concat(data));
        };
        SupertypeLogger.prototype.trace = function () {
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            this.log.apply(this, [10].concat(data));
        };
        // Log all arguments assuming the first one is level and the second one might be an object (similar to banyan)
        SupertypeLogger.prototype.log = function (level) {
            var data = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                data[_i - 1] = arguments[_i];
            }
            var msg = '';
            var obj = {
                time: (new Date()).toISOString(),
                msg: '',
                level: 'info',
            };
            for (var prop in this.context) {
                obj[prop] = this.context[prop];
            }
            for (var ix = 0; ix < arguments.length; ++ix) {
                var arg = arguments[ix];
                if (ix == 0) {
                    obj.level = arg;
                }
                else if (ix == 1 && isObject(arg)) { // error when we try to log an object with property 'level'
                    for (var proper in arg) {
                        obj[proper] = arg[proper];
                    }
                }
                else {
                    msg += arg + " ";
                }
            }
            if (obj.msg.length) {
                obj.msg += ' ';
            }
            if (msg.length) {
                if (obj.module && obj.activity) {
                    obj.msg += obj.module + "[" + obj.activity + "] - ";
                }
                obj.msg += msg;
            }
            else if (obj.module && obj.activity) {
                obj.msg += obj.module + "[" + obj.activity + "]";
            }
            if (this.isEnabled(levelToStr[obj.level], obj)) {
                this.sendToLog(levelToStr[obj.level], obj);
            }
        };
        SupertypeLogger.prototype.startContext = function (context) {
            this.context = context;
        };
        // Save the properties in the context and return a new object that has the properties only so they can be cleared
        SupertypeLogger.prototype.setContextProps = function (context) {
            var reverse = {};
            for (var prop in context) {
                reverse[prop] = true;
                this.context[prop] = context[prop];
            }
            return reverse;
        };
        // Parse log levels such as warn.activity
        SupertypeLogger.prototype.setLevel = function (level) {
            var levels = level.split(';');
            for (var ix = 0; ix < levels.length; ++ix) {
                var levela = levels[ix];
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
        };
        // Remove any properties recorded by setContext
        SupertypeLogger.prototype.clearContextProps = function (contextToClear) {
            for (var prop in contextToClear) {
                delete this.context[prop];
            }
        };
        // Create a new logger and copy over it's context
        SupertypeLogger.prototype.createChildLogger = function (context) {
            var child = {};
            for (var prop in this) {
                child[prop] = this[prop];
            }
            child.context = context || {};
            for (var proper in this.context) {
                child.context[proper] = this.context[proper];
            }
            return child; // bad practice but should fix
        };
        SupertypeLogger.prototype.formatDateTime = function (date) {
            return f(2, (date.getMonth() + 1), '/') + f(2, date.getDate(), '/') + f(4, date.getFullYear(), ' ') +
                f(2, date.getHours(), ':') + f(2, date.getMinutes(), ':') + f(2, date.getSeconds(), ':') +
                f(3, date.getMilliseconds()) + ' GMT' + (0 - date.getTimezoneOffset() / 60);
            function f(z, d, s) {
                while (String(d).length < z) {
                    d = '0' + d;
                }
                return d + (s || '');
            }
        };
        SupertypeLogger.prototype.sendToLog = function (level, json) {
            console.log(this.prettyPrint(level, json)); // eslint-disable-line no-console
        };
        SupertypeLogger.prototype.prettyPrint = function (level, json) {
            var split = this.split(json, { time: 1, msg: 1, level: 1, name: 1 });
            return this.formatDateTime(new Date(json.time)) + ': ' +
                level.toUpperCase() + ': ' +
                addColonIfToken(split[1].name, ': ') +
                addColonIfToken(split[1].msg, ': ') +
                xy(split[0]);
            function addColonIfToken(token, colonAndSpace) {
                if (token) {
                    return token + colonAndSpace;
                }
                return '';
            }
            function xy(j) {
                var str = '';
                var sep = '';
                for (var prop in j) {
                    str += sep + prop + '=' + JSON.stringify(j[prop]);
                    sep = ' ';
                }
                if (str.length > 0) {
                    return '(' + str + ')';
                }
                return '';
            }
        };
        SupertypeLogger.prototype.split = function (json, props) {
            var a = {};
            var b = {};
            for (var prop in json) {
                (props[prop] ? b : a)[prop] = json[prop];
            }
            return [a, b];
        };
        // Logging is enabled if either the level threshold is met or the granular level matches
        SupertypeLogger.prototype.isEnabled = function (level, obj) {
            level = strToLevel[level];
            if (level >= strToLevel[this.level]) {
                return true;
            }
            if (this.granularLevels) {
                for (var levelr in this.granularLevels) {
                    if (obj[levelr] && obj[levelr] == this.granularLevels[levelr]) {
                        return true;
                    }
                }
            }
        };
        return SupertypeLogger;
    }());
    exports.SupertypeLogger = SupertypeLogger;
});
//# sourceMappingURL=SupertypeLogger.js.map