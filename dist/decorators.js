"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Supertype_1 = require("./Supertype");
exports.Supertype = Supertype_1.Supertype;
var ObjectTemplate_1 = require("./ObjectTemplate");
require("reflect-metadata");
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
        target.prototype.__template__ = target;
        target.prototype.amorphicClass = target;
        target.prototype.amorphicGetClassName = function () { return target.__name__; };
        target.isObjectTemplate = true;
        target.__injections__ = [];
        target.__objectTemplate__ = objectTemplate;
        var createProps = objectTemplate.getTemplateProperties(props || {});
        target.__toClient__ = createProps.__toClient__;
        target.__toServer__ = createProps.__toServer__;
        target.__shadowChildren__ = [];
        // Push an array of template references (we can't get at their names now).  Later we will
        // use this to construct __dictionary__
        objectTemplate.__templates__ = objectTemplate.__templates__ || [];
        objectTemplate.__templates__.push(target);
        // We can never reference template functions at compile time which is when this decorator is executed
        // Therefore we have to setup getters for properties that need access to the template functions so
        // that we can ensure they are fully resolved before accessing them
        Object.defineProperty(target, 'defineProperties', { get: defineProperties });
        Object.defineProperty(target, 'amorphicProperties', { get: defineProperties });
        Object.defineProperty(target, '__name__', { get: getName });
        Object.defineProperty(target, 'amorphicClassName', { get: getName });
        Object.defineProperty(target, 'parentTemplate', { get: getParent });
        Object.defineProperty(target, '__parent__', { get: getParent });
        Object.defineProperty(target, '__children__', { get: getChildren });
        Object.defineProperty(target, 'amorphicParentClass', { get: getParent });
        Object.defineProperty(target, 'amorphicChildClasses', { get: getChildren });
        Object.defineProperty(target, 'amorphicStatic', { get: function () { return objectTemplate; } });
        target.fromPOJO = function fromPOJO(pojo) {
            return objectTemplate.fromPOJO(pojo, target);
        };
        target.fromJSON = // Legacy
            target.amorphicFromJSON = function fromJSON(str, idPrefix) {
                return objectTemplate.fromJSON(str, target, idPrefix);
            };
        target.getProperties = // Legacy
            target.amorphicGetProperties = function getProperties(includeVirtual) {
                return objectTemplate._getDefineProperties(target, undefined, includeVirtual);
            };
        target.createProperty = // Legacy
            target.amorphicCreateProperty = function (propertyName, defineProperty) {
                if (defineProperty.body) {
                    target.prototype[propertyName] = objectTemplate._setupFunction(propertyName, defineProperty.body, defineProperty.on, defineProperty.validate);
                }
                else {
                    target.prototype.__amorphicprops__[propertyName] = defineProperty;
                    if (typeof defineProperty.value in ['string', 'number'] || defineProperty.value == null) {
                        Object.defineProperty(target.prototype, propertyName, { enumerable: true, writable: true, value: defineProperty.value });
                    }
                    else {
                        Object.defineProperty(target.prototype, propertyName, {
                            enumerable: true,
                            get: function () {
                                if (!this['__' + propertyName]) {
                                    this['__' + propertyName] =
                                        ObjectTemplate_1.ObjectTemplate.clone(defineProperty.value, defineProperty.of ||
                                            defineProperty.type || null);
                                }
                                return this['__' + propertyName];
                            },
                            set: function (value) {
                                this['__' + propertyName] = value;
                            }
                        });
                    }
                }
            };
        if (target.prototype.__exceptions__) {
            objectTemplate.__exceptions__ = objectTemplate.__exceptions__ || [];
            for (var exceptionKey in target.prototype.__exceptions__) {
                objectTemplate.__exceptions__.push({
                    func: target.prototype.__exceptions__[exceptionKey],
                    class: getName,
                    prop: exceptionKey
                });
            }
        }
        function defineProperties() {
            return target.prototype.__amorphicprops__;
        }
        function getName() {
            return target.toString().match(/function ([^(]*)/)[1];
        }
        function getDictionary() {
            objectTemplate.getClasses();
        }
        function getParent() {
            getDictionary();
            return target.__shadowParent__;
        }
        function getChildren() {
            getDictionary();
            return target.__shadowChildren__;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUNBQXdDO0FBQS9CLGdDQUFBLFNBQVMsQ0FBQTtBQUNsQixtREFBa0Q7QUFFbEQsNEJBQTBCO0FBRTFCOzs7Ozs7OztNQVFNO0FBQ04sd0JBQStCLFdBQVksRUFBRSxjQUFlO0lBRXhELHNGQUFzRjtJQUN0RixvRkFBb0Y7SUFDcEYsOEZBQThGO0lBRTlGLGdDQUFnQztJQUNoQyxJQUFJLFdBQVcsQ0FBQyxTQUFTLEVBQUUsRUFBRSx3SUFBd0k7UUFDakssT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDakM7SUFFRCxtQ0FBbUM7SUFDbkMsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDO0lBQ3hCLE9BQU8sU0FBUyxDQUFDO0lBRWpCLHNCQUFzQjtJQUN0QixtQkFBbUIsTUFBTTtRQUNyQixjQUFjLEdBQUcsY0FBYyxJQUFJLCtCQUFjLENBQUM7UUFFbEQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztRQUN4QyxNQUFNLENBQUMsU0FBUyxDQUFDLG9CQUFvQixHQUFHLGNBQWMsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDL0IsTUFBTSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDM0IsTUFBTSxDQUFDLGtCQUFrQixHQUFHLGNBQWMsQ0FBQztRQUMzQyxJQUFJLFdBQVcsR0FBRyxjQUFjLENBQUMscUJBQXFCLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUMvQyxNQUFNLENB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QUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUVuRCxDQUFDLENBQUM7U0FDTDtRQUNELElBQUksY0FBYyxLQUFLLEtBQUssRUFBRTtZQUMxQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNuQixLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztTQUNuQjthQUNJO1lBQ0QsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7U0FDckI7UUFDRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ2hELENBQUMsQ0FBQztBQUNOLENBQUM7QUF2Q0QsNEJBdUNDO0FBQUEsQ0FBQztBQUVGLGdCQUF1QixjQUFjO0lBQ2pDLE9BQU8sVUFBVSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVU7SUFDakQsQ0FBQyxDQUFBO0FBQ0wsQ0FBQztBQUhELHdCQUdDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgU3VwZXJ0eXBlIH0gZnJvbSAnLi9TdXBlcnR5cGUnO1xuaW1wb3J0IHsgT2JqZWN0VGVtcGxhdGUgfSBmcm9tICcuL09iamVjdFRlbXBsYXRlJztcblxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcblxuLyoqXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0UHJvcHMtIG9wdGlvbmFsIHByb3BlcnR5IGZvciBwYXNzaW5nIHBhcmFtcyBpbnRvIHN1cGVydHlwZWNsYXNzLCBpZiBubyBwYXJhbXMsIGlzIHVuZGVmaW5lZCxcbiAgICAqICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhcmFtIG9mIHRoaXMgZnVuY3Rpb24gZGVmYXVsdHMgdG8gb2JqZWN0VGVtcGxhdGUgaW5zdGVhZFxuICAgICogQHBhcmFtIHsqfSBvYmplY3RUZW1wbGF0ZSBcbiAgICAqIFxuICAgICogQFRPRE86IGZpeCByZXR1cm4gdHlwZXNcbiAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oYXZlbi1saWZlL3N1cGVydHlwZS9pc3N1ZXMvNlxuICAgICovXG5leHBvcnQgZnVuY3Rpb24gc3VwZXJ0eXBlQ2xhc3Mob2JqZWN0UHJvcHM/LCBvYmplY3RUZW1wbGF0ZT8pOiBhbnkge1xuXG4gICAgLy8gV2hlbiB1c2VkIGFzIEBzdXBlcnR5cGVDbGFzcyh7YmxhIGJsYSBibGF9KSwgdGhlIGRlY29yYXRvciBpcyBmaXJzdCBjYWxsZWQgYXMgaXQgaXNcbiAgICAvLyBpcyBiZWluZyBwYXNzZWQgaW50byB0aGUgZGVjb3JhdG9yIHByb2Nlc3NvciBhbmQgc28gaXQgbmVlZHMgdG8gcmV0dXJuIGEgZnVuY3Rpb25cbiAgICAvLyBzbyB0aGF0IGl0IHdpbGwgYmUgY2FsbGVkIGFnYWluIHdoZW4gdGhlIGRlY29yYXRvcnMgYXJlIGFjdHVhbGx5IHByb2Nlc3NlZC4gIEtpbmRhIHNwbGlmZnkuXG5cbiAgICAvLyBDYWxsZWQgYnkgZGVjb3JhdG9yIHByb2Nlc3NvclxuICAgIGlmIChvYmplY3RQcm9wcy5wcm90b3R5cGUpIHsgLy8gaWYgb2JqZWN0UHJvcHMgaXMgdGhlIGNsYXNzIChzZWNvbmQgcGFzcyBpZiBwYXNzZWQgd2l0aCB7dG9DbGllbnQgc3R5bGUgcGFyYW1zfSBvciBmaXJzdCBwYXNzIHdoZW4gQHN1cGVydHlwZUNsYXNzIG5vIHBhcmVuIGFuZCBhcmdzKVxuICAgICAgICByZXR1cm4gZGVjb3JhdG9yKG9iamVjdFByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBDYWxsZWQgZmlyc3QgdGltZSB3aXRoIHBhcmFtZXRlclxuICAgIHZhciBwcm9wcyA9IG9iamVjdFByb3BzO1xuICAgIHJldHVybiBkZWNvcmF0b3I7XG5cbiAgICAvLyBEZWNvcmF0b3IgV29ya2VyYmVlXG4gICAgZnVuY3Rpb24gZGVjb3JhdG9yKHRhcmdldCkge1xuICAgICAgICBvYmplY3RUZW1wbGF0ZSA9IG9iamVjdFRlbXBsYXRlIHx8IE9iamVjdFRlbXBsYXRlO1xuXG4gICAgICAgIHRhcmdldC5wcm90b3R5cGUuX190ZW1wbGF0ZV9fID0gdGFyZ2V0O1xuICAgICAgICB0YXJnZXQucHJvdG90eXBlLmFtb3JwaGljQ2xhc3MgPSB0YXJnZXQ7XG4gICAgICAgIHRhcmdldC5wcm90b3R5cGUuYW1vcnBoaWNHZXRDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0YXJnZXQuX19uYW1lX18gfTtcbiAgICAgICAgdGFyZ2V0LmlzT2JqZWN0VGVtcGxhdGUgPSB0cnVlO1xuICAgICAgICB0YXJnZXQuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGFyZ2V0Ll9fb2JqZWN0VGVtcGxhdGVfXyA9IG9iamVjdFRlbXBsYXRlO1xuICAgICAgICB2YXIgY3JlYXRlUHJvcHMgPSBvYmplY3RUZW1wbGF0ZS5nZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMgfHwge30pO1xuICAgICAgICB0YXJnZXQuX190b0NsaWVudF9fID0gY3JlYXRlUHJvcHMuX190b0NsaWVudF9fO1xuICAgICAgICB0YXJnZXQuX190b1NlcnZlcl9fID0gY3JlYXRlUHJvcHMuX190b1NlcnZlcl9fO1xuICAgICAgICB0YXJnZXQuX19zaGFkb3dDaGlsZHJlbl9fID0gW107XG5cbiAgICAgICAgLy8gUHVzaCBhbiBhcnJheSBvZiB0ZW1wbGF0ZSByZWZlcmVuY2VzICh3ZSBjYW4ndCBnZXQgYXQgdGhlaXIgbmFtZXMgbm93KS4gIExhdGVyIHdlIHdpbGxcbiAgICAgICAgLy8gdXNlIHRoaXMgdG8gY29uc3RydWN0IF9fZGljdGlvbmFyeV9fXG4gICAgICAgIG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVzX18gPSBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlc19fIHx8IFtdO1xuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlc19fLnB1c2godGFyZ2V0KTtcblxuXG4gICAgICAgIC8vIFdlIGNhbiBuZXZlciByZWZlcmVuY2UgdGVtcGxhdGUgZnVuY3Rpb25zIGF0IGNvbXBpbGUgdGltZSB3aGljaCBpcyB3aGVuIHRoaXMgZGVjb3JhdG9yIGlzIGV4ZWN1dGVkXG4gICAgICAgIC8vIFRoZXJlZm9yZSB3ZSBoYXZlIHRvIHNldHVwIGdldHRlcnMgZm9yIHByb3BlcnRpZXMgdGhhdCBuZWVkIGFjY2VzcyB0byB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIHNvXG4gICAgICAgIC8vIHRoYXQgd2UgY2FuIGVuc3VyZSB0aGV5IGFyZSBmdWxseSByZXNvbHZlZCBiZWZvcmUgYWNjZXNzaW5nIHRoZW1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2RlZmluZVByb3BlcnRpZXMnLCB7IGdldDogZGVmaW5lUHJvcGVydGllcyB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2Ftb3JwaGljUHJvcGVydGllcycsIHsgZ2V0OiBkZWZpbmVQcm9wZXJ0aWVzIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnX19uYW1lX18nLCB7IGdldDogZ2V0TmFtZSB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2Ftb3JwaGljQ2xhc3NOYW1lJywgeyBnZXQ6IGdldE5hbWUgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdwYXJlbnRUZW1wbGF0ZScsIHsgZ2V0OiBnZXRQYXJlbnQgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdfX3BhcmVudF9fJywgeyBnZXQ6IGdldFBhcmVudCB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ19fY2hpbGRyZW5fXycsIHsgZ2V0OiBnZXRDaGlsZHJlbiB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2Ftb3JwaGljUGFyZW50Q2xhc3MnLCB7IGdldDogZ2V0UGFyZW50IH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnYW1vcnBoaWNDaGlsZENsYXNzZXMnLCB7IGdldDogZ2V0Q2hpbGRyZW4gfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdhbW9ycGhpY1N0YXRpYycsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBvYmplY3RUZW1wbGF0ZSB9IH0pO1xuXG4gICAgICAgIHRhcmdldC5mcm9tUE9KTyA9IGZ1bmN0aW9uIGZyb21QT0pPKHBvam8pIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tUE9KTyhwb2pvLCB0YXJnZXQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRhcmdldC5mcm9tSlNPTiA9IC8vIExlZ2FjeVxuICAgICAgICAgICAgdGFyZ2V0LmFtb3JwaGljRnJvbUpTT04gPSBmdW5jdGlvbiBmcm9tSlNPTihzdHIsIGlkUHJlZml4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRlbXBsYXRlLmZyb21KU09OKHN0ciwgdGFyZ2V0LCBpZFByZWZpeCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHRhcmdldC5nZXRQcm9wZXJ0aWVzID0gLy8gTGVnYWN5XG4gICAgICAgICAgICB0YXJnZXQuYW1vcnBoaWNHZXRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZ2V0UHJvcGVydGllcyhpbmNsdWRlVmlydHVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHVuZGVmaW5lZCwgaW5jbHVkZVZpcnR1YWwpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICB0YXJnZXQuY3JlYXRlUHJvcGVydHkgPSAvLyBMZWdhY3lcbiAgICAgICAgICAgIHRhcmdldC5hbW9ycGhpY0NyZWF0ZVByb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5TmFtZSwgZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuYm9keSkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHJvdG90eXBlW3Byb3BlcnR5TmFtZV0gPSBvYmplY3RUZW1wbGF0ZS5fc2V0dXBGdW5jdGlvbihwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5vbiwgZGVmaW5lUHJvcGVydHkudmFsaWRhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnByb3RvdHlwZS5fX2Ftb3JwaGljcHJvcHNfX1twcm9wZXJ0eU5hbWVdID0gZGVmaW5lUHJvcGVydHk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmaW5lUHJvcGVydHkudmFsdWUgaW4gWydzdHJpbmcnLCAnbnVtYmVyJ10gfHwgZGVmaW5lUHJvcGVydHkudmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldC5wcm90b3R5cGUsIHByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGVudW1lcmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlLCB2YWx1ZTogZGVmaW5lUHJvcGVydHkudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LnByb3RvdHlwZSwgcHJvcGVydHlOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzWydfXycgKyBwcm9wZXJ0eU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wZXJ0eU5hbWVdID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3RUZW1wbGF0ZS5jbG9uZShkZWZpbmVQcm9wZXJ0eS52YWx1ZSwgZGVmaW5lUHJvcGVydHkub2YgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1snX18nICsgcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BlcnR5TmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRhcmdldC5wcm90b3R5cGUuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9fZXhjZXB0aW9uc19fID0gb2JqZWN0VGVtcGxhdGUuX19leGNlcHRpb25zX18gfHwgW107XG4gICAgICAgICAgICBmb3IgKHZhciBleGNlcHRpb25LZXkgaW4gdGFyZ2V0LnByb3RvdHlwZS5fX2V4Y2VwdGlvbnNfXykge1xuICAgICAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9fZXhjZXB0aW9uc19fLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBmdW5jOiB0YXJnZXQucHJvdG90eXBlLl9fZXhjZXB0aW9uc19fW2V4Y2VwdGlvbktleV0sXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiBnZXROYW1lLFxuICAgICAgICAgICAgICAgICAgICBwcm9wOiBleGNlcHRpb25LZXlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXMoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnByb3RvdHlwZS5fX2Ftb3JwaGljcHJvcHNfXztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZXROYW1lKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvbiAoW14oXSopLylbMV07XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ2V0RGljdGlvbmFyeSgpIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmdldENsYXNzZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZXRQYXJlbnQoKSB7XG4gICAgICAgICAgICBnZXREaWN0aW9uYXJ5KCk7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0Ll9fc2hhZG93UGFyZW50X187XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2hpbGRyZW4oKSB7XG4gICAgICAgICAgICBnZXREaWN0aW9uYXJ5KCk7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0Ll9fc2hhZG93Q2hpbGRyZW5fXztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkocHJvcHM/KTogYW55IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0S2V5KSB7XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgICAgIHByb3BzLmVudW1lcmFibGUgPSB0cnVlO1xuICAgICAgICB0YXJnZXQuX19hbW9ycGhpY3Byb3BzX18gPSB0YXJnZXQuaGFzT3duUHJvcGVydHkoJ19fYW1vcnBoaWNwcm9wc19fJykgPyB0YXJnZXQuX19hbW9ycGhpY3Byb3BzX18gOiB7fTtcbiAgICAgICAgdmFyIHJlZmxlY3Rpb25UeXBlID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZGVzaWduOnR5cGUnLCB0YXJnZXQsIHRhcmdldEtleSk7XG4gICAgICAgIHZhciBkZWNsYXJlZFR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB2YXIgdHlwZSA9IHJlZmxlY3Rpb25UeXBlICE9PSBBcnJheSA/IGRlY2xhcmVkVHlwZSB8fCByZWZsZWN0aW9uVHlwZSA6IGRlY2xhcmVkVHlwZTtcbiAgICAvLyBUeXBlIG1pc21hdGNoZXNcbiAgICAgICAgaWYgKGRlY2xhcmVkVHlwZSAmJiByZWZsZWN0aW9uVHlwZSAmJiByZWZsZWN0aW9uVHlwZSAhPT0gQXJyYXkpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfXyA9IHRhcmdldC5fX2V4Y2VwdGlvbnNfXyB8fCB7fTtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfX1t0YXJnZXRLZXldID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgcHJvcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWUgKyAnLicgKyBwcm9wICsgJyAtIGRlY29yYXRvciB0eXBlIGRvZXMgbm90IG1hdGNoIGFjdHVhbCB0eXBlJztcbiAgICAgICAgICAgIH07XG4gICAgLy8gRGVmZXJyZWQgdHlwZVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBwcm9wcy5nZXRUeXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0YXJnZXQuX19kZWZlcnJlZFR5cGVfXyA9IHRhcmdldC5oYXNPd25Qcm9wZXJ0eSgnX19kZWZlcnJlZFR5cGVfXycpID8gdGFyZ2V0Ll9fZGVmZXJyZWRUeXBlX18gOiB7fTtcbiAgICAgICAgICAgIHRhcmdldC5fX2RlZmVycmVkVHlwZV9fW3RhcmdldEtleV0gPSBwcm9wcy5nZXRUeXBlO1xuICAgICAgICAgICAgZGVsZXRlIHByb3BzLmdldFR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfXyA9IHRhcmdldC5fX2V4Y2VwdGlvbnNfXyB8fCB7fTtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfX1t0YXJnZXRLZXldID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgcHJvcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWUgKyAnLicgKyBwcm9wICtcbiAgICAgICAgICAgICAgICAnIC0gdHlwZSBpcyB1bmRlZmluZWQuIENpcmN1bGFyIHJlZmVyZW5jZT8gVHJ5IEBwcm9wZXJ0eSh7Z2V0VHlwZTogKCkgPT4ge3JldHVybiAnICtcbiAgICAgICAgICAgICAgICBwcm9wWzBdLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnN1YnN0cigxKSArICd9fSknO1xuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWZsZWN0aW9uVHlwZSA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgIHByb3BzLnR5cGUgPSBBcnJheTtcbiAgICAgICAgICAgIHByb3BzLm9mID0gdHlwZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzLnR5cGUgPSB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC5fX2Ftb3JwaGljcHJvcHNfX1t0YXJnZXRLZXldID0gcHJvcHM7XG4gICAgfTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdGUoZGVmaW5lUHJvcGVydHkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgcHJvcGVydHlOYW1lLCBkZXNjcmlwdG9yKSB7XG4gICAgfVxufSJdfQ==