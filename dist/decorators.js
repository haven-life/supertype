"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Supertype_1 = require("./Supertype");
exports.Supertype = Supertype_1.Supertype;
var ObjectTemplate_1 = require("./ObjectTemplate");
require("reflect-metadata");
var UtilityFunctions_1 = require("./UtilityFunctions");
/**
    *
    * @param {*} objectProps- optional property for passing params into supertypeclass, if no params, is undefined,
    *                      first param of this function defaults to objectTemplate instead
    * @param {*} objectTemplate
    *
    * @TODO: fix return types
    * https://github.com/haven-life/supertype/issues/6
    */
function supertypeClass(objectProps, objectTemplate) {
    // When used as @supertypeClass({bla bla bla}), the decorator is first called as it is
    // is being passed into the decorator processor and so it needs to return a function
    // so that it will be called again when the decorators are actually processed.  Kinda spliffy.
    // Called by decorator processor
    if (objectProps.prototype) { // if objectProps is the class (second pass if passed with {toClient style params} or first pass when @supertypeClass no paren and args)
        return decorator(objectProps);
    }
    // Called first time with parameter
    var props = objectProps;
    return decorator;
    // Decorator Workerbee
    function decorator(target) {
        objectTemplate = objectTemplate || ObjectTemplate_1.ObjectTemplate;
        var createProps = UtilityFunctions_1.UtilityFunctions.getTemplateProperties(props || {}, objectTemplate);
        target.__toClient__ = createProps.__toClient__;
        target.__toServer__ = createProps.__toServer__;
        target.__shadowChildren__ = []; // necessary?
        // Push an array of template references (we can't get at their names now).  Later we will
        // use this to construct __dictionary__
        objectTemplate.__templates__ = objectTemplate.__templates__ || [];
        objectTemplate.__templates__.push(target);
    }
}
exports.supertypeClass = supertypeClass;
function property(props) {
    return function (target, targetKey) {
        props = props || {};
        props.enumerable = true;
        target.__amorphicprops__ = target.hasOwnProperty('__amorphicprops__') ? target.__amorphicprops__ : {};
        var reflectionType = Reflect.getMetadata('design:type', target, targetKey);
        var declaredType = props.type;
        var type = reflectionType !== Array ? declaredType || reflectionType : declaredType;
        // Type mismatches
        if (declaredType && reflectionType && reflectionType !== Array) {
            target.__exceptions__ = target.__exceptions__ || {};
            target.__exceptions__[targetKey] = function (className, prop) {
                return className + '.' + prop + ' - decorator type does not match actual type';
            };
            // Deferred type
        }
        else if (typeof props.getType === 'function') {
            target.__deferredType__ = target.hasOwnProperty('__deferredType__') ? target.__deferredType__ : {};
            target.__deferredType__[targetKey] = props.getType;
            delete props.getType;
        }
        else if (!type) {
            target.__exceptions__ = target.__exceptions__ || {};
            target.__exceptions__[targetKey] = function (className, prop) {
                return className + '.' + prop +
                    ' - type is undefined. Circular reference? Try @property({getType: () => {return ' +
                    prop[0].toUpperCase() + prop.substr(1) + '}})';
            };
        }
        if (reflectionType === Array) {
            props.type = Array;
            props.of = type;
        }
        else {
            props.type = type;
        }
        target.__amorphicprops__[targetKey] = props;
    };
}
exports.property = property;
;
function remote(defineProperty) {
    return function (target, propertyName, descriptor) {
    };
}
exports.remote = remote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQXdDO0FBQS9CLGdDQUFBLFNBQVMsQ0FBQTtBQUNsQixtREFBa0Q7QUFFbEQsNEJBQTBCO0FBQzFCLHVEQUFzRDtBQUV0RDs7Ozs7Ozs7TUFRTTtBQUNOLHdCQUErQixXQUFZLEVBQUUsY0FBZTtJQUV4RCxzRkFBc0Y7SUFDdEYsb0ZBQW9GO0lBQ3BGLDhGQUE4RjtJQUU5RixnQ0FBZ0M7SUFDaEMsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLEVBQUUsd0lBQXdJO1FBQ2pLLE9BQU8sU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsbUNBQW1DO0lBQ25DLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQztJQUN4QixPQUFPLFNBQVMsQ0FBQztJQUVqQixzQkFBc0I7SUFDdEIsbUJBQW1CLE1BQU07UUFDckIsY0FBYyxHQUFHLGNBQWMsSUFBSSwrQkFBYyxDQUFDO1FBRWxELElBQUksV0FBVyxHQUFHLG1DQUFnQixDQUFDLHFCQUFxQixDQUFDLEtBQUssSUFBSSxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDdEYsTUFBTSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUMvQyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUMsYUFBYTtRQUU3Qyx5RkFBeUY7UUFDekYsdUNBQXVDO1FBQ3ZDLGNBQWMsQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7UUFDbEUsY0FBYyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztBQUNMLENBQUM7QUE3QkQsd0NBNkJDO0FBR0Qsa0JBQXlCLEtBQU07SUFDM0IsT0FBTyxVQUFVLE1BQU0sRUFBRSxTQUFTO1FBQzlCLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BCLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3RHLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMzRSxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQzlCLElBQUksSUFBSSxHQUFHLGNBQWMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLFlBQVksSUFBSSxjQUFjLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUN4RixrQkFBa0I7UUFDZCxJQUFJLFlBQVksSUFBSSxjQUFjLElBQUksY0FBYyxLQUFLLEtBQUssRUFBRTtZQUM1RCxNQUFNLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsVUFBVSxTQUFTLEVBQUUsSUFBSTtnQkFDeEQsT0FBTyxTQUFTLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyw4Q0FBOEMsQ0FBQztZQUNuRixDQUFDLENBQUM7WUFDVixnQkFBZ0I7U0FDWDthQUNJLElBQUksT0FBTyxLQUFLLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRTtZQUMxQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNuRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUNuRCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUM7U0FDeEI7YUFDSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1osTUFBTSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztZQUNwRCxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFVBQVUsU0FBUyxFQUFFLElBQUk7Z0JBQ3hELE9BQU8sU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJO29CQUM3QixrRkFBa0Y7b0JBQ2xGLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUVuRCxDQUFDLENBQUM7U0FDTDtRQUNELElBQUksY0FBYyxLQUFLLEtBQUssRUFBRTtZQUMxQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNuQixLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztTQUNuQjthQUNJO1lBQ0QsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7U0FDckI7UUFDRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ2hELENBQUMsQ0FBQztBQUNOLENBQUM7QUF2Q0QsNEJBdUNDO0FBQUEsQ0FBQztBQUVGLGdCQUF1QixjQUFjO0lBQ2pDLE9BQU8sVUFBVSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVU7SUFDakQsQ0FBQyxDQUFBO0FBQ0wsQ0FBQztBQUhELHdCQUdDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgU3VwZXJ0eXBlIH0gZnJvbSAnLi9TdXBlcnR5cGUnO1xuaW1wb3J0IHsgT2JqZWN0VGVtcGxhdGUgfSBmcm9tICcuL09iamVjdFRlbXBsYXRlJztcblxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCB7IFV0aWxpdHlGdW5jdGlvbnMgfSBmcm9tICcuL1V0aWxpdHlGdW5jdGlvbnMnO1xuXG4vKipcbiAgICAqIFxuICAgICogQHBhcmFtIHsqfSBvYmplY3RQcm9wcy0gb3B0aW9uYWwgcHJvcGVydHkgZm9yIHBhc3NpbmcgcGFyYW1zIGludG8gc3VwZXJ0eXBlY2xhc3MsIGlmIG5vIHBhcmFtcywgaXMgdW5kZWZpbmVkLFxuICAgICogICAgICAgICAgICAgICAgICAgICAgZmlyc3QgcGFyYW0gb2YgdGhpcyBmdW5jdGlvbiBkZWZhdWx0cyB0byBvYmplY3RUZW1wbGF0ZSBpbnN0ZWFkXG4gICAgKiBAcGFyYW0geyp9IG9iamVjdFRlbXBsYXRlIFxuICAgICogXG4gICAgKiBAVE9ETzogZml4IHJldHVybiB0eXBlc1xuICAgICogaHR0cHM6Ly9naXRodWIuY29tL2hhdmVuLWxpZmUvc3VwZXJ0eXBlL2lzc3Vlcy82XG4gICAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBlcnR5cGVDbGFzcyhvYmplY3RQcm9wcz8sIG9iamVjdFRlbXBsYXRlPyk6IGFueSB7XG5cbiAgICAvLyBXaGVuIHVzZWQgYXMgQHN1cGVydHlwZUNsYXNzKHtibGEgYmxhIGJsYX0pLCB0aGUgZGVjb3JhdG9yIGlzIGZpcnN0IGNhbGxlZCBhcyBpdCBpc1xuICAgIC8vIGlzIGJlaW5nIHBhc3NlZCBpbnRvIHRoZSBkZWNvcmF0b3IgcHJvY2Vzc29yIGFuZCBzbyBpdCBuZWVkcyB0byByZXR1cm4gYSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgaXQgd2lsbCBiZSBjYWxsZWQgYWdhaW4gd2hlbiB0aGUgZGVjb3JhdG9ycyBhcmUgYWN0dWFsbHkgcHJvY2Vzc2VkLiAgS2luZGEgc3BsaWZmeS5cblxuICAgIC8vIENhbGxlZCBieSBkZWNvcmF0b3IgcHJvY2Vzc29yXG4gICAgaWYgKG9iamVjdFByb3BzLnByb3RvdHlwZSkgeyAvLyBpZiBvYmplY3RQcm9wcyBpcyB0aGUgY2xhc3MgKHNlY29uZCBwYXNzIGlmIHBhc3NlZCB3aXRoIHt0b0NsaWVudCBzdHlsZSBwYXJhbXN9IG9yIGZpcnN0IHBhc3Mgd2hlbiBAc3VwZXJ0eXBlQ2xhc3Mgbm8gcGFyZW4gYW5kIGFyZ3MpXG4gICAgICAgIHJldHVybiBkZWNvcmF0b3Iob2JqZWN0UHJvcHMpO1xuICAgIH1cblxuICAgIC8vIENhbGxlZCBmaXJzdCB0aW1lIHdpdGggcGFyYW1ldGVyXG4gICAgdmFyIHByb3BzID0gb2JqZWN0UHJvcHM7XG4gICAgcmV0dXJuIGRlY29yYXRvcjtcblxuICAgIC8vIERlY29yYXRvciBXb3JrZXJiZWVcbiAgICBmdW5jdGlvbiBkZWNvcmF0b3IodGFyZ2V0KSB7XG4gICAgICAgIG9iamVjdFRlbXBsYXRlID0gb2JqZWN0VGVtcGxhdGUgfHwgT2JqZWN0VGVtcGxhdGU7XG5cbiAgICAgICAgdmFyIGNyZWF0ZVByb3BzID0gVXRpbGl0eUZ1bmN0aW9ucy5nZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMgfHwge30sIG9iamVjdFRlbXBsYXRlKTtcbiAgICAgICAgdGFyZ2V0Ll9fdG9DbGllbnRfXyA9IGNyZWF0ZVByb3BzLl9fdG9DbGllbnRfXztcbiAgICAgICAgdGFyZ2V0Ll9fdG9TZXJ2ZXJfXyA9IGNyZWF0ZVByb3BzLl9fdG9TZXJ2ZXJfXztcbiAgICAgICAgdGFyZ2V0Ll9fc2hhZG93Q2hpbGRyZW5fXyA9IFtdOyAvLyBuZWNlc3Nhcnk/XG5cbiAgICAgICAgLy8gUHVzaCBhbiBhcnJheSBvZiB0ZW1wbGF0ZSByZWZlcmVuY2VzICh3ZSBjYW4ndCBnZXQgYXQgdGhlaXIgbmFtZXMgbm93KS4gIExhdGVyIHdlIHdpbGxcbiAgICAgICAgLy8gdXNlIHRoaXMgdG8gY29uc3RydWN0IF9fZGljdGlvbmFyeV9fXG4gICAgICAgIG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVzX18gPSBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlc19fIHx8IFtdO1xuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlc19fLnB1c2godGFyZ2V0KTtcbiAgICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5KHByb3BzPyk6IGFueSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldEtleSkge1xuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuICAgICAgICBwcm9wcy5lbnVtZXJhYmxlID0gdHJ1ZTtcbiAgICAgICAgdGFyZ2V0Ll9fYW1vcnBoaWNwcm9wc19fID0gdGFyZ2V0Lmhhc093blByb3BlcnR5KCdfX2Ftb3JwaGljcHJvcHNfXycpID8gdGFyZ2V0Ll9fYW1vcnBoaWNwcm9wc19fIDoge307XG4gICAgICAgIHZhciByZWZsZWN0aW9uVHlwZSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2Rlc2lnbjp0eXBlJywgdGFyZ2V0LCB0YXJnZXRLZXkpO1xuICAgICAgICB2YXIgZGVjbGFyZWRUeXBlID0gcHJvcHMudHlwZTtcbiAgICAgICAgdmFyIHR5cGUgPSByZWZsZWN0aW9uVHlwZSAhPT0gQXJyYXkgPyBkZWNsYXJlZFR5cGUgfHwgcmVmbGVjdGlvblR5cGUgOiBkZWNsYXJlZFR5cGU7XG4gICAgLy8gVHlwZSBtaXNtYXRjaGVzXG4gICAgICAgIGlmIChkZWNsYXJlZFR5cGUgJiYgcmVmbGVjdGlvblR5cGUgJiYgcmVmbGVjdGlvblR5cGUgIT09IEFycmF5KSB7XG4gICAgICAgICAgICB0YXJnZXQuX19leGNlcHRpb25zX18gPSB0YXJnZXQuX19leGNlcHRpb25zX18gfHwge307XG4gICAgICAgICAgICB0YXJnZXQuX19leGNlcHRpb25zX19bdGFyZ2V0S2V5XSA9IGZ1bmN0aW9uIChjbGFzc05hbWUsIHByb3ApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xhc3NOYW1lICsgJy4nICsgcHJvcCArICcgLSBkZWNvcmF0b3IgdHlwZSBkb2VzIG5vdCBtYXRjaCBhY3R1YWwgdHlwZSc7XG4gICAgICAgICAgICB9O1xuICAgIC8vIERlZmVycmVkIHR5cGVcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgcHJvcHMuZ2V0VHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZGVmZXJyZWRUeXBlX18gPSB0YXJnZXQuaGFzT3duUHJvcGVydHkoJ19fZGVmZXJyZWRUeXBlX18nKSA/IHRhcmdldC5fX2RlZmVycmVkVHlwZV9fIDoge307XG4gICAgICAgICAgICB0YXJnZXQuX19kZWZlcnJlZFR5cGVfX1t0YXJnZXRLZXldID0gcHJvcHMuZ2V0VHlwZTtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wcy5nZXRUeXBlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICB0YXJnZXQuX19leGNlcHRpb25zX18gPSB0YXJnZXQuX19leGNlcHRpb25zX18gfHwge307XG4gICAgICAgICAgICB0YXJnZXQuX19leGNlcHRpb25zX19bdGFyZ2V0S2V5XSA9IGZ1bmN0aW9uIChjbGFzc05hbWUsIHByb3ApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xhc3NOYW1lICsgJy4nICsgcHJvcCArXG4gICAgICAgICAgICAgICAgJyAtIHR5cGUgaXMgdW5kZWZpbmVkLiBDaXJjdWxhciByZWZlcmVuY2U/IFRyeSBAcHJvcGVydHkoe2dldFR5cGU6ICgpID0+IHtyZXR1cm4gJyArXG4gICAgICAgICAgICAgICAgcHJvcFswXS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zdWJzdHIoMSkgKyAnfX0pJztcblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVmbGVjdGlvblR5cGUgPT09IEFycmF5KSB7XG4gICAgICAgICAgICBwcm9wcy50eXBlID0gQXJyYXk7XG4gICAgICAgICAgICBwcm9wcy5vZiA9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcm9wcy50eXBlID0gdHlwZTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQuX19hbW9ycGhpY3Byb3BzX19bdGFyZ2V0S2V5XSA9IHByb3BzO1xuICAgIH07XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3RlKGRlZmluZVByb3BlcnR5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIHByb3BlcnR5TmFtZSwgZGVzY3JpcHRvcikge1xuICAgIH1cbn0iXX0=