import { ObjectTemplate } from './ObjectTemplate';
export declare namespace UtilityFunctions {
    function constructorName(constructor: any): any;
    /**
     * Purpose unknown
     *
     * @param {unknown} props unknown
     *
     * @returns {unknown}
     */
    function getTemplateProperties(props: any, objectTemplateRef: typeof ObjectTemplate): {
        __toClient__?: any;
        __toServer__?: any;
    };
    function pruneExisting(obj: any, props: any): {};
    function getName(target: any): any;
    function defineProperties(target: any): any;
    function getDictionary(objectTemplate: any): void;
    function getParent(target: any, objectTemplate: any): any;
    function getChildren(target: any, objectTemplate: any): any;
}
