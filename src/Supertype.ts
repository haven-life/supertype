import {ObjectTemplate} from './ObjectTemplate';
import { UtilityFunctions } from './UtilityFunctions';
import * as serializer from './serializer';

export type Constructable = new (...args: any[]) => {};
type DefinePropertyType = { type: any, of: any, body: any, on: any, validate: any, value: any };

/**
 * This is the base class for typescript classes. 
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */

export class Supertype {
    /**
     * The constructor, or the class definition itself.
     * @type {typeof Supertype}
     * @memberof Supertype
     */
    __template__: typeof Supertype;

    /**
    * The constructor, or the class definition itself.
    * @type {typeof Supertype}
    * @memberof Supertype
    */
    amorphicClass: typeof Supertype;

    amorphic: typeof ObjectTemplate;
    __name__: string;
    static __injections__: Array<Function> = [];
    static isObjectTemplate = true;
    static amorphicProperties: any;
    static amorphicChildClasses: Array<Constructable>;
    static amorphicParentClass: Constructable;
    static amorphicClassName: string;
    static amorphicStatic: typeof ObjectTemplate;
    static __objectTemplate__ = ObjectTemplate;

    /**
     * @TODO: Doublecheck this true/true setup
     */
    static __toClient__ = true;
    static __toServer__ = true;
    static __shadowChildren__ = [];

    // Object members
    __id__: string;
    amorphicLeaveEmpty: boolean;

    // Deprecated legacy naming
    static __children__: Array<Supertype>;
    static __parent__: typeof Supertype;
    __amorphicprops__: any;
    __exceptions__: any;
    static amorphicCreateProperty(prop: String, defineProperty: Object) {
        // Implemented in the decorator @supertypeClass
    }

    static amorphicGetProperties(includeVirtualProperties?: boolean):any {
        // Implemented in the decorator @supertypeClass
    }
    static amorphicFromJSON(json: string) {
        // Implemented in the decorator @supertypeClass
    }
    static createProperty(prop: String, defineProperty: Object) {
        // Implemented in the decorator @supertypeClass
    }
    static getProperties() {
        // Implemented in the decorator @supertypeClass
    }
    amorphicGetClassName () : string {
        // Implemented in the decorator @supertypeClass
        return '';
    }
    static fromJSON (json: string, idPrefix?: string) {
        // Implemented in the decorator @supertypeClass
    
    }

    static inject (injector: any) {
        // Implemented in Line 128, of ObjectTemplate.ts (static performInjections)
    }
    constructor(objectTemplate = ObjectTemplate) {
        var template = this.__template__;
        if (!template) {
            throw new Error(UtilityFunctions.constructorName(Object.getPrototypeOf(this).constructor) + ' missing @supertypeClass');
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
        this.__template__ = this.constructor as typeof Supertype;
        this.amorphicClass = this.constructor as typeof Supertype;

        if (this.__exceptions__) {
            objectTemplate.__exceptions__ = objectTemplate.__exceptions__ || [];
            for (var exceptionKey in this.__exceptions__) {
                objectTemplate.__exceptions__.push({
                    func: this.__exceptions__[exceptionKey],
                    class: UtilityFunctions.getName,
                    prop: exceptionKey
                });
            }
        }

        //@TODO: fill the properties of 'this' in? do I need this after deleting the callerContext approach
        // https://github.com/haven-life/supertype/issues/7
        return this;
    }
    amorphicToJSON(cb?){
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
    toJSONString(cb?) {
        return this.amorphicToJSON(cb)
    }
}