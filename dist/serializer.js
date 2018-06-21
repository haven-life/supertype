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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zZXJpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUE7O09BRUc7SUFDSDs7Ozs7Ozs7T0FRRztJQUNILHNCQUE2QixHQUFHLEVBQUUsRUFBRztRQUNqQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7UUFFZixJQUFJO1lBQ0EsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxXQUFXLEdBQUcsRUFBRSxLQUFLO2dCQUM1QyxJQUFJLEdBQUcsS0FBSyxvQkFBb0IsSUFBSSxHQUFHLEtBQUssVUFBVSxFQUFFO29CQUNwRCxPQUFPLElBQUksQ0FBQztpQkFDZjtnQkFDRCxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7b0JBQzdDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDckIsS0FBSyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztxQkFDL0M7eUJBQ0k7d0JBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7cUJBQzFDO2lCQUNKO2dCQUVELElBQUksRUFBRSxFQUFFO29CQUNKLE9BQU8sRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDekI7Z0JBRUQsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUM7U0FDTjtRQUNELE9BQU8sQ0FBQyxFQUFFO1lBQ04sTUFBTSxDQUFDLENBQUM7U0FDWDtJQUNMLENBQUM7SUEzQkQsb0NBMkJDO0lBRUQsa0JBQWtCLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRztRQUM3QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNaLEdB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Q0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT2JqZWN0VGVtcGxhdGUudG9KU09OU3RyaW5nO1xuICovXG4vKipcbiAqIENvbnZlcnQgYW4gb2JqZWN0IHRvIEpTT04sIHN0cmlwcGluZyBhbnkgcmVjdXJzaXZlIG9iamVjdCByZWZlcmVuY2VzIHNvIHRoZXkgY2FuIGJlXG4gKiByZWNvbnN0aXR1dGVkIGxhdGVyXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSBvYmogdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBjYiB1bmtub3duXG4gKlxuICogQHJldHVybnMge3Vua25vd259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0pTT05TdHJpbmcob2JqLCBjYj8pIHtcbiAgICB2YXIgaWRNYXAgPSBbXTtcblxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIGZ1bmN0aW9uIGEoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gJ19fb2JqZWN0VGVtcGxhdGVfXycgfHwga2V5ID09PSAnYW1vcnBoaWMnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuX190ZW1wbGF0ZV9fICYmIHZhbHVlLl9faWRfXykge1xuICAgICAgICAgICAgICAgIGlmIChpZE1hcFt2YWx1ZS5fX2lkX19dKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0geyBfX2lkX186IHZhbHVlLl9faWRfXy50b1N0cmluZygpIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZE1hcFt2YWx1ZS5fX2lkX18udG9TdHJpbmcoKV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYihrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByb3BYZmVyKHByb3AsIHBvam8sIG9iaikge1xuICAgIGlmIChwb2pvW3Byb3BdKSB7XG4gICAgICAgIG9ialtwcm9wXSA9IHBvam9bcHJvcF07XG4gICAgfVxufVxuXG4vKipcbiAqIE9iamVjdFRlbXBsYXRlLmZyb21QT0pPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tUE9KTyhwb2pvLCB0ZW1wbGF0ZSwgZGVmaW5lUHJvcGVydHk/LCBpZE1hcD8sIGlkUXVhbGlmaWVyPywgcGFyZW50PywgcHJvcD8sIGNyZWF0b3I/KSB7XG4gICAgZnVuY3Rpb24gZ2V0SWQoaWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoaWRRdWFsaWZpZXIpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIGlkICsgJy0nICsgaWRRdWFsaWZpZXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgLy8gRm9yIHJlY29yZGluZyBiYWNrIHJlZnNcbiAgICBpZiAoIWlkTWFwKSB7XG4gICAgICAgIGlkTWFwID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFwb2pvLl9faWRfXykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG9iajtcblxuICAgIGlmIChjcmVhdG9yKSB7XG4gICAgICAgIG9iaiA9IGNyZWF0b3IocGFyZW50LCBwcm9wLCB0ZW1wbGF0ZSwgaWRNYXBbcG9qby5fX2lkX18udG9TdHJpbmcoKV0sIHBvam8uX190cmFuc2llbnRfXyk7XG5cbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBvYmogPSBvYmpbMF07XG4gICAgICAgICAgICBpZE1hcFtvYmouX19pZF9fLnRvU3RyaW5nKCldID0gb2JqO1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG9iaikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb2JqKSB7XG4gICAgICAgICAgICB0aGlzLm5vSW5pdCA9IHRydWU7XG4gICAgICAgICAgICBvYmogPSBuZXcgdGVtcGxhdGUoKTtcbiAgICAgICAgICAgIHRoaXMubm9Jbml0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9iaiA9IHRoaXMuX2NyZWF0ZUVtcHR5T2JqZWN0KHRlbXBsYXRlLCBnZXRJZChwb2pvLl9faWRfXy50b1N0cmluZygpKSwgZGVmaW5lUHJvcGVydHksIHBvam8uX190cmFuc2llbnRfXyk7XG4gICAgfVxuXG4gICAgaWRNYXBbZ2V0SWQocG9qby5fX2lkX18udG9TdHJpbmcoKSldID0gb2JqO1xuXG4gICAgLy8gR28gdGhyb3VnaCBhbGwgdGhlIHByb3BlcnRpZXMgYW5kIHRyYW5zZmVyIHRoZW0gdG8gbmV3bHkgY3JlYXRlZCBvYmplY3RcbiAgICB2YXIgcHJvcHMgPSBvYmouX190ZW1wbGF0ZV9fLmdldFByb3BlcnRpZXMoKTtcblxuICAgIGZvciAodmFyIHByb3BiIGluIHBvam8pIHtcbiAgICAgICAgcHJvcGIgPSBwcm9wYi5yZXBsYWNlKC9eX18vLCAnJyk7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wID0gcHJvcHNbcHJvcGJdO1xuICAgICAgICBpZiAoIWRlZmluZVByb3ApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgdmFyIHR5cGUgPSBkZWZpbmVQcm9wLnR5cGU7XG5cbiAgICAgICAgLy8gQmVjYXVzZSBzZW1vdHVzIGNhbiBzZXJpYWxpemUgb25seSB0aGUgc2hhZG93IHByb3BlcnRpZXMgd2UgdHJ5IGFuZCByZXN0b3JlIHRoZW1cbiAgICAgICAgdmFyIHBvam9Qcm9wID0gKHR5cGUgJiYgdHlwZW9mIHBvam9bJ19fJyArIHByb3BiXSAhPT0gJ3VuZGVmaW5lZCcpID8gJ19fJyArIHByb3BiIDogcHJvcGI7XG5cbiAgICAgICAgaWYgKHR5cGUgJiYgcG9qb1twb2pvUHJvcF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgb2JqW3Byb3BiXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZSAmJiB0eXBlb2YgKHBvam9bcG9qb1Byb3BdKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlID09IEFycmF5ICYmIGRlZmluZVByb3Aub2YgJiYgZGVmaW5lUHJvcC5vZi5pc09iamVjdFRlbXBsYXRlKSB7IC8vIEFycmF5IG9mIHRlbXBsYXRlZCBvYmplY3RzXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5RGlyZWN0aW9ucyA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3JlYXRvcikge1xuICAgICAgICAgICAgICAgICAgICBhcnJheURpcmVjdGlvbnMgPSBjcmVhdG9yKG9iaiwgcHJvcGIsIGRlZmluZVByb3Aub2YsIGlkTWFwW3Bvam8uX19pZF9fLnRvU3RyaW5nKCldLCBwb2pvLl9fdHJhbnNpZW50X18pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKGFycmF5RGlyZWN0aW9ucykgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgcG9qb1twb2pvUHJvcF0ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXR5cGUgPSBwb2pvW3Bvam9Qcm9wXVtpeF0uX190ZW1wbGF0ZV9fIHx8IGRlZmluZVByb3Aub2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9qb1twb2pvUHJvcF1baXhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvam9bcG9qb1Byb3BdW2l4XS5fX2lkX18gJiYgaWRNYXBbZ2V0SWQocG9qb1twb2pvUHJvcF1baXhdLl9faWRfXy50b1N0cmluZygpKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXVtpeF0gPSBpZE1hcFtnZXRJZChwb2pvW3Bvam9Qcm9wXVtpeF0uX19pZF9fLnRvU3RyaW5nKCkpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl1baXhdID0gdGhpcy5mcm9tUE9KTyhwb2pvW3Bvam9Qcm9wXVtpeF0sIGF0eXBlLCBkZWZpbmVQcm9wLCBpZE1hcCwgaWRRdWFsaWZpZXIsIG9iaiwgcHJvcGIsIGNyZWF0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl1baXhdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUuaXNPYmplY3RUZW1wbGF0ZSkgeyAvLyBUZW1wbGF0ZWQgb2JqZWN0c1xuICAgICAgICAgICAgICAgIHZhciBvdHlwZSA9IHBvam9bcG9qb1Byb3BdLl9fdGVtcGxhdGVfXyB8fCB0eXBlO1xuICAgICAgICAgICAgICAgIGlmIChwb2pvW3Bvam9Qcm9wXS5fX2lkX18gJiYgaWRNYXBbZ2V0SWQocG9qb1twb2pvUHJvcF0uX19pZF9fLnRvU3RyaW5nKCkpXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gaWRNYXBbZ2V0SWQocG9qb1twb2pvUHJvcF0uX19pZF9fLnRvU3RyaW5nKCkpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSB0aGlzLmZyb21QT0pPKHBvam9bcG9qb1Byb3BdLCBvdHlwZSwgZGVmaW5lUHJvcCwgaWRNYXAsIGlkUXVhbGlmaWVyLCBvYmosIHByb3BiLCBjcmVhdG9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlID09IERhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAocG9qb1twb2pvUHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IG5ldyBEYXRlKHBvam9bcG9qb1Byb3BdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSBwb2pvW3Bvam9Qcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvciB0aGUgYmVuZWZpdCBvZiBwZXJzaXN0T2JqZWN0VGVtcGxhdGVcbiAgICBpZiAoIWNyZWF0b3IgJiYgcG9qby5faWQpIHtcbiAgICAgICAgb2JqLl9pZCA9IGdldElkKHBvam8uX2lkKTtcbiAgICB9XG5cbiAgICBpZiAoIWNyZWF0b3IpIHtcbiAgICAgICAgcHJvcFhmZXIoJ19fY2hhbmdlZF9fJywgcG9qbywgb2JqKTtcbiAgICAgICAgcHJvcFhmZXIoJ19fdmVyc2lvbl9fJywgcG9qbywgb2JqKTtcbiAgICB9XG5cbiAgICBwcm9wWGZlcignX190b1NlcnZlcl9fJywgcG9qbywgb2JqKTtcbiAgICBwcm9wWGZlcignX190b0NsaWVudF9fJywgcG9qbywgb2JqKTtcblxuICAgIHJldHVybiBvYmo7XG59O1xuXG5cbi8qKlxuICogT2JqZWN0VGVtcGxhdGUuZnJvbUpTT05cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21KU09OKHN0ciwgdGVtcGxhdGUsIGlkUXVhbGlmaWVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbVBPSk8oSlNPTi5wYXJzZShzdHIpLCB0ZW1wbGF0ZSwgbnVsbCwgbnVsbCwgaWRRdWFsaWZpZXIpO1xufTtcbiJdfQ==