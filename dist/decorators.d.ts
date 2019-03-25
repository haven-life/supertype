export { Supertype } from './Supertype';
import 'reflect-metadata';
/**
    *
    * @param {*} objectProps- optional property for passing params into supertypeclass, if no params, is undefined,
    *                      first param of this function defaults to objectTemplate instead
    * @param {*} objectTemplate
    *
    * @TODO: fix return types
    * https://github.com/haven-life/supertype/issues/6
    */
export declare function supertypeClass(objectProps?: any, objectTemplate?: any): any;
export declare function property(props?: any): any;
export declare function remote(defineProperty: any): (target: any, propertyName: any, descriptor: any) => void;
