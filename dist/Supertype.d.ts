import { ObjectTemplate } from './ObjectTemplate';
export declare type Constructable = new (...args: any[]) => {};
/**
 * This is the base class for typescript classes.
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */
export declare class Supertype {
    __template__: any;
    amorphic: typeof ObjectTemplate;
    static amorphicCreateProperty(prop: String, defineProperty: Object): void;
    static amorphicGetProperties(includeVirtualProperties?: boolean): any;
    static amorphicFromJSON(json: string): void;
    static createProperty(prop: String, defineProperty: Object): void;
    static getProperties(): void;
    amorphicGetClassName(): string;
    static fromJSON(json: string, idPrefix?: string): void;
    static inject(injector: any): void;
    static amorphicProperties: any;
    static amorphicChildClasses: Array<Constructable>;
    static amorphicParentClass: Constructable;
    static amorphicClassName: string;
    static amorphicStatic: typeof ObjectTemplate;
    __id__: String;
    amorphicLeaveEmpty: boolean;
    static __children__: Array<Constructable>;
    static __parent__: Constructable;
    amorphicClass: any;
    constructor(objectTemplate?: typeof ObjectTemplate);
    amorphicToJSON(cb?: any): string;
    amorphicGetPropertyDefinition(prop: any): any;
    amorphicGetPropertyValues(prop: any): any;
    amorphicGetPropertyDescriptions(prop: any): any;
    createCopy(creator: any): any;
    inject(injector: any): void;
    copyProperties(obj: any): void;
    __prop__(prop: any): any;
    __values__(prop: any): any;
    __descriptions__(prop: any): any;
    toJSONString(cb?: any): string;
}
