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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlTG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vU3VwZXJ0eXBlTG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEsSUFBTSxVQUFVLEdBQUcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ2xHLElBQU0sVUFBVSxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUVsRyxrQkFBa0IsR0FBRztRQUNqQixPQUFPLEdBQUcsSUFBSSxJQUFJO2VBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVE7ZUFDekIsQ0FBQyxDQUFDLEdBQUcsWUFBWSxLQUFLLENBQUM7ZUFDdkIsQ0FBQyxDQUFDLEdBQUcsWUFBWSxJQUFJLENBQUM7ZUFDdEIsQ0FBQyxDQUFDLEdBQUcsWUFBWSxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBVUQ7UUFLSSxpQkFBaUI7UUFDakIsdUJBQXVCO1FBQ3ZCLDRCQUE0QjtRQUU1QjtZQUNJLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLENBQUM7UUFHRCwrQkFBSyxHQUFMO1lBQU0sY0FBYztpQkFBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO2dCQUFkLHlCQUFjOztZQUNoQixJQUFJLENBQUMsR0FBRyxPQUFSLElBQUks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R0FBRyxHQUFHLENBQUM7aUJBQzFCO2dCQUVELE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQztRQUNMLENBQUM7UUFFTywrQkFBSyxHQUFiLFVBQWMsSUFBSSxFQUFFLEtBQUs7WUFDckIsSUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRWIsS0FBSyxJQUFNLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM1QztZQUVELE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELHdGQUF3RjtRQUNoRixtQ0FBUyxHQUFqQixVQUFrQixLQUFLLEVBQUUsR0FBRztZQUN4QixLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFCLElBQUksS0FBSyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFDO2FBQ2Y7WUFFRCxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQ3JCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtvQkFDcEMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQzNELE9BQU8sSUFBSSxDQUFDO3FCQUNmO2lCQUNKO2FBQ0o7UUFDTCxDQUFDO1FBQ0wsc0JBQUM7SUFBRCxDQUFDLEFBbE9ELElBa09DO0lBbE9ZLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgbGV2ZWxUb1N0ciA9IHsgNjA6ICdmYXRhbCcsIDUwOiAnZXJyb3InLCA0MDogJ3dhcm4nLCAzMDogJ2luZm8nLCAyMDogJ2RlYnVnJywgMTA6ICd0cmFjZScgfTtcbmNvbnN0IHN0clRvTGV2ZWwgPSB7ICdmYXRhbCc6IDYwLCAnZXJyb3InOiA1MCwgJ3dhcm4nOiA0MCwgJ2luZm8nOiAzMCwgJ2RlYnVnJzogMjAsICd0cmFjZSc6IDEwIH07XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICAgIHJldHVybiBvYmogIT0gbnVsbFxuICAgICAgICAmJiB0eXBlb2YgKG9iaikgPT09ICdvYmplY3QnXG4gICAgICAgICYmICEob2JqIGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICAgICYmICEob2JqIGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgICAgJiYgIShvYmogaW5zdGFuY2VvZiBFcnJvcik7XG59XG5cbnR5cGUgTG9nT2JqZWN0ID0ge1xuICAgIGxldmVsOiBzdHJpbmc7XG4gICAgdGltZTogc3RyaW5nO1xuICAgIG1zZzogc3RyaW5nO1xuICAgIG1vZHVsZT86IGFueTtcbiAgICBhY3Rpdml0eT86IGFueTtcbn07XG5cbmV4cG9ydCBjbGFzcyBTdXBlcnR5cGVMb2dnZXIge1xuICAgIGNvbnRleHQ6IGFueTtcbiAgICBncmFudWxhckxldmVsczogYW55O1xuICAgIGxldmVsOiBhbnk7XG5cbiAgICAvLyBmb3Igb3ZlcnJpZGluZ1xuICAgIC8vIHNlbmRUb0xvZzogRnVuY3Rpb247XG4gICAgLy8gZm9ybWF0RGF0ZVRpbWU6IEZ1bmN0aW9uO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHt9O1xuICAgICAgICB0aGlzLmdyYW51bGFyTGV2ZWxzID0ge307XG4gICAgICAgIHRoaXMubGV2ZWwgPSAnaW5mbyc7XG4gICAgfVxuXG5cbiAgICBmYXRhbCguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZyg2MCwgLi4uZGF0YSk7XG4gICAgfVxuXG4gICAgZXJyb3IoLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coNTAsIC4uLmRhdGEpO1xuICAgIH1cblxuICAgIHdhcm4oLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coNDAsIC4uLmRhdGEpO1xuICAgIH1cblxuICAgIGluZm8oLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coMzAsIC4uLmRhdGEpO1xuICAgIH1cbiAgICBkZWJ1ZyguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZygyMCwgLi4uZGF0YSk7XG4gICAgfVxuICAgIHRyYWNlKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDEwLCAuLi5kYXRhKTtcbiAgICB9XG5cbiAgICAvLyBMb2cgYWxsIGFyZ3VtZW50cyBhc3N1bWluZyB0aGUgZmlyc3Qgb25lIGlzIGxldmVsIGFuZCB0aGUgc2Vjb25kIG9uZSBtaWdodCBiZSBhbiBvYmplY3QgKHNpbWlsYXIgdG8gYmFueWFuKVxuICAgIGxvZyhsZXZlbDogbnVtYmVyLCAuLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBsZXQgbXNnID0gJyc7XG4gICAgICAgIGNvbnN0IG9iajogTG9nT2JqZWN0ID0ge1xuICAgICAgICAgICAgdGltZTogKG5ldyBEYXRlKCkpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBtc2c6ICcnLFxuICAgICAgICAgICAgbGV2ZWw6ICdpbmZvJywgLy9kZWZhdWx0IGluZm9cbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcy5jb250ZXh0KSB7XG4gICAgICAgICAgICBvYmpbcHJvcF0gPSB0aGlzLmNvbnRleHRbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgYXJndW1lbnRzLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgY29uc3QgYXJnID0gYXJndW1lbnRzW2l4XTtcbiAgICAgICAgICAgIGlmIChpeCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgb2JqLmxldmVsID0gYXJnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXggPT0gMSAmJiBpc09iamVjdChhcmcpKSB7IC8vIGVycm9yIHdoZW4gd2UgdHJ5IHRvIGxvZyBhbiBvYmplY3Qgd2l0aCBwcm9wZXJ0eSAnbGV2ZWwnXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wZXIgaW4gYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wZXJdID0gYXJnW3Byb3Blcl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnICs9IGAke2FyZ30gYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvYmoubXNnLmxlbmd0aCkge1xuICAgICAgICAgICAgb2JqLm1zZyArPSAnICc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobXNnLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKG9iai5tb2R1bGUgJiYgb2JqLmFjdGl2aXR5KSB7XG4gICAgICAgICAgICAgICAgb2JqLm1zZyArPSBgJHtvYmoubW9kdWxlfVske29iai5hY3Rpdml0eX1dIC0gYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLm1zZyArPSBtc2c7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqLm1vZHVsZSAmJiBvYmouYWN0aXZpdHkpIHtcbiAgICAgICAgICAgIG9iai5tc2cgKz0gYCR7b2JqLm1vZHVsZX1bJHtvYmouYWN0aXZpdHl9XWA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0VuYWJsZWQobGV2ZWxUb1N0cltvYmoubGV2ZWxdLCBvYmopKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRUb0xvZyhsZXZlbFRvU3RyW29iai5sZXZlbF0sIG9iaik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGFydENvbnRleHQoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIC8vIFNhdmUgdGhlIHByb3BlcnRpZXMgaW4gdGhlIGNvbnRleHQgYW5kIHJldHVybiBhIG5ldyBvYmplY3QgdGhhdCBoYXMgdGhlIHByb3BlcnRpZXMgb25seSBzbyB0aGV5IGNhbiBiZSBjbGVhcmVkXG4gICAgc2V0Q29udGV4dFByb3BzKGNvbnRleHQpIHtcbiAgICAgICAgY29uc3QgcmV2ZXJzZSA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBjb250ZXh0KSB7XG4gICAgICAgICAgICByZXZlcnNlW3Byb3BdID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dFtwcm9wXSA9IGNvbnRleHRbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV2ZXJzZTtcbiAgICB9XG4gICAgLy8gUGFyc2UgbG9nIGxldmVscyBzdWNoIGFzIHdhcm4uYWN0aXZpdHlcbiAgICBzZXRMZXZlbChsZXZlbCkge1xuICAgICAgICB2YXIgbGV2ZWxzID0gbGV2ZWwuc3BsaXQoJzsnKTtcblxuICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgbGV2ZWxzLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgdmFyIGxldmVsYSA9IGxldmVsc1tpeF07XG5cbiAgICAgICAgICAgIGlmIChsZXZlbGEubWF0Y2goLzovKSkge1xuICAgICAgICAgICAgICAgIGlmIChsZXZlbHNbaXhdLm1hdGNoKC8oLiopOiguKikvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyYW51bGFyTGV2ZWxzW1JlZ0V4cC4kMV0gPSB0aGlzLmdyYW51bGFyTGV2ZWxzW1JlZ0V4cC4kMV0gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JhbnVsYXJMZXZlbHNbUmVnRXhwLiQxXSA9IFJlZ0V4cC4kMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbHNbaXhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYW55IHByb3BlcnRpZXMgcmVjb3JkZWQgYnkgc2V0Q29udGV4dFxuICAgIGNsZWFyQ29udGV4dFByb3BzKGNvbnRleHRUb0NsZWFyKSB7XG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBjb250ZXh0VG9DbGVhcikge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY29udGV4dFtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIG5ldyBsb2dnZXIgYW5kIGNvcHkgb3ZlciBpdCdzIGNvbnRleHRcbiAgICBjcmVhdGVDaGlsZExvZ2dlcihjb250ZXh0KTogU3VwZXJ0eXBlTG9nZ2VyIHtcbiAgICAgICAgbGV0IGNoaWxkOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG5cbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzKSB7XG4gICAgICAgICAgICBjaGlsZFtwcm9wXSA9IHRoaXNbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICBjaGlsZC5jb250ZXh0ID0gY29udGV4dCB8fCB7fTtcblxuICAgICAgICBmb3IgKGxldCBwcm9wZXIgaW4gdGhpcy5jb250ZXh0KSB7XG4gICAgICAgICAgICBjaGlsZC5jb250ZXh0W3Byb3Blcl0gPSB0aGlzLmNvbnRleHRbcHJvcGVyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGlsZCBhcyBTdXBlcnR5cGVMb2dnZXI7IC8vIGJhZCBwcmFjdGljZSBidXQgc2hvdWxkIGZpeFxuICAgIH1cblxuICAgIGZvcm1hdERhdGVUaW1lKGRhdGUpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZigyLCAoZGF0ZS5nZXRNb250aCgpICsgMSksICcvJykgKyBmKDIsIGRhdGUuZ2V0RGF0ZSgpLCAnLycpICsgZig0LCBkYXRlLmdldEZ1bGxZZWFyKCksICcgJykgK1xuICAgICAgICAgICAgZigyLCBkYXRlLmdldEhvdXJzKCksICc6JykgKyBmKDIsIGRhdGUuZ2V0TWludXRlcygpLCAnOicpICsgZigyLCBkYXRlLmdldFNlY29uZHMoKSwgJzonKSArXG4gICAgICAgICAgICBmKDMsIGRhdGUuZ2V0TWlsbGlzZWNvbmRzKCkpICsgJyBHTVQnICsgKDAgLSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZih6LCBkLCBzPykge1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZyhkKS5sZW5ndGggPCB6KSB7XG4gICAgICAgICAgICAgICAgZCA9ICcwJyArIGQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkICsgKHMgfHwgJycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VuZFRvTG9nKGxldmVsLCBqc29uKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMucHJldHR5UHJpbnQobGV2ZWwsIGpzb24pKTsgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIH1cblxuICAgIHByZXR0eVByaW50KGxldmVsLCBqc29uKSB7XG4gICAgICAgIGxldCBzcGxpdCA9IHRoaXMuc3BsaXQoanNvbiwge3RpbWU6IDEsIG1zZzogMSwgbGV2ZWw6IDEsIG5hbWU6IDF9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXREYXRlVGltZShuZXcgRGF0ZShqc29uLnRpbWUpKSArICc6ICcgKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsLnRvVXBwZXJDYXNlKCkgKyAnOiAnICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRDb2xvbklmVG9rZW4oc3BsaXRbMV0ubmFtZSwgJzogJykgKyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZENvbG9uSWZUb2tlbihzcGxpdFsxXS5tc2csICc6ICcpICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4eShzcGxpdFswXSk7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkQ29sb25JZlRva2VuICh0b2tlbiwgY29sb25BbmRTcGFjZSkge1xuICAgICAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuICsgY29sb25BbmRTcGFjZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24geHkoaikge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgdmFyIHNlcCA9ICcnO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGopIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gc2VwICsgcHJvcCArICc9JyArIEpTT04uc3RyaW5naWZ5KGpbcHJvcF0pO1xuICAgICAgICAgICAgICAgIHNlcCA9ICcgJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcoJyArIHN0ciArICcpJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzcGxpdChqc29uLCBwcm9wcyk6IGFueVtdIHtcbiAgICAgICAgY29uc3QgYSA9IHt9O1xuICAgICAgICBjb25zdCBiID0ge307XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIGpzb24pIHtcbiAgICAgICAgICAgIChwcm9wc1twcm9wXSA/IGIgOiBhKVtwcm9wXSA9IGpzb25bcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW2EsIGJdO1xuICAgIH1cblxuICAgIC8vIExvZ2dpbmcgaXMgZW5hYmxlZCBpZiBlaXRoZXIgdGhlIGxldmVsIHRocmVzaG9sZCBpcyBtZXQgb3IgdGhlIGdyYW51bGFyIGxldmVsIG1hdGNoZXNcbiAgICBwcml2YXRlIGlzRW5hYmxlZChsZXZlbCwgb2JqKSB7XG4gICAgICAgIGxldmVsID0gc3RyVG9MZXZlbFtsZXZlbF07XG5cbiAgICAgICAgaWYgKGxldmVsID49IHN0clRvTGV2ZWxbdGhpcy5sZXZlbF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JhbnVsYXJMZXZlbHMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGxldmVsciBpbiB0aGlzLmdyYW51bGFyTGV2ZWxzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9ialtsZXZlbHJdICYmIG9ialtsZXZlbHJdID09IHRoaXMuZ3JhbnVsYXJMZXZlbHNbbGV2ZWxyXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59Il19