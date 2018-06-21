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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQUEseUNBQXdDO0lBQS9CLGdDQUFBLFNBQVMsQ0FBQTtJQUNsQixtREFBa0Q7SUFFbEQsNEJBQTBCO0lBRTFCOzs7Ozs7O1VBT007SUFDTix3QkFBK0IsV0FBWSxFQUFFLGNBQWU7UUFFeEQsc0ZBQXNGO1FBQ3RGLG9GQUFvRjtRQUNwRiw4RkFBOEY7UUFFOUYsZ0NBQWdDO1FBQ2hDLElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRSxFQUFFLHdJQUF3STtZQUNqSyxPQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNqQztRQUVELG1DQUFtQztRQUNuQyxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUM7UUFDeEIsT0FBTyxTQUFTLENBQUM7UUFFakIsc0JBQXNCO1FBQ3RCLG1CQUFtQixNQUFNO1lBQ3JCLGNBQWMsR0FBRyxjQUFjLElBQUksK0JBQWMsQ0FBQztZQUVsRCxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7WUFDdkMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEdBQUcsY0FBYyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUEsQ0FBQyxDQUFDLENBQUM7WUFDL0UsTUFBTSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUMvQixNQUFNLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUMzQixNQUFNLENBQUMsa0JBQWtCLEdBQUcsY0FBYyxDQUFDO1lBQzNDLElBQUksV0FBVyxHQUFHLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1lBQy9D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QUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUVuRCxDQUFDLENBQUM7YUFDTDtZQUNELElBQUksY0FBYyxLQUFLLEtBQUssRUFBRTtnQkFDMUIsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7Z0JBQ25CLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO2FBQ25CO2lCQUNJO2dCQUNELEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO2FBQ3JCO1lBQ0QsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNoRCxDQUFDLENBQUM7SUFDTixDQUFDO0lBdkNELDRCQXVDQztJQUFBLENBQUM7SUFFRixnQkFBdUIsY0FBYztRQUNqQyxPQUFPLFVBQVUsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVO1FBQ2pELENBQUMsQ0FBQTtJQUNMLENBQUM7SUFIRCx3QkFHQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IFN1cGVydHlwZSB9IGZyb20gJy4vU3VwZXJ0eXBlJztcbmltcG9ydCB7IE9iamVjdFRlbXBsYXRlIH0gZnJvbSAnLi9PYmplY3RUZW1wbGF0ZSc7XG5cbmltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5cbi8qKlxuICAgICogXG4gICAgKiBAcGFyYW0geyp9IG9iamVjdFByb3BzLSBvcHRpb25hbCBwcm9wZXJ0eSBmb3IgcGFzc2luZyBwYXJhbXMgaW50byBzdXBlcnR5cGVjbGFzcywgaWYgbm8gcGFyYW1zLCBpcyB1bmRlZmluZWQsXG4gICAgKiAgICAgICAgICAgICAgICAgICAgICBmaXJzdCBwYXJhbSBvZiB0aGlzIGZ1bmN0aW9uIGRlZmF1bHRzIHRvIG9iamVjdFRlbXBsYXRlIGluc3RlYWRcbiAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0VGVtcGxhdGUgXG4gICAgKiBcbiAgICAqIEBUT0RPOiBmaXggcmV0dXJuIHR5cGVzXG4gICAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdXBlcnR5cGVDbGFzcyhvYmplY3RQcm9wcz8sIG9iamVjdFRlbXBsYXRlPyk6IGFueSB7XG5cbiAgICAvLyBXaGVuIHVzZWQgYXMgQHN1cGVydHlwZUNsYXNzKHtibGEgYmxhIGJsYX0pLCB0aGUgZGVjb3JhdG9yIGlzIGZpcnN0IGNhbGxlZCBhcyBpdCBpc1xuICAgIC8vIGlzIGJlaW5nIHBhc3NlZCBpbnRvIHRoZSBkZWNvcmF0b3IgcHJvY2Vzc29yIGFuZCBzbyBpdCBuZWVkcyB0byByZXR1cm4gYSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgaXQgd2lsbCBiZSBjYWxsZWQgYWdhaW4gd2hlbiB0aGUgZGVjb3JhdG9ycyBhcmUgYWN0dWFsbHkgcHJvY2Vzc2VkLiAgS2luZGEgc3BsaWZmeS5cblxuICAgIC8vIENhbGxlZCBieSBkZWNvcmF0b3IgcHJvY2Vzc29yXG4gICAgaWYgKG9iamVjdFByb3BzLnByb3RvdHlwZSkgeyAvLyBpZiBvYmplY3RQcm9wcyBpcyB0aGUgY2xhc3MgKHNlY29uZCBwYXNzIGlmIHBhc3NlZCB3aXRoIHt0b0NsaWVudCBzdHlsZSBwYXJhbXN9IG9yIGZpcnN0IHBhc3Mgd2hlbiBAc3VwZXJ0eXBlQ2xhc3Mgbm8gcGFyZW4gYW5kIGFyZ3MpXG4gICAgICAgIHJldHVybiBkZWNvcmF0b3Iob2JqZWN0UHJvcHMpO1xuICAgIH1cblxuICAgIC8vIENhbGxlZCBmaXJzdCB0aW1lIHdpdGggcGFyYW1ldGVyXG4gICAgdmFyIHByb3BzID0gb2JqZWN0UHJvcHM7XG4gICAgcmV0dXJuIGRlY29yYXRvcjtcblxuICAgIC8vIERlY29yYXRvciBXb3JrZXJiZWVcbiAgICBmdW5jdGlvbiBkZWNvcmF0b3IodGFyZ2V0KSB7XG4gICAgICAgIG9iamVjdFRlbXBsYXRlID0gb2JqZWN0VGVtcGxhdGUgfHwgT2JqZWN0VGVtcGxhdGU7XG5cbiAgICAgICAgdGFyZ2V0LnByb3RvdHlwZS5fX3RlbXBsYXRlX18gPSB0YXJnZXQ7XG4gICAgICAgIHRhcmdldC5wcm90b3R5cGUuYW1vcnBoaWNDbGFzcyA9IHRhcmdldDtcbiAgICAgICAgdGFyZ2V0LnByb3RvdHlwZS5hbW9ycGhpY0dldENsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRhcmdldC5fX25hbWVfXyB9O1xuICAgICAgICB0YXJnZXQuaXNPYmplY3RUZW1wbGF0ZSA9IHRydWU7XG4gICAgICAgIHRhcmdldC5fX2luamVjdGlvbnNfXyA9IFtdO1xuICAgICAgICB0YXJnZXQuX19vYmplY3RUZW1wbGF0ZV9fID0gb2JqZWN0VGVtcGxhdGU7XG4gICAgICAgIHZhciBjcmVhdGVQcm9wcyA9IG9iamVjdFRlbXBsYXRlLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcyB8fCB7fSk7XG4gICAgICAgIHRhcmdldC5fX3RvQ2xpZW50X18gPSBjcmVhdGVQcm9wcy5fX3RvQ2xpZW50X187XG4gICAgICAgIHRhcmdldC5fX3RvU2VydmVyX18gPSBjcmVhdGVQcm9wcy5fX3RvU2VydmVyX187XG4gICAgICAgIHRhcmdldC5fX3NoYWRvd0NoaWxkcmVuX18gPSBbXTtcblxuICAgICAgICAvLyBQdXNoIGFuIGFycmF5IG9mIHRlbXBsYXRlIHJlZmVyZW5jZXMgKHdlIGNhbid0IGdldCBhdCB0aGVpciBuYW1lcyBub3cpLiAgTGF0ZXIgd2Ugd2lsbFxuICAgICAgICAvLyB1c2UgdGhpcyB0byBjb25zdHJ1Y3QgX19kaWN0aW9uYXJ5X19cbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZXNfXyA9IG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVzX18gfHwgW107XG4gICAgICAgIG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVzX18ucHVzaCh0YXJnZXQpO1xuXG5cbiAgICAgICAgLy8gV2UgY2FuIG5ldmVyIHJlZmVyZW5jZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXQgY29tcGlsZSB0aW1lIHdoaWNoIGlzIHdoZW4gdGhpcyBkZWNvcmF0b3IgaXMgZXhlY3V0ZWRcbiAgICAgICAgLy8gVGhlcmVmb3JlIHdlIGhhdmUgdG8gc2V0dXAgZ2V0dGVycyBmb3IgcHJvcGVydGllcyB0aGF0IG5lZWQgYWNjZXNzIHRvIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgc29cbiAgICAgICAgLy8gdGhhdCB3ZSBjYW4gZW5zdXJlIHRoZXkgYXJlIGZ1bGx5IHJlc29sdmVkIGJlZm9yZSBhY2Nlc3NpbmcgdGhlbVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnZGVmaW5lUHJvcGVydGllcycsIHsgZ2V0OiBkZWZpbmVQcm9wZXJ0aWVzIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnYW1vcnBoaWNQcm9wZXJ0aWVzJywgeyBnZXQ6IGRlZmluZVByb3BlcnRpZXMgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdfX25hbWVfXycsIHsgZ2V0OiBnZXROYW1lIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnYW1vcnBoaWNDbGFzc05hbWUnLCB7IGdldDogZ2V0TmFtZSB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ3BhcmVudFRlbXBsYXRlJywgeyBnZXQ6IGdldFBhcmVudCB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ19fcGFyZW50X18nLCB7IGdldDogZ2V0UGFyZW50IH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnX19jaGlsZHJlbl9fJywgeyBnZXQ6IGdldENoaWxkcmVuIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCAnYW1vcnBoaWNQYXJlbnRDbGFzcycsIHsgZ2V0OiBnZXRQYXJlbnQgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdhbW9ycGhpY0NoaWxkQ2xhc3NlcycsIHsgZ2V0OiBnZXRDaGlsZHJlbiB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2Ftb3JwaGljU3RhdGljJywgeyBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9iamVjdFRlbXBsYXRlIH0gfSk7XG5cbiAgICAgICAgdGFyZ2V0LmZyb21QT0pPID0gZnVuY3Rpb24gZnJvbVBPSk8ocG9qbykge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRlbXBsYXRlLmZyb21QT0pPKHBvam8sIHRhcmdldCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGFyZ2V0LmZyb21KU09OID0gLy8gTGVnYWN5XG4gICAgICAgICAgICB0YXJnZXQuYW1vcnBoaWNGcm9tSlNPTiA9IGZ1bmN0aW9uIGZyb21KU09OKHN0ciwgaWRQcmVmaXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oc3RyLCB0YXJnZXQsIGlkUHJlZml4KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgdGFyZ2V0LmdldFByb3BlcnRpZXMgPSAvLyBMZWdhY3lcbiAgICAgICAgICAgIHRhcmdldC5hbW9ycGhpY0dldFByb3BlcnRpZXMgPSBmdW5jdGlvbiBnZXRQcm9wZXJ0aWVzKGluY2x1ZGVWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgdW5kZWZpbmVkLCBpbmNsdWRlVmlydHVhbCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHRhcmdldC5jcmVhdGVQcm9wZXJ0eSA9IC8vIExlZ2FjeVxuICAgICAgICAgICAgdGFyZ2V0LmFtb3JwaGljQ3JlYXRlUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHlOYW1lLCBkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5ib2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5wcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgZGVmaW5lUHJvcGVydHkuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5Lm9uLCBkZWZpbmVQcm9wZXJ0eS52YWxpZGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHJvdG90eXBlLl9fYW1vcnBoaWNwcm9wc19fW3Byb3BlcnR5TmFtZV0gPSBkZWZpbmVQcm9wZXJ0eTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSBpbiBbJ3N0cmluZycsICdudW1iZXInXSB8fCBkZWZpbmVQcm9wZXJ0eS52YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LnByb3RvdHlwZSwgcHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZW51bWVyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlOiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQucHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXNbJ19fJyArIHByb3BlcnR5TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BlcnR5TmFtZV0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdFRlbXBsYXRlLmNsb25lKGRlZmluZVByb3BlcnR5LnZhbHVlLCBkZWZpbmVQcm9wZXJ0eS5vZiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzWydfXycgKyBwcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1snX18nICsgcHJvcGVydHlOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAodGFyZ2V0LnByb3RvdHlwZS5fX2V4Y2VwdGlvbnNfXykge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19leGNlcHRpb25zX18gPSBvYmplY3RUZW1wbGF0ZS5fX2V4Y2VwdGlvbnNfXyB8fCBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGV4Y2VwdGlvbktleSBpbiB0YXJnZXQucHJvdG90eXBlLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19leGNlcHRpb25zX18ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmM6IHRhcmdldC5wcm90b3R5cGUuX19leGNlcHRpb25zX19bZXhjZXB0aW9uS2V5XSxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6IGdldE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHByb3A6IGV4Y2VwdGlvbktleVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcygpIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQucHJvdG90eXBlLl9fYW1vcnBoaWNwcm9wc19fO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdldE5hbWUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXihdKikvKVsxXTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZXREaWN0aW9uYXJ5KCkge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuZ2V0Q2xhc3NlcygpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdldFBhcmVudCgpIHtcbiAgICAgICAgICAgIGdldERpY3Rpb25hcnkoKTtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQuX19zaGFkb3dQYXJlbnRfXztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBnZXRDaGlsZHJlbigpIHtcbiAgICAgICAgICAgIGdldERpY3Rpb25hcnkoKTtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQuX19zaGFkb3dDaGlsZHJlbl9fO1xuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgVE9ETzogVHlwZXNjcmlwdFxuICAgICAgICBMb29raW5nIGF0IHRoZSBzdXBlcnR5cGUgY29uc3RydWN0b3IgdGhlc2UgbmVlZCB0byBiZSBkZWFsdCB3aXRoXG4gICAgICAgIC0gY3JlYXRlUHJvcGVydGllcyB1c2VkIGJ5IGNsaWVudC5qcyB0byBhZGQgUGVyc2lzdG9yLCBHZXQgYW5kIEZldGNoXG4gICAgICAgIC0gaW5qZWN0aW9uc1xuICAgICAgICAqL1xuICAgIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkocHJvcHM/KTogYW55IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0S2V5KSB7XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgICAgIHByb3BzLmVudW1lcmFibGUgPSB0cnVlO1xuICAgICAgICB0YXJnZXQuX19hbW9ycGhpY3Byb3BzX18gPSB0YXJnZXQuaGFzT3duUHJvcGVydHkoJ19fYW1vcnBoaWNwcm9wc19fJykgPyB0YXJnZXQuX19hbW9ycGhpY3Byb3BzX18gOiB7fTtcbiAgICAgICAgdmFyIHJlZmxlY3Rpb25UeXBlID0gUmVmbGVjdC5nZXRNZXRhZGF0YSgnZGVzaWduOnR5cGUnLCB0YXJnZXQsIHRhcmdldEtleSk7XG4gICAgICAgIHZhciBkZWNsYXJlZFR5cGUgPSBwcm9wcy50eXBlO1xuICAgICAgICB2YXIgdHlwZSA9IHJlZmxlY3Rpb25UeXBlICE9PSBBcnJheSA/IGRlY2xhcmVkVHlwZSB8fCByZWZsZWN0aW9uVHlwZSA6IGRlY2xhcmVkVHlwZTtcbiAgICAvLyBUeXBlIG1pc21hdGNoZXNcbiAgICAgICAgaWYgKGRlY2xhcmVkVHlwZSAmJiByZWZsZWN0aW9uVHlwZSAmJiByZWZsZWN0aW9uVHlwZSAhPT0gQXJyYXkpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfXyA9IHRhcmdldC5fX2V4Y2VwdGlvbnNfXyB8fCB7fTtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfX1t0YXJnZXRLZXldID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgcHJvcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWUgKyAnLicgKyBwcm9wICsgJyAtIGRlY29yYXRvciB0eXBlIGRvZXMgbm90IG1hdGNoIGFjdHVhbCB0eXBlJztcbiAgICAgICAgICAgIH07XG4gICAgLy8gRGVmZXJyZWQgdHlwZVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBwcm9wcy5nZXRUeXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0YXJnZXQuX19kZWZlcnJlZFR5cGVfXyA9IHRhcmdldC5oYXNPd25Qcm9wZXJ0eSgnX19kZWZlcnJlZFR5cGVfXycpID8gdGFyZ2V0Ll9fZGVmZXJyZWRUeXBlX18gOiB7fTtcbiAgICAgICAgICAgIHRhcmdldC5fX2RlZmVycmVkVHlwZV9fW3RhcmdldEtleV0gPSBwcm9wcy5nZXRUeXBlO1xuICAgICAgICAgICAgZGVsZXRlIHByb3BzLmdldFR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfXyA9IHRhcmdldC5fX2V4Y2VwdGlvbnNfXyB8fCB7fTtcbiAgICAgICAgICAgIHRhcmdldC5fX2V4Y2VwdGlvbnNfX1t0YXJnZXRLZXldID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgcHJvcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWUgKyAnLicgKyBwcm9wICtcbiAgICAgICAgICAgICAgICAnIC0gdHlwZSBpcyB1bmRlZmluZWQuIENpcmN1bGFyIHJlZmVyZW5jZT8gVHJ5IEBwcm9wZXJ0eSh7Z2V0VHlwZTogKCkgPT4ge3JldHVybiAnICtcbiAgICAgICAgICAgICAgICBwcm9wWzBdLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnN1YnN0cigxKSArICd9fSknO1xuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWZsZWN0aW9uVHlwZSA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgIHByb3BzLnR5cGUgPSBBcnJheTtcbiAgICAgICAgICAgIHByb3BzLm9mID0gdHlwZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzLnR5cGUgPSB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC5fX2Ftb3JwaGljcHJvcHNfX1t0YXJnZXRLZXldID0gcHJvcHM7XG4gICAgfTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdGUoZGVmaW5lUHJvcGVydHkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgcHJvcGVydHlOYW1lLCBkZXNjcmlwdG9yKSB7XG4gICAgfVxufSJdfQ==