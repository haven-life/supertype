/* Copyright 2011-2012 Sam Elsamman
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
 * ObjectTemplate - n Type System with Benefits
 */

 import * as serializer from './serializer';
 import * as ObjectTemplate from './ObjectTemplate';
 
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else if (typeof exports === 'object') {
        module.exports = factory();
    }
    else {
        root.ObjectTemplate = factory();
    }
}(this, function () {

    function ObjectTemplate() {
    }





/**
 * 
 * General function to create templates used by create, extend and mixin
 *
 * @param {unknown} mixinTemplate - template used for a mixin
 * @param {unknown} parentTemplate - template used for an extend
 * @param {unknown} propertiesOrTemplate - properties to be added/mxied in
 * @param {unknown} createProperties unknown
 * @param {unknown} templateName - the name of the template as it will be stored retrieved from dictionary
 *
 * @returns {Function}
 *
 * @private
 */
    ObjectTemplate._createTemplate = function createTemplate (mixinTemplate, parentTemplate, propertiesOrTemplate, createProperties, templateName, createTemplateNow) {
    // We will return a constructor that can be used in a new function
    // that will call an init() function found in properties, define properties using Object.defineProperties
    // and make copies of those that are really objects
        var functionProperties = {};    // Will be populated with init function from properties
        var objectProperties = {};    // List of properties to be processed by hand
        var defineProperties = {};    // List of properties to be sent to Object.defineProperties()
        var objectTemplate = this;
        var templatePrototype;

        function F () {}     // Used in case of extend

        if (!this.lazyTemplateLoad) {
            createTemplateNow = true;
        }
    // Setup variables depending on the type of call (create, extend, mixin)
        if (createTemplateNow) {
            if (mixinTemplate) {        // Mixin
                this.createIfNeeded(mixinTemplate);
                if (propertiesOrTemplate.isObjectTemplate) {
                    this.createIfNeeded(propertiesOrTemplate);
                    for (var prop in propertiesOrTemplate.defineProperties) {
                        mixinTemplate.defineProperties[prop] = propertiesOrTemplate.defineProperties[prop];
                    }

                    for (var propp in propertiesOrTemplate.objectProperties) {
                        mixinTemplate.objectProperties[propp] = propertiesOrTemplate.objectProperties[propp];
                    }

                    for (var propo in propertiesOrTemplate.functionProperties) {
                        if (propo == 'init') {
                            mixinTemplate.functionProperties.init = mixinTemplate.functionProperties.init || [];

                            for (var ix = 0; ix < propertiesOrTemplate.functionProperties.init.length; ++ix) {
                                mixinTemplate.functionProperties.init.push(propertiesOrTemplate.functionProperties.init[ix]);
                            }
                        }
                        else {
                            mixinTemplate.functionProperties[propo] = propertiesOrTemplate.functionProperties[propo];
                        }
                    }

                    for (var propn in propertiesOrTemplate.prototype) {
                        var propDesc = Object.getOwnPropertyDescriptor(propertiesOrTemplate.prototype, propn);

                        if (propDesc) {
                            Object.defineProperty(mixinTemplate.prototype, propn, propDesc);

                            if (propDesc.get) {
                                Object.getOwnPropertyDescriptor(mixinTemplate.prototype, propn).get.sourceTemplate = propDesc.get.sourceTemplate;
                            }
                        }
                        else {
                            mixinTemplate.prototype[propn] = propertiesOrTemplate.prototype[propn];
                        }
                    }

                    mixinTemplate.props = {};

                    var props = ObjectTemplate._getDefineProperties(mixinTemplate, undefined, true);

                    for (var propm in props) {
                        mixinTemplate.props[propm] = props[propm];
                    }

                    return mixinTemplate;
                }
                else {
                    defineProperties = mixinTemplate.defineProperties;
                    objectProperties = mixinTemplate.objectProperties;
                    functionProperties = mixinTemplate.functionProperties;
                    templatePrototype = mixinTemplate.prototype;
                    parentTemplate = mixinTemplate.parentTemplate;
                }
            }
            else {        // Extend
                this.createIfNeeded(parentTemplate);
                F.prototype = parentTemplate.prototype;
                templatePrototype = new F();
            }
        }
    /**
     * Constructor that will be returned will only ever be created once
     */
        var template = this.__dictionary__[templateName] || function template() {

            objectTemplate.createIfNeeded(template, this);

            objectTemplate.__templateUsage__[template.__name__] = true;
            var parent = template.__parent__;
            while (parent) {
                objectTemplate.__templateUsage__[parent.__name__] = true;
                var parent = parent.__parent__;
            }

            this.__template__ = template;

            if (objectTemplate.__transient__) {
                this.__transient__ = true;
            }

            var prunedObjectProperties = pruneExisting(this, template.objectProperties);
            var prunedDefineProperties = pruneExisting(this, template.defineProperties);

            try {
            // Create properties either with EMCA 5 defineProperties or by hand
                if (Object.defineProperties) {
                    Object.defineProperties(this, prunedDefineProperties);    // This method will be added pre-EMCA 5
                }
            }
            catch (e) {
            // TODO: find a better way to deal with errors that are thrown
                console.log(e);     // eslint-disable-line no-console
            }

            this.fromRemote = this.fromRemote || objectTemplate._stashObject(this, template);

            this.copyProperties = function copyProperties(obj) {
                for (var prop in obj) {
                    this[prop] = obj[prop];
                }
            };

        // Initialize properties from the defineProperties value property
            for (var propertyName in prunedObjectProperties) {
                var defineProperty = prunedObjectProperties[propertyName];

                if (typeof(defineProperty.init) !== 'undefined') {
                    if (defineProperty.byValue) {
                        this[propertyName] = ObjectTemplate.clone(defineProperty.init, defineProperty.of || defineProperty.type || null);
                    }
                    else {
                        this[propertyName] = (defineProperty.init);
                    }
                }
            }

        // Template level injections
            for (var ix = 0; ix < template.__injections__.length; ++ix) {
                template.__injections__[ix].call(this, this);
            }

        // Global injections
            for (var j = 0; j < objectTemplate.__injections__.length; ++j) {
                objectTemplate.__injections__[j].call(this, this);
            }

            this.__prop__ = function g(prop) {
                return ObjectTemplate._getDefineProperty(prop, this.__template__);
            };

            this.__values__ = function f(prop) {
                var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);

                if (typeof(defineProperty.values) === 'function') {
                    return defineProperty.values.call(this);
                }

                return defineProperty.values;
            };

            this.__descriptions__ = function e(prop) {
                var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);

                if (typeof(defineProperty.descriptions) === 'function') {
                    return defineProperty.descriptions.call(this);
                }

                return defineProperty.descriptions;
            };

        // If we don't have an init function or are a remote creation call parent constructor otherwise call init
        //  function who will be responsible for calling parent constructor to allow for parameter passing.
            if (this.fromRemote || !template.functionProperties.init || objectTemplate.noInit) {
                if (parentTemplate && parentTemplate.isObjectTemplate) {
                    parentTemplate.call(this);
                }
            }
            else {
                if (template.functionProperties.init) {
                    for (var i = 0; i < template.functionProperties.init.length; ++i) {
                        template.functionProperties.init[i].apply(this, arguments);
                    }
                }
            }

            this.__template__ = template;

            this.toJSONString = function toJSONString(cb) {
                return serializer.toJSONString(this, cb);
            };

        /* Clone and object calling a callback for each referenced object.
         The call back is passed (obj, prop, template)
         obj - the parent object (except the highest level)
         prop - the name of the property
         template - the template of the object to be created
         the function returns:
         - falsy - clone object as usual with a new id
         - object reference - the callback created the object (presumably to be able to pass init parameters)
         - [object] - a one element array of the object means don't copy the properties or traverse
         */
            this.createCopy = function createCopy(creator) {
                return ObjectTemplate.createCopy(this, creator);
            };

        };

        template.isObjectTemplate = true;

        template.extend = function extend(p1, p2) {
            return objectTemplate.extend.call(objectTemplate, this, p1, p2);
        };

        template.mixin = function mixin(p1, p2) {
            return objectTemplate.mixin.call(objectTemplate, this, p1, p2);
        };

        template.staticMixin = function staticMixin(p1, p2) {
            return objectTemplate.staticMixin.call(objectTemplate, this, p1, p2);
        };

        template.fromPOJO = function fromPOJO(pojo) {
            objectTemplate.createIfNeeded(template);
            return objectTemplate.fromPOJO(pojo, template);
        };

        template.fromJSON = function fromJSON(str, idPrefix) {
            objectTemplate.createIfNeeded(template);
            return objectTemplate.fromJSON(str, template, idPrefix);
        };

        template.getProperties = function getProperties(includeVirtual) {
            objectTemplate.createIfNeeded(template);
            return ObjectTemplate._getDefineProperties(template, undefined, includeVirtual);
        };

        if (!createTemplateNow) {
            template.__createParameters__ = template.__createParameters__ || [];
            template.__createParameters__.push([mixinTemplate, parentTemplate, propertiesOrTemplate, createProperties, templateName]);
            return template;
        }

        template.prototype = templatePrototype;

        var createProperty = function createProperty(propertyName, propertyValue, properties, createProperties) {
            if (!properties) {
                properties = {};
                properties[propertyName] = propertyValue;
            }

        // Record the initialization function
            if (propertyName == 'init' && typeof(properties[propertyName]) === 'function') {
                functionProperties.init = [properties[propertyName]];
            }
            else {
                var defineProperty = null;    // defineProperty to be added to defineProperties

            // Determine the property value which may be a defineProperties structure or just an initial value
                var descriptor = {};

                if (properties) {
                    descriptor = Object.getOwnPropertyDescriptor(properties, propertyName);
                }

                var type = 'null';

                if (descriptor.get || descriptor.set) {
                    type = 'getset';
                }
                else if (properties[propertyName] !== null) {
                    type = typeof(properties[propertyName]);
                }

                switch (type) {
                // Figure out whether this is a defineProperty structure (has a constructor of object)
                case 'object': // Or array
                    // Handle remote function calls
                    if (properties[propertyName].body && typeof(properties[propertyName].body) === 'function') {
                        templatePrototype[propertyName] = objectTemplate._setupFunction(propertyName, properties[propertyName].body, properties[propertyName].on, properties[propertyName].validate);

                        if (properties[propertyName].type) {
                            templatePrototype[propertyName].__returns__ = properties[propertyName].type;
                        }

                        if (properties[propertyName].of) {
                            templatePrototype[propertyName].__returns__ = properties[propertyName].of;
                            templatePrototype[propertyName].__returnsarray__ = true;
                        }

                        templatePrototype[propertyName].__on__ = properties[propertyName].on;
                        templatePrototype[propertyName].__validate__ = properties[propertyName].validate;
                        templatePrototype[propertyName].__body__ = properties[propertyName].body;
                        break;
                    }
                    else if (properties[propertyName].type) {
                        defineProperty = properties[propertyName];
                        properties[propertyName].writable = true;  // We are using setters

                        if (typeof(properties[propertyName].enumerable) === 'undefined') {
                            properties[propertyName].enumerable = true;
                        }
                        break;
                    }
                    else if (properties[propertyName] instanceof Array) {
                        defineProperty = {type: Object, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                        break;
                    }
                    else { // Other crap
                        defineProperty = {type: Object, value: properties[propertyName], enumerable: true, writable: true};
                        break;
                    }

                case 'string':
                    defineProperty = {type: String, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                    break;

                case 'boolean':
                    defineProperty = {type: Boolean, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                    break;

                case 'number':
                    defineProperty = {type: Number, value: properties[propertyName], enumerable: true, writable: true, isLocal: true};
                    break;

                case 'function':
                    templatePrototype[propertyName] = objectTemplate._setupFunction(propertyName, properties[propertyName]);
                    templatePrototype[propertyName].sourceTemplate = templateName;
                    break;

                case 'getset': // getters and setters
                    descriptor.templateSource = templateName;
                    Object.defineProperty(templatePrototype, propertyName, descriptor);
                    Object.getOwnPropertyDescriptor(templatePrototype, propertyName).get.sourceTemplate = templateName;
                    break;
                }

            // If a defineProperty to be added
                if (defineProperty) {
                    if (typeof descriptor.toClient !== 'undefined') {
                        defineProperty.toClient = descriptor.toClient;
                    }
                    if (typeof descriptor.toServer !== 'undefined') {
                        defineProperty.toServer = descriptor.toServer;
                    }

                    objectTemplate._setupProperty(propertyName, defineProperty, objectProperties, defineProperties, parentTemplate, createProperties);
                    defineProperty.sourceTemplate = templateName;
                }
            }
        };

    // Walk through properties and construct the defineProperties hash of properties, the list of
    // objectProperties that have to be reinstantiated and attach functions to the prototype
        for (var propertyName in propertiesOrTemplate) {
            createProperty(propertyName, null, propertiesOrTemplate, createProperties);
        }

        template.defineProperties = defineProperties;
        template.objectProperties = objectProperties;

        template.functionProperties = functionProperties;
        template.parentTemplate = parentTemplate;


        template.createProperty = createProperty;

        template.props = {};

        var propst = ObjectTemplate._getDefineProperties(template, undefined, true);

        for (var propd in propst) {
            template.props[propd] = propst[propd];
        }

        return template;
    };



    ObjectTemplate.init();

    ObjectTemplate.supertypeClass = function (target, objectTemplate) {

        // When used as @supertypeClass({bla bla bla}), the decorator is first called as it is
        // is being passed into the decorator processor and so it needs to return a function
        // so that it will be called again when the decorators are actually processed.  Kinda spliffy.

        // Called by decorator processor
        if (target.prototype) {
            return decorator(target);
        }

        // Called first time with parameter
        return decorator;

        // Decorator Workerbee
        function decorator (target) {
            objectTemplate = objectTemplate || ObjectTemplate;

            target.prototype.__template__ = target;
            target.prototype.amorphicClass = target;
            target.prototype.amorphicGetClassName = function () {return target.__name__};
            target.isObjectTemplate = true;
            target.__injections__ = [];
            target.__objectTemplate__ = objectTemplate;
            var createProps = objectTemplate.getTemplateProperties(target || {});
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
            Object.defineProperty(target, 'defineProperties', {get: defineProperties});
            Object.defineProperty(target, 'amorphicProperties', {get: defineProperties});
            Object.defineProperty(target, '__name__', {get: getName});
            Object.defineProperty(target, 'amorphicClassName', {get: getName});
            Object.defineProperty(target, 'parentTemplate', {get: getParent});
            Object.defineProperty(target, '__parent__', {get: getParent});
            Object.defineProperty(target, '__children__', {get: getChildren});
            Object.defineProperty(target, 'amorphicParentClass', {get: getParent});
            Object.defineProperty(target, 'amorphicChildClasses', {get: getChildren});
            Object.defineProperty(target, 'amorphicStatic', {get: function () {return objectTemplate}});

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
                    target.prototype[propertyName] = objectTemplate._setupFunction(propertyName, defineProperty.body,
                        defineProperty.on, defineProperty.validate);
                }
                else {
                    target.prototype.__amorphicprops__[propertyName] = defineProperty;
                    if (typeof defineProperty.value in ['string', 'number'] || defineProperty.value == null) {
                        Object.defineProperty(target.prototype, propertyName,
                            {enumerable: true, writable: true, value: defineProperty.value});
                    }
                    else {
                        Object.defineProperty(target.prototype, propertyName, {enumerable: true,
                            get: function () {
                                if (!this['__' + propertyName]) {
                                    this['__' + propertyName] =
                                        ObjectTemplate.clone(defineProperty.value, defineProperty.of ||
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

            if (target.prototype.__exceptions__)  {
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
            function getName () {
                return target.toString().match(/function ([^(]*)/)[1];
            }
            function getDictionary () {
                objectTemplate.getClasses();
            }
            function getParent () {
                getDictionary();
                return target.__shadowParent__;
            }
            function getChildren () {
                getDictionary();
                return target.__shadowChildren__;
            }

        /*
        TODO: Typescript
        Looking at the supertype constructor these need to be dealt with
        - createProperties used by client.js to add Persistor, Get and Fetch
        - injections
        */
            function constructorName(constructor) {
                var namedFunction = constructor.toString().match(/function ([^(]*)/);
                return namedFunction ? namedFunction[1] : null;
            }
        }
    };


/**
 * This is the base class for typescript classes.  It must
 * It will inject members into the object from both the template and objectTemplate
 * @param {ObjectTemplate} - other layers can pass in their own object template (this is the object not ObjectTemplate)
 * @returns {Object} the object itself
 */
    // objectTemplate = objectTemplate || ObjectTemplate 
    // pass ObjectTemplate into Supertype's constructor
    ObjectTemplate.Supertype = Supertype.constructor

	ObjectTemplate.property = function (props) {
        require('reflect-metadata');
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
    };

    ObjectTemplate.remote = function (defineProperty) {
        return function (target, propertyName, descriptor) {
        };
    };

    ObjectTemplate.amorphicStatic = ObjectTemplate;

    return ObjectTemplate;

}));
