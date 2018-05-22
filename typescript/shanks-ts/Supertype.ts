
/**
 * This is the base class for typescript classes.  It must
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */

class Supertype {
    constructor(objectTemplate, callerContext) {
        var template = callerContext.__template__;
        if (!template) {
            throw new Error(constructorName(Object.getPrototypeOf(this).constructor) + ' missing @supertypeClass');
        }

        // Tell constructor not to execute as this is an empty object
        callerContext.amorphicLeaveEmpty = objectTemplate._stashObject(this, template);

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

        callerContext.amorphic = objectTemplate;

        return callerContext;

        function constructorName(constructor) {
            var namedFunction = constructor.toString().match(/function ([^(]*)/);
            return namedFunction ? namedFunction[1] : null;
        }
    }
    
}

ObjectTemplate.Supertype = function (objectTemplate) {

    objectTemplate = objectTemplate || ObjectTemplate;

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

    return this;

    function constructorName(constructor) {
        var namedFunction = constructor.toString().match(/function ([^(]*)/);
        return namedFunction ? namedFunction[1] : null;
    }

};

ObjectTemplate.Supertype.prototype.amorphicToJSON = (cb) => serializer.toJSONString(this, cb);


ObjectTemplate.Supertype.prototype.amorphicGetPropertyDefinition = function (prop) {
    return ObjectTemplate._getDefineProperty(prop, this.__template__);
};

ObjectTemplate.Supertype.prototype.amorphicGetPropertyValues = function f(prop) {
    var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);

    if (typeof(defineProperty.values) === 'function') {
        return defineProperty.values.call(this);
    }
    return defineProperty.values;
};

ObjectTemplate.Supertype.prototype.amorphicGetPropertyDescriptions = function e(prop) {
    var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);

    if (typeof(defineProperty.descriptions) === 'function') {
        return defineProperty.descriptions.call(this);
    }

    return defineProperty.descriptions;
};

ObjectTemplate.Supertype.prototype.__prop__ = ObjectTemplate.Supertype.prototype.amorphicGetPropertyDefinition;
ObjectTemplate.Supertype.prototype.__values__ = ObjectTemplate.Supertype.prototype.amorphicGetPropertyValues;
ObjectTemplate.Supertype.prototype.__descriptions__ = ObjectTemplate.Supertype.prototype.amorphicGetPropertyDescriptions;
ObjectTemplate.Supertype.prototype.toJSONString = ObjectTemplate.Supertype.prototype.amorphicToJSON;
ObjectTemplate.Supertype.prototype.inject = function inject(injector) {
    ObjectTemplate.inject(this, injector);
};
ObjectTemplate.Supertype.prototype.createCopy = function fromPOJO(creator) {
    var obj = this;
    return ObjectTemplate.fromPOJO(obj, obj.__template__, null, null, undefined, null, null, creator);
};
ObjectTemplate.Supertype.prototype.copyProperties = function copyProperties(obj) {
    for (var prop in obj) {
        this[prop] = obj[prop];
    }
};