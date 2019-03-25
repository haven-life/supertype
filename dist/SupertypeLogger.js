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
            __amorphicContext: {}
        };
        var amorphicContext = {};
        // Copy amorphic context into the data
        for (var prop in this.context) {
            obj[prop] = this.context[prop];
            amorphicContext[prop] = this.context[prop];
        }
        obj.level = level;
        obj.__amorphicContext = amorphicContext;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlTG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZUxvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQU0sVUFBVSxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUNsRyxJQUFNLFVBQVUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7QUFFbEcsa0JBQWtCLEdBQUc7SUFDakIsT0FBTyxHQUFHLElBQUksSUFBSTtXQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRO1dBQ3pCLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDO1dBQ3ZCLENBQUMsQ0FBQyxHQUFHLFlBQVksSUFBSSxDQUFDO1dBQ3RCLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQWFEO0lBS0ksaUJBQWlCO0lBQ2pCLHVCQUF1QjtJQUN2Qiw0QkFBNEI7SUFFNUI7UUFDSSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztJQUN4QixDQUFDO0lBR0QsK0JBQUssR0FBTDtRQUFNLGNBQWM7YUFBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO1lBQWQseUJBQWM7O1FBQ2hCLElBQUksQ0FBQyxHQUFHLE9BQVIsSUFBSSxHQUFLLEVB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LENBQUM7aUJBQ2Y7YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0FBQyxBQXBQRCxJQW9QQztBQXBQWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGxldmVsVG9TdHIgPSB7IDYwOiAnZmF0YWwnLCA1MDogJ2Vycm9yJywgNDA6ICd3YXJuJywgMzA6ICdpbmZvJywgMjA6ICdkZWJ1ZycsIDEwOiAndHJhY2UnIH07XG5jb25zdCBzdHJUb0xldmVsID0geyAnZmF0YWwnOiA2MCwgJ2Vycm9yJzogNTAsICd3YXJuJzogNDAsICdpbmZvJzogMzAsICdkZWJ1Zyc6IDIwLCAndHJhY2UnOiAxMCB9O1xuXG5mdW5jdGlvbiBpc09iamVjdChvYmopIHtcbiAgICByZXR1cm4gb2JqICE9IG51bGxcbiAgICAgICAgJiYgdHlwZW9mIChvYmopID09PSAnb2JqZWN0J1xuICAgICAgICAmJiAhKG9iaiBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgICAmJiAhKG9iaiBpbnN0YW5jZW9mIERhdGUpXG4gICAgICAgICYmICEob2JqIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuXG50eXBlIExvZ2dlckZ1bmN0aW9uID0gKGxvZ0xldmVsOiBzdHJpbmcsIGxvZ09iamVjdDogYW55LCAuLi5yYXdMb2dEYXRhKSA9PiB2b2lkO1xuXG50eXBlIExvZ09iamVjdCA9IHtcbiAgICBsZXZlbDogc3RyaW5nIHwgbnVtYmVyO1xuICAgIHRpbWU6IHN0cmluZztcbiAgICBtc2c6IHN0cmluZztcbiAgICBtb2R1bGU/OiBhbnk7XG4gICAgYWN0aXZpdHk/OiBhbnk7XG4gICAgX19hbW9ycGhpY0NvbnRleHQ6IGFueTtcbn07XG5cbmV4cG9ydCBjbGFzcyBTdXBlcnR5cGVMb2dnZXIge1xuICAgIGNvbnRleHQ6IGFueTtcbiAgICBncmFudWxhckxldmVsczogYW55O1xuICAgIGxldmVsOiBhbnk7XG5cbiAgICAvLyBmb3Igb3ZlcnJpZGluZ1xuICAgIC8vIHNlbmRUb0xvZzogRnVuY3Rpb247XG4gICAgLy8gZm9ybWF0RGF0ZVRpbWU6IEZ1bmN0aW9uO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHt9O1xuICAgICAgICB0aGlzLmdyYW51bGFyTGV2ZWxzID0ge307XG4gICAgICAgIHRoaXMubGV2ZWwgPSAnaW5mbyc7XG4gICAgfVxuXG5cbiAgICBmYXRhbCguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZyg2MCwgLi4uZGF0YSk7XG4gICAgfVxuXG4gICAgZXJyb3IoLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coNTAsIC4uLmRhdGEpO1xuICAgIH1cblxuICAgIHdhcm4oLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coNDAsIC4uLmRhdGEpO1xuICAgIH1cblxuICAgIGluZm8oLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coMzAsIC4uLmRhdGEpO1xuICAgIH1cbiAgICBkZWJ1ZyguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZygyMCwgLi4uZGF0YSk7XG4gICAgfVxuICAgIHRyYWNlKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDEwLCAuLi5kYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhc3NpZ24gYSBjdXN0b20gc2VuZCB0byBsb2cgZnVuY3Rpb25hbGl0eS5cbiAgICAgKiBAcGFyYW0geyhsZXZlbDogc3RyaW5nLCBkYXRhOiBhbnkpID0+IHZvaWR9IGxvZ2dlckZ1bmN0aW9uXG4gICAgICovXG4gICAgc2V0TG9nZ2VyKGxvZ2dlckZ1bmN0aW9uOiBMb2dnZXJGdW5jdGlvbikge1xuICAgICAgICB0aGlzLnNlbmRUb0xvZyA9IGxvZ2dlckZ1bmN0aW9uO1xuICAgIH1cblxuICAgIC8vIExvZyBhbGwgYXJndW1lbnRzIGFzc3VtaW5nIHRoZSBmaXJzdCBvbmUgaXMgbGV2ZWwgYW5kIHRoZSBzZWNvbmQgb25lIG1pZ2h0IGJlIGFuIG9iamVjdCAoc2ltaWxhciB0byBiYW55YW4pXG4gICAgcHJpdmF0ZSBsb2cobGV2ZWw6IG51bWJlciwgLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgbGV0IG1zZyA9ICcnO1xuICAgICAgICBjb25zdCBvYmo6IExvZ09iamVjdCA9IHtcbiAgICAgICAgICAgIHRpbWU6IChuZXcgRGF0ZSgpKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbXNnOiAnJyxcbiAgICAgICAgICAgIGxldmVsOiAnaW5mbycsIC8vZGVmYXVsdCBpbmZvXG4gICAgICAgICAgICBfX2Ftb3JwaGljQ29udGV4dDoge31cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBhbW9ycGhpY0NvbnRleHQgPSB7fTtcbiAgICAgICAgLy8gQ29weSBhbW9ycGhpYyBjb250ZXh0IGludG8gdGhlIGRhdGFcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMuY29udGV4dCkge1xuICAgICAgICAgICAgb2JqW3Byb3BdID0gdGhpcy5jb250ZXh0W3Byb3BdO1xuICAgICAgICAgICAgYW1vcnBoaWNDb250ZXh0W3Byb3BdID0gdGhpcy5jb250ZXh0W3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqLmxldmVsID0gbGV2ZWw7XG4gICAgICAgIG9iai5fX2Ftb3JwaGljQ29udGV4dCA9IGFtb3JwaGljQ29udGV4dDtcblxuICAgICAgICBkYXRhLmZvckVhY2goKGFyZywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCAmJiBpc09iamVjdChhcmcpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wZXIgaW4gYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wZXJdID0gYXJnW3Byb3Blcl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnICs9IGAke2FyZ30gYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9iai5tc2cubGVuZ3RoKSB7XG4gICAgICAgICAgICBvYmoubXNnICs9ICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtc2cubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAob2JqLm1vZHVsZSAmJiBvYmouYWN0aXZpdHkpIHtcbiAgICAgICAgICAgICAgICBvYmoubXNnICs9IGAke29iai5tb2R1bGV9WyR7b2JqLmFjdGl2aXR5fV0gLSBgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmoubXNnICs9IG1zZztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmoubW9kdWxlICYmIG9iai5hY3Rpdml0eSkge1xuICAgICAgICAgICAgb2JqLm1zZyArPSBgJHtvYmoubW9kdWxlfVske29iai5hY3Rpdml0eX1dYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmlzRW5hYmxlZChsZXZlbFRvU3RyW29iai5sZXZlbF0sIG9iaikpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZFRvTG9nKGxldmVsVG9TdHJbb2JqLmxldmVsXSwgb2JqLCAuLi5kYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0Q29udGV4dChjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSB0aGUgcHJvcGVydGllcyBpbiB0aGUgY29udGV4dCBhbmQgcmV0dXJuIGEgbmV3IG9iamVjdCB0aGF0IGhhcyB0aGUgcHJvcGVydGllcyBvbmx5IHNvIHRoZXkgY2FuIGJlIGNsZWFyZWRcbiAgICBzZXRDb250ZXh0UHJvcHMoY29udGV4dCkge1xuICAgICAgICBjb25zdCByZXZlcnNlID0ge307XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldmVyc2VbcHJvcF0gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0W3Byb3BdID0gY29udGV4dFtwcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXZlcnNlO1xuICAgIH1cbiAgICAvLyBQYXJzZSBsb2cgbGV2ZWxzIHN1Y2ggYXMgd2Fybi5hY3Rpdml0eVxuICAgIHNldExldmVsKGxldmVsKSB7XG4gICAgICAgIHZhciBsZXZlbHMgPSBsZXZlbC5zcGxpdCgnOycpO1xuXG4gICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCBsZXZlbHMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICB2YXIgbGV2ZWxhID0gbGV2ZWxzW2l4XTtcblxuICAgICAgICAgICAgaWYgKGxldmVsYS5tYXRjaCgvOi8pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxldmVsc1tpeF0ubWF0Y2goLyguKik6KC4qKS8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JhbnVsYXJMZXZlbHNbUmVnRXhwLiQxXSA9IHRoaXMuZ3JhbnVsYXJMZXZlbHNbUmVnRXhwLiQxXSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmFudWxhckxldmVsc1tSZWdFeHAuJDFdID0gUmVnRXhwLiQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsc1tpeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhbnkgcHJvcGVydGllcyByZWNvcmRlZCBieSBzZXRDb250ZXh0XG4gICAgY2xlYXJDb250ZXh0UHJvcHMoY29udGV4dFRvQ2xlYXIpIHtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIGNvbnRleHRUb0NsZWFyKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jb250ZXh0W3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGxvZ2dlciBhbmQgY29weSBvdmVyIGl0J3MgY29udGV4dFxuICAgIGNyZWF0ZUNoaWxkTG9nZ2VyKGNvbnRleHQpOiBTdXBlcnR5cGVMb2dnZXIge1xuICAgICAgICBsZXQgY2hpbGQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcblxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMpIHtcbiAgICAgICAgICAgIGNoaWxkW3Byb3BdID0gdGhpc1twcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkLmNvbnRleHQgPSBjb250ZXh0IHx8IHt9O1xuXG4gICAgICAgIGZvciAobGV0IHByb3BlciBpbiB0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgICAgIGNoaWxkLmNvbnRleHRbcHJvcGVyXSA9IHRoaXMuY29udGV4dFtwcm9wZXJdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkIGFzIFN1cGVydHlwZUxvZ2dlcjsgLy8gYmFkIHByYWN0aWNlIGJ1dCBzaG91bGQgZml4XG4gICAgfVxuXG4gICAgZm9ybWF0RGF0ZVRpbWUoZGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBmKDIsIChkYXRlLmdldE1vbnRoKCkgKyAxKSwgJy8nKSArIGYoMiwgZGF0ZS5nZXREYXRlKCksICcvJykgKyBmKDQsIGRhdGUuZ2V0RnVsbFllYXIoKSwgJyAnKSArXG4gICAgICAgICAgICBmKDIsIGRhdGUuZ2V0SG91cnMoKSwgJzonKSArIGYoMiwgZGF0ZS5nZXRNaW51dGVzKCksICc6JykgKyBmKDIsIGRhdGUuZ2V0U2Vjb25kcygpLCAnOicpICtcbiAgICAgICAgICAgIGYoMywgZGF0ZS5nZXRNaWxsaXNlY29uZHMoKSkgKyAnIEdNVCcgKyAoMCAtIGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDYwKTtcblxuICAgICAgICBmdW5jdGlvbiBmKHosIGQsIHM/KSB7XG4gICAgICAgICAgICB3aGlsZSAoU3RyaW5nKGQpLmxlbmd0aCA8IHopIHtcbiAgICAgICAgICAgICAgICBkID0gJzAnICsgZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGQgKyAocyB8fCAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB0aGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJlcGxhY2VkIGJ5IHRoZSBjb25zdW1lciBvZiB0aGlzIGNsYXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxvZ0xldmVsIC0gbG9nIGxldmVsXG4gICAgICogQHBhcmFtIGxvZ09iamVjdCAtIGZvcm1hdHRlZCBsb2cgb2JqZWN0LCBwYXNzZWQgaW4gZnJvbSBjb25zdW1lclxuICAgICAqIEBwYXJhbSByYXdMb2dEYXRhIC0gdW5mb3JtYXR0ZWQgYW5kIHVucHJvY2Vzc2VkIHZlcnNpb24gb2YgXCJsb2dPYmplY3RcIiBwYXJhbVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBzZW5kVG9Mb2cobG9nTGV2ZWwsIGxvZ09iamVjdCwgLi4ucmF3TG9nRGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnByZXR0eVByaW50KGxvZ0xldmVsLCBsb2dPYmplY3QpKTsgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIH1cblxuICAgIHByZXR0eVByaW50KGxldmVsLCBqc29uKSB7XG4gICAgICAgIGxldCBzcGxpdCA9IHRoaXMuc3BsaXQoanNvbiwge3RpbWU6IDEsIG1zZzogMSwgbGV2ZWw6IDEsIG5hbWU6IDF9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXREYXRlVGltZShuZXcgRGF0ZShqc29uLnRpbWUpKSArICc6ICcgK1xuICAgICAgICAgICAgbGV2ZWwudG9VcHBlckNhc2UoKSArICc6ICcgK1xuICAgICAgICAgICAgYWRkQ29sb25JZlRva2VuKHNwbGl0WzFdLm5hbWUsICc6ICcpICtcbiAgICAgICAgICAgIGFkZENvbG9uSWZUb2tlbihzcGxpdFsxXS5tc2csICc6ICcpICtcbiAgICAgICAgICAgIHh5KHNwbGl0WzBdKTtcblxuICAgICAgICBmdW5jdGlvbiBhZGRDb2xvbklmVG9rZW4gKHRva2VuLCBjb2xvbkFuZFNwYWNlKSB7XG4gICAgICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW4gKyBjb2xvbkFuZFNwYWNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB4eShqKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICB2YXIgc2VwID0gJyc7XG5cbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gaikge1xuICAgICAgICAgICAgICAgIHN0ciArPSBzZXAgKyBwcm9wICsgJz0nICsgSlNPTi5zdHJpbmdpZnkoaltwcm9wXSk7XG4gICAgICAgICAgICAgICAgc2VwID0gJyAnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJygnICsgc3RyICsgJyknO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNwbGl0KGpzb24sIHByb3BzKTogYW55W10ge1xuICAgICAgICBjb25zdCBhID0ge307XG4gICAgICAgIGNvbnN0IGIgPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4ganNvbikge1xuICAgICAgICAgICAgKHByb3BzW3Byb3BdID8gYiA6IGEpW3Byb3BdID0ganNvbltwcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbYSwgYl07XG4gICAgfVxuXG4gICAgLy8gTG9nZ2luZyBpcyBlbmFibGVkIGlmIGVpdGhlciB0aGUgbGV2ZWwgdGhyZXNob2xkIGlzIG1ldCBvciB0aGUgZ3JhbnVsYXIgbGV2ZWwgbWF0Y2hlc1xuICAgIHByaXZhdGUgaXNFbmFibGVkKGxldmVsLCBvYmopIHtcbiAgICAgICAgbGV2ZWwgPSBzdHJUb0xldmVsW2xldmVsXTtcblxuICAgICAgICBpZiAobGV2ZWwgPj0gc3RyVG9MZXZlbFt0aGlzLmxldmVsXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ncmFudWxhckxldmVscykge1xuICAgICAgICAgICAgZm9yIChsZXQgbGV2ZWxyIGluIHRoaXMuZ3JhbnVsYXJMZXZlbHMpIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqW2xldmVscl0gJiYgb2JqW2xldmVscl0gPT0gdGhpcy5ncmFudWxhckxldmVsc1tsZXZlbHJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0iXX0=