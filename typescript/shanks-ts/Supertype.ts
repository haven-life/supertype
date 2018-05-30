import {ObjectTemplate} from './ObjectTemplate';
import * as serializer from './serializer';

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

export class Supertype {
    __template__: any;
    amorphic: any;

    constructor(objectTemplate = ObjectTemplate, callerContext) {
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

        Object.assign(this, callerContext);
        //@TODO: fill the properties of 'this' in
        return this;
    }
    amorphicToJSON(cb){
        return serializer.toJSONString(this, cb);
    } 

    amorphicGetPropertyDefinition(prop) {
        return ObjectTemplate._getDefineProperty(prop, this.__template__);
    }
    amorphicGetPropertyValues(prop) {
        var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);
    
        if (typeof(defineProperty.values) === 'function') {
            return defineProperty.values.call(this);
        }
        return defineProperty.values;
    }
    amorphicGetPropertyDescriptions(prop) {
        var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);
    
        if (typeof(defineProperty.descriptions) === 'function') {
            return defineProperty.descriptions.call(this);
        }
    
        return defineProperty.descriptions;
    }

    createCopy(creator) {
        var obj = this;
        return ObjectTemplate.fromPOJO(obj, obj.__template__, null, null, undefined, null, null, creator);
    }

    inject(injector) {
        ObjectTemplate.inject(this, injector);
    }

    copyProperties(obj) {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }
    __prop__(prop) {
        return this.amorphicGetPropertyDefinition(prop);
    }
    __values__(prop) {
        return this.amorphicGetPropertyValues(prop);
    }
    __descriptions__(prop){
        return this.amorphicGetPropertyDescriptions(prop);
    }
    toJSONString(cb) {
        return this.amorphicToJSON(cb)
    }
}

var y = new Supertype(undefined, {});