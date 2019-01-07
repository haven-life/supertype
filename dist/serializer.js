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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zZXJpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7O0dBRUc7QUFDSDs7Ozs7Ozs7R0FRRztBQUNILHNCQUE2QixHQUFHLEVBQUUsRUFBRztJQUNqQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7SUFFZixJQUFJO1FBQ0EsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxXQUFXLEdBQUcsRUFBRSxLQUFLO1lBQzVDLElBQUksR0FBRyxLQUFLLG9CQUFvQixJQUFJLEdBQUcsS0FBSyxVQUFVLEVBQUU7Z0JBQ3BELE9BQU8sSUFBSSxDQUFDO2FBQ2Y7WUFDRCxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQzdDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDckIsS0FBSyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztpQkFDL0M7cUJBQ0k7b0JBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7aUJBQzFDO2FBQ0o7WUFFRCxJQUFJLEVBQUUsRUFBRTtnQkFDSixPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDekI7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztLQUNOO0lBQ0QsT0FBTyxDQUFDLEVBQUU7UUFDTixNQUFNLENBQUMsQ0FBQztLQUNYO0FBQ0wsQ0FBQztBQTNCRCxvQ0EyQkM7QUFFRCxrQkFBa0IsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHO0lBQzdCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1osR0FBRyxDQUFDLElBQUksQ0FB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IE9iamVjdFRlbXBsYXRlLnRvSlNPTlN0cmluZztcbiAqL1xuLyoqXG4gKiBDb252ZXJ0IGFuIG9iamVjdCB0byBKU09OLCBzdHJpcHBpbmcgYW55IHJlY3Vyc2l2ZSBvYmplY3QgcmVmZXJlbmNlcyBzbyB0aGV5IGNhbiBiZVxuICogcmVjb25zdGl0dXRlZCBsYXRlclxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gY2IgdW5rbm93blxuICpcbiAqIEByZXR1cm5zIHt1bmtub3dufVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9KU09OU3RyaW5nKG9iaiwgY2I/KSB7XG4gICAgdmFyIGlkTWFwID0gW107XG5cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCBmdW5jdGlvbiBhKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdfX29iamVjdFRlbXBsYXRlX18nIHx8IGtleSA9PT0gJ2Ftb3JwaGljJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLl9fdGVtcGxhdGVfXyAmJiB2YWx1ZS5fX2lkX18pIHtcbiAgICAgICAgICAgICAgICBpZiAoaWRNYXBbdmFsdWUuX19pZF9fXSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHsgX19pZF9fOiB2YWx1ZS5fX2lkX18udG9TdHJpbmcoKSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWRNYXBbdmFsdWUuX19pZF9fLnRvU3RyaW5nKCldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2Ioa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcm9wWGZlcihwcm9wLCBwb2pvLCBvYmopIHtcbiAgICBpZiAocG9qb1twcm9wXSkge1xuICAgICAgICBvYmpbcHJvcF0gPSBwb2pvW3Byb3BdO1xuICAgIH1cbn1cblxuLyoqXG4gKiBPYmplY3RUZW1wbGF0ZS5mcm9tUE9KT1xuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbVBPSk8ocG9qbywgdGVtcGxhdGUsIGRlZmluZVByb3BlcnR5PywgaWRNYXA/LCBpZFF1YWxpZmllcj8sIHBhcmVudD8sIHByb3A/LCBjcmVhdG9yPykge1xuICAgIGZ1bmN0aW9uIGdldElkKGlkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgKGlkUXVhbGlmaWVyKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBpZCArICctJyArIGlkUXVhbGlmaWVyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIC8vIEZvciByZWNvcmRpbmcgYmFjayByZWZzXG4gICAgaWYgKCFpZE1hcCkge1xuICAgICAgICBpZE1hcCA9IHt9O1xuICAgIH1cblxuICAgIGlmICghcG9qby5fX2lkX18pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBvYmo7XG5cbiAgICBpZiAoY3JlYXRvcikge1xuICAgICAgICBvYmogPSBjcmVhdG9yKHBhcmVudCwgcHJvcCwgdGVtcGxhdGUsIGlkTWFwW3Bvam8uX19pZF9fLnRvU3RyaW5nKCldLCBwb2pvLl9fdHJhbnNpZW50X18pO1xuXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgb2JqID0gb2JqWzBdO1xuICAgICAgICAgICAgaWRNYXBbb2JqLl9faWRfXy50b1N0cmluZygpXSA9IG9iajtcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChvYmopID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9iaikge1xuICAgICAgICAgICAgdGhpcy5ub0luaXQgPSB0cnVlO1xuICAgICAgICAgICAgb2JqID0gbmV3IHRlbXBsYXRlKCk7XG4gICAgICAgICAgICB0aGlzLm5vSW5pdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmogPSB0aGlzLl9jcmVhdGVFbXB0eU9iamVjdCh0ZW1wbGF0ZSwgZ2V0SWQocG9qby5fX2lkX18udG9TdHJpbmcoKSksIGRlZmluZVByb3BlcnR5LCBwb2pvLl9fdHJhbnNpZW50X18pO1xuICAgIH1cblxuICAgIGlkTWFwW2dldElkKHBvam8uX19pZF9fLnRvU3RyaW5nKCkpXSA9IG9iajtcblxuICAgIC8vIEdvIHRocm91Z2ggYWxsIHRoZSBwcm9wZXJ0aWVzIGFuZCB0cmFuc2ZlciB0aGVtIHRvIG5ld2x5IGNyZWF0ZWQgb2JqZWN0XG4gICAgdmFyIHByb3BzID0gb2JqLl9fdGVtcGxhdGVfXy5nZXRQcm9wZXJ0aWVzKCk7XG5cbiAgICBmb3IgKHZhciBwcm9wYiBpbiBwb2pvKSB7XG4gICAgICAgIHByb3BiID0gcHJvcGIucmVwbGFjZSgvXl9fLywgJycpO1xuICAgICAgICB2YXIgZGVmaW5lUHJvcCA9IHByb3BzW3Byb3BiXTtcbiAgICAgICAgaWYgKCFkZWZpbmVQcm9wKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciB0eXBlID0gZGVmaW5lUHJvcC50eXBlO1xuXG4gICAgICAgIC8vIEJlY2F1c2Ugc2Vtb3R1cyBjYW4gc2VyaWFsaXplIG9ubHkgdGhlIHNoYWRvdyBwcm9wZXJ0aWVzIHdlIHRyeSBhbmQgcmVzdG9yZSB0aGVtXG4gICAgICAgIHZhciBwb2pvUHJvcCA9ICh0eXBlICYmIHR5cGVvZiBwb2pvWydfXycgKyBwcm9wYl0gIT09ICd1bmRlZmluZWQnKSA/ICdfXycgKyBwcm9wYiA6IHByb3BiO1xuXG4gICAgICAgIGlmICh0eXBlICYmIHBvam9bcG9qb1Byb3BdID09IG51bGwpIHtcbiAgICAgICAgICAgIG9ialtwcm9wYl0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgJiYgdHlwZW9mIChwb2pvW3Bvam9Qcm9wXSkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PSBBcnJheSAmJiBkZWZpbmVQcm9wLm9mICYmIGRlZmluZVByb3Aub2YuaXNPYmplY3RUZW1wbGF0ZSkgeyAvLyBBcnJheSBvZiB0ZW1wbGF0ZWQgb2JqZWN0c1xuICAgICAgICAgICAgICAgIHZhciBhcnJheURpcmVjdGlvbnMgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyYXlEaXJlY3Rpb25zID0gY3JlYXRvcihvYmosIHByb3BiLCBkZWZpbmVQcm9wLm9mLCBpZE1hcFtwb2pvLl9faWRfXy50b1N0cmluZygpXSwgcG9qby5fX3RyYW5zaWVudF9fKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChhcnJheURpcmVjdGlvbnMpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHBvam9bcG9qb1Byb3BdLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0eXBlID0gcG9qb1twb2pvUHJvcF1baXhdLl9fdGVtcGxhdGVfXyB8fCBkZWZpbmVQcm9wLm9mO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvam9bcG9qb1Byb3BdW2l4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2pvW3Bvam9Qcm9wXVtpeF0uX19pZF9fICYmIGlkTWFwW2dldElkKHBvam9bcG9qb1Byb3BdW2l4XS5fX2lkX18udG9TdHJpbmcoKSldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl1baXhdID0gaWRNYXBbZ2V0SWQocG9qb1twb2pvUHJvcF1baXhdLl9faWRfXy50b1N0cmluZygpKV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdW2l4XSA9IHRoaXMuZnJvbVBPSk8ocG9qb1twb2pvUHJvcF1baXhdLCBhdHlwZSwgZGVmaW5lUHJvcCwgaWRNYXAsIGlkUXVhbGlmaWVyLCBvYmosIHByb3BiLCBjcmVhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdW2l4XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlLmlzT2JqZWN0VGVtcGxhdGUpIHsgLy8gVGVtcGxhdGVkIG9iamVjdHNcbiAgICAgICAgICAgICAgICB2YXIgb3R5cGUgPSBwb2pvW3Bvam9Qcm9wXS5fX3RlbXBsYXRlX18gfHwgdHlwZTtcbiAgICAgICAgICAgICAgICBpZiAocG9qb1twb2pvUHJvcF0uX19pZF9fICYmIGlkTWFwW2dldElkKHBvam9bcG9qb1Byb3BdLl9faWRfXy50b1N0cmluZygpKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BiXSA9IGlkTWFwW2dldElkKHBvam9bcG9qb1Byb3BdLl9faWRfXy50b1N0cmluZygpKV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gdGhpcy5mcm9tUE9KTyhwb2pvW3Bvam9Qcm9wXSwgb3R5cGUsIGRlZmluZVByb3AsIGlkTWFwLCBpZFF1YWxpZmllciwgb2JqLCBwcm9wYiwgY3JlYXRvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBEYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBvam9bcG9qb1Byb3BdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wYl0gPSBuZXcgRGF0ZShwb2pvW3Bvam9Qcm9wXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvYmpbcHJvcGJdID0gcG9qb1twb2pvUHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3IgdGhlIGJlbmVmaXQgb2YgcGVyc2lzdE9iamVjdFRlbXBsYXRlXG4gICAgaWYgKCFjcmVhdG9yICYmIHBvam8uX2lkKSB7XG4gICAgICAgIG9iai5faWQgPSBnZXRJZChwb2pvLl9pZCk7XG4gICAgfVxuXG4gICAgaWYgKCFjcmVhdG9yKSB7XG4gICAgICAgIHByb3BYZmVyKCdfX2NoYW5nZWRfXycsIHBvam8sIG9iaik7XG4gICAgICAgIHByb3BYZmVyKCdfX3ZlcnNpb25fXycsIHBvam8sIG9iaik7XG4gICAgfVxuXG4gICAgcHJvcFhmZXIoJ19fdG9TZXJ2ZXJfXycsIHBvam8sIG9iaik7XG4gICAgcHJvcFhmZXIoJ19fdG9DbGllbnRfXycsIHBvam8sIG9iaik7XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxuXG4vKipcbiAqIE9iamVjdFRlbXBsYXRlLmZyb21KU09OXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFF1YWxpZmllcikge1xuICAgIHJldHVybiB0aGlzLmZyb21QT0pPKEpTT04ucGFyc2Uoc3RyKSwgdGVtcGxhdGUsIG51bGwsIG51bGwsIGlkUXVhbGlmaWVyKTtcbn07XG4iXX0=