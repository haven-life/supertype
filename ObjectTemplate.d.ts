import * as serializer from './serializer';
import { SupertypeLogger } from './SupertypeLogger';
declare type CreateTypeForName = {
    name?: string;
    toClient?: boolean;
    toServer?: boolean;
    isLocal?: boolean;
};
/**
 * this is pretty much the class (the template itself)
 * Try to unify this with the Supertype Type (maybe make this a partial, have supertype extend this)
 */
declare type ConstructorType = Function & {
    amorphicClassName: any;
    __shadowParent__: any;
    props?: any;
    __parent__: any;
    __name__: any;
    __createParameters__: any;
    functionProperties: any;
    isObjectTemplate: any;
    extend: any;
    staticMixin: any;
    mixin: any;
    fromPOJO: any;
    fromJSON: any;
    getProperties: (includeVirtual: any) => any;
    prototype: any;
    defineProperties: any;
    objectProperties: any;
    parentTemplate: any;
    createProperty: any;
    __template__: any;
    __injections__: any;
};
declare type ObjectTemplateClone = typeof ObjectTemplate;
/**
 * the og ObjectTemplate, what everything picks off of
 */
export declare class ObjectTemplate {
    static lazyTemplateLoad: any;
    static isLocalRuleSet: any;
    static nextId: any;
    static __exceptions__: any;
    static __templates__: ConstructorType[];
    static toServerRuleSet: string[];
    static toClientRuleSet: string[];
    static templateInterceptor: any;
    static __dictionary__: {
        [key: string]: ConstructorType;
    };
    static __anonymousId__: number;
    static __templatesToInject__: {};
    static logger: any;
    static __templateUsage__: any;
    static __injections__: Function[];
    static __toClient__: boolean;
    static amorphicStatic: typeof ObjectTemplate;
    /**
     * Purpose unknown
     */
    static performInjections(): void;
    static init(): void;
    static getTemplateByName(name: any): ConstructorType;
    /**
 * Purpose unknown
 *
 * @param {unknown} template unknown
 * @param {unknown} name unknown
 * @param {unknown} props unknown
 */
    static setTemplateProperties(template: any, name: any, props: any): void;
    /**
     * Purpose unknown
     *
     * @param {unknown} props unknown
     *
     * @returns {unknown}
     */
    static getTemplateProperties(props: any): {
        __toClient__?: any;
        __toServer__?: any;
    };
    /**
        * Create an object template that is instantiated with the new operator.
        * properties is
        *
        * @param {unknown} name the name of the template or an object with
        *        name - the name of the class
        *        toClient - whether the object is to be shipped to the client (with semotus)
        *        toServer - whether the object is to be shipped to the server (with semotus)
        *        isLocal - equivalent to setting toClient && toServer to false
        * @param {unknown} properties an object whose properties represent data and function
        * properties of the object.  The data properties may use the defineProperty
        * format for properties or may be properties assigned a Number, String or Date.
        *
        * @returns {*} the object template
        */
    static create(name: string | CreateTypeForName, properties: any): any;
    /**
     * Extend and existing (parent template)
     *
     * @param {unknown} parentTemplate unknown
     * @param {unknown} name the name of the template or an object with
     *        name - the name of the class
     *        toClient - whether the object is to be shipped to the client (with semotus)
     *        toServer - whether the object is to be shipped to the server (with semotus)
     *        isLocal - equivalent to setting toClient && toServer to false
     * @param {unknown} properties are the same as for create
     *
     * @returns {*} the object template
     */
    static extend(parentTemplate: any, name: string | CreateTypeForName, properties: any): any;
    static mixin(template: any, properties: any): any;
    /**
    * Purpose unknown
    *
    * @param {unknown} template unknown
    * @param {unknown} properties unknown
    */
    static staticMixin(template: any, properties: any): void;
    /**
     * Add a function that will fire on object creation
     *
     * @param {unknown} template unknown
     * @param {Function} injector unknown
     */
    static inject(template: any, injector: Function): void;
    /**
     * Add a function that will fire on all object creations (apparently)? Just a guess
     *
     * @param {Function} injector - unknown
     */
    static globalInject(injector: Function): void;
    /**
     * Create the template if it needs to be created
     * @param [unknown} template to be created
     */
    static createIfNeeded(template?: any, thisObj?: any): void;
    static getClasses(): {
        [key: string]: ConstructorType;
    };
    /**
     * Overridden by other Type Systems to cache or globally identify objects
     * Also assigns a unique internal Id so that complex structures with
     * recursive objects can be serialized
     *
     * @param {unknown} obj - the object to be passed during creation time
     * @param {unknown} template - unknown
     *
     * @returns {unknown}
     *
     * @private
     */
    static _stashObject(obj: any, template: any): boolean;
    /**
     * Overridden by other Type Systems to inject other elements
     *
     * @param {_template} _template - the object to be passed during creation time
     *
     * @private
     * */
    static _injectIntoTemplate(_template: any): void;
    /**
     * Used by template setup to create an property descriptor for use by the constructor
     *
     * @param {unknown} propertyName is the name of the property
     * @param {unknown} defineProperty is the property descriptor passed to the template
     * @param {unknown} objectProperties is all properties that will be processed manually.  A new property is
     *                         added to this if the property needs to be initialized by value
     * @param {unknown} defineProperties is all properties that will be passed to Object.defineProperties
     *                         A new property will be added to this object
     *
     * @private
     */
    static _setupProperty(propertyName: any, defineProperty: any, objectProperties: any, defineProperties: any): void;
    /**
     * Clone an object created from an ObjectTemplate
     * Used only within supertype (see copyObject for general copy)
     *
     * @param obj is the source object
     * @param template is the template used to create the object
     *
     * @returns {*} a copy of the object
     */
    static clone(obj: any, template?: any): any;
    /**
     * Overridden by other Type Systems to be able to create remote functions or
     * otherwise intercept function calls
     *
     * @param {unknown} _propertyName is the name of the function
     * @param {unknown} propertyValue is the function itself
     *
     * @returns {*} a new function to be assigned to the object prototype
     *
     * @private
     */
    static _setupFunction(_propertyName: any, propertyValue: any): any;
    /**
 * Purpose unknown
 *
 * @param {unknown} obj unknown
 * @param {unknown} creator unknown
 *
 * @returns {unknown}
 */
    static createCopy(obj: any, creator: any): any;
    /**
     * Abstract function for benefit of Semotus
     *
     * @param {unknown} cb unknown
     */
    static withoutChangeTracking(cb: any): void;
    /**
     * Purpose unknown
     *
     * @param {unknown} pojo unknown
     * @param {unknown} template unknown
     * @param {unknown} defineProperty unknown
     * @param {unknown} idMap unknown
     * @param {unknown} idQualifier unknown
     * @param {unknown} parent unknown
     * @param {unknown} prop unknown
     * @param {unknown} creator unknown
     *
    * @returns {unknown}
    */
    static fromPOJO: typeof serializer.fromPOJO;
    /**
    * Purpose unknown
    *
    * @param {unknown} str unknown
    * @param {unknown} template unknown
    * @param {unknown} idQualifier unknown
    * objectTemplate.fromJSON(str, template, idQualifier)
    * @returns {unknown}
    */
    static fromJSON: typeof serializer.fromJSON;
    /**
     * Convert an object to JSON, stripping any recursive object references so they can be
     * reconstituted later
     *
     * @param {unknown} obj unknown
     * @param {unknown} cb unknown
     *
     * @returns {unknown}
     */
    static toJSONString: typeof serializer.toJSONString;
    /**
/**
 * Find the right subclass to instantiate by either looking at the
 * declared list in the subClasses define property or walking through
 * the subclasses of the declared template
 *
 * @param {unknown} template unknown
 * @param {unknown} objId unknown
 * @param {unknown} defineProperty unknown
 * @returns {*}
 * @private
 */
    static _resolveSubClass(template: any, objId: any, defineProperty: any): any;
    /**
     * Walk recursively through extensions of template via __children__
     * looking for a name match
     *
     * @param {unknown} template unknown
     * @param {unknown} templateName unknown
     * @returns {*}
     * @private
     */
    static _findSubClass(template: any, templateName: any): any;
    /**
     * Return the highest level template
     *
     * @param {unknown} template unknown
     *
     * @returns {*}
     *
     * @private
     */
    static _getBaseClass(template: any): any;
    /**
 * An overridable function used to create an object from a template and optionally
 * manage the caching of that object (used by derivative type systems).  It
 * preserves the original id of an object
 *
 * @param {unknown} template of object
 * @param {unknown} objId and id (if present)
 * @param {unknown} defineProperty unknown
 * @returns {*}
 * @private
 */
    static _createEmptyObject(template: any, objId: any, defineProperty: any): any;
    /**
     * Looks up a property in the defineProperties saved with the template cascading
     * up the prototype chain to find it
     *
     * @param {unknown} prop is the property being sought
     * @param {unknown} template is the template used to create the object containing the property
     * @returns {*} the "defineProperty" structure for the property
     * @private
     */
    static _getDefineProperty(prop: any, template: any): any;
    /**
     * Returns a hash of all properties including those inherited
     *
     * @param {unknown} template is the template used to create the object containing the property
     * @param {unknown} returnValue unknown
     * @param {unknown} includeVirtual unknown
     * @returns {*} an associative array of each "defineProperty" structure for the property
     * @private
     */
    static _getDefineProperties(template: any, returnValue: any, includeVirtual: any): any;
    /**
     *
     * General function to create templates used by create, extend and mixin
     *
     * @param {unknown} mixinTemplate - template used for a mixin
     * @param {unknown} parentTemplate - template used for an extend
     * @param {unknown} propertiesOrTemplate - properties to be added/mxied in
     * @param {unknown} createProperties unknown
     * @param {unknown} templateName - the name of the template as it will be stored retrieved from dictionary
     *
     * @returns {Function}
     *
     * @private
     */
    private static _createTemplate;
    /**
     * A function to clone the Type System
     * @returns {o}
     * @private
     */
    static _createObject(): ObjectTemplateClone;
    /**
    * Purpose unknown
    * @param {unknown} originally took a context that it threw away
    * @returns {SupertypeLogger}
    */
    static createLogger(): SupertypeLogger;
}
export {};
