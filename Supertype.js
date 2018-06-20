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
//# sourceMappingURL=Supertype.js.map