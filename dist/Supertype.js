"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ObjectTemplate_1 = require("./ObjectTemplate");
var serializer = require("./serializer");
function constructorName(constructor) {
    var namedFunction = constructor.toString().match(/function ([^(]*)/);
    return namedFunction ? namedFunction[1] : null;
}
/**
 * This is the base class for typescript classes.  It must
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */
var Supertype = /** @class */ (function () {
    function Supertype(objectTemplate) {
        if (objectTemplate === void 0) { objectTemplate = ObjectTemplate_1.ObjectTemplate; }
        var template = this.__template__;
        if (!template) {
            throw new Error(constructorName(Object.getPrototypeOf(this).constructor) + ' missing @supertypeClass');
        }
        // Tell constructor not to execute as this is an empty object
        this.amorphicLeaveEmpty = objectTemplate._stashObject(this, template);
        // Template level injections that the application may use
        var targetTemplate = template;
        while (targetTemplate) {
            for (var ix = 0; ix < targetTemplate.__injections__.length; ++ix) {
                targetTemplate.__injections__[ix].call(this, this);
            }
            targetTemplate = targetTemplate.__parent__;
        }
        // Global injections used by the framework
        for (var j = 0; j < objectTemplate.__injections__.length; ++j) {
            objectTemplate.__injections__[j].call(this, this);
        }
        this.amorphic = objectTemplate;
        //@TODO: fill the properties of 'this' in? do I need this after deleting the callerContext approach
        return this;
    }
    Supertype.amorphicCreateProperty = function (prop, defineProperty) {
        // Implemented in the decorator @supertypeClass
    };
    Supertype.amorphicGetProperties = function (includeVirtualProperties) {
        // Implemented in the decorator @supertypeClass
    };
    Supertype.amorphicFromJSON = function (json) {
        // Implemented in the decorator @supertypeClass
    };
    Supertype.createProperty = function (prop, defineProperty) {
        // Implemented in the decorator @supertypeClass
    };
    Supertype.getProperties = function () {
        // Implemented in the decorator @supertypeClass
    };
    Supertype.prototype.amorphicGetClassName = function () {
        // Implemented in the decorator @supertypeClass
        return '';
    };
    Supertype.fromJSON = function (json, idPrefix) {
        // Implemented in the decorator @supertypeClass
    };
    Supertype.inject = function (injector) {
        // Implemented in Line 128, of ObjectTemplate.ts (static performInjections)
    };
    Supertype.prototype.amorphicToJSON = function (cb) {
        return serializer.toJSONString(this, cb);
    };
    Supertype.prototype.amorphicGetPropertyDefinition = function (prop) {
        return ObjectTemplate_1.ObjectTemplate._getDefineProperty(prop, this.__template__);
    };
    Supertype.prototype.amorphicGetPropertyValues = function (prop) {
        var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);
        if (typeof (defineProperty.values) === 'function') {
            return defineProperty.values.call(this);
        }
        return defineProperty.values;
    };
    Supertype.prototype.amorphicGetPropertyDescriptions = function (prop) {
        var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);
        if (typeof (defineProperty.descriptions) === 'function') {
            return defineProperty.descriptions.call(this);
        }
        return defineProperty.descriptions;
    };
    Supertype.prototype.createCopy = function (creator) {
        var obj = this;
        return ObjectTemplate_1.ObjectTemplate.fromPOJO(obj, obj.__template__, null, null, undefined, null, null, creator);
    };
    Supertype.prototype.inject = function (injector) {
        ObjectTemplate_1.ObjectTemplate.inject(this, injector);
    };
    Supertype.prototype.copyProperties = function (obj) {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    };
    Supertype.prototype.__prop__ = function (prop) {
        return this.amorphicGetPropertyDefinition(prop);
    };
    Supertype.prototype.__values__ = function (prop) {
        return this.amorphicGetPropertyValues(prop);
    };
    Supertype.prototype.__descriptions__ = function (prop) {
        return this.amorphicGetPropertyDescriptions(prop);
    };
    Supertype.prototype.toJSONString = function (cb) {
        return this.amorphicToJSON(cb);
    };
    return Supertype;
}());
exports.Supertype = Supertype;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUFnRDtBQUNoRCx5Q0FBMkM7QUFFM0MseUJBQXlCLFdBQVc7SUFDaEMsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3JFLE9BQU8sYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNuRCxDQUFDO0FBS0Q7Ozs7O0dBS0c7QUFFSDtJQWdESSxtQkFBWSxjQUErQjtRQUEvQiwrQkFBQSxFQUFBLGlCQUFpQiwrQkFBYztRQUN2QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLENBQUM7U0FDMUc7UUFFRCw2REFBNkQ7UUFDN0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGNBQWMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXRFLHlEQUF5RDtRQUN6RCxJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUM7UUFDOUIsT0FBTyxjQUFjLEVBQUU7WUFDbkIsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUM5RCxjQUFjLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDdEQ7WUFDRCxjQUFjLEdBQUcsY0FBYyxD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a0NBQWMsR0FBZCxVQUFlLEdBQUc7UUFDZCxLQUFLLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFCO0lBQ0wsQ0FBQztJQUNELDRCQUFRLEdBQVIsVUFBUyxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUNELDhCQUFVLEdBQVYsVUFBVyxJQUFJO1FBQ1gsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUNELG9DQUFnQixHQUFoQixVQUFpQixJQUFJO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFDRCxnQ0FBWSxHQUFaLFVBQWEsRUFBRztRQUNaLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNsQyxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBL0hELElBK0hDO0FBL0hZLDhCQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtPYmplY3RUZW1wbGF0ZX0gZnJvbSAnLi9PYmplY3RUZW1wbGF0ZSc7XG5pbXBvcnQgKiBhcyBzZXJpYWxpemVyIGZyb20gJy4vc2VyaWFsaXplcic7XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdG9yTmFtZShjb25zdHJ1Y3Rvcikge1xuICAgIHZhciBuYW1lZEZ1bmN0aW9uID0gY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvZnVuY3Rpb24gKFteKF0qKS8pO1xuICAgIHJldHVybiBuYW1lZEZ1bmN0aW9uID8gbmFtZWRGdW5jdGlvblsxXSA6IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIENvbnN0cnVjdGFibGUgPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiB7fTtcblxuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIHR5cGVzY3JpcHQgY2xhc3Nlcy4gIEl0IG11c3RcbiAqIEl0IHdpbGwgaW5qZWN0IG1lbWJlcnMgaW50byB0aGUgb2JqZWN0IGZyb20gYm90aCB0aGUgdGVtcGxhdGUgYW5kIG9iamVjdFRlbXBsYXRlXG4gKiBAcGFyYW0ge09iamVjdFRlbXBsYXRlfSAtIG90aGVyIGxheWVycyBjYW4gcGFzcyBpbiB0aGVpciBvd24gb2JqZWN0IHRlbXBsYXRlICh0aGlzIGlzIHRoZSBvYmplY3Qgbm90IE9iamVjdFRlbXBsYXRlKVxuICogQHJldHVybnMge09iamVjdH0gdGhlIG9iamVjdCBpdHNlbGZcbiAqL1xuXG5leHBvcnQgY2xhc3MgU3VwZXJ0eXBlIHtcbiAgICBfX3RlbXBsYXRlX186IGFueTtcbiAgICBhbW9ycGhpYyA6IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcblxuICAgIHN0YXRpYyBhbW9ycGhpY0NyZWF0ZVByb3BlcnR5KHByb3A6IFN0cmluZywgZGVmaW5lUHJvcGVydHk6IE9iamVjdCkge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIH1cblxuICAgIHN0YXRpYyBhbW9ycGhpY0dldFByb3BlcnRpZXMoaW5jbHVkZVZpcnR1YWxQcm9wZXJ0aWVzPzogYm9vbGVhbik6YW55IHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICB9XG4gICAgc3RhdGljIGFtb3JwaGljRnJvbUpTT04oanNvbjogc3RyaW5nKSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIHRoZSBkZWNvcmF0b3IgQHN1cGVydHlwZUNsYXNzXG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVQcm9wZXJ0eShwcm9wOiBTdHJpbmcsIGRlZmluZVByb3BlcnR5OiBPYmplY3QpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICB9XG4gICAgc3RhdGljIGdldFByb3BlcnRpZXMoKSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIHRoZSBkZWNvcmF0b3IgQHN1cGVydHlwZUNsYXNzXG4gICAgfVxuICAgIGFtb3JwaGljR2V0Q2xhc3NOYW1lICgpIDogc3RyaW5nIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBzdGF0aWMgZnJvbUpTT04gKGpzb246IHN0cmluZywgaWRQcmVmaXg/OiBzdHJpbmcpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICBcbiAgICB9XG5cbiAgICBzdGF0aWMgaW5qZWN0IChpbmplY3RvcjogYW55KSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIExpbmUgMTI4LCBvZiBPYmplY3RUZW1wbGF0ZS50cyAoc3RhdGljIHBlcmZvcm1JbmplY3Rpb25zKVxuICAgIH1cblxuICAgIHN0YXRpYyBhbW9ycGhpY1Byb3BlcnRpZXM6IGFueTtcbiAgICBzdGF0aWMgYW1vcnBoaWNDaGlsZENsYXNzZXM6IEFycmF5PENvbnN0cnVjdGFibGU+O1xuICAgIHN0YXRpYyBhbW9ycGhpY1BhcmVudENsYXNzOiBDb25zdHJ1Y3RhYmxlO1xuICAgIHN0YXRpYyBhbW9ycGhpY0NsYXNzTmFtZSA6IHN0cmluZztcbiAgICBzdGF0aWMgYW1vcnBoaWNTdGF0aWMgOiB0eXBlb2YgT2JqZWN0VGVtcGxhdGU7XG5cbiAgICAvLyBPYmplY3QgbWVtYmVyc1xuICAgIF9faWRfXzogU3RyaW5nO1xuICAgIGFtb3JwaGljTGVhdmVFbXB0eTogYm9vbGVhbjtcblxuICAgIC8vIERlcHJlY2F0ZWQgbGVnYWN5IG5hbWluZ1xuICAgIHN0YXRpYyBfX2NoaWxkcmVuX186IEFycmF5PENvbnN0cnVjdGFibGU+O1xuICAgIHN0YXRpYyBfX3BhcmVudF9fOiBDb25zdHJ1Y3RhYmxlO1xuICAgIGFtb3JwaGljQ2xhc3MgOiBhbnlcblxuICAgIGNvbnN0cnVjdG9yKG9iamVjdFRlbXBsYXRlID0gT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlX187XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihjb25zdHJ1Y3Rvck5hbWUoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yKSArICcgbWlzc2luZyBAc3VwZXJ0eXBlQ2xhc3MnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlbGwgY29uc3RydWN0b3Igbm90IHRvIGV4ZWN1dGUgYXMgdGhpcyBpcyBhbiBlbXB0eSBvYmplY3RcbiAgICAgICAgdGhpcy5hbW9ycGhpY0xlYXZlRW1wdHkgPSBvYmplY3RUZW1wbGF0ZS5fc3Rhc2hPYmplY3QodGhpcywgdGVtcGxhdGUpO1xuXG4gICAgICAgIC8vIFRlbXBsYXRlIGxldmVsIGluamVjdGlvbnMgdGhhdCB0aGUgYXBwbGljYXRpb24gbWF5IHVzZVxuICAgICAgICB2YXIgdGFyZ2V0VGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgd2hpbGUgKHRhcmdldFRlbXBsYXRlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgdGFyZ2V0VGVtcGxhdGUuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0VGVtcGxhdGUuX19pbmplY3Rpb25zX19baXhdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXJnZXRUZW1wbGF0ZSA9IHRhcmdldFRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iYWwgaW5qZWN0aW9ucyB1c2VkIGJ5IHRoZSBmcmFtZXdvcmtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX19bal0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYW1vcnBoaWMgPSBvYmplY3RUZW1wbGF0ZTtcblxuICAgICAgICAvL0BUT0RPOiBmaWxsIHRoZSBwcm9wZXJ0aWVzIG9mICd0aGlzJyBpbj8gZG8gSSBuZWVkIHRoaXMgYWZ0ZXIgZGVsZXRpbmcgdGhlIGNhbGxlckNvbnRleHQgYXBwcm9hY2hcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGFtb3JwaGljVG9KU09OKGNiPyl7XG4gICAgICAgIHJldHVybiBzZXJpYWxpemVyLnRvSlNPTlN0cmluZyh0aGlzLCBjYik7XG4gICAgfSBcblxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlEZWZpbml0aW9uKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0aGlzLl9fdGVtcGxhdGVfXyk7XG4gICAgfVxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlWYWx1ZXMocHJvcCkge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG4gICAgXG4gICAgICAgIGlmICh0eXBlb2YoZGVmaW5lUHJvcGVydHkudmFsdWVzKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcy5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXM7XG4gICAgfVxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlEZXNjcmlwdGlvbnMocHJvcCkge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG4gICAgXG4gICAgICAgIGlmICh0eXBlb2YoZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucy5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnM7XG4gICAgfVxuXG4gICAgY3JlYXRlQ29weShjcmVhdG9yKSB7XG4gICAgICAgIHZhciBvYmogPSB0aGlzO1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ob2JqLCBvYmouX190ZW1wbGF0ZV9fLCBudWxsLCBudWxsLCB1bmRlZmluZWQsIG51bGwsIG51bGwsIGNyZWF0b3IpO1xuICAgIH1cblxuICAgIGluamVjdChpbmplY3Rvcikge1xuICAgICAgICBPYmplY3RUZW1wbGF0ZS5pbmplY3QodGhpcywgaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgdGhpc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfX3Byb3BfXyhwcm9wKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFtb3JwaGljR2V0UHJvcGVydHlEZWZpbml0aW9uKHByb3ApO1xuICAgIH1cbiAgICBfX3ZhbHVlc19fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eVZhbHVlcyhwcm9wKTtcbiAgICB9XG4gICAgX19kZXNjcmlwdGlvbnNfXyhwcm9wKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKTtcbiAgICB9XG4gICAgdG9KU09OU3RyaW5nKGNiPykge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY1RvSlNPTihjYilcbiAgICB9XG59Il19