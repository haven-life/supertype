import { ObjectTemplate } from './ObjectTemplate';
export declare type SupertypeConstructor = typeof Supertype;
declare type DefinePropertyType = {
    isLocal?: any;
    toClient?: any;
    toServer?: any;
    type?: any;
    of?: any;
    body?: any;
    on?: any;
    validate?: any;
    value?: any;
};
export declare type Constructable = new (...args: any[]) => {};
/**
 * This is the base class for typescript classes.
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */
export declare class Supertype {
    static __injections__: Array<Function>;
    static isObjectTemplate: boolean;
    static __objectTemplate__: typeof ObjectTemplate;
    /**
     * @TODO: Doublecheck this false/false setup may cause problems
     */
    static __toClient__: boolean;
    static __toServer__: boolean;
    static __shadowChildren__: any[];
    static amorphicCreateProperty(prop: string, defineProperty: DefinePropertyType): void;
    static readonly amorphicClassName: string;
    static readonly amorphicChildClasses: Array<SupertypeConstructor>;
    static readonly amorphicParentClass: SupertypeConstructor;
    static amorphicGetProperties(includeVirtualProperties?: boolean): any;
    static readonly amorphicProperties: any;
    static readonly amorphicStatic: typeof ObjectTemplate;
    /**
     * Legacy
     *
     * @static
     * @param {string} prop
     * @param {Object} defineProperty
     * @memberof Supertype
     */
    static createProperty(prop: string, defineProperty: DefinePropertyType): void;
    static amorphicFromJSON(json: string, idPrefix?: any): any;
    static readonly __children__: Array<SupertypeConstructor>;
    static readonly defineProperties: any;
    /**
     * Legacy
     *
     * @static
     * @param {string} json
     * @param {string} [idPrefix]
     * @memberof Supertype
     */
    static fromJSON(json: string, idPrefix?: string): any;
    static fromPOJO(pojo: any): any;
    /**
     * Legacy method
     *
     * @static
     * @memberof Supertype
     */
    static getProperties(includeVirtualProperties?: boolean): any;
    static inject(injector: any): void;
    static readonly __name__: string;
    static readonly parentTemplate: any;
    static readonly __parent__: SupertypeConstructor;
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
    __id__: string;
    amorphicLeaveEmpty: boolean;
    __amorphicprops__: any;
    __exceptions__: any;
    constructor(objectTemplate?: typeof ObjectTemplate);
    amorphicToJSON(cb?: any): string;
    amorphicGetPropertyDefinition(prop: any): any;
    amorphicGetPropertyValues(prop: any): any;
    amorphicGetPropertyDescriptions(prop: any): any;
    amorphicGetClassName(): string;
    createCopy(creator: any): any;
    inject(injector: any): void;
    copyProperties(obj: any): void;
    /**
     * Legacy alias of amoprhicPropertyDefinition. Should be protected
     *
     * @param {*} prop
     * @returns
     * @memberof Supertype
     */
    __prop__(prop: any): any;
    /**
     * Legacy alias of amorphicGetPropertyValues. Should be protected
     *
     * @param {*} prop
     * @returns
     * @memberof Supertype
     */
    __values__(prop: any): any;
    /**
     * Legacy alias of amorphicGetPropertyDescriptions. Should be protected
     *
     * @param {*} prop
     * @returns
     * @memberof Supertype
     */
    __descriptions__(prop: any): any;
    /**
     * Legacy alias of amorphicToJSON. Should be protected
     *
     * @param {Function} callback
     * @returns
     * @memberof Supertype
     */
    toJSONString(cb?: any): string;
    /**
     * Legacy members of Supertype. Don't need to be interacted with. Only used in ObjectTemplate.ts
     *
     * @static
     */
    static __shadowParent__: any;
    static props?: any;
    static __createParameters__: any;
    static functionProperties: any;
    static extend: any;
    static staticMixin: any;
    static mixin: any;
    static objectProperties: any;
}
export {};
