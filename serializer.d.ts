/**
 * ObjectTemplate.toJSONString;
 */
/**
 * Convert an object to JSON, stripping any recursive object references so they can be
 * reconstituted later
 *
 * @param {unknown} obj unknown
 * @param {unknown} cb unknown
 *
 * @returns {unknown}
 */
export declare function toJSONString(obj: any, cb?: any): string;
/**
 * ObjectTemplate.fromPOJO
 */
export declare function fromPOJO(pojo: any, template: any, defineProperty?: any, idMap?: any, idQualifier?: any, parent?: any, prop?: any, creator?: any): any;
/**
 * ObjectTemplate.fromJSON
 */
export declare function fromJSON(str: any, template: any, idQualifier: any): any;
