(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Supertype", "./ObjectTemplate", "reflect-metadata"], factory);
    }
})(function (require, exports) {
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
            /*
            TODO: Typescript
            Looking at the supertype constructor these need to be dealt with
            - createProperties used by client.js to add Persistor, Get and Fetch
            - injections
            */
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2RlY29yYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQSx5Q0FBd0M7SUFBL0IsZ0NBQUEsU0FBUyxDQUFBO0lBQ2xCLG1EQUFrRDtJQUVsRCw0QkFBMEI7SUFFMUI7Ozs7Ozs7VUFPTTtJQUNOLHdCQUErQixXQUFZLEVBQUUsY0FBZTtRQUV4RCxzRkFBc0Y7UUFDdEYsb0ZBQW9GO1FBQ3BGLDhGQUE4RjtRQUU5RixnQ0FBZ0M7UUFDaEMsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLEVBQUUsd0lBQXdJO1lBQ2pLLE9BQU8sU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsbUNBQW1DO1FBQ25DLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQztRQUN4QixPQUFPLFNBQVMsQ0FBQztRQUVqQixzQkFBc0I7UUFDdEIsbUJBQW1CLE1BQU07WUFDckIsY0FBYyxHQUFHLGNBQWMsSUFBSSwrQkFBYyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztZQUN2QyxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7WUFDeEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyxjQUFjLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQSxDQUFDLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUM7WUFDM0MsSUFBSSxXQUFXLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUM7WUFDL0MsTUFB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Q0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBRW5ELENBQUMsQ0FBQzthQUNMO1lBQ0QsSUFBSSxjQUFjLEtBQUssS0FBSyxFQUFFO2dCQUMxQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztnQkFDbkIsS0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7YUFDbkI7aUJBQ0k7Z0JBQ0QsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7YUFDckI7WUFDRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ2hELENBQUMsQ0FBQztJQUNOLENBQUM7SUF2Q0QsNEJBdUNDO0lBQUEsQ0FBQztJQUVGLGdCQUF1QixjQUFjO1FBQ2pDLE9BQU8sVUFBVSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVU7UUFDakQsQ0FBQyxDQUFBO0lBQ0wsQ0FBQztJQUhELHdCQUdDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgU3VwZXJ0eXBlIH0gZnJvbSAnLi9TdXBlcnR5cGUnO1xuaW1wb3J0IHsgT2JqZWN0VGVtcGxhdGUgfSBmcm9tICcuL09iamVjdFRlbXBsYXRlJztcblxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcblxuLyoqXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0UHJvcHMtIG9wdGlvbmFsIHByb3BlcnR5IGZvciBwYXNzaW5nIHBhcmFtcyBpbnRvIHN1cGVydHlwZWNsYXNzLCBpZiBubyBwYXJhbXMsIGlzIHVuZGVmaW5lZCxcbiAgICAqICAgICAgICAgICAgICAgICAgICAgIGZpcnN0IHBhcmFtIG9mIHRoaXMgZnVuY3Rpb24gZGVmYXVsdHMgdG8gb2JqZWN0VGVtcGxhdGUgaW5zdGVhZFxuICAgICogQHBhcmFtIHsqfSBvYmplY3RUZW1wbGF0ZSBcbiAgICAqIFxuICAgICogQFRPRE86IGZpeCByZXR1cm4gdHlwZXNcbiAgICAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1cGVydHlwZUNsYXNzKG9iamVjdFByb3BzPywgb2JqZWN0VGVtcGxhdGU/KTogYW55IHtcblxuICAgIC8vIFdoZW4gdXNlZCBhcyBAc3VwZXJ0eXBlQ2xhc3Moe2JsYSBibGEgYmxhfSksIHRoZSBkZWNvcmF0b3IgaXMgZmlyc3QgY2FsbGVkIGFzIGl0IGlzXG4gICAgLy8gaXMgYmVpbmcgcGFzc2VkIGludG8gdGhlIGRlY29yYXRvciBwcm9jZXNzb3IgYW5kIHNvIGl0IG5lZWRzIHRvIHJldHVybiBhIGZ1bmN0aW9uXG4gICAgLy8gc28gdGhhdCBpdCB3aWxsIGJlIGNhbGxlZCBhZ2FpbiB3aGVuIHRoZSBkZWNvcmF0b3JzIGFyZSBhY3R1YWxseSBwcm9jZXNzZWQuICBLaW5kYSBzcGxpZmZ5LlxuXG4gICAgLy8gQ2FsbGVkIGJ5IGRlY29yYXRvciBwcm9jZXNzb3JcbiAgICBpZiAob2JqZWN0UHJvcHMucHJvdG90eXBlKSB7IC8vIGlmIG9iamVjdFByb3BzIGlzIHRoZSBjbGFzcyAoc2Vjb25kIHBhc3MgaWYgcGFzc2VkIHdpdGgge3RvQ2xpZW50IHN0eWxlIHBhcmFtc30gb3IgZmlyc3QgcGFzcyB3aGVuIEBzdXBlcnR5cGVDbGFzcyBubyBwYXJlbiBhbmQgYXJncylcbiAgICAgICAgcmV0dXJuIGRlY29yYXRvcihvYmplY3RQcm9wcyk7XG4gICAgfVxuXG4gICAgLy8gQ2FsbGVkIGZpcnN0IHRpbWUgd2l0aCBwYXJhbWV0ZXJcbiAgICB2YXIgcHJvcHMgPSBvYmplY3RQcm9wcztcbiAgICByZXR1cm4gZGVjb3JhdG9yO1xuXG4gICAgLy8gRGVjb3JhdG9yIFdvcmtlcmJlZVxuICAgIGZ1bmN0aW9uIGRlY29yYXRvcih0YXJnZXQpIHtcbiAgICAgICAgb2JqZWN0VGVtcGxhdGUgPSBvYmplY3RUZW1wbGF0ZSB8fCBPYmplY3RUZW1wbGF0ZTtcblxuICAgICAgICB0YXJnZXQucHJvdG90eXBlLl9fdGVtcGxhdGVfXyA9IHRhcmdldDtcbiAgICAgICAgdGFyZ2V0LnByb3RvdHlwZS5hbW9ycGhpY0NsYXNzID0gdGFyZ2V0O1xuICAgICAgICB0YXJnZXQucHJvdG90eXBlLmFtb3JwaGljR2V0Q2xhc3NOYW1lID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGFyZ2V0Ll9fbmFtZV9fIH07XG4gICAgICAgIHRhcmdldC5pc09iamVjdFRlbXBsYXRlID0gdHJ1ZTtcbiAgICAgICAgdGFyZ2V0Ll9faW5qZWN0aW9uc19fID0gW107XG4gICAgICAgIHRhcmdldC5fX29iamVjdFRlbXBsYXRlX18gPSBvYmplY3RUZW1wbGF0ZTtcbiAgICAgICAgdmFyIGNyZWF0ZVByb3BzID0gb2JqZWN0VGVtcGxhdGUuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzIHx8IHt9KTtcbiAgICAgICAgdGFyZ2V0Ll9fdG9DbGllbnRfXyA9IGNyZWF0ZVByb3BzLl9fdG9DbGllbnRfXztcbiAgICAgICAgdGFyZ2V0Ll9fdG9TZXJ2ZXJfXyA9IGNyZWF0ZVByb3BzLl9fdG9TZXJ2ZXJfXztcbiAgICAgICAgdGFyZ2V0Ll9fc2hhZG93Q2hpbGRyZW5fXyA9IFtdO1xuXG4gICAgICAgIC8vIFB1c2ggYW4gYXJyYXkgb2YgdGVtcGxhdGUgcmVmZXJlbmNlcyAod2UgY2FuJ3QgZ2V0IGF0IHRoZWlyIG5hbWVzIG5vdykuICBMYXRlciB3ZSB3aWxsXG4gICAgICAgIC8vIHVzZSB0aGlzIHRvIGNvbnN0cnVjdCBfX2RpY3Rpb25hcnlfX1xuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlc19fID0gb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZXNfXyB8fCBbXTtcbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZXNfXy5wdXNoKHRhcmdldCk7XG5cblxuICAgICAgICAvLyBXZSBjYW4gbmV2ZXIgcmVmZXJlbmNlIHRlbXBsYXRlIGZ1bmN0aW9ucyBhdCBjb21waWxlIHRpbWUgd2hpY2ggaXMgd2hlbiB0aGlzIGRlY29yYXRvciBpcyBleGVjdXRlZFxuICAgICAgICAvLyBUaGVyZWZvcmUgd2UgaGF2ZSB0byBzZXR1cCBnZXR0ZXJzIGZvciBwcm9wZXJ0aWVzIHRoYXQgbmVlZCBhY2Nlc3MgdG8gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBzb1xuICAgICAgICAvLyB0aGF0IHdlIGNhbiBlbnN1cmUgdGhleSBhcmUgZnVsbHkgcmVzb2x2ZWQgYmVmb3JlIGFjY2Vzc2luZyB0aGVtXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdkZWZpbmVQcm9wZXJ0aWVzJywgeyBnZXQ6IGRlZmluZVByb3BlcnRpZXMgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdhbW9ycGhpY1Byb3BlcnRpZXMnLCB7IGdldDogZGVmaW5lUHJvcGVydGllcyB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ19fbmFtZV9fJywgeyBnZXQ6IGdldE5hbWUgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdhbW9ycGhpY0NsYXNzTmFtZScsIHsgZ2V0OiBnZXROYW1lIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAncGFyZW50VGVtcGxhdGUnLCB7IGdldDogZ2V0UGFyZW50IH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnX19wYXJlbnRfXycsIHsgZ2V0OiBnZXRQYXJlbnQgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdfX2NoaWxkcmVuX18nLCB7IGdldDogZ2V0Q2hpbGRyZW4gfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdhbW9ycGhpY1BhcmVudENsYXNzJywgeyBnZXQ6IGdldFBhcmVudCB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2Ftb3JwaGljQ2hpbGRDbGFzc2VzJywgeyBnZXQ6IGdldENoaWxkcmVuIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnYW1vcnBoaWNTdGF0aWMnLCB7IGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gb2JqZWN0VGVtcGxhdGUgfSB9KTtcblxuICAgICAgICB0YXJnZXQuZnJvbVBPSk8gPSBmdW5jdGlvbiBmcm9tUE9KTyhwb2pvKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGFyZ2V0KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0YXJnZXQuZnJvbUpTT04gPSAvLyBMZWdhY3lcbiAgICAgICAgICAgIHRhcmdldC5hbW9ycGhpY0Zyb21KU09OID0gZnVuY3Rpb24gZnJvbUpTT04oc3RyLCBpZFByZWZpeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRhcmdldCwgaWRQcmVmaXgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICB0YXJnZXQuZ2V0UHJvcGVydGllcyA9IC8vIExlZ2FjeVxuICAgICAgICAgICAgdGFyZ2V0LmFtb3JwaGljR2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uIGdldFByb3BlcnRpZXMoaW5jbHVkZVZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGFyZ2V0LCB1bmRlZmluZWQsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgdGFyZ2V0LmNyZWF0ZVByb3BlcnR5ID0gLy8gTGVnYWN5XG4gICAgICAgICAgICB0YXJnZXQuYW1vcnBoaWNDcmVhdGVQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdID0gb2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcGVydHlOYW1lLCBkZWZpbmVQcm9wZXJ0eS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkub24sIGRlZmluZVByb3BlcnR5LnZhbGlkYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5wcm90b3R5cGUuX19hbW9ycGhpY3Byb3BzX19bcHJvcGVydHlOYW1lXSA9IGRlZmluZVByb3BlcnR5O1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmluZVByb3BlcnR5LnZhbHVlIGluIFsnc3RyaW5nJywgJ251bWJlciddIHx8IGRlZmluZVByb3BlcnR5LnZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQucHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBlbnVtZXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IGRlZmluZVByb3BlcnR5LnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldC5wcm90b3R5cGUsIHByb3BlcnR5TmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpc1snX18nICsgcHJvcGVydHlOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcGVydHlOYW1lXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUuY2xvbmUoZGVmaW5lUHJvcGVydHkudmFsdWUsIGRlZmluZVByb3BlcnR5Lm9mIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ19fJyArIHByb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWydfXycgKyBwcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0YXJnZXQucHJvdG90eXBlLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXyA9IG9iamVjdFRlbXBsYXRlLl9fZXhjZXB0aW9uc19fIHx8IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgZXhjZXB0aW9uS2V5IGluIHRhcmdldC5wcm90b3R5cGUuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYzogdGFyZ2V0LnByb3RvdHlwZS5fX2V4Y2VwdGlvbnNfX1tleGNlcHRpb25LZXldLFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogZ2V0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcDogZXhjZXB0aW9uS2V5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5wcm90b3R5cGUuX19hbW9ycGhpY3Byb3BzX187XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ2V0TmFtZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKS5tYXRjaCgvZnVuY3Rpb24gKFteKF0qKS8pWzFdO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdldERpY3Rpb25hcnkoKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5nZXRDbGFzc2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ2V0UGFyZW50KCkge1xuICAgICAgICAgICAgZ2V0RGljdGlvbmFyeSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5fX3NoYWRvd1BhcmVudF9fO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdldENoaWxkcmVuKCkge1xuICAgICAgICAgICAgZ2V0RGljdGlvbmFyeSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5fX3NoYWRvd0NoaWxkcmVuX187XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICBUT0RPOiBUeXBlc2NyaXB0XG4gICAgICAgIExvb2tpbmcgYXQgdGhlIHN1cGVydHlwZSBjb25zdHJ1Y3RvciB0aGVzZSBuZWVkIHRvIGJlIGRlYWx0IHdpdGhcbiAgICAgICAgLSBjcmVhdGVQcm9wZXJ0aWVzIHVzZWQgYnkgY2xpZW50LmpzIHRvIGFkZCBQZXJzaXN0b3IsIEdldCBhbmQgRmV0Y2hcbiAgICAgICAgLSBpbmplY3Rpb25zXG4gICAgICAgICovXG4gICAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eShwcm9wcz8pOiBhbnkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRLZXkpIHtcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICAgICAgcHJvcHMuZW51bWVyYWJsZSA9IHRydWU7XG4gICAgICAgIHRhcmdldC5fX2Ftb3JwaGljcHJvcHNfXyA9IHRhcmdldC5oYXNPd25Qcm9wZXJ0eSgnX19hbW9ycGhpY3Byb3BzX18nKSA/IHRhcmdldC5fX2Ftb3JwaGljcHJvcHNfXyA6IHt9O1xuICAgICAgICB2YXIgcmVmbGVjdGlvblR5cGUgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdkZXNpZ246dHlwZScsIHRhcmdldCwgdGFyZ2V0S2V5KTtcbiAgICAgICAgdmFyIGRlY2xhcmVkVHlwZSA9IHByb3BzLnR5cGU7XG4gICAgICAgIHZhciB0eXBlID0gcmVmbGVjdGlvblR5cGUgIT09IEFycmF5ID8gZGVjbGFyZWRUeXBlIHx8IHJlZmxlY3Rpb25UeXBlIDogZGVjbGFyZWRUeXBlO1xuICAgIC8vIFR5cGUgbWlzbWF0Y2hlc1xuICAgICAgICBpZiAoZGVjbGFyZWRUeXBlICYmIHJlZmxlY3Rpb25UeXBlICYmIHJlZmxlY3Rpb25UeXBlICE9PSBBcnJheSkge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fID0gdGFyZ2V0Ll9fZXhjZXB0aW9uc19fIHx8IHt9O1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fW3RhcmdldEtleV0gPSBmdW5jdGlvbiAoY2xhc3NOYW1lLCBwcm9wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYXNzTmFtZSArICcuJyArIHByb3AgKyAnIC0gZGVjb3JhdG9yIHR5cGUgZG9lcyBub3QgbWF0Y2ggYWN0dWFsIHR5cGUnO1xuICAgICAgICAgICAgfTtcbiAgICAvLyBEZWZlcnJlZCB0eXBlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHByb3BzLmdldFR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2RlZmVycmVkVHlwZV9fID0gdGFyZ2V0Lmhhc093blByb3BlcnR5KCdfX2RlZmVycmVkVHlwZV9fJykgPyB0YXJnZXQuX19kZWZlcnJlZFR5cGVfXyA6IHt9O1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZGVmZXJyZWRUeXBlX19bdGFyZ2V0S2V5XSA9IHByb3BzLmdldFR5cGU7XG4gICAgICAgICAgICBkZWxldGUgcHJvcHMuZ2V0VHlwZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghdHlwZSkge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fID0gdGFyZ2V0Ll9fZXhjZXB0aW9uc19fIHx8IHt9O1xuICAgICAgICAgICAgdGFyZ2V0Ll9fZXhjZXB0aW9uc19fW3RhcmdldEtleV0gPSBmdW5jdGlvbiAoY2xhc3NOYW1lLCBwcm9wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNsYXNzTmFtZSArICcuJyArIHByb3AgK1xuICAgICAgICAgICAgICAgICcgLSB0eXBlIGlzIHVuZGVmaW5lZC4gQ2lyY3VsYXIgcmVmZXJlbmNlPyBUcnkgQHByb3BlcnR5KHtnZXRUeXBlOiAoKSA9PiB7cmV0dXJuICcgK1xuICAgICAgICAgICAgICAgIHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc3Vic3RyKDEpICsgJ319KSc7XG5cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlZmxlY3Rpb25UeXBlID09PSBBcnJheSkge1xuICAgICAgICAgICAgcHJvcHMudHlwZSA9IEFycmF5O1xuICAgICAgICAgICAgcHJvcHMub2YgPSB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMudHlwZSA9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0Ll9fYW1vcnBoaWNwcm9wc19fW3RhcmdldEtleV0gPSBwcm9wcztcbiAgICB9O1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW90ZShkZWZpbmVQcm9wZXJ0eSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBwcm9wZXJ0eU5hbWUsIGRlc2NyaXB0b3IpIHtcbiAgICB9XG59Il19