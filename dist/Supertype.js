"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ObjectTemplate_1 = require("./ObjectTemplate");
var serializer = require("./serializer");
function constructorName(constructor) {
    var namedFunction = constructor.toString().match(/function ([^(]*)/);
    return namedFunction ? namedFunction[1] : null;
}
/**
 * This is the base class for typescript classes.
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
        // https://github.com/haven-life/supertype/issues/7
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUFnRDtBQUNoRCx5Q0FBMkM7QUFFM0MseUJBQXlCLFdBQVc7SUFDaEMsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3JFLE9BQU8sYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNuRCxDQUFDO0FBS0Q7Ozs7O0dBS0c7QUFFSDtJQWdESSxtQkFBWSxjQUErQjtRQUEvQiwrQkFBQSxFQUFBLGlCQUFpQiwrQkFBYztRQUN2QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLENBQUM7U0FDMUc7UUFFRCw2REFBNkQ7UUFDN0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGNBQWMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXRFLHlEQUF5RDtRQUN6RCxJQUFJLGNBQWMsR0FBRyxRQUFRLENBQUM7UUFDOUIsT0FBTyxjQUFjLEVBQUU7WUFDbkIsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUM5RCxjQUFjLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDdEQ7WUFDRCxjQUFjLEdBQUcsY0FBYyxD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MUMsQ0FBQztJQUVELGtDQUFjLEdBQWQsVUFBZSxHQUFHO1FBQ2QsS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUU7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQjtJQUNMLENBQUM7SUFDRCw0QkFBUSxHQUFSLFVBQVMsSUFBSTtRQUNULE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFDRCw4QkFBVSxHQUFWLFVBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFDRCxvQ0FBZ0IsR0FBaEIsVUFBaUIsSUFBSTtRQUNqQixPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBQ0QsZ0NBQVksR0FBWixVQUFhLEVBQUc7UUFDWixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbEMsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQWhJRCxJQWdJQztBQWhJWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7T2JqZWN0VGVtcGxhdGV9IGZyb20gJy4vT2JqZWN0VGVtcGxhdGUnO1xuaW1wb3J0ICogYXMgc2VyaWFsaXplciBmcm9tICcuL3NlcmlhbGl6ZXInO1xuXG5mdW5jdGlvbiBjb25zdHJ1Y3Rvck5hbWUoY29uc3RydWN0b3IpIHtcbiAgICB2YXIgbmFtZWRGdW5jdGlvbiA9IGNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXihdKikvKTtcbiAgICByZXR1cm4gbmFtZWRGdW5jdGlvbiA/IG5hbWVkRnVuY3Rpb25bMV0gOiBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RhYmxlID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4ge307XG5cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBiYXNlIGNsYXNzIGZvciB0eXBlc2NyaXB0IGNsYXNzZXMuIFxuICogSXQgd2lsbCBpbmplY3QgbWVtYmVycyBpbnRvIHRoZSBvYmplY3QgZnJvbSBib3RoIHRoZSB0ZW1wbGF0ZSBhbmQgb2JqZWN0VGVtcGxhdGVcbiAqIEBwYXJhbSB7T2JqZWN0VGVtcGxhdGV9IC0gb3RoZXIgbGF5ZXJzIGNhbiBwYXNzIGluIHRoZWlyIG93biBvYmplY3QgdGVtcGxhdGUgKHRoaXMgaXMgdGhlIG9iamVjdCBub3QgT2JqZWN0VGVtcGxhdGUpXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgb2JqZWN0IGl0c2VsZlxuICovXG5cbmV4cG9ydCBjbGFzcyBTdXBlcnR5cGUge1xuICAgIF9fdGVtcGxhdGVfXzogYW55O1xuICAgIGFtb3JwaGljIDogdHlwZW9mIE9iamVjdFRlbXBsYXRlO1xuXG4gICAgc3RhdGljIGFtb3JwaGljQ3JlYXRlUHJvcGVydHkocHJvcDogU3RyaW5nLCBkZWZpbmVQcm9wZXJ0eTogT2JqZWN0KSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIHRoZSBkZWNvcmF0b3IgQHN1cGVydHlwZUNsYXNzXG4gICAgfVxuXG4gICAgc3RhdGljIGFtb3JwaGljR2V0UHJvcGVydGllcyhpbmNsdWRlVmlydHVhbFByb3BlcnRpZXM/OiBib29sZWFuKTphbnkge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIH1cbiAgICBzdGF0aWMgYW1vcnBoaWNGcm9tSlNPTihqc29uOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KHByb3A6IFN0cmluZywgZGVmaW5lUHJvcGVydHk6IE9iamVjdCkge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0UHJvcGVydGllcygpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRDbGFzc05hbWUgKCkgOiBzdHJpbmcge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTiAoanNvbjogc3RyaW5nLCBpZFByZWZpeD86IHN0cmluZykge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIFxuICAgIH1cblxuICAgIHN0YXRpYyBpbmplY3QgKGluamVjdG9yOiBhbnkpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gTGluZSAxMjgsIG9mIE9iamVjdFRlbXBsYXRlLnRzIChzdGF0aWMgcGVyZm9ybUluamVjdGlvbnMpXG4gICAgfVxuXG4gICAgc3RhdGljIGFtb3JwaGljUHJvcGVydGllczogYW55O1xuICAgIHN0YXRpYyBhbW9ycGhpY0NoaWxkQ2xhc3NlczogQXJyYXk8Q29uc3RydWN0YWJsZT47XG4gICAgc3RhdGljIGFtb3JwaGljUGFyZW50Q2xhc3M6IENvbnN0cnVjdGFibGU7XG4gICAgc3RhdGljIGFtb3JwaGljQ2xhc3NOYW1lIDogc3RyaW5nO1xuICAgIHN0YXRpYyBhbW9ycGhpY1N0YXRpYyA6IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcblxuICAgIC8vIE9iamVjdCBtZW1iZXJzXG4gICAgX19pZF9fOiBTdHJpbmc7XG4gICAgYW1vcnBoaWNMZWF2ZUVtcHR5OiBib29sZWFuO1xuXG4gICAgLy8gRGVwcmVjYXRlZCBsZWdhY3kgbmFtaW5nXG4gICAgc3RhdGljIF9fY2hpbGRyZW5fXzogQXJyYXk8Q29uc3RydWN0YWJsZT47XG4gICAgc3RhdGljIF9fcGFyZW50X186IENvbnN0cnVjdGFibGU7XG4gICAgYW1vcnBoaWNDbGFzcyA6IGFueVxuXG4gICAgY29uc3RydWN0b3Iob2JqZWN0VGVtcGxhdGUgPSBPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLl9fdGVtcGxhdGVfXztcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGNvbnN0cnVjdG9yTmFtZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3IpICsgJyBtaXNzaW5nIEBzdXBlcnR5cGVDbGFzcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVsbCBjb25zdHJ1Y3RvciBub3QgdG8gZXhlY3V0ZSBhcyB0aGlzIGlzIGFuIGVtcHR5IG9iamVjdFxuICAgICAgICB0aGlzLmFtb3JwaGljTGVhdmVFbXB0eSA9IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZSk7XG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9ucyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBtYXkgdXNlXG4gICAgICAgIHZhciB0YXJnZXRUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICB3aGlsZSAodGFyZ2V0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldFRlbXBsYXRlID0gdGFyZ2V0VGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zIHVzZWQgYnkgdGhlIGZyYW1ld29ya1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tqXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbW9ycGhpYyA9IG9iamVjdFRlbXBsYXRlO1xuXG4gICAgICAgIC8vQFRPRE86IGZpbGwgdGhlIHByb3BlcnRpZXMgb2YgJ3RoaXMnIGluPyBkbyBJIG5lZWQgdGhpcyBhZnRlciBkZWxldGluZyB0aGUgY2FsbGVyQ29udGV4dCBhcHByb2FjaFxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaGF2ZW4tbGlmZS9zdXBlcnR5cGUvaXNzdWVzLzdcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGFtb3JwaGljVG9KU09OKGNiPyl7XG4gICAgICAgIHJldHVybiBzZXJpYWxpemVyLnRvSlNPTlN0cmluZyh0aGlzLCBjYik7XG4gICAgfSBcblxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlEZWZpbml0aW9uKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0aGlzLl9fdGVtcGxhdGVfXyk7XG4gICAgfVxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlWYWx1ZXMocHJvcCkge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG4gICAgXG4gICAgICAgIGlmICh0eXBlb2YoZGVmaW5lUHJvcGVydHkudmFsdWVzKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcy5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXM7XG4gICAgfVxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlEZXNjcmlwdGlvbnMocHJvcCkge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG4gICAgXG4gICAgICAgIGlmICh0eXBlb2YoZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucy5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnM7XG4gICAgfVxuXG4gICAgY3JlYXRlQ29weShjcmVhdG9yKSB7XG4gICAgICAgIHZhciBvYmogPSB0aGlzO1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ob2JqLCBvYmouX190ZW1wbGF0ZV9fLCBudWxsLCBudWxsLCB1bmRlZmluZWQsIG51bGwsIG51bGwsIGNyZWF0b3IpO1xuICAgIH1cblxuICAgIGluamVjdChpbmplY3Rvcikge1xuICAgICAgICBPYmplY3RUZW1wbGF0ZS5pbmplY3QodGhpcywgaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgdGhpc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfX3Byb3BfXyhwcm9wKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFtb3JwaGljR2V0UHJvcGVydHlEZWZpbml0aW9uKHByb3ApO1xuICAgIH1cbiAgICBfX3ZhbHVlc19fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eVZhbHVlcyhwcm9wKTtcbiAgICB9XG4gICAgX19kZXNjcmlwdGlvbnNfXyhwcm9wKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKTtcbiAgICB9XG4gICAgdG9KU09OU3RyaW5nKGNiPykge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY1RvSlNPTihjYilcbiAgICB9XG59Il19