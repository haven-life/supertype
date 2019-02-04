"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ObjectTemplate_1 = require("./ObjectTemplate");
var serializer = require("./serializer");
var UtilityFunctions_1 = require("./UtilityFunctions");
/**
 * This is the base class for typescript classes.
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */
var Supertype = /** @class */ (function () {
    function Supertype(objectTemplate) {
        if (objectTemplate === void 0) { objectTemplate = ObjectTemplate_1.ObjectTemplate; }
        this.__template__ = this.constructor;
        this.amorphicClass = this.constructor;
        var template = this.__template__;
        if (!template) {
            throw new Error(UtilityFunctions_1.UtilityFunctions.constructorName(Object.getPrototypeOf(this).constructor) + ' missing @supertypeClass');
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
        if (this.__exceptions__) {
            objectTemplate.__exceptions__ = objectTemplate.__exceptions__ || [];
            for (var exceptionKey in this.__exceptions__) {
                objectTemplate.__exceptions__.push({
                    func: this.__exceptions__[exceptionKey],
                    class: UtilityFunctions_1.UtilityFunctions.getName,
                    prop: exceptionKey
                });
            }
        }
        //@TODO: fill the properties of 'this' in? do I need this after deleting the callerContext approach
        // https://github.com/haven-life/supertype/issues/7
        return this;
    }
    // Deprecated legacy naming
    Supertype.amorphicCreateProperty = function (prop, defineProperty) {
        var _this = this;
        if (defineProperty.body) {
            this.prototype[prop] = ObjectTemplate_1.ObjectTemplate._setupFunction(prop, defineProperty.body, defineProperty.on, defineProperty.validate);
        }
        else {
            this.prototype.__amorphicprops__[prop] = defineProperty;
            if (typeof defineProperty.value in ['string', 'number'] || defineProperty.value == null) {
                Object.defineProperty(this.prototype, prop, { enumerable: true, writable: true, value: defineProperty.value });
            }
            else {
                Object.defineProperty(this.prototype, prop, {
                    enumerable: true,
                    get: function () {
                        if (!_this['__' + prop]) {
                            _this['__' + prop] =
                                ObjectTemplate_1.ObjectTemplate.clone(defineProperty.value, defineProperty.of || defineProperty.type || null);
                        }
                        return _this['__' + prop];
                    },
                    set: function (value) {
                        _this['__' + prop] = value;
                    }
                });
            }
        }
    };
    Object.defineProperty(Supertype, "amorphicClassName", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getName(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Supertype, "amorphicChildClasses", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getChildren(this, this.__objectTemplate__);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Supertype, "amorphicParentClass", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getParent(this, this.__objectTemplate__);
        },
        enumerable: true,
        configurable: true
    });
    Supertype.amorphicGetProperties = function (includeVirtualProperties) {
        return ObjectTemplate_1.ObjectTemplate._getDefineProperties(this, undefined, includeVirtualProperties);
    };
    Object.defineProperty(Supertype, "amorphicProperties", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.defineProperties(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Supertype, "amorphicStatic", {
        get: function () {
            return this.__objectTemplate__;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Legacy
     *
     * @static
     * @param {string} prop
     * @param {Object} defineProperty
     * @memberof Supertype
     */
    Supertype.createProperty = function (prop, defineProperty) {
        var _this = this;
        if (defineProperty.body) {
            this.prototype[prop] = ObjectTemplate_1.ObjectTemplate._setupFunction(prop, defineProperty.body, defineProperty.on, defineProperty.validate);
        }
        else {
            this.prototype.__amorphicprops__[prop] = defineProperty;
            if (typeof defineProperty.value in ['string', 'number'] || defineProperty.value == null) {
                Object.defineProperty(this.prototype, prop, { enumerable: true, writable: true, value: defineProperty.value });
            }
            else {
                Object.defineProperty(this.prototype, prop, {
                    enumerable: true,
                    get: function () {
                        if (!_this['__' + prop]) {
                            _this['__' + prop] =
                                ObjectTemplate_1.ObjectTemplate.clone(defineProperty.value, defineProperty.of || defineProperty.type || null);
                        }
                        return _this['__' + prop];
                    },
                    set: function (value) {
                        _this['__' + prop] = value;
                    }
                });
            }
        }
    };
    Supertype.amorphicFromJSON = function (json, idPrefix) {
        return ObjectTemplate_1.ObjectTemplate.fromJSON(json, this, idPrefix);
    };
    Object.defineProperty(Supertype, "__children__", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getChildren(this, this.__objectTemplate__);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Supertype, "defineProperties", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.defineProperties(this);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Legacy
     *
     * @static
     * @param {string} json
     * @param {string} [idPrefix]
     * @memberof Supertype
     */
    Supertype.fromJSON = function (json, idPrefix) {
        return ObjectTemplate_1.ObjectTemplate.fromJSON(json, this, idPrefix);
    };
    Supertype.fromPOJO = function (pojo) {
        return ObjectTemplate_1.ObjectTemplate.fromPOJO(pojo, this);
    };
    /**
     * Legacy method
     *
     * @static
     * @memberof Supertype
     */
    Supertype.getProperties = function (includeVirtualProperties) {
        return ObjectTemplate_1.ObjectTemplate._getDefineProperties(this, undefined, includeVirtualProperties);
    };
    Supertype.inject = function (injector) {
        // Implemented in Line 128, of ObjectTemplate.ts (static performInjections)
    };
    Object.defineProperty(Supertype, "__name__", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getName(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Supertype, "parentTemplate", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getParent(this, this.__objectTemplate__);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Supertype, "__parent__", {
        get: function () {
            return UtilityFunctions_1.UtilityFunctions.getParent(this, this.__objectTemplate__);
        },
        enumerable: true,
        configurable: true
    });
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
    Supertype.prototype.amorphicGetClassName = function () {
        return this.__template__.__name__;
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
    /**
     * Legacy alias of amoprhicPropertyDefinition. Should be protected
     *
     * @param {*} prop
     * @returns
     * @memberof Supertype
     */
    Supertype.prototype.__prop__ = function (prop) {
        return this.amorphicGetPropertyDefinition(prop);
    };
    /**
     * Legacy alias of amorphicGetPropertyValues. Should be protected
     *
     * @param {*} prop
     * @returns
     * @memberof Supertype
     */
    Supertype.prototype.__values__ = function (prop) {
        return this.amorphicGetPropertyValues(prop);
    };
    /**
     * Legacy alias of amorphicGetPropertyDescriptions. Should be protected
     *
     * @param {*} prop
     * @returns
     * @memberof Supertype
     */
    Supertype.prototype.__descriptions__ = function (prop) {
        return this.amorphicGetPropertyDescriptions(prop);
    };
    /**
     * Legacy alias of amorphicToJSON. Should be protected
     *
     * @param {Function} callback
     * @returns
     * @memberof Supertype
     */
    Supertype.prototype.toJSONString = function (cb) {
        return this.amorphicToJSON(cb);
    };
    Supertype.__injections__ = [];
    Supertype.isObjectTemplate = true;
    Supertype.__objectTemplate__ = ObjectTemplate_1.ObjectTemplate;
    /**
     * @TODO: Doublecheck this false/false setup may cause problems
     */
    Supertype.__toClient__ = false;
    Supertype.__toServer__ = false;
    Supertype.__shadowChildren__ = [];
    return Supertype;
}());
exports.Supertype = Supertype;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUFrRDtBQUNsRCx5Q0FBMkM7QUFDM0MsdURBQXNEO0FBUXREOzs7OztHQUtHO0FBRUg7SUEyS0ksbUJBQVksY0FBK0I7UUFBL0IsK0JBQUEsRUFBQSxpQkFBaUIsK0JBQWM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBK0IsQ0FBQztRQUN6RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxXQUErQixDQUFDO1FBRTFELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQWdCLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsMEJBQTBCLENBQUMsQ0FBQztTQUMzSDtRQUVELDZEQUE2RDtRQUM3RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFdEUseURBQXlEO1FBQ3pELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQztRQUM5QixPQUFPLGNBQWMsRUFBRTtZQUNuQixLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQzlELGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN0RDtZQUNELGNBQWMsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDO1NBQzlDO1FBRUQsMENBQTBDO1FBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcs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QUFJLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFCO0lBQ0wsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNILDRCQUFRLEdBQVIsVUFBUyxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNILDhCQUFVLEdBQVYsVUFBVyxJQUFJO1FBQ1gsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILG9DQUFnQixHQUFoQixVQUFpQixJQUFJO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxnQ0FBWSxHQUFaLFVBQWEsRUFBRztRQUNaLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNsQyxDQUFDO0lBeFNNLHdCQUFjLEdBQW9CLEVBQUUsQ0FBQztJQUNyQywwQkFBZ0IsR0FBRyxJQUFJLENBQUM7SUFDeEIsNEJBQWtCLEdBQUcsK0JBQWMsQ0FBQztJQUMzQzs7T0FFRztJQUNJLHNCQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLHNCQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLDRCQUFrQixHQUFHLEVBQUUsQ0FBQztJQStTbkMsZ0JBQUM7Q0FBQSxBQXpURCxJQXlUQztBQXpUWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9iamVjdFRlbXBsYXRlIH0gZnJvbSAnLi9PYmplY3RUZW1wbGF0ZSc7XG5pbXBvcnQgKiBhcyBzZXJpYWxpemVyIGZyb20gJy4vc2VyaWFsaXplcic7XG5pbXBvcnQgeyBVdGlsaXR5RnVuY3Rpb25zIH0gZnJvbSAnLi9VdGlsaXR5RnVuY3Rpb25zJztcblxuZXhwb3J0IHR5cGUgU3VwZXJ0eXBlQ29uc3RydWN0b3IgPSB0eXBlb2YgU3VwZXJ0eXBlO1xuXG5leHBvcnQgdHlwZSBEZWZpbmVQcm9wZXJ0eVR5cGUgPSB7IGlzTG9jYWw/OiBhbnksIHRvQ2xpZW50PzogYW55LCB0b1NlcnZlcj86IGFueSwgdHlwZT86IGFueSwgb2Y/OiBhbnksIGJvZHk/OiBhbnksIG9uPzogYW55LCB2YWxpZGF0ZT86IGFueSwgdmFsdWU/OiBhbnkgfTtcblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0YWJsZSA9IG5ldyAoLi4uYXJnczogYW55W10pID0+IHt9O1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIHR5cGVzY3JpcHQgY2xhc3Nlcy4gXG4gKiBJdCB3aWxsIGluamVjdCBtZW1iZXJzIGludG8gdGhlIG9iamVjdCBmcm9tIGJvdGggdGhlIHRlbXBsYXRlIGFuZCBvYmplY3RUZW1wbGF0ZVxuICogQHBhcmFtIHtPYmplY3RUZW1wbGF0ZX0gLSBvdGhlciBsYXllcnMgY2FuIHBhc3MgaW4gdGhlaXIgb3duIG9iamVjdCB0ZW1wbGF0ZSAodGhpcyBpcyB0aGUgb2JqZWN0IG5vdCBPYmplY3RUZW1wbGF0ZSlcbiAqIEByZXR1cm5zIHtPYmplY3R9IHRoZSBvYmplY3QgaXRzZWxmXG4gKi9cblxuZXhwb3J0IGNsYXNzIFN1cGVydHlwZSB7XG5cbiAgICBzdGF0aWMgX19pbmplY3Rpb25zX186IEFycmF5PEZ1bmN0aW9uPiA9IFtdO1xuICAgIHN0YXRpYyBpc09iamVjdFRlbXBsYXRlID0gdHJ1ZTtcbiAgICBzdGF0aWMgX19vYmplY3RUZW1wbGF0ZV9fID0gT2JqZWN0VGVtcGxhdGU7XG4gICAgLyoqXG4gICAgICogQFRPRE86IERvdWJsZWNoZWNrIHRoaXMgZmFsc2UvZmFsc2Ugc2V0dXAgbWF5IGNhdXNlIHByb2JsZW1zXG4gICAgICovXG4gICAgc3RhdGljIF9fdG9DbGllbnRfXyA9IGZhbHNlO1xuICAgIHN0YXRpYyBfX3RvU2VydmVyX18gPSBmYWxzZTtcbiAgICBzdGF0aWMgX19zaGFkb3dDaGlsZHJlbl9fID0gW107XG4gICAgLy8gRGVwcmVjYXRlZCBsZWdhY3kgbmFtaW5nXG5cbiAgICBzdGF0aWMgYW1vcnBoaWNDcmVhdGVQcm9wZXJ0eShwcm9wOiBzdHJpbmcsIGRlZmluZVByb3BlcnR5OiBEZWZpbmVQcm9wZXJ0eVR5cGUpIHtcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMucHJvdG90eXBlW3Byb3BdID0gT2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcCwgZGVmaW5lUHJvcGVydHkuYm9keSwgZGVmaW5lUHJvcGVydHkub24sIGRlZmluZVByb3BlcnR5LnZhbGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJvdG90eXBlLl9fYW1vcnBoaWNwcm9wc19fW3Byb3BdID0gZGVmaW5lUHJvcGVydHk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlZmluZVByb3BlcnR5LnZhbHVlIGluIFsnc3RyaW5nJywgJ251bWJlciddIHx8IGRlZmluZVByb3BlcnR5LnZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5wcm90b3R5cGUsIHByb3AsIHsgZW51bWVyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlOiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwgcHJvcCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpc1snX18nICsgcHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcF0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUuY2xvbmUoZGVmaW5lUHJvcGVydHkudmFsdWUsIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzWydfXycgKyBwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQ6ICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBhbW9ycGhpY0NsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXROYW1lKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgYW1vcnBoaWNDaGlsZENsYXNzZXMoKTogQXJyYXk8U3VwZXJ0eXBlQ29uc3RydWN0b3I+IHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZ2V0Q2hpbGRyZW4odGhpcywgdGhpcy5fX29iamVjdFRlbXBsYXRlX18pO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgYW1vcnBoaWNQYXJlbnRDbGFzcygpOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldFBhcmVudCh0aGlzLCB0aGlzLl9fb2JqZWN0VGVtcGxhdGVfXyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFtb3JwaGljR2V0UHJvcGVydGllcyhpbmNsdWRlVmlydHVhbFByb3BlcnRpZXM/OiBib29sZWFuKTogYW55IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHVuZGVmaW5lZCwgaW5jbHVkZVZpcnR1YWxQcm9wZXJ0aWVzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBhbW9ycGhpY1Byb3BlcnRpZXMoKSB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmRlZmluZVByb3BlcnRpZXModGhpcyk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgYW1vcnBoaWNTdGF0aWMoKTogdHlwZW9mIE9iamVjdFRlbXBsYXRlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vYmplY3RUZW1wbGF0ZV9fO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGVmaW5lUHJvcGVydHlcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KHByb3A6IHN0cmluZywgZGVmaW5lUHJvcGVydHk6IERlZmluZVByb3BlcnR5VHlwZSkge1xuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuYm9keSkge1xuICAgICAgICAgICAgdGhpcy5wcm90b3R5cGVbcHJvcF0gPSBPYmplY3RUZW1wbGF0ZS5fc2V0dXBGdW5jdGlvbihwcm9wLCBkZWZpbmVQcm9wZXJ0eS5ib2R5LCBkZWZpbmVQcm9wZXJ0eS5vbiwgZGVmaW5lUHJvcGVydHkudmFsaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcm90b3R5cGUuX19hbW9ycGhpY3Byb3BzX19bcHJvcF0gPSBkZWZpbmVQcm9wZXJ0eTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmaW5lUHJvcGVydHkudmFsdWUgaW4gWydzdHJpbmcnLCAnbnVtYmVyJ10gfHwgZGVmaW5lUHJvcGVydHkudmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwgcHJvcCwgeyBlbnVtZXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IGRlZmluZVByb3BlcnR5LnZhbHVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMucHJvdG90eXBlLCBwcm9wLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzWydfXycgKyBwcm9wXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3RUZW1wbGF0ZS5jbG9uZShkZWZpbmVQcm9wZXJ0eS52YWx1ZSwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ19fJyArIHByb3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldDogKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGFtb3JwaGljRnJvbUpTT04oanNvbjogc3RyaW5nLCBpZFByZWZpeD8pIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLmZyb21KU09OKGpzb24sIHRoaXMsIGlkUHJlZml4KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IF9fY2hpbGRyZW5fXygpOiBBcnJheTxTdXBlcnR5cGVDb25zdHJ1Y3Rvcj4ge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXRDaGlsZHJlbih0aGlzLCB0aGlzLl9fb2JqZWN0VGVtcGxhdGVfXyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBkZWZpbmVQcm9wZXJ0aWVzKCkge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbaWRQcmVmaXhdXG4gICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTihqc29uOiBzdHJpbmcsIGlkUHJlZml4Pzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihqc29uLCB0aGlzLCBpZFByZWZpeCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb21QT0pPKHBvam8pIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLmZyb21QT0pPKHBvam8sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBtZXRob2QgXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRQcm9wZXJ0aWVzKGluY2x1ZGVWaXJ0dWFsUHJvcGVydGllcz86IGJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHVuZGVmaW5lZCwgaW5jbHVkZVZpcnR1YWxQcm9wZXJ0aWVzKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBpbmplY3QoaW5qZWN0b3I6IGFueSkge1xuICAgICAgICAvLyBJbXBsZW1lbnRlZCBpbiBMaW5lIDEyOCwgb2YgT2JqZWN0VGVtcGxhdGUudHMgKHN0YXRpYyBwZXJmb3JtSW5qZWN0aW9ucylcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IF9fbmFtZV9fKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldE5hbWUodGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBwYXJlbnRUZW1wbGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZ2V0UGFyZW50KHRoaXMsIHRoaXMuX19vYmplY3RUZW1wbGF0ZV9fKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IF9fcGFyZW50X18oKTogU3VwZXJ0eXBlQ29uc3RydWN0b3Ige1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXRQYXJlbnQodGhpcywgdGhpcy5fX29iamVjdFRlbXBsYXRlX18pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogVGhlIGNvbnN0cnVjdG9yLCBvciB0aGUgY2xhc3MgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgKiBAdHlwZSB7dHlwZW9mIFN1cGVydHlwZX1cbiAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAqL1xuICAgIF9fdGVtcGxhdGVfXzogdHlwZW9mIFN1cGVydHlwZTtcbiAgICAvKipcbiAgICAqIFRoZSBjb25zdHJ1Y3Rvciwgb3IgdGhlIGNsYXNzIGRlZmluaXRpb24gaXRzZWxmLlxuICAgICogQHR5cGUge3R5cGVvZiBTdXBlcnR5cGV9XG4gICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgKi9cbiAgICBhbW9ycGhpY0NsYXNzOiB0eXBlb2YgU3VwZXJ0eXBlO1xuICAgIGFtb3JwaGljOiB0eXBlb2YgT2JqZWN0VGVtcGxhdGU7XG4gICAgLy8gT2JqZWN0IG1lbWJlcnNcbiAgICBfX2lkX186IHN0cmluZztcbiAgICBhbW9ycGhpY0xlYXZlRW1wdHk6IGJvb2xlYW47XG4gICAgX19hbW9ycGhpY3Byb3BzX186IGFueTtcbiAgICBfX2V4Y2VwdGlvbnNfXzogYW55O1xuXG4gICAgY29uc3RydWN0b3Iob2JqZWN0VGVtcGxhdGUgPSBPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRoaXMuY29uc3RydWN0b3IgYXMgdHlwZW9mIFN1cGVydHlwZTtcbiAgICAgICAgdGhpcy5hbW9ycGhpY0NsYXNzID0gdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgU3VwZXJ0eXBlO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZV9fO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoVXRpbGl0eUZ1bmN0aW9ucy5jb25zdHJ1Y3Rvck5hbWUoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yKSArICcgbWlzc2luZyBAc3VwZXJ0eXBlQ2xhc3MnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlbGwgY29uc3RydWN0b3Igbm90IHRvIGV4ZWN1dGUgYXMgdGhpcyBpcyBhbiBlbXB0eSBvYmplY3RcbiAgICAgICAgdGhpcy5hbW9ycGhpY0xlYXZlRW1wdHkgPSBvYmplY3RUZW1wbGF0ZS5fc3Rhc2hPYmplY3QodGhpcywgdGVtcGxhdGUpO1xuXG4gICAgICAgIC8vIFRlbXBsYXRlIGxldmVsIGluamVjdGlvbnMgdGhhdCB0aGUgYXBwbGljYXRpb24gbWF5IHVzZVxuICAgICAgICB2YXIgdGFyZ2V0VGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgd2hpbGUgKHRhcmdldFRlbXBsYXRlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgdGFyZ2V0VGVtcGxhdGUuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0VGVtcGxhdGUuX19pbmplY3Rpb25zX19baXhdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXJnZXRUZW1wbGF0ZSA9IHRhcmdldFRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iYWwgaW5qZWN0aW9ucyB1c2VkIGJ5IHRoZSBmcmFtZXdvcmtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX19bal0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYW1vcnBoaWMgPSBvYmplY3RUZW1wbGF0ZTtcblxuICAgICAgICBpZiAodGhpcy5fX2V4Y2VwdGlvbnNfXykge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19leGNlcHRpb25zX18gPSBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXyB8fCBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGV4Y2VwdGlvbktleSBpbiB0aGlzLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19leGNlcHRpb25zX18ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmM6IHRoaXMuX19leGNlcHRpb25zX19bZXhjZXB0aW9uS2V5XSxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6IFV0aWxpdHlGdW5jdGlvbnMuZ2V0TmFtZSwgLy8gQFRPRE86IG5lZWQgdG8gYmluZCB0YXJnZXQgdG8gdGhpcyBET0VTIFRISVMgRVZFTiBXT1JLP1xuICAgICAgICAgICAgICAgICAgICBwcm9wOiBleGNlcHRpb25LZXlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vQFRPRE86IGZpbGwgdGhlIHByb3BlcnRpZXMgb2YgJ3RoaXMnIGluPyBkbyBJIG5lZWQgdGhpcyBhZnRlciBkZWxldGluZyB0aGUgY2FsbGVyQ29udGV4dCBhcHByb2FjaFxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaGF2ZW4tbGlmZS9zdXBlcnR5cGUvaXNzdWVzLzdcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGFtb3JwaGljVG9KU09OKGNiPykge1xuICAgICAgICByZXR1cm4gc2VyaWFsaXplci50b0pTT05TdHJpbmcodGhpcywgY2IpO1xuICAgIH1cblxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlEZWZpbml0aW9uKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0aGlzLl9fdGVtcGxhdGVfXyk7XG4gICAgfVxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlWYWx1ZXMocHJvcCkge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkudmFsdWVzKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcy5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXM7XG4gICAgfVxuICAgIGFtb3JwaGljR2V0UHJvcGVydHlEZXNjcmlwdGlvbnMocHJvcCkge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucy5jYWxsKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucztcbiAgICB9XG5cbiAgICBhbW9ycGhpY0dldENsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3RlbXBsYXRlX18uX19uYW1lX187XG4gICAgfVxuXG4gICAgY3JlYXRlQ29weShjcmVhdG9yKSB7XG4gICAgICAgIHZhciBvYmogPSB0aGlzO1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ob2JqLCBvYmouX190ZW1wbGF0ZV9fLCBudWxsLCBudWxsLCB1bmRlZmluZWQsIG51bGwsIG51bGwsIGNyZWF0b3IpO1xuICAgIH1cblxuICAgIGluamVjdChpbmplY3Rvcikge1xuICAgICAgICBPYmplY3RUZW1wbGF0ZS5pbmplY3QodGhpcywgaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgdGhpc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgYWxpYXMgb2YgYW1vcHJoaWNQcm9wZXJ0eURlZmluaXRpb24uIFNob3VsZCBiZSBwcm90ZWN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gcHJvcFxuICAgICAqIEByZXR1cm5zXG4gICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICAqL1xuICAgIF9fcHJvcF9fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eURlZmluaXRpb24ocHJvcCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBhbGlhcyBvZiBhbW9ycGhpY0dldFByb3BlcnR5VmFsdWVzLiBTaG91bGQgYmUgcHJvdGVjdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHByb3BcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAgKi9cbiAgICBfX3ZhbHVlc19fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eVZhbHVlcyhwcm9wKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgYWxpYXMgb2YgYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucy4gU2hvdWxkIGJlIHByb3RlY3RlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBwcm9wXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgX19kZXNjcmlwdGlvbnNfXyhwcm9wKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFtb3JwaGljR2V0UHJvcGVydHlEZXNjcmlwdGlvbnMocHJvcCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVnYWN5IGFsaWFzIG9mIGFtb3JwaGljVG9KU09OLiBTaG91bGQgYmUgcHJvdGVjdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqIEByZXR1cm5zXG4gICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICAqL1xuICAgIHRvSlNPTlN0cmluZyhjYj8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNUb0pTT04oY2IpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVnYWN5IG1lbWJlcnMgb2YgU3VwZXJ0eXBlLiBEb24ndCBuZWVkIHRvIGJlIGludGVyYWN0ZWQgd2l0aC4gT25seSB1c2VkIGluIE9iamVjdFRlbXBsYXRlLnRzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgc3RhdGljIF9fc2hhZG93UGFyZW50X186IGFueTtcbiAgICBzdGF0aWMgcHJvcHM/OiBhbnk7XG4gICAgc3RhdGljIF9fY3JlYXRlUGFyYW1ldGVyc19fOiBhbnk7XG4gICAgc3RhdGljIGZ1bmN0aW9uUHJvcGVydGllczogYW55O1xuICAgIHN0YXRpYyBleHRlbmQ6IGFueTtcbiAgICBzdGF0aWMgc3RhdGljTWl4aW46IGFueTtcbiAgICBzdGF0aWMgbWl4aW46IGFueTtcbiAgICBzdGF0aWMgb2JqZWN0UHJvcGVydGllczogYW55O1xufSJdfQ==