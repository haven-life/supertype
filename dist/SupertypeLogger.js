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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlTG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZUxvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLElBQU0sVUFBVSxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNsRyxJQUFNLFVBQVUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFFbEcsa0JBQWtCLEdBQUc7UUFDakIsT0FBTyxHQUFHLElBQUksSUFBSTtlQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRO2VBQ3pCLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDO2VBQ3ZCLENBQUMsQ0FBQyxHQUFHLFlBQVksSUFBSSxDQUFDO2VBQ3RCLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQVVEO1FBS0ksaUJBQWlCO1FBQ2pCLHVCQUF1QjtRQUN2Qiw0QkFBNEI7UUFFNUI7WUFDSSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUN4QixDQUFDO1FBR0QsK0JBQUssR0FBTDtZQUFNLGNBQWM7aUJBQWQsVUFBYyxFQUFkLHFCQUFjLEVBQWQsSUFBYztnQkFBZCx5QkFBYzs7WUFDaEIsSUFBSSxDQUFDLEdBQUcsT0FBUixJ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QUFHLEdBQUcsR0FBRyxDQUFDO2lCQUMxQjtnQkFFRCxPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUM7UUFDTCxDQUFDO1FBRU8sK0JBQUssR0FBYixVQUFjLElBQUksRUFBRSxLQUFLO1lBQ3JCLElBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNiLElBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUViLEtBQUssSUFBTSxJQUFJLElBQUksSUFBSSxFQUFFO2dCQUNyQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDNUM7WUFFRCxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCx3RkFBd0Y7UUFDaEYsbUNBQVMsR0FBakIsVUFBa0IsS0FBSyxFQUFFLEdBQUc7WUFDeEIsS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUxQixJQUFJLEtBQUssSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNqQyxPQUFPLElBQUksQ0FBQzthQUNmO1lBRUQsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNyQixLQUFLLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQ3BDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMzRCxPQUFPLElBQUksQ0FBQztxQkFDZjtpQkFDSjthQUNKO1FBQ0wsQ0FBQztRQUNMLHNCQUFDO0lBQUQsQ0FBQyxBQWxPRCxJQWtPQztJQWxPWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGxldmVsVG9TdHIgPSB7IDYwOiAnZmF0YWwnLCA1MDogJ2Vycm9yJywgNDA6ICd3YXJuJywgMzA6ICdpbmZvJywgMjA6ICdkZWJ1ZycsIDEwOiAndHJhY2UnIH07XG5jb25zdCBzdHJUb0xldmVsID0geyAnZmF0YWwnOiA2MCwgJ2Vycm9yJzogNTAsICd3YXJuJzogNDAsICdpbmZvJzogMzAsICdkZWJ1Zyc6IDIwLCAndHJhY2UnOiAxMCB9O1xuXG5mdW5jdGlvbiBpc09iamVjdChvYmopIHtcbiAgICByZXR1cm4gb2JqICE9IG51bGxcbiAgICAgICAgJiYgdHlwZW9mIChvYmopID09PSAnb2JqZWN0J1xuICAgICAgICAmJiAhKG9iaiBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgICAmJiAhKG9iaiBpbnN0YW5jZW9mIERhdGUpXG4gICAgICAgICYmICEob2JqIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuXG50eXBlIExvZ09iamVjdCA9IHtcbiAgICBsZXZlbDogc3RyaW5nO1xuICAgIHRpbWU6IHN0cmluZztcbiAgICBtc2c6IHN0cmluZztcbiAgICBtb2R1bGU/OiBhbnk7XG4gICAgYWN0aXZpdHk/OiBhbnk7XG59O1xuXG5leHBvcnQgY2xhc3MgU3VwZXJ0eXBlTG9nZ2VyIHtcbiAgICBjb250ZXh0OiBhbnk7XG4gICAgZ3JhbnVsYXJMZXZlbHM6IGFueTtcbiAgICBsZXZlbDogYW55O1xuXG4gICAgLy8gZm9yIG92ZXJyaWRpbmdcbiAgICAvLyBzZW5kVG9Mb2c6IEZ1bmN0aW9uO1xuICAgIC8vIGZvcm1hdERhdGVUaW1lOiBGdW5jdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB7fTtcbiAgICAgICAgdGhpcy5ncmFudWxhckxldmVscyA9IHt9O1xuICAgICAgICB0aGlzLmxldmVsID0gJ2luZm8nO1xuICAgIH1cblxuXG4gICAgZmF0YWwoLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coNjAsIC4uLmRhdGEpO1xuICAgIH1cblxuICAgIGVycm9yKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDUwLCAuLi5kYXRhKTtcbiAgICB9XG5cbiAgICB3YXJuKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDQwLCAuLi5kYXRhKTtcbiAgICB9XG5cbiAgICBpbmZvKC4uLmRhdGE6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nKDMwLCAuLi5kYXRhKTtcbiAgICB9XG4gICAgZGVidWcoLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2coMjAsIC4uLmRhdGEpO1xuICAgIH1cbiAgICB0cmFjZSguLi5kYXRhOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZygxMCwgLi4uZGF0YSk7XG4gICAgfVxuXG4gICAgLy8gTG9nIGFsbCBhcmd1bWVudHMgYXNzdW1pbmcgdGhlIGZpcnN0IG9uZSBpcyBsZXZlbCBhbmQgdGhlIHNlY29uZCBvbmUgbWlnaHQgYmUgYW4gb2JqZWN0IChzaW1pbGFyIHRvIGJhbnlhbilcbiAgICBsb2cobGV2ZWw6IG51bWJlciwgLi4uZGF0YTogYW55W10pOiB2b2lkIHtcbiAgICAgICAgbGV0IG1zZyA9ICcnO1xuICAgICAgICBjb25zdCBvYmo6IExvZ09iamVjdCA9IHtcbiAgICAgICAgICAgIHRpbWU6IChuZXcgRGF0ZSgpKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgbXNnOiAnJyxcbiAgICAgICAgICAgIGxldmVsOiAnaW5mbycsIC8vZGVmYXVsdCBpbmZvXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMuY29udGV4dCkge1xuICAgICAgICAgICAgb2JqW3Byb3BdID0gdGhpcy5jb250ZXh0W3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50c1tpeF07XG4gICAgICAgICAgICBpZiAoaXggPT0gMCkge1xuICAgICAgICAgICAgICAgIG9iai5sZXZlbCA9IGFyZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGl4ID09IDEgJiYgaXNPYmplY3QoYXJnKSkgeyAvLyBlcnJvciB3aGVuIHdlIHRyeSB0byBsb2cgYW4gb2JqZWN0IHdpdGggcHJvcGVydHkgJ2xldmVsJ1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGVyIGluIGFyZykge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGVyXSA9IGFyZ1twcm9wZXJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZyArPSBgJHthcmd9IGA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2JqLm1zZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG9iai5tc2cgKz0gJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1zZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChvYmoubW9kdWxlICYmIG9iai5hY3Rpdml0eSkge1xuICAgICAgICAgICAgICAgIG9iai5tc2cgKz0gYCR7b2JqLm1vZHVsZX1bJHtvYmouYWN0aXZpdHl9XSAtIGA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9iai5tc2cgKz0gbXNnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iai5tb2R1bGUgJiYgb2JqLmFjdGl2aXR5KSB7XG4gICAgICAgICAgICBvYmoubXNnICs9IGAke29iai5tb2R1bGV9WyR7b2JqLmFjdGl2aXR5fV1gO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNFbmFibGVkKGxldmVsVG9TdHJbb2JqLmxldmVsXSwgb2JqKSkge1xuICAgICAgICAgICAgdGhpcy5zZW5kVG9Mb2cobGV2ZWxUb1N0cltvYmoubGV2ZWxdLCBvYmopO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnRDb250ZXh0KGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHRoZSBwcm9wZXJ0aWVzIGluIHRoZSBjb250ZXh0IGFuZCByZXR1cm4gYSBuZXcgb2JqZWN0IHRoYXQgaGFzIHRoZSBwcm9wZXJ0aWVzIG9ubHkgc28gdGhleSBjYW4gYmUgY2xlYXJlZFxuICAgIHNldENvbnRleHRQcm9wcyhjb250ZXh0KSB7XG4gICAgICAgIGNvbnN0IHJldmVyc2UgPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gY29udGV4dCkge1xuICAgICAgICAgICAgcmV2ZXJzZVtwcm9wXSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHRbcHJvcF0gPSBjb250ZXh0W3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldmVyc2U7XG4gICAgfVxuICAgIC8vIFBhcnNlIGxvZyBsZXZlbHMgc3VjaCBhcyB3YXJuLmFjdGl2aXR5XG4gICAgc2V0TGV2ZWwobGV2ZWwpIHtcbiAgICAgICAgdmFyIGxldmVscyA9IGxldmVsLnNwbGl0KCc7Jyk7XG5cbiAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IGxldmVscy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgIHZhciBsZXZlbGEgPSBsZXZlbHNbaXhdO1xuXG4gICAgICAgICAgICBpZiAobGV2ZWxhLm1hdGNoKC86LykpIHtcbiAgICAgICAgICAgICAgICBpZiAobGV2ZWxzW2l4XS5tYXRjaCgvKC4qKTooLiopLykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmFudWxhckxldmVsc1tSZWdFeHAuJDFdID0gdGhpcy5ncmFudWxhckxldmVsc1tSZWdFeHAuJDFdIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyYW51bGFyTGV2ZWxzW1JlZ0V4cC4kMV0gPSBSZWdFeHAuJDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxldmVsID0gbGV2ZWxzW2l4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxldmVsID0gbGV2ZWxhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFueSBwcm9wZXJ0aWVzIHJlY29yZGVkIGJ5IHNldENvbnRleHRcbiAgICBjbGVhckNvbnRleHRQcm9wcyhjb250ZXh0VG9DbGVhcikge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gY29udGV4dFRvQ2xlYXIpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNvbnRleHRbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgbG9nZ2VyIGFuZCBjb3B5IG92ZXIgaXQncyBjb250ZXh0XG4gICAgY3JlYXRlQ2hpbGRMb2dnZXIoY29udGV4dCk6IFN1cGVydHlwZUxvZ2dlciB7XG4gICAgICAgIGxldCBjaGlsZDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGhpcykge1xuICAgICAgICAgICAgY2hpbGRbcHJvcF0gPSB0aGlzW3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hpbGQuY29udGV4dCA9IGNvbnRleHQgfHwge307XG5cbiAgICAgICAgZm9yIChsZXQgcHJvcGVyIGluIHRoaXMuY29udGV4dCkge1xuICAgICAgICAgICAgY2hpbGQuY29udGV4dFtwcm9wZXJdID0gdGhpcy5jb250ZXh0W3Byb3Blcl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hpbGQgYXMgU3VwZXJ0eXBlTG9nZ2VyOyAvLyBiYWQgcHJhY3RpY2UgYnV0IHNob3VsZCBmaXhcbiAgICB9XG5cbiAgICBmb3JtYXREYXRlVGltZShkYXRlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGYoMiwgKGRhdGUuZ2V0TW9udGgoKSArIDEpLCAnLycpICsgZigyLCBkYXRlLmdldERhdGUoKSwgJy8nKSArIGYoNCwgZGF0ZS5nZXRGdWxsWWVhcigpLCAnICcpICtcbiAgICAgICAgICAgIGYoMiwgZGF0ZS5nZXRIb3VycygpLCAnOicpICsgZigyLCBkYXRlLmdldE1pbnV0ZXMoKSwgJzonKSArIGYoMiwgZGF0ZS5nZXRTZWNvbmRzKCksICc6JykgK1xuICAgICAgICAgICAgZigzLCBkYXRlLmdldE1pbGxpc2Vjb25kcygpKSArICcgR01UJyArICgwIC0gZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpIC8gNjApO1xuXG4gICAgICAgIGZ1bmN0aW9uIGYoeiwgZCwgcz8pIHtcbiAgICAgICAgICAgIHdoaWxlIChTdHJpbmcoZCkubGVuZ3RoIDwgeikge1xuICAgICAgICAgICAgICAgIGQgPSAnMCcgKyBkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZCArIChzIHx8ICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbmRUb0xvZyhsZXZlbCwganNvbikge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnByZXR0eVByaW50KGxldmVsLCBqc29uKSk7ICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICB9XG5cbiAgICBwcmV0dHlQcmludChsZXZlbCwganNvbikge1xuICAgICAgICBsZXQgc3BsaXQgPSB0aGlzLnNwbGl0KGpzb24sIHt0aW1lOiAxLCBtc2c6IDEsIGxldmVsOiAxLCBuYW1lOiAxfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0RGF0ZVRpbWUobmV3IERhdGUoanNvbi50aW1lKSkgKyAnOiAnICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXZlbC50b1VwcGVyQ2FzZSgpICsgJzogJyArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ29sb25JZlRva2VuKHNwbGl0WzFdLm5hbWUsICc6ICcpICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRDb2xvbklmVG9rZW4oc3BsaXRbMV0ubXNnLCAnOiAnKSArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHkoc3BsaXRbMF0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZENvbG9uSWZUb2tlbiAodG9rZW4sIGNvbG9uQW5kU3BhY2UpIHtcbiAgICAgICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbiArIGNvbG9uQW5kU3BhY2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHh5KGopIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIHZhciBzZXAgPSAnJztcblxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBqKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHNlcCArIHByb3AgKyAnPScgKyBKU09OLnN0cmluZ2lmeShqW3Byb3BdKTtcbiAgICAgICAgICAgICAgICBzZXAgPSAnICc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnKCcgKyBzdHIgKyAnKSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc3BsaXQoanNvbiwgcHJvcHMpOiBhbnlbXSB7XG4gICAgICAgIGNvbnN0IGEgPSB7fTtcbiAgICAgICAgY29uc3QgYiA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBqc29uKSB7XG4gICAgICAgICAgICAocHJvcHNbcHJvcF0gPyBiIDogYSlbcHJvcF0gPSBqc29uW3Byb3BdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFthLCBiXTtcbiAgICB9XG5cbiAgICAvLyBMb2dnaW5nIGlzIGVuYWJsZWQgaWYgZWl0aGVyIHRoZSBsZXZlbCB0aHJlc2hvbGQgaXMgbWV0IG9yIHRoZSBncmFudWxhciBsZXZlbCBtYXRjaGVzXG4gICAgcHJpdmF0ZSBpc0VuYWJsZWQobGV2ZWwsIG9iaikge1xuICAgICAgICBsZXZlbCA9IHN0clRvTGV2ZWxbbGV2ZWxdO1xuXG4gICAgICAgIGlmIChsZXZlbCA+PSBzdHJUb0xldmVsW3RoaXMubGV2ZWxdKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdyYW51bGFyTGV2ZWxzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBsZXZlbHIgaW4gdGhpcy5ncmFudWxhckxldmVscykge1xuICAgICAgICAgICAgICAgIGlmIChvYmpbbGV2ZWxyXSAmJiBvYmpbbGV2ZWxyXSA9PSB0aGlzLmdyYW51bGFyTGV2ZWxzW2xldmVscl0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSJdfQ==