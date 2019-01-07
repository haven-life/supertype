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
        console.log("Create property prop is " + prop + " type is " + typeof prop);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUFrRDtBQUNsRCx5Q0FBMkM7QUFDM0MsdURBQXNEO0FBUXREOzs7OztHQUtHO0FBRUg7SUE0S0ksbUJBQVksY0FBK0I7UUFBL0IsK0JBQUEsRUFBQSxpQkFBaUIsK0JBQWM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBK0IsQ0FBQztRQUN6RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxXQUErQixDQUFDO1FBRTFELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQWdCLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsMEJBQTBCLENBQUMsQ0FBQztTQUMzSDtRQUVELDZEQUE2RDtRQUM3RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFdEUseURBQXlEO1FBQ3pELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQztRQUM5QixPQUFPLGNBQWMsRUFBRTtZQUNuQixLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQzlELGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN0RDtZQUNELGNBQWMsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDO1NBQzlDO1FBRUQsMENBQTBDO1FBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcs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LENBQUM7SUFDMUMsQ0FBQztJQUVELGtDQUFjLEdBQWQsVUFBZSxHQUFHO1FBQ2QsS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUU7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQjtJQUNMLENBQUM7SUFDRDs7Ozs7O09BTUc7SUFDSCw0QkFBUSxHQUFSLFVBQVMsSUFBSTtRQUNULE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFDRDs7Ozs7O09BTUc7SUFDSCw4QkFBVSxHQUFWLFVBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxvQ0FBZ0IsR0FBaEIsVUFBaUIsSUFBSTtRQUNqQixPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsZ0NBQVksR0FBWixVQUFhLEVBQUc7UUFDWixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbEMsQ0FBQztJQXpTTSx3QkFBYyxHQUFvQixFQUFFLENBQUM7SUFDckMsMEJBQWdCLEdBQUcsSUFBSSxDQUFDO0lBQ3hCLDRCQUFrQixHQUFHLCtCQUFjLENBQUM7SUFDM0M7O09BRUc7SUFDSSxzQkFBWSxHQUFHLEtBQUssQ0FBQztJQUNyQixzQkFBWSxHQUFHLEtBQUssQ0FBQztJQUNyQiw0QkFBa0IsR0FBRyxFQUFFLENBQUM7SUFnVG5DLGdCQUFDO0NBQUEsQUExVEQsSUEwVEM7QUExVFksOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYmplY3RUZW1wbGF0ZSB9IGZyb20gJy4vT2JqZWN0VGVtcGxhdGUnO1xuaW1wb3J0ICogYXMgc2VyaWFsaXplciBmcm9tICcuL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHsgVXRpbGl0eUZ1bmN0aW9ucyB9IGZyb20gJy4vVXRpbGl0eUZ1bmN0aW9ucyc7XG5cbmV4cG9ydCB0eXBlIFN1cGVydHlwZUNvbnN0cnVjdG9yID0gdHlwZW9mIFN1cGVydHlwZTtcblxudHlwZSBEZWZpbmVQcm9wZXJ0eVR5cGUgPSB7IGlzTG9jYWw/OiBhbnksIHRvQ2xpZW50PzogYW55LCB0b1NlcnZlcj86IGFueSwgdHlwZT86IGFueSwgb2Y/OiBhbnksIGJvZHk/OiBhbnksIG9uPzogYW55LCB2YWxpZGF0ZT86IGFueSwgdmFsdWU/OiBhbnkgfTtcblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0YWJsZSA9IG5ldyAoLi4uYXJnczogYW55W10pID0+IHt9O1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIHR5cGVzY3JpcHQgY2xhc3Nlcy4gXG4gKiBJdCB3aWxsIGluamVjdCBtZW1iZXJzIGludG8gdGhlIG9iamVjdCBmcm9tIGJvdGggdGhlIHRlbXBsYXRlIGFuZCBvYmplY3RUZW1wbGF0ZVxuICogQHBhcmFtIHtPYmplY3RUZW1wbGF0ZX0gLSBvdGhlciBsYXllcnMgY2FuIHBhc3MgaW4gdGhlaXIgb3duIG9iamVjdCB0ZW1wbGF0ZSAodGhpcyBpcyB0aGUgb2JqZWN0IG5vdCBPYmplY3RUZW1wbGF0ZSlcbiAqIEByZXR1cm5zIHtPYmplY3R9IHRoZSBvYmplY3QgaXRzZWxmXG4gKi9cblxuZXhwb3J0IGNsYXNzIFN1cGVydHlwZSB7XG5cbiAgICBzdGF0aWMgX19pbmplY3Rpb25zX186IEFycmF5PEZ1bmN0aW9uPiA9IFtdO1xuICAgIHN0YXRpYyBpc09iamVjdFRlbXBsYXRlID0gdHJ1ZTtcbiAgICBzdGF0aWMgX19vYmplY3RUZW1wbGF0ZV9fID0gT2JqZWN0VGVtcGxhdGU7XG4gICAgLyoqXG4gICAgICogQFRPRE86IERvdWJsZWNoZWNrIHRoaXMgZmFsc2UvZmFsc2Ugc2V0dXAgbWF5IGNhdXNlIHByb2JsZW1zXG4gICAgICovXG4gICAgc3RhdGljIF9fdG9DbGllbnRfXyA9IGZhbHNlO1xuICAgIHN0YXRpYyBfX3RvU2VydmVyX18gPSBmYWxzZTtcbiAgICBzdGF0aWMgX19zaGFkb3dDaGlsZHJlbl9fID0gW107XG4gICAgLy8gRGVwcmVjYXRlZCBsZWdhY3kgbmFtaW5nXG5cbiAgICBzdGF0aWMgYW1vcnBoaWNDcmVhdGVQcm9wZXJ0eShwcm9wOiBzdHJpbmcsIGRlZmluZVByb3BlcnR5OiBEZWZpbmVQcm9wZXJ0eVR5cGUpIHtcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMucHJvdG90eXBlW3Byb3BdID0gT2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcCwgZGVmaW5lUHJvcGVydHkuYm9keSwgZGVmaW5lUHJvcGVydHkub24sIGRlZmluZVByb3BlcnR5LnZhbGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJvdG90eXBlLl9fYW1vcnBoaWNwcm9wc19fW3Byb3BdID0gZGVmaW5lUHJvcGVydHk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlZmluZVByb3BlcnR5LnZhbHVlIGluIFsnc3RyaW5nJywgJ251bWJlciddIHx8IGRlZmluZVByb3BlcnR5LnZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5wcm90b3R5cGUsIHByb3AsIHsgZW51bWVyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlOiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwgcHJvcCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpc1snX18nICsgcHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcF0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUuY2xvbmUoZGVmaW5lUHJvcGVydHkudmFsdWUsIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzWydfXycgKyBwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQ6ICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBhbW9ycGhpY0NsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXROYW1lKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgYW1vcnBoaWNDaGlsZENsYXNzZXMoKTogQXJyYXk8U3VwZXJ0eXBlQ29uc3RydWN0b3I+IHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZ2V0Q2hpbGRyZW4odGhpcywgdGhpcy5fX29iamVjdFRlbXBsYXRlX18pO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgYW1vcnBoaWNQYXJlbnRDbGFzcygpOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldFBhcmVudCh0aGlzLCB0aGlzLl9fb2JqZWN0VGVtcGxhdGVfXyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFtb3JwaGljR2V0UHJvcGVydGllcyhpbmNsdWRlVmlydHVhbFByb3BlcnRpZXM/OiBib29sZWFuKTogYW55IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHVuZGVmaW5lZCwgaW5jbHVkZVZpcnR1YWxQcm9wZXJ0aWVzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBhbW9ycGhpY1Byb3BlcnRpZXMoKSB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmRlZmluZVByb3BlcnRpZXModGhpcyk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgYW1vcnBoaWNTdGF0aWMoKTogdHlwZW9mIE9iamVjdFRlbXBsYXRlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19vYmplY3RUZW1wbGF0ZV9fO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHByb3BcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGVmaW5lUHJvcGVydHlcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZVByb3BlcnR5KHByb3A6IHN0cmluZywgZGVmaW5lUHJvcGVydHk6IERlZmluZVByb3BlcnR5VHlwZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgQ3JlYXRlIHByb3BlcnR5IHByb3AgaXMgJHtwcm9wfSB0eXBlIGlzICR7dHlwZW9mIHByb3B9YCk7XG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5ib2R5KSB7XG4gICAgICAgICAgICB0aGlzLnByb3RvdHlwZVtwcm9wXSA9IE9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3AsIGRlZmluZVByb3BlcnR5LmJvZHksIGRlZmluZVByb3BlcnR5Lm9uLCBkZWZpbmVQcm9wZXJ0eS52YWxpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnByb3RvdHlwZS5fX2Ftb3JwaGljcHJvcHNfX1twcm9wXSA9IGRlZmluZVByb3BlcnR5O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSBpbiBbJ3N0cmluZycsICdudW1iZXInXSB8fCBkZWZpbmVQcm9wZXJ0eS52YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMucHJvdG90eXBlLCBwcm9wLCB7IGVudW1lcmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlLCB2YWx1ZTogZGVmaW5lUHJvcGVydHkudmFsdWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5wcm90b3R5cGUsIHByb3AsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXNbJ19fJyArIHByb3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BdID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdFRlbXBsYXRlLmNsb25lKGRlZmluZVByb3BlcnR5LnZhbHVlLCBkZWZpbmVQcm9wZXJ0eS5vZiB8fCBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1snX18nICsgcHJvcF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0OiAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgYW1vcnBoaWNGcm9tSlNPTihqc29uOiBzdHJpbmcsIGlkUHJlZml4Pykge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oanNvbiwgdGhpcywgaWRQcmVmaXgpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgX19jaGlsZHJlbl9fKCk6IEFycmF5PFN1cGVydHlwZUNvbnN0cnVjdG9yPiB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldENoaWxkcmVuKHRoaXMsIHRoaXMuX19vYmplY3RUZW1wbGF0ZV9fKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGRlZmluZVByb3BlcnRpZXMoKSB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmRlZmluZVByb3BlcnRpZXModGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVnYWN5IFxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBqc29uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtpZFByZWZpeF1cbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgc3RhdGljIGZyb21KU09OKGpzb246IHN0cmluZywgaWRQcmVmaXg/OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLmZyb21KU09OKGpzb24sIHRoaXMsIGlkUHJlZml4KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbVBPSk8ocG9qbykge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVnYWN5IG1ldGhvZCBcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgc3RhdGljIGdldFByb3BlcnRpZXMoaW5jbHVkZVZpcnR1YWxQcm9wZXJ0aWVzPzogYm9vbGVhbikge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGhpcywgdW5kZWZpbmVkLCBpbmNsdWRlVmlydHVhbFByb3BlcnRpZXMpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGluamVjdChpbmplY3RvcjogYW55KSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIExpbmUgMTI4LCBvZiBPYmplY3RUZW1wbGF0ZS50cyAoc3RhdGljIHBlcmZvcm1JbmplY3Rpb25zKVxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgX19uYW1lX18oKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZ2V0TmFtZSh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IHBhcmVudFRlbXBsYXRlKCkge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXRQYXJlbnQodGhpcywgdGhpcy5fX29iamVjdFRlbXBsYXRlX18pO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgX19wYXJlbnRfXygpOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldFBhcmVudCh0aGlzLCB0aGlzLl9fb2JqZWN0VGVtcGxhdGVfXyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUaGUgY29uc3RydWN0b3IsIG9yIHRoZSBjbGFzcyBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICAqIEB0eXBlIHt0eXBlb2YgU3VwZXJ0eXBlfVxuICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICovXG4gICAgX190ZW1wbGF0ZV9fOiB0eXBlb2YgU3VwZXJ0eXBlO1xuICAgIC8qKlxuICAgICogVGhlIGNvbnN0cnVjdG9yLCBvciB0aGUgY2xhc3MgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgKiBAdHlwZSB7dHlwZW9mIFN1cGVydHlwZX1cbiAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAqL1xuICAgIGFtb3JwaGljQ2xhc3M6IHR5cGVvZiBTdXBlcnR5cGU7XG4gICAgYW1vcnBoaWM6IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcbiAgICAvLyBPYmplY3QgbWVtYmVyc1xuICAgIF9faWRfXzogc3RyaW5nO1xuICAgIGFtb3JwaGljTGVhdmVFbXB0eTogYm9vbGVhbjtcbiAgICBfX2Ftb3JwaGljcHJvcHNfXzogYW55O1xuICAgIF9fZXhjZXB0aW9uc19fOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihvYmplY3RUZW1wbGF0ZSA9IE9iamVjdFRlbXBsYXRlKSB7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZV9fID0gdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgU3VwZXJ0eXBlO1xuICAgICAgICB0aGlzLmFtb3JwaGljQ2xhc3MgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBTdXBlcnR5cGU7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlX187XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihVdGlsaXR5RnVuY3Rpb25zLmNvbnN0cnVjdG9yTmFtZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3IpICsgJyBtaXNzaW5nIEBzdXBlcnR5cGVDbGFzcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVsbCBjb25zdHJ1Y3RvciBub3QgdG8gZXhlY3V0ZSBhcyB0aGlzIGlzIGFuIGVtcHR5IG9iamVjdFxuICAgICAgICB0aGlzLmFtb3JwaGljTGVhdmVFbXB0eSA9IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZSk7XG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9ucyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBtYXkgdXNlXG4gICAgICAgIHZhciB0YXJnZXRUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICB3aGlsZSAodGFyZ2V0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldFRlbXBsYXRlID0gdGFyZ2V0VGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zIHVzZWQgYnkgdGhlIGZyYW1ld29ya1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tqXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbW9ycGhpYyA9IG9iamVjdFRlbXBsYXRlO1xuXG4gICAgICAgIGlmICh0aGlzLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXyA9IG9iamVjdFRlbXBsYXRlLl9fZXhjZXB0aW9uc19fIHx8IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgZXhjZXB0aW9uS2V5IGluIHRoaXMuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYzogdGhpcy5fX2V4Y2VwdGlvbnNfX1tleGNlcHRpb25LZXldLFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogVXRpbGl0eUZ1bmN0aW9ucy5nZXROYW1lLCAvLyBAVE9ETzogbmVlZCB0byBiaW5kIHRhcmdldCB0byB0aGlzIERPRVMgVEhJUyBFVkVOIFdPUks/XG4gICAgICAgICAgICAgICAgICAgIHByb3A6IGV4Y2VwdGlvbktleVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9AVE9ETzogZmlsbCB0aGUgcHJvcGVydGllcyBvZiAndGhpcycgaW4/IGRvIEkgbmVlZCB0aGlzIGFmdGVyIGRlbGV0aW5nIHRoZSBjYWxsZXJDb250ZXh0IGFwcHJvYWNoXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9oYXZlbi1saWZlL3N1cGVydHlwZS9pc3N1ZXMvN1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgYW1vcnBoaWNUb0pTT04oY2I/KSB7XG4gICAgICAgIHJldHVybiBzZXJpYWxpemVyLnRvSlNPTlN0cmluZyh0aGlzLCBjYik7XG4gICAgfVxuXG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eURlZmluaXRpb24ocHJvcCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRoaXMuX190ZW1wbGF0ZV9fKTtcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eVZhbHVlcyhwcm9wKSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS52YWx1ZXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcztcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zLmNhbGwodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zO1xuICAgIH1cblxuICAgIGFtb3JwaGljR2V0Q2xhc3NOYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fdGVtcGxhdGVfXy5fX25hbWVfXztcbiAgICB9XG5cbiAgICBjcmVhdGVDb3B5KGNyZWF0b3IpIHtcbiAgICAgICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5mcm9tUE9KTyhvYmosIG9iai5fX3RlbXBsYXRlX18sIG51bGwsIG51bGwsIHVuZGVmaW5lZCwgbnVsbCwgbnVsbCwgY3JlYXRvcik7XG4gICAgfVxuXG4gICAgaW5qZWN0KGluamVjdG9yKSB7XG4gICAgICAgIE9iamVjdFRlbXBsYXRlLmluamVjdCh0aGlzLCBpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgY29weVByb3BlcnRpZXMob2JqKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBhbGlhcyBvZiBhbW9wcmhpY1Byb3BlcnR5RGVmaW5pdGlvbi4gU2hvdWxkIGJlIHByb3RlY3RlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBwcm9wXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgX19wcm9wX18ocHJvcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY0dldFByb3BlcnR5RGVmaW5pdGlvbihwcm9wKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGVnYWN5IGFsaWFzIG9mIGFtb3JwaGljR2V0UHJvcGVydHlWYWx1ZXMuIFNob3VsZCBiZSBwcm90ZWN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gcHJvcFxuICAgICAqIEByZXR1cm5zXG4gICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICAqL1xuICAgIF9fdmFsdWVzX18ocHJvcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY0dldFByb3BlcnR5VmFsdWVzKHByb3ApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBhbGlhcyBvZiBhbW9ycGhpY0dldFByb3BlcnR5RGVzY3JpcHRpb25zLiBTaG91bGQgYmUgcHJvdGVjdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHByb3BcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAgKi9cbiAgICBfX2Rlc2NyaXB0aW9uc19fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgYWxpYXMgb2YgYW1vcnBoaWNUb0pTT04uIFNob3VsZCBiZSBwcm90ZWN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgdG9KU09OU3RyaW5nKGNiPykge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY1RvSlNPTihjYilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgbWVtYmVycyBvZiBTdXBlcnR5cGUuIERvbid0IG5lZWQgdG8gYmUgaW50ZXJhY3RlZCB3aXRoLiBPbmx5IHVzZWQgaW4gT2JqZWN0VGVtcGxhdGUudHNcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBzdGF0aWMgX19zaGFkb3dQYXJlbnRfXzogYW55O1xuICAgIHN0YXRpYyBwcm9wcz86IGFueTtcbiAgICBzdGF0aWMgX19jcmVhdGVQYXJhbWV0ZXJzX186IGFueTtcbiAgICBzdGF0aWMgZnVuY3Rpb25Qcm9wZXJ0aWVzOiBhbnk7XG4gICAgc3RhdGljIGV4dGVuZDogYW55O1xuICAgIHN0YXRpYyBzdGF0aWNNaXhpbjogYW55O1xuICAgIHN0YXRpYyBtaXhpbjogYW55O1xuICAgIHN0YXRpYyBvYmplY3RQcm9wZXJ0aWVzOiBhbnk7XG59Il19