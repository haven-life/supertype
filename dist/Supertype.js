(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./ObjectTemplate", "./serializer"], factory);
    }
})(function (require, exports) {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLG1EQUFnRDtJQUNoRCx5Q0FBMkM7SUFFM0MseUJBQXlCLFdBQVc7UUFDaEMsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sYUFBYSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRCxDQUFDO0lBS0Q7Ozs7O09BS0c7SUFFSDtRQWdESSxtQkFBWSxjQUErQjtZQUEvQiwrQkFBQSxFQUFBLGlCQUFpQiwrQkFBYztZQUN2QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRywwQkFBMEIsQ0FBQyxDQUFDO2FBQzFHO1lBRUQsNkRBQTZEO1lBQzdELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV0RSx5REFBeUQ7WUFDekQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDO1lBQzlCLE9BQU8sY0FBYyxFQUFFO2dCQUNuQixLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7b0JBQzlELGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDdEQ7Z0JBQ0QsY0FBYyxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUM7YUFDOUM7WUFFRCwwQ0FBMEM7WUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dCQUMzRCxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDckQ7WUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLGNBQWMsQ0FBQztZQUUvQixtR0FBbUc7WUFDbkcsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQXZFTSxnQ0FBc0IsR0FBN0IsVUFBOEIsSUFBWSxFQUFFLGNBQXNCO1lBQzlELCtDQUErQztRQUNuRCxDQUFDO1FBRU0sK0JBQXFCLEdBQTVCLFVBQTZCLHdCQUFrQztZQUMzRCwrQ0FBK0M7UUFDbkQsQ0FBQztRQUNNLDBCQUFnQixHQUF2QixVQUF3QixJQUFZO1lBQ2hDLCtDQUErQztRQUNuRCxDQUFDO1FBQ00sd0JBQWMsR0FBckIsVUFBc0IsSUFBWSxFQUFFLGNBQXNCO1lBQ3RELCtDQUErQztRQUNuRCxDQUFDO1FBQ00sdUJBQWEsR0FBcEI7WUFDSSwrQ0FBK0M7UUFDbkQsQ0FBQztRQUNELHdDQUFvQixHQUFwQjtZQUNJLCtDQUErQztZQUMvQyxPQUFPLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFDTSxrQkFBUSxHQUFmLFVBQWlCLElBQVksRUFBRSxRQUFpQjtZQUM1QywrQ0FBK0M7UUFFbkQsQ0FBQztRQUVNLGdCQUFNLEdBQWIsVUFBZSxRQUFhO1lBQ3hCLDJFQUEyRTtRQUMvRSxDQUFDO1FBNkNELGtDQUFjLEdBQWQsVUFBZSxFQUFHO1lBQ2QsT0FBTyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsaURBQTZCLEdBQTdCLFVBQThCLElBQUk7WUFDOUIsT0FBTywrQkFBYyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUNELDZDQUF5QixHQUF6QixVQUEwQixJQUFJO1lBQzFCLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFFdEUsSUFBSSxPQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsRUFBRTtnQkFDOUMsT0FBTyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzQztZQUNELE9BQU8sY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUNqQyxDQUFDO1FBQ0QsbURBQStCLEdBQS9CLFVBQWdDLElBQUk7WUFDaEMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUV0RSxJQUFJLE9BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEtBQUssVUFBVSxFQUFFO2dCQUNwRCxPQUFPLGNBQWMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2pEO1lBRUQsT0FBTyxjQUFjLENBQUMsWUFBWSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCw4QkFBVSxHQUFWLFVBQVcsT0FBTztZQUNkLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztZQUNmLE9BQU8sK0JBQWMsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsMEJBQU0sR0FBTixVQUFPLFFBQVE7WUFDWCwrQkFBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVELGtDQUFjLEdBQWQsVUFBZSxHQUFHO1lBQ2QsS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUU7Z0JBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUI7UUFDTCxDQUFDO1FBQ0QsNEJBQVEsR0FBUixVQUFTLElBQUk7WUFDVCxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBQ0QsOEJBQVUsR0FBVixVQUFXLElBQUk7WUFDWCxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0Qsb0NBQWdCLEdBQWhCLFVBQWlCLElBQUk7WUFDakIsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUNELGdDQUFZLEdBQVosVUFBYSxFQUFHO1lBQ1osT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLENBQUM7UUFDTCxnQkFBQztJQUFELENBQUMsQUEvSEQsSUErSEM7SUEvSFksOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge09iamVjdFRlbXBsYXRlfSBmcm9tICcuL09iamVjdFRlbXBsYXRlJztcbmltcG9ydCAqIGFzIHNlcmlhbGl6ZXIgZnJvbSAnLi9zZXJpYWxpemVyJztcblxuZnVuY3Rpb24gY29uc3RydWN0b3JOYW1lKGNvbnN0cnVjdG9yKSB7XG4gICAgdmFyIG5hbWVkRnVuY3Rpb24gPSBjb25zdHJ1Y3Rvci50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvbiAoW14oXSopLyk7XG4gICAgcmV0dXJuIG5hbWVkRnVuY3Rpb24gPyBuYW1lZEZ1bmN0aW9uWzFdIDogbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0YWJsZSA9IG5ldyAoLi4uYXJnczogYW55W10pID0+IHt9O1xuXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgdHlwZXNjcmlwdCBjbGFzc2VzLiAgSXQgbXVzdFxuICogSXQgd2lsbCBpbmplY3QgbWVtYmVycyBpbnRvIHRoZSBvYmplY3QgZnJvbSBib3RoIHRoZSB0ZW1wbGF0ZSBhbmQgb2JqZWN0VGVtcGxhdGVcbiAqIEBwYXJhbSB7T2JqZWN0VGVtcGxhdGV9IC0gb3RoZXIgbGF5ZXJzIGNhbiBwYXNzIGluIHRoZWlyIG93biBvYmplY3QgdGVtcGxhdGUgKHRoaXMgaXMgdGhlIG9iamVjdCBub3QgT2JqZWN0VGVtcGxhdGUpXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgb2JqZWN0IGl0c2VsZlxuICovXG5cbmV4cG9ydCBjbGFzcyBTdXBlcnR5cGUge1xuICAgIF9fdGVtcGxhdGVfXzogYW55O1xuICAgIGFtb3JwaGljIDogdHlwZW9mIE9iamVjdFRlbXBsYXRlO1xuXG4gICAgc3RhdGljIGFtb3JwaGljQ3JlYXRlUHJvcGVydHkocHJvcDogU3RyaW5nLCBkZWZpbmVQcm9wZXJ0eTogT2JqZWN0KSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIHRoZSBkZWNvcmF0b3IgQHN1cGVydHlwZUNsYXNzXG4gICAgfVxuXG4gICAgc3RhdGljIGFtb3JwaGljR2V0UHJvcGVydGllcyhpbmNsdWRlVmlydHVhbFByb3BlcnRpZXM/OiBib29sZWFuKTphbnkge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIH1cbiAgICBzdGF0aWMgYW1vcnBoaWNGcm9tSlNPTihqc29uOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KHByb3A6IFN0cmluZywgZGVmaW5lUHJvcGVydHk6IE9iamVjdCkge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0UHJvcGVydGllcygpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gdGhlIGRlY29yYXRvciBAc3VwZXJ0eXBlQ2xhc3NcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRDbGFzc05hbWUgKCkgOiBzdHJpbmcge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTiAoanNvbjogc3RyaW5nLCBpZFByZWZpeD86IHN0cmluZykge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiB0aGUgZGVjb3JhdG9yIEBzdXBlcnR5cGVDbGFzc1xuICAgIFxuICAgIH1cblxuICAgIHN0YXRpYyBpbmplY3QgKGluamVjdG9yOiBhbnkpIHtcbiAgICAgICAgLy8gSW1wbGVtZW50ZWQgaW4gTGluZSAxMjgsIG9mIE9iamVjdFRlbXBsYXRlLnRzIChzdGF0aWMgcGVyZm9ybUluamVjdGlvbnMpXG4gICAgfVxuXG4gICAgc3RhdGljIGFtb3JwaGljUHJvcGVydGllczogYW55O1xuICAgIHN0YXRpYyBhbW9ycGhpY0NoaWxkQ2xhc3NlczogQXJyYXk8Q29uc3RydWN0YWJsZT47XG4gICAgc3RhdGljIGFtb3JwaGljUGFyZW50Q2xhc3M6IENvbnN0cnVjdGFibGU7XG4gICAgc3RhdGljIGFtb3JwaGljQ2xhc3NOYW1lIDogc3RyaW5nO1xuICAgIHN0YXRpYyBhbW9ycGhpY1N0YXRpYyA6IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcblxuICAgIC8vIE9iamVjdCBtZW1iZXJzXG4gICAgX19pZF9fOiBTdHJpbmc7XG4gICAgYW1vcnBoaWNMZWF2ZUVtcHR5OiBib29sZWFuO1xuXG4gICAgLy8gRGVwcmVjYXRlZCBsZWdhY3kgbmFtaW5nXG4gICAgc3RhdGljIF9fY2hpbGRyZW5fXzogQXJyYXk8Q29uc3RydWN0YWJsZT47XG4gICAgc3RhdGljIF9fcGFyZW50X186IENvbnN0cnVjdGFibGU7XG4gICAgYW1vcnBoaWNDbGFzcyA6IGFueVxuXG4gICAgY29uc3RydWN0b3Iob2JqZWN0VGVtcGxhdGUgPSBPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLl9fdGVtcGxhdGVfXztcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGNvbnN0cnVjdG9yTmFtZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3IpICsgJyBtaXNzaW5nIEBzdXBlcnR5cGVDbGFzcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVsbCBjb25zdHJ1Y3RvciBub3QgdG8gZXhlY3V0ZSBhcyB0aGlzIGlzIGFuIGVtcHR5IG9iamVjdFxuICAgICAgICB0aGlzLmFtb3JwaGljTGVhdmVFbXB0eSA9IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZSk7XG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9ucyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBtYXkgdXNlXG4gICAgICAgIHZhciB0YXJnZXRUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICB3aGlsZSAodGFyZ2V0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldFRlbXBsYXRlID0gdGFyZ2V0VGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zIHVzZWQgYnkgdGhlIGZyYW1ld29ya1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tqXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbW9ycGhpYyA9IG9iamVjdFRlbXBsYXRlO1xuXG4gICAgICAgIC8vQFRPRE86IGZpbGwgdGhlIHByb3BlcnRpZXMgb2YgJ3RoaXMnIGluPyBkbyBJIG5lZWQgdGhpcyBhZnRlciBkZWxldGluZyB0aGUgY2FsbGVyQ29udGV4dCBhcHByb2FjaFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgYW1vcnBoaWNUb0pTT04oY2I/KXtcbiAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZXIudG9KU09OU3RyaW5nKHRoaXMsIGNiKTtcbiAgICB9IFxuXG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eURlZmluaXRpb24ocHJvcCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRoaXMuX190ZW1wbGF0ZV9fKTtcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eVZhbHVlcyhwcm9wKSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcbiAgICBcbiAgICAgICAgaWYgKHR5cGVvZihkZWZpbmVQcm9wZXJ0eS52YWx1ZXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcztcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcbiAgICBcbiAgICAgICAgaWYgKHR5cGVvZihkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucztcbiAgICB9XG5cbiAgICBjcmVhdGVDb3B5KGNyZWF0b3IpIHtcbiAgICAgICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5mcm9tUE9KTyhvYmosIG9iai5fX3RlbXBsYXRlX18sIG51bGwsIG51bGwsIHVuZGVmaW5lZCwgbnVsbCwgbnVsbCwgY3JlYXRvcik7XG4gICAgfVxuXG4gICAgaW5qZWN0KGluamVjdG9yKSB7XG4gICAgICAgIE9iamVjdFRlbXBsYXRlLmluamVjdCh0aGlzLCBpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgY29weVByb3BlcnRpZXMob2JqKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9fcHJvcF9fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eURlZmluaXRpb24ocHJvcCk7XG4gICAgfVxuICAgIF9fdmFsdWVzX18ocHJvcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY0dldFByb3BlcnR5VmFsdWVzKHByb3ApO1xuICAgIH1cbiAgICBfX2Rlc2NyaXB0aW9uc19fKHByb3Ape1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY0dldFByb3BlcnR5RGVzY3JpcHRpb25zKHByb3ApO1xuICAgIH1cbiAgICB0b0pTT05TdHJpbmcoY2I/KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFtb3JwaGljVG9KU09OKGNiKVxuICAgIH1cbn0iXX0=