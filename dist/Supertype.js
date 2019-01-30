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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwZXJ0eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N1cGVydHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUFrRDtBQUNsRCx5Q0FBMkM7QUFDM0MsdURBQXNEO0FBUXREOzs7OztHQUtHO0FBRUg7SUEyS0ksbUJBQVksY0FBK0I7UUFBL0IsK0JBQUEsRUFBQSxpQkFBaUIsK0JBQWM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBK0IsQ0FBQztRQUN6RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxXQUErQixDQUFDO1FBRTFELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQWdCLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsMEJBQTBCLENBQUMsQ0FBQztTQUMzSDtRQUVELDZEQUE2RDtRQUM3RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFdEUseURBQXlEO1FBQ3pELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQztRQUM5QixPQUFPLGNBQWMsRUFBRTtZQUNuQixLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQzlELGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN0RDtZQUNELGNBQWMsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDO1NBQzlDO1FBRUQsMENBQTBDO1FBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtZQUMzRCxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDckQ7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLGNBQWMsQ0FBQztRQUUvQixJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDckIsY0FBYyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztZQUNwRSxLQUFLLElBQUksWUFBWSxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQzFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO29CQUMvQixJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7b0JBQ3ZDLEtBQUssRUFBRSxtQ0FBZ0IsQ0FBQyxPQUFPO29CQUMvQixJQUFJLEVBQUUsWUFBWTtpQkFDckIsQ0FBQyxDQUFDO2FBQ047U0FDSjtRQUVELG1HQUFtRztRQUNuRyxtREFBbUQ7UUFDbkQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQTFNRCwyQkFBMkI7SUFFcEIsZ0NBQXNCLEdBQTdCLFVBQThCLElBQVksRUFBRSxjQUFrQztRQUE5RSxpQkEwQkM7UUF6QkcsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsK0JBQWMsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDL0g7YUFDSTtZQUNELElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDO1lBQ3hELElBQUksT0FBTyxjQUFjLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO2dCQUNyRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUNsSDtpQkFDSTtnQkFDRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUN0QztvQkFDSSxVQUFVLEVBQUUsSUFBSTtvQkFDaEIsR0FBRyxFQUFFO3dCQUNELElBQUksQ0FBQyxLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFOzRCQUNwQixLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQ0FDYiwrQkFBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxFQUFFLElBQUksY0FBYyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQzt5QkFDcEc7d0JBQ0QsT0FBTyxLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO29CQUM3QixDQUFDO29CQUNELEdBQUcsRUFBRSxVQUFDLEtBQUs7d0JBQ1AsS0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7b0JBQzlCLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2FBQ1Y7U0FDSjtJQUNMLENBQUM7SUFFRCxzQkFBVyw4QkFBaUI7YUFBNUI7WUFDSSxPQUFPLG1DQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxDQUFDOzs7T0FBQTtJQUVELHNCQUFXLGlDQUFvQjthQUEvQjtZQUNJLE9BQU8sbUNBQWdCLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN2RSxDQUFDOzs7T0FBQTtJQUVELHNCQUFXLGdDQUFtQjthQUE5QjtZQUNJLE9BQU8sbUNBQWdCLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyRSxDQUFDOzs7T0FBQTtJQUVNLCtCQUFxQixHQUE1QixVQUE2Qix3QkFBa0M7UUFDM0QsT0FBTywrQkFBYyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBQ0Qsc0JBQVcsK0JBQWtCO2FBQTdCO1lBQ0ksT0FBTyxtQ0FBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDOzs7T0FBQTtJQUNELHNCQUFXLDJCQUFjO2FBQXpCO1lBQ0ksT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDbkMsQ0FBQzs7O09BQUE7SUFDRDs7Ozs7OztPQU9HO0lBQ0ksd0JBQWMsR0FBckIsVUFBc0IsSUFBWSxFQUFFLGNBQWtDO1FBQXRFLGlCQTBCQztRQXpCRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRywrQkFBYyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUMvSDthQUNJO1lBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUM7WUFDeEQsSUFBSSxPQUFPLGNBQWMsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUksY0FBYyxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7Z0JBQ3JGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ2xIO2lCQUNJO2dCQUNELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQ3RDO29CQUNJLFVBQVUsRUFBRSxJQUFJO29CQUNoQixHQUFHLEVBQUU7d0JBQ0QsSUFBSSxDQUFDLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUU7NEJBQ3BCLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO2dDQUNiLCtCQUFjLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLEVBQUUsSUFBSSxjQUFjLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO3lCQUNwRzt3QkFDRCxPQUFPLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7b0JBQzdCLENBQUM7b0JBQ0QsR0FBRyxFQUFFLFVBQUMsS0FBSzt3QkFDUCxLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztvQkFDOUIsQ0FBQztpQkFDSixDQUFDLENBQUM7YUFDVjtTQUNKO0lBQ0wsQ0FBQztJQUNNLDBCQUFnQixHQUF2QixVQUF3QixJQUFZLEVBQUUsUUFBUztRQUMzQyxPQUFPLCtCQUFjLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELHNCQUFXLHlCQUFZO2FBQXZCO1lBQ0ksT0FBTyxtQ0FBZ0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7OztPQUFBO0lBRUQsc0JBQVcsNkJBQWdCO2FBQTNCO1lBQ0ksT0FBTyxtQ0FBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDOzs7T0FBQTtJQUVEOzs7Ozs7O09BT0c7SUFDSSxrQkFBUSxHQUFmLFVBQWdCLElBQVksRUFBRSxRQUFpQjtRQUMzQyxPQUFPLCtCQUFjLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVNLGtCQUFRLEdBQWYsVUFBZ0IsSUFBSTtRQUNoQixPQUFPLCtCQUFjLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSx1QkFBYSxHQUFwQixVQUFxQix3QkFBa0M7UUFDbkQsT0FBTywrQkFBYyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBR00sZ0JBQU0sR0FBYixVQUFjLFFBQWE7UUFDdkIsMkVBQTJFO0lBQy9FLENBQUM7SUFFRCxzQkFBVyxxQkFBUTthQUFuQjtZQUNJLE9BQU8sbUNBQWdCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLENBQUM7OztPQUFBO0lBRUQsc0JBQVcsMkJBQWM7YUFBekI7WUFDSSxPQUFPLG1DQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDckUsQ0FBQzs7O09BQUE7SUFFRCxzQkFBVyx1QkFBVTthQUFyQjtZQUNJLE9BQU8sbUNBQWdCLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyRSxDQUFDOzs7T0FBQTtJQWdFRCxrQ0FBYyxHQUFkLFVBQWUsRUFBRztRQUNkLE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELGlEQUE2QixHQUE3QixVQUE4QixJQUFJO1FBQzlCLE9BQU8sK0JBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFDRCw2Q0FBeUIsR0FBekIsVUFBMEIsSUFBSTtRQUMxQixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBRXRFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxVQUFVLEVBQUU7WUFDL0MsT0FBTyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQztRQUNELE9BQU8sY0FBYyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxDQUFDO0lBQ0QsbURBQStCLEdBQS9CLFVBQWdDLElBQUk7UUFDaEMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUV0RSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEtBQUssVUFBVSxFQUFFO1lBQ3JELE9BQU8sY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakQ7UUFFRCxPQUFPLGNBQWMsQ0FBQyxZQUFZLENBQUM7SUFDdkMsQ0FBQztJQUVELHdDQUFvQixHQUFwQjtRQUNJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDdEMsQ0FBQztJQUVELDhCQUFVLEdBQVYsVUFBVyxPQUFPO1FBQ2QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTywrQkFBYyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3RHLENBQUM7SUFFRCwwQkFBTSxHQUFOLFVBQU8sUUFBUTtRQUNYLCtCQUFjLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsa0NBQWMsR0FBZCxVQUFlLEdBQUc7UUFDZCxLQUFLLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFCO0lBQ0wsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNILDRCQUFRLEdBQVIsVUFBUyxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUNEOzs7Ozs7T0FNRztJQUNILDhCQUFVLEdBQVYsVUFBVyxJQUFJO1FBQ1gsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILG9DQUFnQixHQUFoQixVQUFpQixJQUFJO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxnQ0FBWSxHQUFaLFVBQWEsRUFBRztRQUNaLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNsQyxDQUFDO0lBeFNNLHdCQUFjLEdBQW9CLEVBQUUsQ0FBQztJQUNyQywwQkFBZ0IsR0FBRyxJQUFJLENBQUM7SUFDeEIsNEJBQWtCLEdBQUcsK0JBQWMsQ0FBQztJQUMzQzs7T0FFRztJQUNJLHNCQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLHNCQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLDRCQUFrQixHQUFHLEVBQUUsQ0FBQztJQStTbkMsZ0JBQUM7Q0FBQSxBQXpURCxJQXlUQztBQXpUWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9iamVjdFRlbXBsYXRlIH0gZnJvbSAnLi9PYmplY3RUZW1wbGF0ZSc7XG5pbXBvcnQgKiBhcyBzZXJpYWxpemVyIGZyb20gJy4vc2VyaWFsaXplcic7XG5pbXBvcnQgeyBVdGlsaXR5RnVuY3Rpb25zIH0gZnJvbSAnLi9VdGlsaXR5RnVuY3Rpb25zJztcblxuZXhwb3J0IHR5cGUgU3VwZXJ0eXBlQ29uc3RydWN0b3IgPSB0eXBlb2YgU3VwZXJ0eXBlO1xuXG50eXBlIERlZmluZVByb3BlcnR5VHlwZSA9IHsgaXNMb2NhbD86IGFueSwgdG9DbGllbnQ/OiBhbnksIHRvU2VydmVyPzogYW55LCB0eXBlPzogYW55LCBvZj86IGFueSwgYm9keT86IGFueSwgb24/OiBhbnksIHZhbGlkYXRlPzogYW55LCB2YWx1ZT86IGFueSB9O1xuXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RhYmxlID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4ge307XG5cbi8qKlxuICogVGhpcyBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgdHlwZXNjcmlwdCBjbGFzc2VzLiBcbiAqIEl0IHdpbGwgaW5qZWN0IG1lbWJlcnMgaW50byB0aGUgb2JqZWN0IGZyb20gYm90aCB0aGUgdGVtcGxhdGUgYW5kIG9iamVjdFRlbXBsYXRlXG4gKiBAcGFyYW0ge09iamVjdFRlbXBsYXRlfSAtIG90aGVyIGxheWVycyBjYW4gcGFzcyBpbiB0aGVpciBvd24gb2JqZWN0IHRlbXBsYXRlICh0aGlzIGlzIHRoZSBvYmplY3Qgbm90IE9iamVjdFRlbXBsYXRlKVxuICogQHJldHVybnMge09iamVjdH0gdGhlIG9iamVjdCBpdHNlbGZcbiAqL1xuXG5leHBvcnQgY2xhc3MgU3VwZXJ0eXBlIHtcblxuICAgIHN0YXRpYyBfX2luamVjdGlvbnNfXzogQXJyYXk8RnVuY3Rpb24+ID0gW107XG4gICAgc3RhdGljIGlzT2JqZWN0VGVtcGxhdGUgPSB0cnVlO1xuICAgIHN0YXRpYyBfX29iamVjdFRlbXBsYXRlX18gPSBPYmplY3RUZW1wbGF0ZTtcbiAgICAvKipcbiAgICAgKiBAVE9ETzogRG91YmxlY2hlY2sgdGhpcyBmYWxzZS9mYWxzZSBzZXR1cCBtYXkgY2F1c2UgcHJvYmxlbXNcbiAgICAgKi9cbiAgICBzdGF0aWMgX190b0NsaWVudF9fID0gZmFsc2U7XG4gICAgc3RhdGljIF9fdG9TZXJ2ZXJfXyA9IGZhbHNlO1xuICAgIHN0YXRpYyBfX3NoYWRvd0NoaWxkcmVuX18gPSBbXTtcbiAgICAvLyBEZXByZWNhdGVkIGxlZ2FjeSBuYW1pbmdcblxuICAgIHN0YXRpYyBhbW9ycGhpY0NyZWF0ZVByb3BlcnR5KHByb3A6IHN0cmluZywgZGVmaW5lUHJvcGVydHk6IERlZmluZVByb3BlcnR5VHlwZSkge1xuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuYm9keSkge1xuICAgICAgICAgICAgdGhpcy5wcm90b3R5cGVbcHJvcF0gPSBPYmplY3RUZW1wbGF0ZS5fc2V0dXBGdW5jdGlvbihwcm9wLCBkZWZpbmVQcm9wZXJ0eS5ib2R5LCBkZWZpbmVQcm9wZXJ0eS5vbiwgZGVmaW5lUHJvcGVydHkudmFsaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcm90b3R5cGUuX19hbW9ycGhpY3Byb3BzX19bcHJvcF0gPSBkZWZpbmVQcm9wZXJ0eTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmaW5lUHJvcGVydHkudmFsdWUgaW4gWydzdHJpbmcnLCAnbnVtYmVyJ10gfHwgZGVmaW5lUHJvcGVydHkudmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwgcHJvcCwgeyBlbnVtZXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IGRlZmluZVByb3BlcnR5LnZhbHVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMucHJvdG90eXBlLCBwcm9wLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzWydfXycgKyBwcm9wXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3RUZW1wbGF0ZS5jbG9uZShkZWZpbmVQcm9wZXJ0eS52YWx1ZSwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ19fJyArIHByb3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldDogKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGFtb3JwaGljQ2xhc3NOYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldE5hbWUodGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBhbW9ycGhpY0NoaWxkQ2xhc3NlcygpOiBBcnJheTxTdXBlcnR5cGVDb25zdHJ1Y3Rvcj4ge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXRDaGlsZHJlbih0aGlzLCB0aGlzLl9fb2JqZWN0VGVtcGxhdGVfXyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBhbW9ycGhpY1BhcmVudENsYXNzKCk6IFN1cGVydHlwZUNvbnN0cnVjdG9yIHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZ2V0UGFyZW50KHRoaXMsIHRoaXMuX19vYmplY3RUZW1wbGF0ZV9fKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYW1vcnBoaWNHZXRQcm9wZXJ0aWVzKGluY2x1ZGVWaXJ0dWFsUHJvcGVydGllcz86IGJvb2xlYW4pOiBhbnkge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGhpcywgdW5kZWZpbmVkLCBpbmNsdWRlVmlydHVhbFByb3BlcnRpZXMpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0IGFtb3JwaGljUHJvcGVydGllcygpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZGVmaW5lUHJvcGVydGllcyh0aGlzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBhbW9ycGhpY1N0YXRpYygpOiB0eXBlb2YgT2JqZWN0VGVtcGxhdGUge1xuICAgICAgICByZXR1cm4gdGhpcy5fX29iamVjdFRlbXBsYXRlX187XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvcFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbmVQcm9wZXJ0eVxuICAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlUHJvcGVydHkocHJvcDogc3RyaW5nLCBkZWZpbmVQcm9wZXJ0eTogRGVmaW5lUHJvcGVydHlUeXBlKSB7XG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5ib2R5KSB7XG4gICAgICAgICAgICB0aGlzLnByb3RvdHlwZVtwcm9wXSA9IE9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3AsIGRlZmluZVByb3BlcnR5LmJvZHksIGRlZmluZVByb3BlcnR5Lm9uLCBkZWZpbmVQcm9wZXJ0eS52YWxpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnByb3RvdHlwZS5fX2Ftb3JwaGljcHJvcHNfX1twcm9wXSA9IGRlZmluZVByb3BlcnR5O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSBpbiBbJ3N0cmluZycsICdudW1iZXInXSB8fCBkZWZpbmVQcm9wZXJ0eS52YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMucHJvdG90eXBlLCBwcm9wLCB7IGVudW1lcmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlLCB2YWx1ZTogZGVmaW5lUHJvcGVydHkudmFsdWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5wcm90b3R5cGUsIHByb3AsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXNbJ19fJyArIHByb3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BdID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdFRlbXBsYXRlLmNsb25lKGRlZmluZVByb3BlcnR5LnZhbHVlLCBkZWZpbmVQcm9wZXJ0eS5vZiB8fCBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1snX18nICsgcHJvcF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0OiAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgYW1vcnBoaWNGcm9tSlNPTihqc29uOiBzdHJpbmcsIGlkUHJlZml4Pykge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oanNvbiwgdGhpcywgaWRQcmVmaXgpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgX19jaGlsZHJlbl9fKCk6IEFycmF5PFN1cGVydHlwZUNvbnN0cnVjdG9yPiB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldENoaWxkcmVuKHRoaXMsIHRoaXMuX19vYmplY3RUZW1wbGF0ZV9fKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGRlZmluZVByb3BlcnRpZXMoKSB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmRlZmluZVByb3BlcnRpZXModGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVnYWN5IFxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBqc29uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtpZFByZWZpeF1cbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgc3RhdGljIGZyb21KU09OKGpzb246IHN0cmluZywgaWRQcmVmaXg/OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLmZyb21KU09OKGpzb24sIHRoaXMsIGlkUHJlZml4KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbVBPSk8ocG9qbykge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVnYWN5IG1ldGhvZCBcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgc3RhdGljIGdldFByb3BlcnRpZXMoaW5jbHVkZVZpcnR1YWxQcm9wZXJ0aWVzPzogYm9vbGVhbikge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGhpcywgdW5kZWZpbmVkLCBpbmNsdWRlVmlydHVhbFByb3BlcnRpZXMpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGluamVjdChpbmplY3RvcjogYW55KSB7XG4gICAgICAgIC8vIEltcGxlbWVudGVkIGluIExpbmUgMTI4LCBvZiBPYmplY3RUZW1wbGF0ZS50cyAoc3RhdGljIHBlcmZvcm1JbmplY3Rpb25zKVxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgX19uYW1lX18oKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIFV0aWxpdHlGdW5jdGlvbnMuZ2V0TmFtZSh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IHBhcmVudFRlbXBsYXRlKCkge1xuICAgICAgICByZXR1cm4gVXRpbGl0eUZ1bmN0aW9ucy5nZXRQYXJlbnQodGhpcywgdGhpcy5fX29iamVjdFRlbXBsYXRlX18pO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgX19wYXJlbnRfXygpOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciB7XG4gICAgICAgIHJldHVybiBVdGlsaXR5RnVuY3Rpb25zLmdldFBhcmVudCh0aGlzLCB0aGlzLl9fb2JqZWN0VGVtcGxhdGVfXyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBUaGUgY29uc3RydWN0b3IsIG9yIHRoZSBjbGFzcyBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICAqIEB0eXBlIHt0eXBlb2YgU3VwZXJ0eXBlfVxuICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICovXG4gICAgX190ZW1wbGF0ZV9fOiB0eXBlb2YgU3VwZXJ0eXBlO1xuICAgIC8qKlxuICAgICogVGhlIGNvbnN0cnVjdG9yLCBvciB0aGUgY2xhc3MgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgKiBAdHlwZSB7dHlwZW9mIFN1cGVydHlwZX1cbiAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAqL1xuICAgIGFtb3JwaGljQ2xhc3M6IHR5cGVvZiBTdXBlcnR5cGU7XG4gICAgYW1vcnBoaWM6IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcbiAgICAvLyBPYmplY3QgbWVtYmVyc1xuICAgIF9faWRfXzogc3RyaW5nO1xuICAgIGFtb3JwaGljTGVhdmVFbXB0eTogYm9vbGVhbjtcbiAgICBfX2Ftb3JwaGljcHJvcHNfXzogYW55O1xuICAgIF9fZXhjZXB0aW9uc19fOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihvYmplY3RUZW1wbGF0ZSA9IE9iamVjdFRlbXBsYXRlKSB7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZV9fID0gdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgU3VwZXJ0eXBlO1xuICAgICAgICB0aGlzLmFtb3JwaGljQ2xhc3MgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBTdXBlcnR5cGU7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlX187XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihVdGlsaXR5RnVuY3Rpb25zLmNvbnN0cnVjdG9yTmFtZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3IpICsgJyBtaXNzaW5nIEBzdXBlcnR5cGVDbGFzcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVsbCBjb25zdHJ1Y3RvciBub3QgdG8gZXhlY3V0ZSBhcyB0aGlzIGlzIGFuIGVtcHR5IG9iamVjdFxuICAgICAgICB0aGlzLmFtb3JwaGljTGVhdmVFbXB0eSA9IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZSk7XG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9ucyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBtYXkgdXNlXG4gICAgICAgIHZhciB0YXJnZXRUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICB3aGlsZSAodGFyZ2V0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldFRlbXBsYXRlID0gdGFyZ2V0VGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zIHVzZWQgYnkgdGhlIGZyYW1ld29ya1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tqXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbW9ycGhpYyA9IG9iamVjdFRlbXBsYXRlO1xuXG4gICAgICAgIGlmICh0aGlzLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXyA9IG9iamVjdFRlbXBsYXRlLl9fZXhjZXB0aW9uc19fIHx8IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgZXhjZXB0aW9uS2V5IGluIHRoaXMuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYzogdGhpcy5fX2V4Y2VwdGlvbnNfX1tleGNlcHRpb25LZXldLFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogVXRpbGl0eUZ1bmN0aW9ucy5nZXROYW1lLCAvLyBAVE9ETzogbmVlZCB0byBiaW5kIHRhcmdldCB0byB0aGlzIERPRVMgVEhJUyBFVkVOIFdPUks/XG4gICAgICAgICAgICAgICAgICAgIHByb3A6IGV4Y2VwdGlvbktleVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9AVE9ETzogZmlsbCB0aGUgcHJvcGVydGllcyBvZiAndGhpcycgaW4/IGRvIEkgbmVlZCB0aGlzIGFmdGVyIGRlbGV0aW5nIHRoZSBjYWxsZXJDb250ZXh0IGFwcHJvYWNoXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9oYXZlbi1saWZlL3N1cGVydHlwZS9pc3N1ZXMvN1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgYW1vcnBoaWNUb0pTT04oY2I/KSB7XG4gICAgICAgIHJldHVybiBzZXJpYWxpemVyLnRvSlNPTlN0cmluZyh0aGlzLCBjYik7XG4gICAgfVxuXG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eURlZmluaXRpb24ocHJvcCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRoaXMuX190ZW1wbGF0ZV9fKTtcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eVZhbHVlcyhwcm9wKSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS52YWx1ZXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcztcbiAgICB9XG4gICAgYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zLmNhbGwodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zO1xuICAgIH1cblxuICAgIGFtb3JwaGljR2V0Q2xhc3NOYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fdGVtcGxhdGVfXy5fX25hbWVfXztcbiAgICB9XG5cbiAgICBjcmVhdGVDb3B5KGNyZWF0b3IpIHtcbiAgICAgICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5mcm9tUE9KTyhvYmosIG9iai5fX3RlbXBsYXRlX18sIG51bGwsIG51bGwsIHVuZGVmaW5lZCwgbnVsbCwgbnVsbCwgY3JlYXRvcik7XG4gICAgfVxuXG4gICAgaW5qZWN0KGluamVjdG9yKSB7XG4gICAgICAgIE9iamVjdFRlbXBsYXRlLmluamVjdCh0aGlzLCBpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgY29weVByb3BlcnRpZXMob2JqKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBhbGlhcyBvZiBhbW9wcmhpY1Byb3BlcnR5RGVmaW5pdGlvbi4gU2hvdWxkIGJlIHByb3RlY3RlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBwcm9wXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgX19wcm9wX18ocHJvcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY0dldFByb3BlcnR5RGVmaW5pdGlvbihwcm9wKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGVnYWN5IGFsaWFzIG9mIGFtb3JwaGljR2V0UHJvcGVydHlWYWx1ZXMuIFNob3VsZCBiZSBwcm90ZWN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gcHJvcFxuICAgICAqIEByZXR1cm5zXG4gICAgICogQG1lbWJlcm9mIFN1cGVydHlwZVxuICAgICAqL1xuICAgIF9fdmFsdWVzX18ocHJvcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY0dldFByb3BlcnR5VmFsdWVzKHByb3ApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExlZ2FjeSBhbGlhcyBvZiBhbW9ycGhpY0dldFByb3BlcnR5RGVzY3JpcHRpb25zLiBTaG91bGQgYmUgcHJvdGVjdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHByb3BcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqIEBtZW1iZXJvZiBTdXBlcnR5cGVcbiAgICAgKi9cbiAgICBfX2Rlc2NyaXB0aW9uc19fKHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW1vcnBoaWNHZXRQcm9wZXJ0eURlc2NyaXB0aW9ucyhwcm9wKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgYWxpYXMgb2YgYW1vcnBoaWNUb0pTT04uIFNob3VsZCBiZSBwcm90ZWN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgU3VwZXJ0eXBlXG4gICAgICovXG4gICAgdG9KU09OU3RyaW5nKGNiPykge1xuICAgICAgICByZXR1cm4gdGhpcy5hbW9ycGhpY1RvSlNPTihjYilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMZWdhY3kgbWVtYmVycyBvZiBTdXBlcnR5cGUuIERvbid0IG5lZWQgdG8gYmUgaW50ZXJhY3RlZCB3aXRoLiBPbmx5IHVzZWQgaW4gT2JqZWN0VGVtcGxhdGUudHNcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBzdGF0aWMgX19zaGFkb3dQYXJlbnRfXzogYW55O1xuICAgIHN0YXRpYyBwcm9wcz86IGFueTtcbiAgICBzdGF0aWMgX19jcmVhdGVQYXJhbWV0ZXJzX186IGFueTtcbiAgICBzdGF0aWMgZnVuY3Rpb25Qcm9wZXJ0aWVzOiBhbnk7XG4gICAgc3RhdGljIGV4dGVuZDogYW55O1xuICAgIHN0YXRpYyBzdGF0aWNNaXhpbjogYW55O1xuICAgIHN0YXRpYyBtaXhpbjogYW55O1xuICAgIHN0YXRpYyBvYmplY3RQcm9wZXJ0aWVzOiBhbnk7XG59Il19