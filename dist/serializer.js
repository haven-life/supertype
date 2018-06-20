(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    function toJSONString(obj, cb) {
        var idMap = [];
        try {
            return JSON.stringify(obj, function a(key, value) {
                if (key === '__objectTemplate__' || key === 'amorphic') {
                    return null;
                }
                if (value && value.__template__ && value.__id__) {
                    if (idMap[value.__id__]) {
                        value = { __id__: value.__id__.toString() };
                    }
                    else {
                        idMap[value.__id__.toString()] = value;
                    }
                }
                if (cb) {
                    return cb(key, value);
                }
                return value;
            });
        }
        catch (e) {
            throw e;
        }
    }
    exports.toJSONString = toJSONString;
    function propXfer(prop, pojo, obj) {
        if (pojo[prop]) {
            obj[prop] = pojo[prop];
        }
    }
    /**
     * ObjectTemplate.fromPOJO
     */
    function fromPOJO(pojo, template, defineProperty, idMap, idQualifier, parent, prop, creator) {
        function getId(id) {
            if (typeof (idQualifier) !== 'undefined') {
                return id + '-' + idQualifier;
            }
            return id;
        }
        // For recording back refs
        if (!idMap) {
            idMap = {};
        }
        if (!pojo.__id__) {
            return;
        }
        var obj;
        if (creator) {
            obj = creator(parent, prop, template, idMap[pojo.__id__.toString()], pojo.__transient__);
            if (obj instanceof Array) {
                obj = obj[0];
                idMap[obj.__id__.toString()] = obj;
                return obj;
            }
            if (typeof (obj) === 'undefined') {
                return null;
            }
            if (!obj) {
                this.noInit = true;
                obj = new template();
                this.noInit = false;
            }
        }
        else {
            obj = this._createEmptyObject(template, getId(pojo.__id__.toString()), defineProperty, pojo.__transient__);
        }
        idMap[getId(pojo.__id__.toString())] = obj;
        // Go through all the properties and transfer them to newly created object
        var props = obj.__template__.getProperties();
        for (var propb in pojo) {
            propb = propb.replace(/^__/, '');
            var defineProp = props[propb];
            if (!defineProp)
                continue;
            var type = defineProp.type;
            // Because semotus can serialize only the shadow properties we try and restore them
            var pojoProp = (type && typeof pojo['__' + propb] !== 'undefined') ? '__' + propb : propb;
            if (type && pojo[pojoProp] == null) {
                obj[propb] = null;
            }
            else if (type && typeof (pojo[pojoProp]) !== 'undefined') {
                if (type == Array && defineProp.of && defineProp.of.isObjectTemplate) { // Array of templated objects
                    var arrayDirections = null;
                    if (creator) {
                        arrayDirections = creator(obj, propb, defineProp.of, idMap[pojo.__id__.toString()], pojo.__transient__);
                    }
                    if (typeof (arrayDirections) !== 'undefined') {
                        obj[propb] = [];
                        for (var ix = 0; ix < pojo[pojoProp].length; ++ix) {
                            var atype = pojo[pojoProp][ix].__template__ || defineProp.of;
                            if (pojo[pojoProp][ix]) {
                                if (pojo[pojoProp][ix].__id__ && idMap[getId(pojo[pojoProp][ix].__id__.toString())]) {
                                    obj[propb][ix] = idMap[getId(pojo[pojoProp][ix].__id__.toString())];
                                }
                                else {
                                    obj[propb][ix] = this.fromPOJO(pojo[pojoProp][ix], atype, defineProp, idMap, idQualifier, obj, propb, creator);
                                }
                            }
                            else {
                                obj[propb][ix] = null;
                            }
                        }
                    }
                    else {
                        obj[propb] = [];
                    }
                }
                else if (type.isObjectTemplate) { // Templated objects
                    var otype = pojo[pojoProp].__template__ || type;
                    if (pojo[pojoProp].__id__ && idMap[getId(pojo[pojoProp].__id__.toString())]) {
                        obj[propb] = idMap[getId(pojo[pojoProp].__id__.toString())];
                    }
                    else {
                        obj[propb] = this.fromPOJO(pojo[pojoProp], otype, defineProp, idMap, idQualifier, obj, propb, creator);
                    }
                }
                else if (type == Date) {
                    if (pojo[pojoProp]) {
                        obj[propb] = new Date(pojo[pojoProp]);
                    }
                    else {
                        obj[propb] = null;
                    }
                }
                else {
                    obj[propb] = pojo[pojoProp];
                }
            }
        }
        // For the benefit of persistObjectTemplate
        if (!creator && pojo._id) {
            obj._id = getId(pojo._id);
        }
        if (!creator) {
            propXfer('__changed__', pojo, obj);
            propXfer('__version__', pojo, obj);
        }
        propXfer('__toServer__', pojo, obj);
        propXfer('__toClient__', pojo, obj);
        return obj;
    }
    exports.fromPOJO = fromPOJO;
    ;
    /**
     * ObjectTemplate.fromJSON
     */
    function fromJSON(str, template, idQualifier) {
        return this.fromPOJO(JSON.parse(str), template, null, null, idQualifier);
    }
    exports.fromJSON = fromJSON;
    ;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQTs7T0FFRztJQUNIOzs7Ozs7OztPQVFHO0lBQ0gsc0JBQTZCLEdBQUcsRUFBRSxFQUFHO1FBQ2pDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUVmLElBQUk7WUFDQSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFdBQVcsR0FBRyxFQUFFLEtBQUs7Z0JBQzVDLElBQUksR0FBRyxLQUFLLG9CQUFvQixJQUFJLEdBQUcsS0FBSyxVQUFVLEVBQUU7b0JBQ3BELE9BQU8sSUFBSSxDQUFDO2lCQUNmO2dCQUNELElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtvQkFDN0MsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUNyQixLQUFLLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO3FCQUMvQzt5QkFDSTt3QkFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztxQkFDMUM7aUJBQ0o7Z0JBRUQsSUFBSSxFQUFFLEVBQUU7b0JBQ0osT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUN6QjtnQkFFRCxPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FBQztTQUNOO1FBQ0QsT0FBTyxDQUFDLEVBQUU7WUFDTixNQUFNLENBQUMsQ0FBQztTQUNYO0lBQ0wsQ0FBQztJQTNCRCxvQ0EyQkM7SUFFRCxrQkFBa0IsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHO1FBQzdCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ1osR0FBRyxD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Iiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBPYmplY3RUZW1wbGF0ZS50b0pTT05TdHJpbmc7XG4gKi9cbi8qKlxuICogQ29udmVydCBhbiBvYmplY3QgdG8gSlNPTiwgc3RyaXBwaW5nIGFueSByZWN1cnNpdmUgb2JqZWN0IHJlZmVyZW5jZXMgc28gdGhleSBjYW4gYmVcbiAqIHJlY29uc3RpdHV0ZWQgbGF0ZXJcbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IG9iaiB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IGNiIHVua25vd25cbiAqXG4gKiBAcmV0dXJucyB7dW5rbm93bn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvSlNPTlN0cmluZyhvYmosIGNiPykge1xuICAgIHZhciBpZE1hcCA9IFtdO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaiwgZnVuY3Rpb24gYShrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnX19vYmplY3RUZW1wbGF0ZV9fJyB8fCBrZXkgPT09ICdhbW9ycGhpYycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5fX3RlbXBsYXRlX18gJiYgdmFsdWUuX19pZF9fKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlkTWFwW3ZhbHVlLl9faWRfX10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB7IF9faWRfXzogdmFsdWUuX19pZF9fLnRvU3RyaW5nKCkgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlkTWFwW3ZhbHVlLl9faWRfXy50b1N0cmluZygpXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJvcFhmZXIocHJvcCwgcG9qbywgb2JqKSB7XG4gICAgaWYgKHBvam9bcHJvcF0pIHtcbiAgICAgICAgb2JqW3Byb3BdID0gcG9qb1twcm9wXTtcbiAgICB9XG59XG5cbi8qKlxuICogT2JqZWN0VGVtcGxhdGUuZnJvbVBPSk9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21QT0pPKHBvam8sIHRlbXBsYXRlLCBkZWZpbmVQcm9wZXJ0eT8sIGlkTWFwPywgaWRRdWFsaWZpZXI/LCBwYXJlbnQ/LCBwcm9wPywgY3JlYXRvcj8pIHtcbiAgICBmdW5jdGlvbiBnZXRJZChpZCkge1xuICAgICAgICBpZiAodHlwZW9mIChpZFF1YWxpZmllcikgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gaWQgKyAnLScgKyBpZFF1YWxpZmllcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICAvLyBGb3IgcmVjb3JkaW5nIGJhY2sgcmVmc1xuICAgIGlmICghaWRNYXApIHtcbiAgICAgICAgaWRNYXAgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIXBvam8uX19pZF9fKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgb2JqO1xuXG4gICAgaWYgKGNyZWF0b3IpIHtcbiAgICAgICAgb2JqID0gY3JlYXRvcihwYXJlbnQsIHByb3AsIHRlbXBsYXRlLCBpZE1hcFtwb2pvLl9faWRfXy50b1N0cmluZygpXSwgcG9qby5fX3RyYW5zaWVudF9fKTtcblxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIG9iaiA9IG9ialswXTtcbiAgICAgICAgICAgIGlkTWFwW29iai5fX2lkX18udG9TdHJpbmcoKV0gPSBvYmo7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAob2JqKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvYmopIHtcbiAgICAgICAgICAgIHRoaXMubm9Jbml0ID0gdHJ1ZTtcbiAgICAgICAgICAgIG9iaiA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5ub0luaXQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb2JqID0gdGhpcy5fY3JlYXRlRW1wdHlPYmplY3QodGVtcGxhdGUsIGdldElkKHBvam8uX19pZF9fLnRvU3RyaW5nKCkpLCBkZWZpbmVQcm9wZXJ0eSwgcG9qby5fX3RyYW5zaWVudF9fKTtcbiAgICB9XG5cbiAgICBpZE1hcFtnZXRJZChwb2pvLl9faWRfXy50b1N0cmluZygpKV0gPSBvYmo7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGFsbCB0aGUgcHJvcGVydGllcyBhbmQgdHJhbnNmZXIgdGhlbSB0byBuZXdseSBjcmVhdGVkIG9iamVjdFxuICAgIHZhciBwcm9wcyA9IG9iai5fX3RlbXBsYXRlX18uZ2V0UHJvcGVydGllcygpO1xuXG4gICAgZm9yICh2YXIgcHJvcGIgaW4gcG9qbykge1xuICAgICAgICBwcm9wYiA9IHByb3BiLnJlcGxhY2UoL15fXy8sICcnKTtcbiAgICAgICAgdmFyIGRlZmluZVByb3AgPSBwcm9wc1twcm9wYl07XG4gICAgICAgIGlmICghZGVmaW5lUHJvcClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB2YXIgdHlwZSA9IGRlZmluZVByb3AudHlwZTtcblxuICAgICAgICAvLyBCZWNhdXNlIHNlbW90dXMgY2FuIHNlcmlhbGl6ZSBvbmx5IHRoZSBzaGFkb3cgcHJvcGVydGllcyB3ZSB0cnkgYW5kIHJlc3RvcmUgdGhlbVxuICAgICAgICB2YXIgcG9qb1Byb3AgPSAodHlwZSAmJiB0eXBlb2YgcG9qb1snX18nICsgcHJvcGJdICE9PSAndW5kZWZpbmVkJykgPyAnX18nICsgcHJvcGIgOiBwcm9wYjtcblxuICAgICAgICBpZiAodHlwZSAmJiBwb2pvW3Bvam9Qcm9wXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBvYmpbcHJvcGJdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlICYmIHR5cGVvZiAocG9qb1twb2pvUHJvcF0pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT0gQXJyYXkgJiYgZGVmaW5lUHJvcC5vZiAmJiBkZWZpbmVQcm9wLm9mLmlzT2JqZWN0VGVtcGxhdGUpIHsgLy8gQXJyYXkgb2YgdGVtcGxhdGVkIG9iamVjdHNcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXlEaXJlY3Rpb25zID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChjcmVhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGFycmF5RGlyZWN0aW9ucyA9IGNyZWF0b3Iob2JqLCBwcm9wYiwgZGVmaW5lUHJvcC5vZiwgaWRNYXBbcG9qby5fX2lkX18udG9TdHJpbmcoKV0sIHBvam8uX190cmFuc2llbnRfXyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoYXJyYXlEaXJlY3Rpb25zKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCBwb2pvW3Bvam9Qcm9wXS5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHlwZSA9IHBvam9bcG9qb1Byb3BdW2l4XS5fX3RlbXBsYXRlX18gfHwgZGVmaW5lUHJvcC5vZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2pvW3Bvam9Qcm9wXVtpeF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9qb1twb2pvUHJvcF1baXhdLl9faWRfXyAmJiBpZE1hcFtnZXRJZChwb2pvW3Bvam9Qcm9wXVtpeF0uX19pZF9fLnRvU3RyaW5nKCkpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdW2l4XSA9IGlkTWFwW2dldElkKHBvam9bcG9qb1Byb3BdW2l4XS5fX2lkX18udG9TdHJpbmcoKSldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXVtpeF0gPSB0aGlzLmZyb21QT0pPKHBvam9bcG9qb1Byb3BdW2l4XSwgYXR5cGUsIGRlZmluZVByb3AsIGlkTWFwLCBpZFF1YWxpZmllciwgb2JqLCBwcm9wYiwgY3JlYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXVtpeF0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZS5pc09iamVjdFRlbXBsYXRlKSB7IC8vIFRlbXBsYXRlZCBvYmplY3RzXG4gICAgICAgICAgICAgICAgdmFyIG90eXBlID0gcG9qb1twb2pvUHJvcF0uX190ZW1wbGF0ZV9fIHx8IHR5cGU7XG4gICAgICAgICAgICAgICAgaWYgKHBvam9bcG9qb1Byb3BdLl9faWRfXyAmJiBpZE1hcFtnZXRJZChwb2pvW3Bvam9Qcm9wXS5fX2lkX18udG9TdHJpbmcoKSldKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSBpZE1hcFtnZXRJZChwb2pvW3Bvam9Qcm9wXS5fX2lkX18udG9TdHJpbmcoKSldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IHRoaXMuZnJvbVBPSk8ocG9qb1twb2pvUHJvcF0sIG90eXBlLCBkZWZpbmVQcm9wLCBpZE1hcCwgaWRRdWFsaWZpZXIsIG9iaiwgcHJvcGIsIGNyZWF0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gRGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmIChwb2pvW3Bvam9Qcm9wXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gbmV3IERhdGUocG9qb1twb2pvUHJvcF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IHBvam9bcG9qb1Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRm9yIHRoZSBiZW5lZml0IG9mIHBlcnNpc3RPYmplY3RUZW1wbGF0ZVxuICAgIGlmICghY3JlYXRvciAmJiBwb2pvLl9pZCkge1xuICAgICAgICBvYmouX2lkID0gZ2V0SWQocG9qby5faWQpO1xuICAgIH1cblxuICAgIGlmICghY3JlYXRvcikge1xuICAgICAgICBwcm9wWGZlcignX19jaGFuZ2VkX18nLCBwb2pvLCBvYmopO1xuICAgICAgICBwcm9wWGZlcignX192ZXJzaW9uX18nLCBwb2pvLCBvYmopO1xuICAgIH1cblxuICAgIHByb3BYZmVyKCdfX3RvU2VydmVyX18nLCBwb2pvLCBvYmopO1xuICAgIHByb3BYZmVyKCdfX3RvQ2xpZW50X18nLCBwb2pvLCBvYmopO1xuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cblxuLyoqXG4gKiBPYmplY3RUZW1wbGF0ZS5mcm9tSlNPTlxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbUpTT04oc3RyLCB0ZW1wbGF0ZSwgaWRRdWFsaWZpZXIpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tUE9KTyhKU09OLnBhcnNlKHN0ciksIHRlbXBsYXRlLCBudWxsLCBudWxsLCBpZFF1YWxpZmllcik7XG59O1xuIl19