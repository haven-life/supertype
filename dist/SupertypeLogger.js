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
    /**
     * assign a custom send to log functionality.
     * @param {(level: string, data: any) => void} loggerFunction
     */
    SupertypeLogger.prototype.setLogger = function (loggerFunction) {
        this.sendToLog = loggerFunction;
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
        obj.level = level;
        data.forEach(function (arg, index) {
            if (index === 0 && isObject(arg)) {
                for (var proper in arg) {
                    obj[proper] = arg[proper];
                }
            }
            else {
                msg += arg + " ";
            }
        });
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
            this.sendToLog.apply(this, [levelToStr[obj.level], obj].concat(data));
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
    /**
     * this function is designed to be replaced by the consumer of this class.
     *
     * @param logLevel - log level
     * @param logObject - formatted log object, passed in from consumer
     * @param rawLogData - unformatted and unprocessed version of "logObject" param
     */
    SupertypeLogger.prototype.sendToLog = function (logLevel, logObject) {
        var rawLogData = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            rawLogData[_i - 2] = arguments[_i];
        }
        console.log(this.prettyPrint(logLevel, logObject)); // eslint-disable-line no-console
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlTG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZUxvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQU0sVUFBVSxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUNsRyxJQUFNLFVBQVUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7QUFFbEcsa0JBQWtCLEdBQUc7SUFDakIsT0FBTyxHQUFHLElBQUksSUFBSTtXQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRO1dBQ3pCLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDO1dBQ3ZCLENBQUMsQ0FBQyxHQUFHLFlBQVksSUFBSSxDQUFDO1dBQ3RCLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQVlEO0lBS0ksaUJBQWlCO0lBQ2pCLHVCQUF1QjtJQUN2Qiw0QkFBNEI7SUFFNUI7UUFDSSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztJQUN4QixDQUFDO0lBR0QsK0JBQUssR0FBTDtRQUFNLGNBQWM7YUFBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO1lBQWQseUJBQWM7O1FBQ2hCLElBQUksQ0FBQyxHQUFHLE9BQVIsSUFBSSxHQUFLLEVB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LEdBQUcsQ0FBQzthQUMxQjtZQUVELE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQztJQUNMLENBQUM7SUFFTywrQkFBSyxHQUFiLFVBQWMsSUFBSSxFQUFFLEtBQUs7UUFDckIsSUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWIsS0FBSyxJQUFNLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDckIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzVDO1FBRUQsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBRUQsd0ZBQXdGO0lBQ2hGLG1DQUFTLEdBQWpCLFVBQWtCLEtBQUssRUFBRSxHQUFHO1FBQ3hCLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUIsSUFBSSxLQUFLLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNqQyxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3JCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDcEMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzNELE9BQU8sSUFBSSxDQUFDO2lCQUNmO2FBQ0o7U0FDSjtJQUNMLENBQUM7SUFDTCxzQkFBQztBQUFELENBQUMsQUEvT0QsSUErT0M7QUEvT1ksMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBsZXZlbFRvU3RyID0geyA2MDogJ2ZhdGFsJywgNTA6ICdlcnJvcicsIDQwOiAnd2FybicsIDMwOiAnaW5mbycsIDIwOiAnZGVidWcnLCAxMDogJ3RyYWNlJyB9O1xuY29uc3Qgc3RyVG9MZXZlbCA9IHsgJ2ZhdGFsJzogNjAsICdlcnJvcic6IDUwLCAnd2Fybic6IDQwLCAnaW5mbyc6IDMwLCAnZGVidWcnOiAyMCwgJ3RyYWNlJzogMTAgfTtcblxuZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsXG4gICAgICAgICYmIHR5cGVvZiAob2JqKSA9PT0gJ29iamVjdCdcbiAgICAgICAgJiYgIShvYmogaW5zdGFuY2VvZiBBcnJheSlcbiAgICAgICAgJiYgIShvYmogaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgICAmJiAhKG9iaiBpbnN0YW5jZW9mIEVycm9yKTtcbn1cblxudHlwZSBMb2dnZXJGdW5jdGlvbiA9IChsb2dMZXZlbDogc3RyaW5nLCBsb2dPYmplY3Q6IGFueSwgLi4ucmF3TG9nRGF0YSkgPT4gdm9pZDtcblxudHlwZSBMb2dPYmplY3QgPSB7XG4gICAgbGV2ZWw6IHN0cmluZyB8IG51bWJlcjtcbiAgICB0aW1lOiBzdHJpbmc7XG4gICAgbXNnOiBzdHJpbmc7XG4gICAgbW9kdWxlPzogYW55O1xuICAgIGFjdGl2aXR5PzogYW55O1xufTtcblxuZXhwb3J0IGNsYXNzIFN1cGVydHlwZUxvZ2dlciB7XG4gICAgY29udGV4dDogYW55O1xuICAgIGdyYW51bGFyTGV2ZWxzOiBhbnk7XG4gICAgbGV2ZWw6IGFueTtcblxuICAgIC8vIGZvciBvdmVycmlkaW5nXG4gICAgLy8gc2VuZFRvTG9nOiBGdW5jdGlvbjtcbiAgICAvLyBmb3JtYXREYXRlVGltZTogRnVuY3Rpb247XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0ge307XG4gICAgICAgIHRoaXMuZ3JhbnVsYXJMZXZlbHMgPSB7fTtcbiAgICAgICAgdGhpcy5sZXZlbCA9ICdpbmZvJztcbiAgICB9XG5cblxuICAgIGZhdGFsKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDYwLCAuLi5kYXRhKTtcbiAgICB9XG5cbiAgICBlcnJvciguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZyg1MCwgLi4uZGF0YSk7XG4gICAgfVxuXG4gICAgd2FybiguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZyg0MCwgLi4uZGF0YSk7XG4gICAgfVxuXG4gICAgaW5mbyguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZygzMCwgLi4uZGF0YSk7XG4gICAgfVxuICAgIGRlYnVnKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDIwLCAuLi5kYXRhKTtcbiAgICB9XG4gICAgdHJhY2UoLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coMTAsIC4uLmRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFzc2lnbiBhIGN1c3RvbSBzZW5kIHRvIGxvZyBmdW5jdGlvbmFsaXR5LlxuICAgICAqIEBwYXJhbSB7KGxldmVsOiBzdHJpbmcsIGRhdGE6IGFueSkgPT4gdm9pZH0gbG9nZ2VyRnVuY3Rpb25cbiAgICAgKi9cbiAgICBzZXRMb2dnZXIobG9nZ2VyRnVuY3Rpb246IExvZ2dlckZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuc2VuZFRvTG9nID0gbG9nZ2VyRnVuY3Rpb247XG4gICAgfVxuXG4gICAgLy8gTG9nIGFsbCBhcmd1bWVudHMgYXNzdW1pbmcgdGhlIGZpcnN0IG9uZSBpcyBsZXZlbCBhbmQgdGhlIHNlY29uZCBvbmUgbWlnaHQgYmUgYW4gb2JqZWN0IChzaW1pbGFyIHRvIGJhbnlhbilcbiAgICBwcml2YXRlIGxvZyhsZXZlbDogbnVtYmVyLCAuLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBsZXQgbXNnID0gJyc7XG4gICAgICAgIGNvbnN0IG9iajogTG9nT2JqZWN0ID0ge1xuICAgICAgICAgICAgdGltZTogKG5ldyBEYXRlKCkpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBtc2c6ICcnLFxuICAgICAgICAgICAgbGV2ZWw6ICdpbmZvJywgLy9kZWZhdWx0IGluZm9cbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcy5jb250ZXh0KSB7XG4gICAgICAgICAgICBvYmpbcHJvcF0gPSB0aGlzLmNvbnRleHRbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICBvYmoubGV2ZWwgPSBsZXZlbDtcblxuICAgICAgICBkYXRhLmZvckVhY2goKGFyZywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCAmJiBpc09iamVjdChhcmcpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wZXIgaW4gYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wZXJdID0gYXJnW3Byb3Blcl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnICs9IGAke2FyZ30gYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9iai5tc2cubGVuZ3RoKSB7XG4gICAgICAgICAgICBvYmoubXNnICs9ICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtc2cubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAob2JqLm1vZHVsZSAmJiBvYmouYWN0aXZpdHkpIHtcbiAgICAgICAgICAgICAgICBvYmoubXNnICs9IGAke29iai5tb2R1bGV9WyR7b2JqLmFjdGl2aXR5fV0gLSBgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmoubXNnICs9IG1zZztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmoubW9kdWxlICYmIG9iai5hY3Rpdml0eSkge1xuICAgICAgICAgICAgb2JqLm1zZyArPSBgJHtvYmoubW9kdWxlfVske29iai5hY3Rpdml0eX1dYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmlzRW5hYmxlZChsZXZlbFRvU3RyW29iai5sZXZlbF0sIG9iaikpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZFRvTG9nKGxldmVsVG9TdHJbb2JqLmxldmVsXSwgb2JqLCAuLi5kYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0Q29udGV4dChjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSB0aGUgcHJvcGVydGllcyBpbiB0aGUgY29udGV4dCBhbmQgcmV0dXJuIGEgbmV3IG9iamVjdCB0aGF0IGhhcyB0aGUgcHJvcGVydGllcyBvbmx5IHNvIHRoZXkgY2FuIGJlIGNsZWFyZWRcbiAgICBzZXRDb250ZXh0UHJvcHMoY29udGV4dCkge1xuICAgICAgICBjb25zdCByZXZlcnNlID0ge307XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldmVyc2VbcHJvcF0gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0W3Byb3BdID0gY29udGV4dFtwcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXZlcnNlO1xuICAgIH1cbiAgICAvLyBQYXJzZSBsb2cgbGV2ZWxzIHN1Y2ggYXMgd2Fybi5hY3Rpdml0eVxuICAgIHNldExldmVsKGxldmVsKSB7XG4gICAgICAgIHZhciBsZXZlbHMgPSBsZXZlbC5zcGxpdCgnOycpO1xuXG4gICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCBsZXZlbHMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICB2YXIgbGV2ZWxhID0gbGV2ZWxzW2l4XTtcblxuICAgICAgICAgICAgaWYgKGxldmVsYS5tYXRjaCgvOi8pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxldmVsc1tpeF0ubWF0Y2goLyguKik6KC4qKS8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JhbnVsYXJMZXZlbHNbUmVnRXhwLiQxXSA9IHRoaXMuZ3JhbnVsYXJMZXZlbHNbUmVnRXhwLiQxXSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmFudWxhckxldmVsc1tSZWdFeHAuJDFdID0gUmVnRXhwLiQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsc1tpeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhbnkgcHJvcGVydGllcyByZWNvcmRlZCBieSBzZXRDb250ZXh0XG4gICAgY2xlYXJDb250ZXh0UHJvcHMoY29udGV4dFRvQ2xlYXIpIHtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIGNvbnRleHRUb0NsZWFyKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jb250ZXh0W3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGxvZ2dlciBhbmQgY29weSBvdmVyIGl0J3MgY29udGV4dFxuICAgIGNyZWF0ZUNoaWxkTG9nZ2VyKGNvbnRleHQpOiBTdXBlcnR5cGVMb2dnZXIge1xuICAgICAgICBsZXQgY2hpbGQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcblxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMpIHtcbiAgICAgICAgICAgIGNoaWxkW3Byb3BdID0gdGhpc1twcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkLmNvbnRleHQgPSBjb250ZXh0IHx8IHt9O1xuXG4gICAgICAgIGZvciAobGV0IHByb3BlciBpbiB0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgICAgIGNoaWxkLmNvbnRleHRbcHJvcGVyXSA9IHRoaXMuY29udGV4dFtwcm9wZXJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkIGFzIFN1cGVydHlwZUxvZ2dlcjsgLy8gYmFkIHByYWN0aWNlIGJ1dCBzaG91bGQgZml4XG4gICAgfVxuXG4gICAgZm9ybWF0RGF0ZVRpbWUoZGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBmKDIsIChkYXRlLmdldE1vbnRoKCkgKyAxKSwgJy8nKSArIGYoMiwgZGF0ZS5nZXREYXRlKCksICcvJykgKyBmKDQsIGRhdGUuZ2V0RnVsbFllYXIoKSwgJyAnKSArXG4gICAgICAgICAgICBmKDIsIGRhdGUuZ2V0SG91cnMoKSwgJzonKSArIGYoMiwgZGF0ZS5nZXRNaW51dGVzKCksICc6JykgKyBmKDIsIGRhdGUuZ2V0U2Vjb25kcygpLCAnOicpICtcbiAgICAgICAgICAgIGYoMywgZGF0ZS5nZXRNaWxsaXNlY29uZHMoKSkgKyAnIEdNVCcgKyAoMCAtIGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDYwKTtcblxuICAgICAgICBmdW5jdGlvbiBmKHosIGQsIHM/KSB7XG4gICAgICAgICAgICB3aGlsZSAoU3RyaW5nKGQpLmxlbmd0aCA8IHopIHtcbiAgICAgICAgICAgICAgICBkID0gJzAnICsgZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGQgKyAocyB8fCAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB0aGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJlcGxhY2VkIGJ5IHRoZSBjb25zdW1lciBvZiB0aGlzIGNsYXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxvZ0xldmVsIC0gbG9nIGxldmVsXG4gICAgICogQHBhcmFtIGxvZ09iamVjdCAtIGZvcm1hdHRlZCBsb2cgb2JqZWN0LCBwYXNzZWQgaW4gZnJvbSBjb25zdW1lclxuICAgICAqIEBwYXJhbSByYXdMb2dEYXRhIC0gdW5mb3JtYXR0ZWQgYW5kIHVucHJvY2Vzc2VkIHZlcnNpb24gb2YgXCJsb2dPYmplY3RcIiBwYXJhbVxuICAgICAqL1xuICAgIHByaXZhdGUgc2VuZFRvTG9nKGxvZ0xldmVsLCBsb2dPYmplY3QsIC4uLnJhd0xvZ0RhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5wcmV0dHlQcmludChsb2dMZXZlbCwgbG9nT2JqZWN0KSk7ICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICB9XG5cbiAgICBwcmV0dHlQcmludChsZXZlbCwganNvbikge1xuICAgICAgICBsZXQgc3BsaXQgPSB0aGlzLnNwbGl0KGpzb24sIHt0aW1lOiAxLCBtc2c6IDEsIGxldmVsOiAxLCBuYW1lOiAxfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0RGF0ZVRpbWUobmV3IERhdGUoanNvbi50aW1lKSkgKyAnOiAnICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXZlbC50b1VwcGVyQ2FzZSgpICsgJzogJyArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ29sb25JZlRva2VuKHNwbGl0WzFdLm5hbWUsICc6ICcpICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRDb2xvbklmVG9rZW4oc3BsaXRbMV0ubXNnLCAnOiAnKSArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHkoc3BsaXRbMF0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZENvbG9uSWZUb2tlbiAodG9rZW4sIGNvbG9uQW5kU3BhY2UpIHtcbiAgICAgICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbiArIGNvbG9uQW5kU3BhY2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHh5KGopIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIHZhciBzZXAgPSAnJztcblxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBqKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHNlcCArIHByb3AgKyAnPScgKyBKU09OLnN0cmluZ2lmeShqW3Byb3BdKTtcbiAgICAgICAgICAgICAgICBzZXAgPSAnICc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnKCcgKyBzdHIgKyAnKSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3BsaXQoanNvbiwgcHJvcHMpOiBhbnlbXSB7XG4gICAgICAgIGNvbnN0IGEgPSB7fTtcbiAgICAgICAgY29uc3QgYiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBqc29uKSB7XG4gICAgICAgICAgICAocHJvcHNbcHJvcF0gPyBiIDogYSlbcHJvcF0gPSBqc29uW3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFthLCBiXTtcbiAgICB9XG5cbiAgICAvLyBMb2dnaW5nIGlzIGVuYWJsZWQgaWYgZWl0aGVyIHRoZSBsZXZlbCB0aHJlc2hvbGQgaXMgbWV0IG9yIHRoZSBncmFudWxhciBsZXZlbCBtYXRjaGVzXG4gICAgcHJpdmF0ZSBpc0VuYWJsZWQobGV2ZWwsIG9iaikge1xuICAgICAgICBsZXZlbCA9IHN0clRvTGV2ZWxbbGV2ZWxdO1xuXG4gICAgICAgIGlmIChsZXZlbCA+PSBzdHJUb0xldmVsW3RoaXMubGV2ZWxdKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdyYW51bGFyTGV2ZWxzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBsZXZlbHIgaW4gdGhpcy5ncmFudWxhckxldmVscykge1xuICAgICAgICAgICAgICAgIGlmIChvYmpbbGV2ZWxyXSAmJiBvYmpbbGV2ZWxyXSA9PSB0aGlzLmdyYW51bGFyTGV2ZWxzW2xldmVscl0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSJdfQ==