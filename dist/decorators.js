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
        // We can never reference template functions at compile time which is when this decorator is executed
        // Therefore we have to setup getters for properties that need access to the template functions so
        // that we can ensure they are fully resolved before accessing them
        // Object.defineProperty(target, '__parent__', { get: getParent });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQXdDO0FBQS9CLGdDQUFBLFNBQVMsQ0FBQTtBQUNsQixtREFBa0Q7QUFFbEQsNEJBQTBCO0FBQzFCLHVEQUFzRDtBQUV0RDs7Ozs7Ozs7TUFRTTtBQUNOLHdCQUErQixXQUFZLEVBQUUsY0FBZTtJQUV4RCxzRkFBc0Y7SUFDdEYsb0ZBQW9GO0lBQ3BGLDhGQUE4RjtJQUU5RixnQ0FBZ0M7SUFDaEMsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLEVBQUUsd0lBQXdJO1FBQ2pLLE9BQU8sU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsbUNBQW1DO0lBQ25DLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQztJQUN4QixPQUFPLFNBQVMsQ0FBQztJQUVqQixzQkFBc0I7SUFDdEIsbUJBQW1CLE1BQU07UUFDckIsY0FBYyxHQUFHLGNBQWMsSUFBSSwrQkFBYyxDQUFDO1FBRWxELElBQUksV0FBVyxHQUFHLG1DQUFnQixDQUFDLHFCQUFxQixDQUFDLEtBQUssSUFBSSxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDdEYsTUFBTSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUMvQyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUMsYUFBYTtRQUU3Qyx5RkFBeUY7UUFDekYsdUNBQXVDO1FBQ3ZDLGNBQWMsQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7UUFDbEUsY0FBYyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFMUMscUdBQXFHO1FBQ3JHLGtHQUFrRztRQUNsRyxtRUFBbUU7UUFDbkUsbUVBQW1FO0lBQ3ZFLENBQUM7QUFDTCxDQUFDO0FBbENELHdDQWtDQztBQUdELGtCQUF5QixLQUFNO0lBQzNCLE9BQU8sVUFBVSxNQUFNLEVBQUUsU0FBUztRQUM5QixLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQixLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN4QixNQUFNLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN0RyxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0UsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUM5QixJQUFJLElBQUksR0FBRyxjQUFjLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDeEYsa0JBQWtCO1FBQ2QsSUFBSSxZQUFZLElBQUksY0FBYyxJQUFJLGNBQWMsS0FBSyxLQUFLLEVBQUU7WUFDNUQsTUFBTSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztZQUNwRCxNQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFVBQVUsU0FBUyxFQUFFLElBQUk7Z0JBQ3hELE9BQU8sU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsOENBQThDLENBQUM7WUFDbkYsQ0FBQyxDQUFDO1lBQ1YsZ0JBQWdCO1NBQ1g7YUFDSSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLEVBQUU7WUFDMUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDbkcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFDbkQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDO1NBQ3hCO2FBQ0ksSUFBSSxDQUFDLElBQUksRUFBRTtZQUNaLE1BQU0sQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7WUFDcEQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxVQUFVLFNBQVMsRUFBRSxJQUFJO2dCQUN4RCxPQUFPLFNBQVMsR0FBRyxHQUFHLEdBQUcsSUFBSTtvQkFDN0Isa0ZBQWtGO29CQUNsRixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7WUFFbkQsQ0FBQyxDQUFDO1NBQ0w7UUFDRCxJQUFJLGNBQWMsS0FBSyxLQUFLLEVBQUU7WUFDMUIsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7WUFDbkIsS0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7U0FDbkI7YUFDSTtZQUNELEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1NBQ3JCO1FBQ0QsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNoRCxDQUFDLENBQUM7QUFDTixDQUFDO0FBdkNELDRCQXVDQztBQUFBLENBQUM7QUFFRixnQkFBdUIsY0FBYztJQUNqQyxPQUFPLFVBQVUsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVO0lBQ2pELENBQUMsQ0FBQTtBQUNMLENBQUM7QUFIRCx3QkFHQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IFN1cGVydHlwZSB9IGZyb20gJy4vU3VwZXJ0eXBlJztcbmltcG9ydCB7IE9iamVjdFRlbXBsYXRlIH0gZnJvbSAnLi9PYmplY3RUZW1wbGF0ZSc7XG5cbmltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5pbXBvcnQgeyBVdGlsaXR5RnVuY3Rpb25zIH0gZnJvbSAnLi9VdGlsaXR5RnVuY3Rpb25zJztcblxuLyoqXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0UHJvcHMtIG9wdGlvbmFsIHByb3BlcnR5IGZvciBwYXNzaW5nIHBhcmFtcyBpbnRvIHN1cGVydHlwZWNsYXNzLCBpZiBubyBwYXJhbXMsIGlzIHVuZGVmaW5lZCxcbiAgICAqICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhcmFtIG9mIHRoaXMgZnVuY3Rpb24gZGVmYXVsdHMgdG8gb2JqZWN0VGVtcGxhdGUgaW5zdGVhZFxuICAgICogQHBhcmFtIHsqfSBvYmplY3RUZW1wbGF0ZSBcbiAgICAqIFxuICAgICogQFRPRE86IGZpeCByZXR1cm4gdHlwZXNcbiAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oYXZlbi1saWZlL3N1cGVydHlwZS9pc3N1ZXMvNlxuICAgICovXG5leHBvcnQgZnVuY3Rpb24gc3VwZXJ0eXBlQ2xhc3Mob2JqZWN0UHJvcHM/LCBvYmplY3RUZW1wbGF0ZT8pOiBhbnkge1xuXG4gICAgLy8gV2hlbiB1c2VkIGFzIEBzdXBlcnR5cGVDbGFzcyh7YmxhIGJsYSBibGF9KSwgdGhlIGRlY29yYXRvciBpcyBmaXJzdCBjYWxsZWQgYXMgaXQgaXNcbiAgICAvLyBpcyBiZWluZyBwYXNzZWQgaW50byB0aGUgZGVjb3JhdG9yIHByb2Nlc3NvciBhbmQgc28gaXQgbmVlZHMgdG8gcmV0dXJuIGEgZnVuY3Rpb25cbiAgICAvLyBzbyB0aGF0IGl0IHdpbGwgYmUgY2FsbGVkIGFnYWluIHdoZW4gdGhlIGRlY29yYXRvcnMgYXJlIGFjdHVhbGx5IHByb2Nlc3NlZC4gIEtpbmRhIHNwbGlmZnkuXG5cbiAgICAvLyBDYWxsZWQgYnkgZGVjb3JhdG9yIHByb2Nlc3NvclxuICAgIGlmIChvYmplY3RQcm9wcy5wcm90b3R5cGUpIHsgLy8gaWYgb2JqZWN0UHJvcHMgaXMgdGhlIGNsYXNzIChzZWNvbmQgcGFzcyBpZiBwYXNzZWQgd2l0aCB7dG9DbGllbnQgc3R5bGUgcGFyYW1zfSBvciBmaXJzdCBwYXNzIHdoZW4gQHN1cGVydHlwZUNsYXNzIG5vIHBhcmVuIGFuZCBhcmdzKVxuICAgICAgICByZXR1cm4gZGVjb3JhdG9yKG9iamVjdFByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBDYWxsZWQgZmlyc3QgdGltZSB3aXRoIHBhcmFtZXRlclxuICAgIHZhciBwcm9wcyA9IG9iamVjdFByb3BzO1xuICAgIHJldHVybiBkZWNvcmF0b3I7XG5cbiAgICAvLyBEZWNvcmF0b3IgV29ya2VyYmVlXG4gICAgZnVuY3Rpb24gZGVjb3JhdG9yKHRhcmdldCkge1xuICAgICAgICBvYmplY3RUZW1wbGF0ZSA9IG9iamVjdFRlbXBsYXRlIHx8IE9iamVjdFRlbXBsYXRlO1xuXG4gICAgICAgIHZhciBjcmVhdGVQcm9wcyA9IFV0aWxpdHlGdW5jdGlvbnMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzIHx8IHt9LCBvYmplY3RUZW1wbGF0ZSk7XG4gICAgICAgIHRhcmdldC5fX3RvQ2xpZW50X18gPSBjcmVhdGVQcm9wcy5fX3RvQ2xpZW50X187XG4gICAgICAgIHRhcmdldC5fX3RvU2VydmVyX18gPSBjcmVhdGVQcm9wcy5fX3RvU2VydmVyX187XG4gICAgICAgIHRhcmdldC5fX3NoYWRvd0NoaWxkcmVuX18gPSBbXTsgLy8gbmVjZXNzYXJ5P1xuXG4gICAgICAgIC8vIFB1c2ggYW4gYXJyYXkgb2YgdGVtcGxhdGUgcmVmZXJlbmNlcyAod2UgY2FuJ3QgZ2V0IGF0IHRoZWlyIG5hbWVzIG5vdykuICBMYXRlciB3ZSB3aWxsXG4gICAgICAgIC8vIHVzZSB0aGlzIHRvIGNvbnN0cnVjdCBfX2RpY3Rpb25hcnlfX1xuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlc19fID0gb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZXNfXyB8fCBbXTtcbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZXNfXy5wdXNoKHRhcmdldCk7XG5cbiAgICAgICAgLy8gV2UgY2FuIG5ldmVyIHJlZmVyZW5jZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXQgY29tcGlsZSB0aW1lIHdoaWNoIGlzIHdoZW4gdGhpcyBkZWNvcmF0b3IgaXMgZXhlY3V0ZWRcbiAgICAgICAgLy8gVGhlcmVmb3JlIHdlIGhhdmUgdG8gc2V0dXAgZ2V0dGVycyBmb3IgcHJvcGVydGllcyB0aGF0IG5lZWQgYWNjZXNzIHRvIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgc29cbiAgICAgICAgLy8gdGhhdCB3ZSBjYW4gZW5zdXJlIHRoZXkgYXJlIGZ1bGx5IHJlc29sdmVkIGJlZm9yZSBhY2Nlc3NpbmcgdGhlbVxuICAgICAgICAvLyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnX19wYXJlbnRfXycsIHsgZ2V0OiBnZXRQYXJlbnQgfSk7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eShwcm9wcz8pOiBhbnkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRLZXkpIHtcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICAgICAgcHJvcHMuZW51bWVyYWJsZSA9IHRydWU7XG4gICAgICAgIHRhcmdldC5fX2Ftb3JwaGljcHJvcHNfXyA9IHRhcmdldC5oYXNPd25Qcm9wZXJ0eSgnX19hbW9ycGhpY3Byb3BzX18nKSA/IHRhcmdldC5fX2Ftb3JwaGljcHJvcHNfXyA6IHt9O1xuICAgICAgICB2YXIgcmVmbGVjdGlvblR5cGUgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdkZXNpZ246dHlwZScsIHRhcmdldCwgdGFyZ2V0S2V5KTtcbiAgICAgICAgdmFyIGRlY2xhcmVkVHlwZSA9IHByb3BzLnR5cGU7XG4gICAgICAgIHZhciB0eXBlID0gcmVmbGVjdGlvblR5cGUgIT09IEFycmF5ID8gZGVjbGFyZWRUeXBlIHx8IHJlZmxlY3Rpb25UeXBlIDogZGVjbGFyZWRUeXBlO1xuICAgIC8vIFR5cGUgbWlzbWF0Y2hlc1xuICAgICAgICBpZiAoZGVjbGFyZWRUeXBlICYmIHJlZmxlY3Rpb25UeXBlICYmIHJlZmxlY3Rpb25UeXBlICE9PSBBcnJheSkge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fID0gdGFyZ2V0Ll9fZXhjZXB0aW9uc19fIHx8IHt9O1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fW3RhcmdldEtleV0gPSBmdW5jdGlvbiAoY2xhc3NOYW1lLCBwcm9wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYXNzTmFtZSArICcuJyArIHByb3AgKyAnIC0gZGVjb3JhdG9yIHR5cGUgZG9lcyBub3QgbWF0Y2ggYWN0dWFsIHR5cGUnO1xuICAgICAgICAgICAgfTtcbiAgICAvLyBEZWZlcnJlZCB0eXBlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHByb3BzLmdldFR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2RlZmVycmVkVHlwZV9fID0gdGFyZ2V0Lmhhc093blByb3BlcnR5KCdfX2RlZmVycmVkVHlwZV9fJykgPyB0YXJnZXQuX19kZWZlcnJlZFR5cGVfXyA6IHt9O1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZGVmZXJyZWRUeXBlX19bdGFyZ2V0S2V5XSA9IHByb3BzLmdldFR5cGU7XG4gICAgICAgICAgICBkZWxldGUgcHJvcHMuZ2V0VHlwZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghdHlwZSkge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fID0gdGFyZ2V0Ll9fZXhjZXB0aW9uc19fIHx8IHt9O1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fW3RhcmdldEtleV0gPSBmdW5jdGlvbiAoY2xhc3NOYW1lLCBwcm9wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYXNzTmFtZSArICcuJyArIHByb3AgK1xuICAgICAgICAgICAgICAgICcgLSB0eXBlIGlzIHVuZGVmaW5lZC4gQ2lyY3VsYXIgcmVmZXJlbmNlPyBUcnkgQHByb3BlcnR5KHtnZXRUeXBlOiAoKSA9PiB7cmV0dXJuICcgK1xuICAgICAgICAgICAgICAgIHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc3Vic3RyKDEpICsgJ319KSc7XG5cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlZmxlY3Rpb25UeXBlID09PSBBcnJheSkge1xuICAgICAgICAgICAgcHJvcHMudHlwZSA9IEFycmF5O1xuICAgICAgICAgICAgcHJvcHMub2YgPSB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMudHlwZSA9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0Ll9fYW1vcnBoaWNwcm9wc19fW3RhcmdldEtleV0gPSBwcm9wcztcbiAgICB9O1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW90ZShkZWZpbmVQcm9wZXJ0eSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBwcm9wZXJ0eU5hbWUsIGRlc2NyaXB0b3IpIHtcbiAgICB9XG59Il19