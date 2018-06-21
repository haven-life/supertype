(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./serializer", "./SupertypeLogger"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var serializer = require("./serializer");
    var SupertypeLogger_1 = require("./SupertypeLogger");
    /**
     * Allow the property to be either a boolean a function that returns a boolean or a string
     * matched against a rule set array of string in ObjectTemplate
     *
     * @param  prop unknown
     * @param ruleSet unknown
     *
     * @returns {function(this:ObjectTemplate)}
     */
    function processProp(prop, ruleSet) {
        var ret = null;
        if (typeof (prop) === 'function') {
            ret = prop.call(ObjectTemplate);
        }
        else if (typeof (prop) === 'string') {
            ret = false;
            if (ruleSet) {
                ruleSet.map(function i(rule) {
                    // this will always execute
                    if (!ret) {
                        // double equals or single equals?
                        ret = rule == prop;
                    }
                });
            }
        }
        else if (prop instanceof Array) {
            prop.forEach(function h(prop) {
                ret = ret || processProp(prop, ruleSet);
            });
        }
        else {
            ret = prop;
        }
        return ret;
    }
    function pruneExisting(obj, props) {
        var newProps = {};
        for (var prop in props) {
            if (typeof (obj[prop]) === 'undefined') {
                newProps[prop] = props[prop];
            }
        }
        return newProps;
    }
    /**
     * the og ObjectTemplate, what everything picks off of
     */
    var ObjectTemplate = /** @class */ (function () {
        function ObjectTemplate() {
        }
        /**
         * Purpose unknown
         */
        ObjectTemplate.performInjections = function () {
            this.getClasses();
            if (this.__templatesToInject__) {
                var objectTemplate_1 = this;
                for (var templateName in this.__templatesToInject__) {
                    var template = this.__templatesToInject__[templateName];
                    template.inject = function inject(injector) {
                        objectTemplate_1.inject(this, injector);
                    };
                    this._injectIntoTemplate(template);
                }
            }
        };
        ObjectTemplate.init = function () {
            this.__templateUsage__ = {};
            this.__injections__ = [];
            this.__dictionary__ = {};
            this.__anonymousId__ = 1;
            this.__templatesToInject__ = {};
            this.logger = this.createLogger(); // Create a default logger
        };
        ObjectTemplate.getTemplateByName = function (name) {
            return this.getClasses()[name];
        };
        /**
     * Purpose unknown
     *
     * @param {unknown} template unknown
     * @param {unknown} name unknown
     * @param {unknown} props unknown
     */
        ObjectTemplate.setTemplateProperties = function (template, name, props) {
            this.__templatesToInject__[name] = template;
            this.__dictionary__[name] = template;
            template.__name__ = name;
            template.__injections__ = [];
            template.__objectTemplate__ = this;
            template.__children__ = [];
            template.__toClient__ = props.__toClient__;
            template.__toServer__ = props.__toServer__;
        };
        /**
         * Purpose unknown
         *
         * @param {unknown} props unknown
         *
         * @returns {unknown}
         */
        ObjectTemplate.getTemplateProperties = function (props) {
            var templateProperties = {};
            if (ObjectTemplate.__toClient__ == false) {
                props.toClient = false;
            }
            if (processProp(props.isLocal, this.isLocalRuleSet)) {
                props.toServer = false;
                props.toClient = false;
            }
            templateProperties.__toClient__ = processProp(props.toClient, this.toClientRuleSet) != false;
            templateProperties.__toServer__ = processProp(props.toServer, this.toServerRuleSet) != false;
            return templateProperties;
        };
        /**
            * Create an object template that is instantiated with the new operator.
            * properties is
            *
            * @param {unknown} name the name of the template or an object with
            *        name - the name of the class
            *        toClient - whether the object is to be shipped to the client (with semotus)
            *        toServer - whether the object is to be shipped to the server (with semotus)
            *        isLocal - equivalent to setting toClient && toServer to false
            * @param {unknown} properties an object whose properties represent data and function
            * properties of the object.  The data properties may use the defineProperty
            * format for properties or may be properties assigned a Number, String or Date.
            *
            * @returns {*} the object template
            */
        ObjectTemplate.create = function (name, properties) {
            /** this block only executes on createtypeforname */
            if (name && !(typeof (name) === 'string') && name.name) {
                var props = name;
                name = props.name;
            }
            else {
                props = {};
            }
            if (typeof (name) !== 'string' || name.match(/[^A-Za-z0-9_]/)) {
                throw new Error('incorrect template name');
            }
            if (typeof (properties) !== 'object') {
                throw new Error('missing template property definitions');
            }
            var createProps = this.getTemplateProperties(props);
            if (typeof (this.templateInterceptor) === 'function') {
                this.templateInterceptor('create', name, properties);
            }
            var template;
            if (properties) {
                template = this._createTemplate(null, Object, properties, createProps, name);
            }
            else {
                template = this._createTemplate(null, Object, name, createProps, name);
            }
            this.setTemplateProperties(template, name, createProps);
            template.__createProps__ = props;
            return template;
        };
        /**
         * Extend and existing (parent template)
         *
         * @param {unknown} parentTemplate unknown
         * @param {unknown} name the name of the template or an object with
         *        name - the name of the class
         *        toClient - whether the object is to be shipped to the client (with semotus)
         *        toServer - whether the object is to be shipped to the server (with semotus)
         *        isLocal - equivalent to setting toClient && toServer to false
         * @param {unknown} properties are the same as for create
         *
         * @returns {*} the object template
         */
        ObjectTemplate.extend = function (parentTemplate, name, properties) {
            var props;
            var createProps;
            if (!parentTemplate.__objectTemplate__) {
                throw new Error('incorrect parent template');
            }
            if (typeof (name) !== 'undefined' && typeof (name) !== 'string' && name.name) {
                props = name;
                name = props.name;
            }
            else {
                props = parentTemplate.__createProps__;
            }
            if (typeof (name) !== 'string' || name.match(/[^A-Za-z0-9_]/)) {
                throw new Error('incorrect template name');
            }
            if (typeof (properties) !== 'object') {
                throw new Error('missing template property definitions');
            }
            var existingTemplate = this.__dictionary__[name];
            if (existingTemplate) {
                if (existingTemplate.__parent__ != parentTemplate) {
                    if (existingTemplate.__parent__.__name__ != parentTemplate.__name__) {
                        // eslint-disable-next-line no-console
                        console.log("WARN: Attempt to extend " + parentTemplate.__name__ + " as " + name + " but " + name + " was already extended from " + existingTemplate.__parent__.__name__);
                    }
                }
                else {
                    this.mixin(existingTemplate, properties);
                    return existingTemplate;
                }
            }
            if (props) {
                createProps = this.getTemplateProperties(props);
            }
            if (typeof (this.templateInterceptor) === 'function') {
                this.templateInterceptor('extend', name, properties);
            }
            var template;
            if (properties) {
                template = this._createTemplate(null, parentTemplate, properties, parentTemplate, name);
            }
            else {
                template = this._createTemplate(null, parentTemplate, name, parentTemplate, name);
            }
            if (createProps) {
                this.setTemplateProperties(template, name, createProps);
            }
            else {
                this.setTemplateProperties(template, name, parentTemplate);
            }
            template.__createProps__ = props;
            // Maintain graph of parent and child templates
            template.__parent__ = parentTemplate;
            parentTemplate.__children__.push(template);
            return template;
        };
        ObjectTemplate.mixin = function (template, properties) {
            if (typeof (this.templateInterceptor) === 'function') {
                this.templateInterceptor('create', template.__name__, properties);
            }
            return this._createTemplate(template, null, properties, template, template.__name__);
        };
        /**
        * Purpose unknown
        *
        * @param {unknown} template unknown
        * @param {unknown} properties unknown
        */
        ObjectTemplate.staticMixin = function (template, properties) {
            for (var prop in properties) {
                template[prop] = properties[prop];
            }
        };
        /**
         * Add a function that will fire on object creation
         *
         * @param {unknown} template unknown
         * @param {Function} injector unknown
         */
        ObjectTemplate.inject = function (template, injector) {
            template.__injections__.push(injector);
        };
        /**
         * Add a function that will fire on all object creations (apparently)? Just a guess
         *
         * @param {Function} injector - unknown
         */
        ObjectTemplate.globalInject = function (injector) {
            this.__injections__.push(injector);
        };
        /**
         * Create the template if it needs to be created
         * @param [unknown} template to be created
         */
        ObjectTemplate.createIfNeeded = function (template, thisObj) {
            if (template.__createParameters__) {
                var createParameters = template.__createParameters__;
                for (var ix = 0; ix < createParameters.length; ++ix) {
                    var params = createParameters[ix];
                    template.__createParameters__ = undefined;
                    this._createTemplate(params[0], params[1], params[2], params[3], params[4], true);
                }
                if (template._injectProperties) {
                    template._injectProperties();
                }
                if (thisObj) {
                    //var copy = new template();
                    var prototypes_1 = [template.prototype];
                    var parent_1 = template.__parent__;
                    while (parent_1) {
                        prototypes_1.push(parent_1.prototype);
                        parent_1 = parent_1.__parent__;
                    }
                    var _loop_1 = function () {
                        var props = Object.getOwnPropertyNames(prototypes_1[ix]);
                        props.forEach(function (val, ix) {
                            Object.defineProperty(thisObj, props[ix], Object.getOwnPropertyDescriptor(prototypes_1[ix], props[ix]));
                        });
                    };
                    for (var ix = prototypes_1.length - 1; ix >= 0; --ix) {
                        _loop_1();
                    }
                    thisObj.__proto__ = template.prototype;
                }
            }
        };
        ObjectTemplate.getClasses = function () {
            if (this.__templates__) {
                for (var ix = 0; ix < this.__templates__.length; ++ix) {
                    var template = this.__templates__[ix];
                    this.__dictionary__[constructorName(template)] = template;
                    this.__templatesToInject__[constructorName(template)] = template;
                    processDeferredTypes(template);
                }
                this.__templates__ = undefined;
                for (var templateName1 in this.__dictionary__) {
                    var template = this.__dictionary__[templateName1];
                    var parentTemplateName = constructorName(Object.getPrototypeOf(template.prototype).constructor);
                    template.__shadowParent__ = this.__dictionary__[parentTemplateName];
                    if (template.__shadowParent__) {
                        template.__shadowParent__.__shadowChildren__.push(template);
                    }
                    template.props = {};
                    var propst = ObjectTemplate._getDefineProperties(template, undefined, true);
                    for (var propd in propst) {
                        template.props[propd] = propst[propd];
                    }
                }
                if (this.__exceptions__) {
                    throw new Error(this.__exceptions__.map(createMessageLine).join('\n'));
                }
            }
            function createMessageLine(exception) {
                return exception.func(exception.class(), exception.prop);
            }
            function processDeferredTypes(template) {
                if (template.prototype.__deferredType__) {
                    for (var prop in template.prototype.__deferredType__) {
                        var defineProperty = template.defineProperties[prop];
                        if (defineProperty) {
                            var type = template.prototype.__deferredType__[prop]();
                            if (defineProperty.type === Array) {
                                defineProperty.of = type;
                            }
                            else {
                                defineProperty.type = type;
                            }
                        }
                    }
                }
            }
            return this.__dictionary__;
            function constructorName(constructor) {
                var namedFunction = constructor.toString().match(/function ([^(]*)/);
                return namedFunction ? namedFunction[1] : null;
            }
        };
        /**
         * Overridden by other Type Systems to cache or globally identify objects
         * Also assigns a unique internal Id so that complex structures with
         * recursive objects can be serialized
         *
         * @param {unknown} obj - the object to be passed during creation time
         * @param {unknown} template - unknown
         *
         * @returns {unknown}
         *
         * @private
         */
        ObjectTemplate._stashObject = function (obj, template) {
            if (!obj.__id__) {
                if (!ObjectTemplate.nextId) {
                    ObjectTemplate.nextId = 1;
                }
                obj.__id__ = 'local-' + template.__name__ + '-' + ++ObjectTemplate.nextId;
            }
            return false;
        };
        /**
         * Overridden by other Type Systems to inject other elements
         *
         * @param {_template} _template - the object to be passed during creation time
         *
         * @private
         * */
        ObjectTemplate._injectIntoTemplate = function (_template) { };
        ;
        /**
         * Used by template setup to create an property descriptor for use by the constructor
         *
         * @param {unknown} propertyName is the name of the property
         * @param {unknown} defineProperty is the property descriptor passed to the template
         * @param {unknown} objectProperties is all properties that will be processed manually.  A new property is
         *                         added to this if the property needs to be initialized by value
         * @param {unknown} defineProperties is all properties that will be passed to Object.defineProperties
         *                         A new property will be added to this object
         *
         * @private
         */
        ObjectTemplate._setupProperty = function (propertyName, defineProperty, objectProperties, defineProperties) {
            // Determine whether value needs to be re-initialized in constructor
            var value = defineProperty.value;
            var byValue = value && typeof (value) !== 'number' && typeof (value) !== 'string';
            if (byValue || !Object.defineProperties || defineProperty.get || defineProperty.set) {
                objectProperties[propertyName] = {
                    init: defineProperty.value,
                    type: defineProperty.type,
                    of: defineProperty.of,
                    byValue: byValue
                };
                delete defineProperty.value;
            }
            // When a super class based on objectTemplate don't transport properties
            defineProperty.toServer = false;
            defineProperty.toClient = false;
            defineProperties[propertyName] = defineProperty;
            // Add getters and setters
            if (defineProperty.get || defineProperty.set) {
                var userSetter_1 = defineProperty.set;
                defineProperty.set = (function d() {
                    // Use a closure to record the property name which is not passed to the setter
                    var prop = propertyName;
                    return function c(value) {
                        if (userSetter_1) {
                            value = userSetter_1.call(this, value);
                        }
                        if (!defineProperty.isVirtual) {
                            this["__" + prop] = value;
                        }
                    };
                })();
                var userGetter_1 = defineProperty.get;
                defineProperty.get = (function get() {
                    // Use closure to record property name which is not passed to the getter
                    var prop = propertyName;
                    return function b() {
                        if (userGetter_1) {
                            if (defineProperty.isVirtual) {
                                return userGetter_1.call(this, undefined);
                            }
                            return userGetter_1.call(this, this["__" + prop]);
                        }
                        return this["__" + prop];
                    };
                })();
                if (!defineProperty.isVirtual) {
                    defineProperties["__" + propertyName] = { enumerable: false, writable: true };
                }
                delete defineProperty.value;
                delete defineProperty.writable;
            }
        };
        /**
         * Clone an object created from an ObjectTemplate
         * Used only within supertype (see copyObject for general copy)
         *
         * @param obj is the source object
         * @param template is the template used to create the object
         *
         * @returns {*} a copy of the object
         */
        // Function to clone simple objects using ObjectTemplate as a guide
        ObjectTemplate.clone = function (obj, template) {
            var copy;
            if (obj instanceof Date) {
                return new Date(obj.getTime());
            }
            else if (obj instanceof Array) {
                copy = [];
                for (var ix = 0; ix < obj.length; ++ix) {
                    copy[ix] = this.clone(obj[ix], template);
                }
                return copy;
            }
            else if (template && obj instanceof template) {
                copy = new template();
                for (var prop in obj) {
                    if (prop != '__id__' && !(obj[prop] instanceof Function)) {
                        var defineProperty = this._getDefineProperty(prop, template) || {};
                        if (obj.hasOwnProperty(prop)) {
                            copy[prop] = this.clone(obj[prop], defineProperty.of || defineProperty.type || null);
                        }
                    }
                }
                return copy;
            }
            else if (obj instanceof Object) {
                copy = {};
                for (var propc in obj) {
                    if (obj.hasOwnProperty(propc)) {
                        copy[propc] = this.clone(obj[propc]);
                    }
                }
                return copy;
            }
            else {
                return obj;
            }
        };
        /**
         * Overridden by other Type Systems to be able to create remote functions or
         * otherwise intercept function calls
         *
         * @param {unknown} _propertyName is the name of the function
         * @param {unknown} propertyValue is the function itself
         *
         * @returns {*} a new function to be assigned to the object prototype
         *
         * @private
         */
        ObjectTemplate._setupFunction = function (_propertyName, propertyValue) {
            return propertyValue;
        };
        ;
        /**
     * Purpose unknown
     *
     * @param {unknown} obj unknown
     * @param {unknown} creator unknown
     *
     * @returns {unknown}
     */
        ObjectTemplate.createCopy = function (obj, creator) {
            return this.fromPOJO(obj, obj.__template__, null, null, undefined, null, null, creator);
        };
        /**
         * Abstract function for benefit of Semotus
         *
         * @param {unknown} cb unknown
         */
        ObjectTemplate.withoutChangeTracking = function (cb) {
            cb();
        };
        /**
    /**
     * Find the right subclass to instantiate by either looking at the
     * declared list in the subClasses define property or walking through
     * the subclasses of the declared template
     *
     * @param {unknown} template unknown
     * @param {unknown} objId unknown
     * @param {unknown} defineProperty unknown
     * @returns {*}
     * @private
     */
        ObjectTemplate._resolveSubClass = function (template, objId, defineProperty) {
            var templateName = '';
            if (objId.match(/-([A-Za-z0-9_:]*)-/)) {
                templateName = RegExp.$1;
            }
            // Resolve template subclass for polymorphic instantiation
            if (defineProperty && defineProperty.subClasses && objId != 'anonymous)') {
                if (templateName) {
                    for (var ix = 0; ix < defineProperty.subClasses.length; ++ix) {
                        if (templateName == defineProperty.subClasses[ix].__name__) {
                            template = defineProperty.subClasses[ix];
                        }
                    }
                }
            }
            else {
                var subClass = this._findSubClass(template, templateName);
                if (subClass) {
                    template = subClass;
                }
            }
            return template;
        };
        /**
         * Walk recursively through extensions of template via __children__
         * looking for a name match
         *
         * @param {unknown} template unknown
         * @param {unknown} templateName unknown
         * @returns {*}
         * @private
         */
        ObjectTemplate._findSubClass = function (template, templateName) {
            if (template.__name__ == templateName) {
                return template;
            }
            for (var ix = 0; ix < template.__children__.length; ++ix) {
                var subClass = this._findSubClass(template.__children__[ix], templateName);
                if (subClass) {
                    return subClass;
                }
            }
            return null;
        };
        /**
         * Return the highest level template
         *
         * @param {unknown} template unknown
         *
         * @returns {*}
         *
         * @private
         */
        ObjectTemplate._getBaseClass = function (template) {
            while (template.__parent__) {
                template = template.__parent__;
            }
            return template;
        };
        /**
     * An overridable function used to create an object from a template and optionally
     * manage the caching of that object (used by derivative type systems).  It
     * preserves the original id of an object
     *
     * @param {unknown} template of object
     * @param {unknown} objId and id (if present)
     * @param {unknown} defineProperty unknown
     * @returns {*}
     * @private
     */
        ObjectTemplate._createEmptyObject = function (template, objId, defineProperty) {
            template = this._resolveSubClass(template, objId, defineProperty);
            var oldStashObject = this._stashObject;
            if (objId) {
                this._stashObject = function stashObject() {
                    return true;
                };
            }
            var newValue = new template();
            this._stashObject = oldStashObject;
            if (objId) {
                newValue.__id__ = objId;
            }
            return newValue;
        };
        /**
         * Looks up a property in the defineProperties saved with the template cascading
         * up the prototype chain to find it
         *
         * @param {unknown} prop is the property being sought
         * @param {unknown} template is the template used to create the object containing the property
         * @returns {*} the "defineProperty" structure for the property
         * @private
         */
        ObjectTemplate._getDefineProperty = function (prop, template) {
            if (template && (template != Object) && template.defineProperties && template.defineProperties[prop]) {
                return template.defineProperties[prop];
            }
            else if (template && template.parentTemplate) {
                return this._getDefineProperty(prop, template.parentTemplate);
            }
            return null;
        };
        /**
         * Returns a hash of all properties including those inherited
         *
         * @param {unknown} template is the template used to create the object containing the property
         * @param {unknown} returnValue unknown
         * @param {unknown} includeVirtual unknown
         * @returns {*} an associative array of each "defineProperty" structure for the property
         * @private
         */
        ObjectTemplate._getDefineProperties = function (template, returnValue, includeVirtual) {
            if (!returnValue) {
                returnValue = {};
            }
            if (template.defineProperties) {
                for (var prop in template.defineProperties) {
                    if (includeVirtual || !template.defineProperties[prop].isVirtual) {
                        returnValue[prop] = template.defineProperties[prop];
                    }
                }
            }
            if (template.parentTemplate) {
                this._getDefineProperties(template.parentTemplate, returnValue, includeVirtual);
            }
            return returnValue;
        };
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
        ObjectTemplate._createTemplate = function (mixinTemplate, parentTemplate, propertiesOrTemplate, createProperties, templateName, createTemplateNow) {
            // We will return a constructor that can be used in a new function
            // that will call an init() function found in properties, define properties using Object.defineProperties
            // and make copies of those that are really objects
            var functionProperties = {}; // Will be populated with init function from properties
            var objectProperties = {}; // List of properties to be processed by hand
            var defineProperties = {}; // List of properties to be sent to Object.defineProperties()
            var objectTemplate = this;
            var templatePrototype;
            function F() { } // Used in case of extend
            if (!this.lazyTemplateLoad) {
                createTemplateNow = true;
            }
            // Setup variables depending on the type of call (create, extend, mixin)
            if (createTemplateNow) {
                if (mixinTemplate) { // Mixin
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
                else { // Extend
                    this.createIfNeeded(parentTemplate);
                    F.prototype = parentTemplate.prototype;
                    templatePrototype = new F();
                }
            }
            /**
             * Constructor that will be returned will only ever be created once
             */
            var template = this.__dictionary__[templateName] ||
                bindParams(templateName, objectTemplate, functionProperties, defineProperties, parentTemplate, propertiesOrTemplate, createProperties, objectProperties, templatePrototype, createTemplateNow, mixinTemplate);
            template.isObjectTemplate = true;
            template.extend = function (p1, p2) { return objectTemplate.extend.call(objectTemplate, template, p1, p2); };
            template.mixin = function (p1, p2) { return objectTemplate.mixin.call(objectTemplate, template, p1, p2); };
            template.staticMixin = function (p1, p2) { return objectTemplate.staticMixin.call(objectTemplate, template, p1, p2); };
            template.fromPOJO = function (pojo) {
                objectTemplate.createIfNeeded(template);
                return objectTemplate.fromPOJO(pojo, template);
            };
            template.fromJSON = function (str, idPrefix) {
                objectTemplate.createIfNeeded(template);
                return objectTemplate.fromJSON(str, template, idPrefix);
            };
            template.getProperties = function (includeVirtual) {
                objectTemplate.createIfNeeded(template);
                return ObjectTemplate._getDefineProperties(template, undefined, includeVirtual);
            };
            if (!createTemplateNow) {
                template.__createParameters__ = template.__createParameters__ || [];
                template.__createParameters__.push([mixinTemplate, parentTemplate, propertiesOrTemplate, createProperties, templateName]);
                return template;
            }
            template.prototype = templatePrototype;
            var createProperty = createPropertyFunc.bind(null, functionProperties, templatePrototype, objectTemplate, templateName, objectProperties, defineProperties, parentTemplate);
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
        ;
        /**
         * A function to clone the Type System
         * @returns {o}
         * @private
         */
        ObjectTemplate._createObject = function () {
            var newFoo = Object.create(this);
            newFoo.init();
            return newFoo;
        };
        /**
        * Purpose unknown
        * @param {unknown} originally took a context that it threw away
        * @returns {SupertypeLogger}
        */
        ObjectTemplate.createLogger = function () {
            return new SupertypeLogger_1.SupertypeLogger();
        };
        ObjectTemplate.amorphicStatic = ObjectTemplate;
        /**
         * Purpose unknown
         *
         * @param {unknown} pojo unknown
         * @param {unknown} template unknown
         * @param {unknown} defineProperty unknown
         * @param {unknown} idMap unknown
         * @param {unknown} idQualifier unknown
         * @param {unknown} parent unknown
         * @param {unknown} prop unknown
         * @param {unknown} creator unknown
         *
        * @returns {unknown}
        */
        ObjectTemplate.fromPOJO = serializer.fromPOJO;
        /**
        * Purpose unknown
        *
        * @param {unknown} str unknown
        * @param {unknown} template unknown
        * @param {unknown} idQualifier unknown
        * objectTemplate.fromJSON(str, template, idQualifier)
        * @returns {unknown}
        */
        ObjectTemplate.fromJSON = serializer.fromJSON;
        /**
         * Convert an object to JSON, stripping any recursive object references so they can be
         * reconstituted later
         *
         * @param {unknown} obj unknown
         * @param {unknown} cb unknown
         *
         * @returns {unknown}
         */
        ObjectTemplate.toJSONString = serializer.toJSONString;
        return ObjectTemplate;
    }());
    exports.ObjectTemplate = ObjectTemplate;
    function createPropertyFunc(functionProperties, templatePrototype, objectTemplate, templateName, objectProperties, defineProperties, parentTemplate, propertyName, propertyValue, properties, createProperties) {
        if (!properties) {
            properties = {};
            properties[propertyName] = propertyValue;
        }
        // Record the initialization function
        if (propertyName == 'init' && typeof (properties[propertyName]) === 'function') {
            functionProperties.init = [properties[propertyName]];
        }
        else {
            var defineProperty = null; // defineProperty to be added to defineProperties
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
                type = typeof (properties[propertyName]);
            }
            switch (type) {
                // Figure out whether this is a defineProperty structure (has a constructor of object)
                case 'object': // Or array
                    // Handle remote function calls
                    if (properties[propertyName].body && typeof (properties[propertyName].body) === 'function') {
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
                        properties[propertyName].writable = true; // We are using setters
                        if (typeof (properties[propertyName].enumerable) === 'undefined') {
                            properties[propertyName].enumerable = true;
                        }
                        break;
                    }
                    else if (properties[propertyName] instanceof Array) {
                        defineProperty = {
                            type: Object,
                            value: properties[propertyName],
                            enumerable: true,
                            writable: true,
                            isLocal: true
                        };
                        break;
                    }
                    else { // Other crap
                        defineProperty = {
                            type: Object,
                            value: properties[propertyName],
                            enumerable: true,
                            writable: true
                        };
                        break;
                    }
                case 'string':
                    defineProperty = {
                        type: String,
                        value: properties[propertyName],
                        enumerable: true,
                        writable: true,
                        isLocal: true
                    };
                    break;
                case 'boolean':
                    defineProperty = {
                        type: Boolean,
                        value: properties[propertyName],
                        enumerable: true,
                        writable: true,
                        isLocal: true
                    };
                    break;
                case 'number':
                    defineProperty = {
                        type: Number,
                        value: properties[propertyName],
                        enumerable: true,
                        writable: true,
                        isLocal: true
                    };
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
    }
    ;
    function bindParams(templateName, objectTemplate, functionProperties, defineProperties, parentTemplate, propertiesOrTemplate, createProperties, objectProperties, templatePrototype, createTemplateNow, mixinTemplate) {
        function template() {
            objectTemplate.createIfNeeded(template, this);
            var templateRef = template;
            objectTemplate.__templateUsage__[templateRef.__name__] = true;
            var parent = templateRef.__parent__;
            while (parent) {
                objectTemplate.__templateUsage__[parent.__name__] = true;
                var parent = parent.__parent__;
            }
            this.__template__ = templateRef;
            if (objectTemplate.__transient__) {
                this.__transient__ = true;
            }
            var prunedObjectProperties = pruneExisting(this, templateRef.objectProperties);
            var prunedDefineProperties = pruneExisting(this, templateRef.defineProperties);
            try {
                // Create properties either with EMCA 5 defineProperties or by hand
                if (Object.defineProperties) {
                    Object.defineProperties(this, prunedDefineProperties); // This method will be added pre-EMCA 5
                }
            }
            catch (e) {
                // TODO: find a better way to deal with errors that are thrown
                console.log(e); // eslint-disable-line no-console
            }
            this.fromRemote = this.fromRemote || objectTemplate._stashObject(this, templateRef);
            this.copyProperties = function copyProperties(obj) {
                for (var prop in obj) {
                    this[prop] = obj[prop];
                }
            };
            // Initialize properties from the defineProperties value property
            for (var propertyName in prunedObjectProperties) {
                var defineProperty = prunedObjectProperties[propertyName];
                if (typeof (defineProperty.init) !== 'undefined') {
                    if (defineProperty.byValue) {
                        this[propertyName] = ObjectTemplate.clone(defineProperty.init, defineProperty.of || defineProperty.type || null);
                    }
                    else {
                        this[propertyName] = (defineProperty.init);
                    }
                }
            }
            // Template level injections
            for (var ix = 0; ix < templateRef.__injections__.length; ++ix) {
                templateRef.__injections__[ix].call(this, this);
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
                if (typeof (defineProperty.values) === 'function') {
                    return defineProperty.values.call(this);
                }
                return defineProperty.values;
            };
            this.__descriptions__ = function e(prop) {
                var defineProperty = this.__prop__(prop) || this.__prop__('_' + prop);
                if (typeof (defineProperty.descriptions) === 'function') {
                    return defineProperty.descriptions.call(this);
                }
                return defineProperty.descriptions;
            };
            // If we don't have an init function or are a remote creation call parent constructor otherwise call init
            //  function who will be responsible for calling parent constructor to allow for parameter passing.
            if (this.fromRemote || !templateRef.functionProperties.init || objectTemplate.noInit) {
                if (parentTemplate && parentTemplate.isObjectTemplate) {
                    parentTemplate.call(this);
                }
            }
            else {
                if (templateRef.functionProperties.init) {
                    for (var i = 0; i < templateRef.functionProperties.init.length; ++i) {
                        templateRef.functionProperties.init[i].apply(this, arguments);
                    }
                }
            }
            this.__template__ = templateRef;
            this.toJSONString = function toJSONString(cb) {
                return ObjectTemplate.toJSONString(this, cb);
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
        }
        ;
        var returnVal = template;
        return returnVal;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBQSx5Q0FBMkM7SUFDM0MscURBQW9EO0lBMkNwRDs7Ozs7Ozs7T0FRRztJQUNILHFCQUFxQixJQUFJLEVBQUUsT0FBTztRQUM5QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7UUFFZixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7WUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDbkM7YUFDSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDakMsR0FBRyxHQUFHLEtBQUssQ0FBQztZQUVaLElBQUksT0FBTyxFQUFFO2dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJO29CQUN2QiwyQkFBMkI7b0JBQzNCLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQ04sa0NBQWtDO3dCQUNsQyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQztxQkFDdEI7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7YUFDTjtTQUNKO2FBQ0ksSUFBSSxJQUFJLFlBQVksS0FBSyxFQUFFO1lBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJO2dCQUN4QixHQUFHLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDLENBQUM7U0FDTjthQUNJO1lBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQztTQUNkO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRUQsdUJBQXVCLEdBQUcsRUFBRSxLQUFLO1FBQzdCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVsQixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFB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QUFDO1lBQ2pELENBQUMsQ0FBQztZQUVGOzs7Ozs7Ozs7ZUFTRztZQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsb0JBQW9CLE9BQU87Z0JBQ3pDLE9BQU8sY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDO1FBRU4sQ0FBQztRQUFBLENBQUM7UUFHRixJQUFJLFNBQVMsR0FBYSxRQUFRLENBQUM7UUFFbkMsT0FBTyxTQUE0QixDQUFDO0lBQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzZXJpYWxpemVyIGZyb20gJy4vc2VyaWFsaXplcic7XG5pbXBvcnQgeyBTdXBlcnR5cGVMb2dnZXIgfSBmcm9tICcuL1N1cGVydHlwZUxvZ2dlcic7XG5leHBvcnQgdHlwZSBDcmVhdGVUeXBlRm9yTmFtZSA9IHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHRvQ2xpZW50PzogYm9vbGVhbjtcbiAgICB0b1NlcnZlcj86IGJvb2xlYW47XG4gICAgaXNMb2NhbD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCB0eXBlIEdldHRlciA9IHtcbiAgICBnZXQ6IGFueTtcbn1cblxuLyoqXG4gKiB0aGlzIGlzIHByZXR0eSBtdWNoIHRoZSBjbGFzcyAodGhlIHRlbXBsYXRlIGl0c2VsZilcbiAqIFRyeSB0byB1bmlmeSB0aGlzIHdpdGggdGhlIFN1cGVydHlwZSBUeXBlIChtYXliZSBtYWtlIHRoaXMgYSBwYXJ0aWFsLCBoYXZlIHN1cGVydHlwZSBleHRlbmQgdGhpcylcbiAqL1xuZXhwb3J0IHR5cGUgQ29uc3RydWN0b3JUeXBlID0gRnVuY3Rpb24gJiB7XG4gICAgYW1vcnBoaWNDbGFzc05hbWU6IGFueTtcbiAgICBfX3NoYWRvd1BhcmVudF9fOiBhbnk7XG4gICAgcHJvcHM/OiBhbnk7XG4gICAgX19wYXJlbnRfXzogYW55O1xuICAgIF9fbmFtZV9fOiBhbnk7XG4gICAgX19jcmVhdGVQYXJhbWV0ZXJzX186IGFueTtcbiAgICBmdW5jdGlvblByb3BlcnRpZXM6IGFueTtcbiAgICBpc09iamVjdFRlbXBsYXRlOiBhbnk7XG4gICAgZXh0ZW5kOiBhbnk7XG4gICAgc3RhdGljTWl4aW46IGFueTtcbiAgICBtaXhpbjogYW55O1xuICAgIGZyb21QT0pPOiBhbnk7XG4gICAgZnJvbUpTT046IGFueTtcbiAgICBnZXRQcm9wZXJ0aWVzOiAoaW5jbHVkZVZpcnR1YWwpID0+IGFueTtcbiAgICBwcm90b3R5cGU6IGFueTtcbiAgICBkZWZpbmVQcm9wZXJ0aWVzOiBhbnk7XG4gICAgb2JqZWN0UHJvcGVydGllczogYW55O1xuICAgIHBhcmVudFRlbXBsYXRlOiBhbnk7XG4gICAgY3JlYXRlUHJvcGVydHk6IGFueTtcbiAgICBfX3RlbXBsYXRlX186IGFueTtcbiAgICBfX2luamVjdGlvbnNfXzogYW55O1xufVxuXG5leHBvcnQgdHlwZSBPYmplY3RUZW1wbGF0ZUNsb25lID0gdHlwZW9mIE9iamVjdFRlbXBsYXRlO1xuXG5cbi8qKlxuICogQWxsb3cgdGhlIHByb3BlcnR5IHRvIGJlIGVpdGhlciBhIGJvb2xlYW4gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBib29sZWFuIG9yIGEgc3RyaW5nXG4gKiBtYXRjaGVkIGFnYWluc3QgYSBydWxlIHNldCBhcnJheSBvZiBzdHJpbmcgaW4gT2JqZWN0VGVtcGxhdGVcbiAqXG4gKiBAcGFyYW0gIHByb3AgdW5rbm93blxuICogQHBhcmFtIHJ1bGVTZXQgdW5rbm93blxuICpcbiAqIEByZXR1cm5zIHtmdW5jdGlvbih0aGlzOk9iamVjdFRlbXBsYXRlKX1cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1Byb3AocHJvcCwgcnVsZVNldCkge1xuICAgIHZhciByZXQgPSBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiAocHJvcCkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0ID0gcHJvcC5jYWxsKE9iamVjdFRlbXBsYXRlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIChwcm9wKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0ID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHJ1bGVTZXQpIHtcbiAgICAgICAgICAgIHJ1bGVTZXQubWFwKGZ1bmN0aW9uIGkocnVsZSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCBhbHdheXMgZXhlY3V0ZVxuICAgICAgICAgICAgICAgIGlmICghcmV0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvdWJsZSBlcXVhbHMgb3Igc2luZ2xlIGVxdWFscz9cbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gcnVsZSA9PSBwcm9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb3AgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBwcm9wLmZvckVhY2goZnVuY3Rpb24gaChwcm9wKSB7XG4gICAgICAgICAgICByZXQgPSByZXQgfHwgcHJvY2Vzc1Byb3AocHJvcCwgcnVsZVNldCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0ID0gcHJvcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBwcnVuZUV4aXN0aW5nKG9iaiwgcHJvcHMpIHtcbiAgICB2YXIgbmV3UHJvcHMgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKHR5cGVvZihvYmpbcHJvcF0pID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbmV3UHJvcHNbcHJvcF0gPSBwcm9wc1twcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdQcm9wcztcbn1cblxuLyoqXG4gKiB0aGUgb2cgT2JqZWN0VGVtcGxhdGUsIHdoYXQgZXZlcnl0aGluZyBwaWNrcyBvZmYgb2ZcbiAqL1xuZXhwb3J0IGNsYXNzIE9iamVjdFRlbXBsYXRlIHtcblxuICAgIHN0YXRpYyBsYXp5VGVtcGxhdGVMb2FkOiBhbnk7XG4gICAgc3RhdGljIGlzTG9jYWxSdWxlU2V0OiBhbnk7XG4gICAgc3RhdGljIG5leHRJZDogYW55OyAvLyBmb3Igc3Rhc2hPYmplY3RcbiAgICBzdGF0aWMgX19leGNlcHRpb25zX186IGFueTtcblxuICAgIHN0YXRpYyBfX3RlbXBsYXRlc19fOiBDb25zdHJ1Y3RvclR5cGVbXTtcbiAgICBzdGF0aWMgdG9TZXJ2ZXJSdWxlU2V0OiBzdHJpbmdbXTtcbiAgICBzdGF0aWMgdG9DbGllbnRSdWxlU2V0OiBzdHJpbmdbXTtcblxuICAgIHN0YXRpYyB0ZW1wbGF0ZUludGVyY2VwdG9yOiBhbnk7XG4gICAgc3RhdGljIF9fZGljdGlvbmFyeV9fOiB7IFtrZXk6IHN0cmluZ106IENvbnN0cnVjdG9yVHlwZSB9O1xuICAgIHN0YXRpYyBfX2Fub255bW91c0lkX186IG51bWJlcjtcbiAgICBzdGF0aWMgX190ZW1wbGF0ZXNUb0luamVjdF9fOiB7fTtcbiAgICBzdGF0aWMgbG9nZ2VyOiBhbnk7XG4gICAgc3RhdGljIF9fdGVtcGxhdGVVc2FnZV9fOiBhbnk7XG4gICAgc3RhdGljIF9faW5qZWN0aW9uc19fOiBGdW5jdGlvbltdO1xuICAgIHN0YXRpYyBfX3RvQ2xpZW50X186IGJvb2xlYW47XG5cbiAgICBzdGF0aWMgYW1vcnBoaWNTdGF0aWMgPSBPYmplY3RUZW1wbGF0ZTtcbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgcGVyZm9ybUluamVjdGlvbnMoKSB7XG4gICAgICAgIHRoaXMuZ2V0Q2xhc3NlcygpO1xuICAgICAgICBpZiAodGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFRlbXBsYXRlID0gdGhpcztcblxuICAgICAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZU5hbWUgaW4gdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW3RlbXBsYXRlTmFtZV07XG5cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QoaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuaW5qZWN0KHRoaXMsIGluamVjdG9yKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5faW5qZWN0SW50b1RlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBpbml0KCkge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVVc2FnZV9fID0ge307XG4gICAgICAgIHRoaXMuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfXyA9IHt9O1xuICAgICAgICB0aGlzLl9fYW5vbnltb3VzSWRfXyA9IDE7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fID0ge307XG4gICAgICAgIHRoaXMubG9nZ2VyID0gdGhpcy5jcmVhdGVMb2dnZXIoKTsgLy8gQ3JlYXRlIGEgZGVmYXVsdCBsb2dnZXJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0VGVtcGxhdGVCeU5hbWUobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGFzc2VzKClbbmFtZV07XG4gICAgfVxuXG4gICAgLyoqXG4gKiBQdXJwb3NlIHVua25vd25cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gbmFtZSB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAqL1xuICAgIHN0YXRpYyBzZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIHByb3BzKSB7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW25hbWVdID0gdGVtcGxhdGU7XG4gICAgICAgIHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgdGVtcGxhdGUuX19uYW1lX18gPSBuYW1lO1xuICAgICAgICB0ZW1wbGF0ZS5fX2luamVjdGlvbnNfXyA9IFtdO1xuICAgICAgICB0ZW1wbGF0ZS5fX29iamVjdFRlbXBsYXRlX18gPSB0aGlzO1xuICAgICAgICB0ZW1wbGF0ZS5fX2NoaWxkcmVuX18gPSBbXTtcbiAgICAgICAgdGVtcGxhdGUuX190b0NsaWVudF9fID0gcHJvcHMuX190b0NsaWVudF9fO1xuICAgICAgICB0ZW1wbGF0ZS5fX3RvU2VydmVyX18gPSBwcm9wcy5fX3RvU2VydmVyX187XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlUHJvcGVydGllczogeyBfX3RvQ2xpZW50X18/OiBhbnk7IF9fdG9TZXJ2ZXJfXz86IGFueSB9ID0ge307XG5cbiAgICAgICAgaWYgKE9iamVjdFRlbXBsYXRlLl9fdG9DbGllbnRfXyA9PSBmYWxzZSkge1xuICAgICAgICAgICAgcHJvcHMudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9jZXNzUHJvcChwcm9wcy5pc0xvY2FsLCB0aGlzLmlzTG9jYWxSdWxlU2V0KSkge1xuICAgICAgICAgICAgcHJvcHMudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHByb3BzLnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZVByb3BlcnRpZXMuX190b0NsaWVudF9fID0gcHJvY2Vzc1Byb3AocHJvcHMudG9DbGllbnQsIHRoaXMudG9DbGllbnRSdWxlU2V0KSAhPSBmYWxzZTtcbiAgICAgICAgdGVtcGxhdGVQcm9wZXJ0aWVzLl9fdG9TZXJ2ZXJfXyA9IHByb2Nlc3NQcm9wKHByb3BzLnRvU2VydmVyLCB0aGlzLnRvU2VydmVyUnVsZVNldCkgIT0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlUHJvcGVydGllcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICAgKiBDcmVhdGUgYW4gb2JqZWN0IHRlbXBsYXRlIHRoYXQgaXMgaW5zdGFudGlhdGVkIHdpdGggdGhlIG5ldyBvcGVyYXRvci5cbiAgICAgICAgKiBwcm9wZXJ0aWVzIGlzXG4gICAgICAgICpcbiAgICAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFuIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIHJlcHJlc2VudCBkYXRhIGFuZCBmdW5jdGlvblxuICAgICAgICAqIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdC4gIFRoZSBkYXRhIHByb3BlcnRpZXMgbWF5IHVzZSB0aGUgZGVmaW5lUHJvcGVydHlcbiAgICAgICAgKiBmb3JtYXQgZm9yIHByb3BlcnRpZXMgb3IgbWF5IGJlIHByb3BlcnRpZXMgYXNzaWduZWQgYSBOdW1iZXIsIFN0cmluZyBvciBEYXRlLlxuICAgICAgICAqXG4gICAgICAgICogQHJldHVybnMgeyp9IHRoZSBvYmplY3QgdGVtcGxhdGVcbiAgICAgICAgKi9cblxuICAgIHN0YXRpYyBjcmVhdGUobmFtZTogc3RyaW5nIHwgQ3JlYXRlVHlwZUZvck5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgLyoqIHRoaXMgYmxvY2sgb25seSBleGVjdXRlcyBvbiBjcmVhdGV0eXBlZm9ybmFtZSAqL1xuICAgICAgICBpZiAobmFtZSAmJiAhKHR5cGVvZiAobmFtZSkgPT09ICdzdHJpbmcnKSAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gcHJvcHMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3JlYXRlUHJvcHMgPSB0aGlzLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiAodGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKCdjcmVhdGUnLCBuYW1lLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0ZW1wbGF0ZTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBPYmplY3QsIHByb3BlcnRpZXMsIGNyZWF0ZVByb3BzLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgT2JqZWN0LCBuYW1lLCBjcmVhdGVQcm9wcywgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgY3JlYXRlUHJvcHMpO1xuICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX18gPSBwcm9wcztcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBFeHRlbmQgYW5kIGV4aXN0aW5nIChwYXJlbnQgdGVtcGxhdGUpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudFRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFyZSB0aGUgc2FtZSBhcyBmb3IgY3JlYXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIG9iamVjdCB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBleHRlbmQocGFyZW50VGVtcGxhdGUsIG5hbWU6IHN0cmluZyB8IENyZWF0ZVR5cGVGb3JOYW1lLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGxldCBwcm9wcztcbiAgICAgICAgbGV0IGNyZWF0ZVByb3BzO1xuXG4gICAgICAgIGlmICghcGFyZW50VGVtcGxhdGUuX19vYmplY3RUZW1wbGF0ZV9fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCBwYXJlbnQgdGVtcGxhdGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSBwcm9wcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMgPSBwYXJlbnRUZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX187XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhpc3RpbmdUZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV07XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18gIT0gcGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fLl9fbmFtZV9fICE9IHBhcmVudFRlbXBsYXRlLl9fbmFtZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOOiBBdHRlbXB0IHRvIGV4dGVuZCAke3BhcmVudFRlbXBsYXRlLl9fbmFtZV9ffSBhcyAke25hbWV9IGJ1dCAke25hbWV9IHdhcyBhbHJlYWR5IGV4dGVuZGVkIGZyb20gJHtleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18uX19uYW1lX199YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taXhpbihleGlzdGluZ1RlbXBsYXRlLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1RlbXBsYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICBjcmVhdGVQcm9wcyA9IHRoaXMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcignZXh0ZW5kJywgbmFtZSwgcHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIG5hbWUsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdGVQcm9wcykge1xuICAgICAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIGNyZWF0ZVByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBwYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQcm9wc19fID0gcHJvcHM7XG5cbiAgICAgICAgLy8gTWFpbnRhaW4gZ3JhcGggb2YgcGFyZW50IGFuZCBjaGlsZCB0ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGUuX19wYXJlbnRfXyA9IHBhcmVudFRlbXBsYXRlO1xuICAgICAgICBwYXJlbnRUZW1wbGF0ZS5fX2NoaWxkcmVuX18ucHVzaCh0ZW1wbGF0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgIHN0YXRpYyBtaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IoJ2NyZWF0ZScsIHRlbXBsYXRlLl9fbmFtZV9fLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSwgbnVsbCwgcHJvcGVydGllcywgdGVtcGxhdGUsIHRlbXBsYXRlLl9fbmFtZV9fKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICpcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIHVua25vd25cbiAgICAqL1xuICAgIHN0YXRpYyBzdGF0aWNNaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGVbcHJvcF0gPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgb24gb2JqZWN0IGNyZWF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIGluamVjdCh0ZW1wbGF0ZSwgaW5qZWN0b3I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRlbXBsYXRlLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIG9uIGFsbCBvYmplY3QgY3JlYXRpb25zIChhcHBhcmVudGx5KT8gSnVzdCBhIGd1ZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciAtIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2xvYmFsSW5qZWN0KGluamVjdG9yOiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgdGVtcGxhdGUgaWYgaXQgbmVlZHMgdG8gYmUgY3JlYXRlZFxuICAgICAqIEBwYXJhbSBbdW5rbm93bn0gdGVtcGxhdGUgdG8gYmUgY3JlYXRlZFxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZT8sIHRoaXNPYmo/KSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXykge1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlUGFyYW1ldGVycyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fO1xuICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IGNyZWF0ZVBhcmFtZXRlcnMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gY3JlYXRlUGFyYW1ldGVyc1tpeF07XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlVGVtcGxhdGUocGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSwgcGFyYW1zWzNdLCBwYXJhbXNbNF0sIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlLl9pbmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX2luamVjdFByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzT2JqKSB7XG4gICAgICAgICAgICAgICAgLy92YXIgY29weSA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3RvdHlwZXMgPSBbdGVtcGxhdGUucHJvdG90eXBlXTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50ID0gdGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZXMucHVzaChwYXJlbnQucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGl4ID0gcHJvdG90eXBlcy5sZW5ndGggLSAxOyBpeCA+PSAwOyAtLWl4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvdG90eXBlc1tpeF0pO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5mb3JFYWNoKCh2YWwsIGl4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpc09iaiwgcHJvcHNbaXhdLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZXNbaXhdLCBwcm9wc1tpeF0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXNPYmouX19wcm90b19fID0gdGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENsYXNzZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9fdGVtcGxhdGVzX18pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0aGlzLl9fdGVtcGxhdGVzX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlc19fW2l4XTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fW2NvbnN0cnVjdG9yTmFtZSh0ZW1wbGF0ZSldID0gdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bY29uc3RydWN0b3JOYW1lKHRlbXBsYXRlKV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVmZXJyZWRUeXBlcyh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9fdGVtcGxhdGVzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlTmFtZTEgaW4gdGhpcy5fX2RpY3Rpb25hcnlfXykge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bdGVtcGxhdGVOYW1lMV07XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VGVtcGxhdGVOYW1lID0gY29uc3RydWN0b3JOYW1lKE9iamVjdC5nZXRQcm90b3R5cGVPZih0ZW1wbGF0ZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fID0gdGhpcy5fX2RpY3Rpb25hcnlfX1twYXJlbnRUZW1wbGF0ZU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fc2hhZG93UGFyZW50X18uX19zaGFkb3dDaGlsZHJlbl9fLnB1c2godGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzdCA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGQgaW4gcHJvcHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fX2V4Y2VwdGlvbnNfXy5tYXAoY3JlYXRlTWVzc2FnZUxpbmUpLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVNZXNzYWdlTGluZShleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBleGNlcHRpb24uZnVuYyhleGNlcHRpb24uY2xhc3MoKSwgZXhjZXB0aW9uLnByb3ApO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEZWZlcnJlZFR5cGVzKHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmaW5lUHJvcGVydHkgPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0ZW1wbGF0ZS5wcm90b3R5cGUuX19kZWZlcnJlZFR5cGVfX1twcm9wXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LnR5cGUgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkub2YgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX19kaWN0aW9uYXJ5X187XG5cbiAgICAgICAgZnVuY3Rpb24gY29uc3RydWN0b3JOYW1lKGNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lZEZ1bmN0aW9uID0gY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvZnVuY3Rpb24gKFteKF0qKS8pO1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVkRnVuY3Rpb24gPyBuYW1lZEZ1bmN0aW9uWzFdIDogbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gY2FjaGUgb3IgZ2xvYmFsbHkgaWRlbnRpZnkgb2JqZWN0c1xuICAgICAqIEFsc28gYXNzaWducyBhIHVuaXF1ZSBpbnRlcm5hbCBJZCBzbyB0aGF0IGNvbXBsZXggc3RydWN0dXJlcyB3aXRoXG4gICAgICogcmVjdXJzaXZlIG9iamVjdHMgY2FuIGJlIHNlcmlhbGl6ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIC0gdGhlIG9iamVjdCB0byBiZSBwYXNzZWQgZHVyaW5nIGNyZWF0aW9uIHRpbWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIC0gdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc3Rhc2hPYmplY3Qob2JqLCB0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIW9iai5fX2lkX18pIHtcbiAgICAgICAgICAgIGlmICghT2JqZWN0VGVtcGxhdGUubmV4dElkKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUubmV4dElkID0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLl9faWRfXyA9ICdsb2NhbC0nICsgdGVtcGxhdGUuX19uYW1lX18gKyAnLScgKyArK09iamVjdFRlbXBsYXRlLm5leHRJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGluamVjdCBvdGhlciBlbGVtZW50c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtfdGVtcGxhdGV9IF90ZW1wbGF0ZSAtIHRoZSBvYmplY3QgdG8gYmUgcGFzc2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lXG4gICAgICogXG4gICAgICogQHByaXZhdGVcbiAgICAgKiAqL1xuICAgIHN0YXRpYyBfaW5qZWN0SW50b1RlbXBsYXRlKF90ZW1wbGF0ZSkgeyB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlZCBieSB0ZW1wbGF0ZSBzZXR1cCB0byBjcmVhdGUgYW4gcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgdXNlIGJ5IHRoZSBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0eU5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSBpcyB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBwYXNzZWQgdG8gdGhlIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBvYmplY3RQcm9wZXJ0aWVzIGlzIGFsbCBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBwcm9jZXNzZWQgbWFudWFsbHkuICBBIG5ldyBwcm9wZXJ0eSBpc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkIHRvIHRoaXMgaWYgdGhlIHByb3BlcnR5IG5lZWRzIHRvIGJlIGluaXRpYWxpemVkIGJ5IHZhbHVlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0aWVzIGlzIGFsbCBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBBIG5ldyBwcm9wZXJ0eSB3aWxsIGJlIGFkZGVkIHRvIHRoaXMgb2JqZWN0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc2V0dXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHZhbHVlIG5lZWRzIHRvIGJlIHJlLWluaXRpYWxpemVkIGluIGNvbnN0cnVjdG9yXG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgIGNvbnN0IGJ5VmFsdWUgPSB2YWx1ZSAmJiB0eXBlb2YgKHZhbHVlKSAhPT0gJ251bWJlcicgJiYgdHlwZW9mICh2YWx1ZSkgIT09ICdzdHJpbmcnO1xuXG4gICAgICAgIGlmIChieVZhbHVlIHx8ICFPYmplY3QuZGVmaW5lUHJvcGVydGllcyB8fCBkZWZpbmVQcm9wZXJ0eS5nZXQgfHwgZGVmaW5lUHJvcGVydHkuc2V0KSB7XG4gICAgICAgICAgICBvYmplY3RQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgaW5pdDogZGVmaW5lUHJvcGVydHkudmFsdWUsXG4gICAgICAgICAgICAgICAgdHlwZTogZGVmaW5lUHJvcGVydHkudHlwZSxcbiAgICAgICAgICAgICAgICBvZjogZGVmaW5lUHJvcGVydHkub2YsXG4gICAgICAgICAgICAgICAgYnlWYWx1ZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2hlbiBhIHN1cGVyIGNsYXNzIGJhc2VkIG9uIG9iamVjdFRlbXBsYXRlIGRvbid0IHRyYW5zcG9ydCBwcm9wZXJ0aWVzXG4gICAgICAgIGRlZmluZVByb3BlcnR5LnRvU2VydmVyID0gZmFsc2U7XG4gICAgICAgIGRlZmluZVByb3BlcnR5LnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIGRlZmluZVByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IGRlZmluZVByb3BlcnR5O1xuXG4gICAgICAgIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5nZXQgfHwgZGVmaW5lUHJvcGVydHkuc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyU2V0dGVyID0gZGVmaW5lUHJvcGVydHkuc2V0O1xuXG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5zZXQgPSAoZnVuY3Rpb24gZCgpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgYSBjbG9zdXJlIHRvIHJlY29yZCB0aGUgcHJvcGVydHkgbmFtZSB3aGljaCBpcyBub3QgcGFzc2VkIHRvIHRoZSBzZXR0ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gcHJvcGVydHlOYW1lO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGModmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJTZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdXNlclNldHRlci5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2BfXyR7cHJvcH1gXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHVzZXJHZXR0ZXIgPSBkZWZpbmVQcm9wZXJ0eS5nZXQ7XG5cbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LmdldCA9IChmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIGNsb3N1cmUgdG8gcmVjb3JkIHByb3BlcnR5IG5hbWUgd2hpY2ggaXMgbm90IHBhc3NlZCB0byB0aGUgZ2V0dGVyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IHByb3BlcnR5TmFtZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBiKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlckdldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1c2VyR2V0dGVyLmNhbGwodGhpcywgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJHZXR0ZXIuY2FsbCh0aGlzLCB0aGlzW2BfXyR7cHJvcH1gXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tgX18ke3Byb3B9YF07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGlmICghZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllc1tgX18ke3Byb3BlcnR5TmFtZX1gXSA9IHsgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgICAgIGRlbGV0ZSBkZWZpbmVQcm9wZXJ0eS53cml0YWJsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb25lIGFuIG9iamVjdCBjcmVhdGVkIGZyb20gYW4gT2JqZWN0VGVtcGxhdGVcbiAgICAgKiBVc2VkIG9ubHkgd2l0aGluIHN1cGVydHlwZSAoc2VlIGNvcHlPYmplY3QgZm9yIGdlbmVyYWwgY29weSlcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvYmogaXMgdGhlIHNvdXJjZSBvYmplY3RcbiAgICAgKiBAcGFyYW0gdGVtcGxhdGUgaXMgdGhlIHRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIHRoZSBvYmplY3RcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfSBhIGNvcHkgb2YgdGhlIG9iamVjdFxuICAgICAqL1xuICAgIC8vIEZ1bmN0aW9uIHRvIGNsb25lIHNpbXBsZSBvYmplY3RzIHVzaW5nIE9iamVjdFRlbXBsYXRlIGFzIGEgZ3VpZGVcbiAgICBzdGF0aWMgY2xvbmUob2JqLCB0ZW1wbGF0ZT8pIHtcbiAgICAgICAgbGV0IGNvcHk7XG5cbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgY29weSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgb2JqLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgIGNvcHlbaXhdID0gdGhpcy5jbG9uZShvYmpbaXhdLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRlbXBsYXRlICYmIG9iaiBpbnN0YW5jZW9mIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBjb3B5ID0gbmV3IHRlbXBsYXRlKCk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvcCAhPSAnX19pZF9fJyAmJiAhKG9ialtwcm9wXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlKSB8fCB7fTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5W3Byb3BdID0gdGhpcy5jbG9uZShvYmpbcHJvcF0sIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgY29weSA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BjIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcGMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcHlbcHJvcGNdID0gdGhpcy5jbG9uZShvYmpbcHJvcGNdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGJlIGFibGUgdG8gY3JlYXRlIHJlbW90ZSBmdW5jdGlvbnMgb3JcbiAgICAgKiBvdGhlcndpc2UgaW50ZXJjZXB0IGZ1bmN0aW9uIGNhbGxzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IF9wcm9wZXJ0eU5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0eVZhbHVlIGlzIHRoZSBmdW5jdGlvbiBpdHNlbGZcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfSBhIG5ldyBmdW5jdGlvbiB0byBiZSBhc3NpZ25lZCB0byB0aGUgb2JqZWN0IHByb3RvdHlwZVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX3NldHVwRnVuY3Rpb24oX3Byb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSkge1xuICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gKiBQdXJwb3NlIHVua25vd25cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IG9iaiB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IGNyZWF0b3IgdW5rbm93blxuICpcbiAqIEByZXR1cm5zIHt1bmtub3dufVxuICovXG4gICAgc3RhdGljIGNyZWF0ZUNvcHkob2JqLCBjcmVhdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZyb21QT0pPKG9iaiwgb2JqLl9fdGVtcGxhdGVfXywgbnVsbCwgbnVsbCwgdW5kZWZpbmVkLCBudWxsLCBudWxsLCBjcmVhdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBYnN0cmFjdCBmdW5jdGlvbiBmb3IgYmVuZWZpdCBvZiBTZW1vdHVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNiIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgd2l0aG91dENoYW5nZVRyYWNraW5nKGNiKSB7XG4gICAgICAgIGNiKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBvam8gdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRNYXAgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRRdWFsaWZpZXIgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50IHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3AgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRvciB1bmtub3duXG4gICAgICpcbiAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICovXG4gICAgc3RhdGljIGZyb21QT0pPID0gc2VyaWFsaXplci5mcm9tUE9KTztcblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKlxuICAgICogQHBhcmFtIHt1bmtub3dufSBzdHIgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IGlkUXVhbGlmaWVyIHVua25vd25cbiAgICAqIG9iamVjdFRlbXBsYXRlLmZyb21KU09OKHN0ciwgdGVtcGxhdGUsIGlkUXVhbGlmaWVyKVxuICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04gPSBzZXJpYWxpemVyLmZyb21KU09OO1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhbiBvYmplY3QgdG8gSlNPTiwgc3RyaXBwaW5nIGFueSByZWN1cnNpdmUgb2JqZWN0IHJlZmVyZW5jZXMgc28gdGhleSBjYW4gYmVcbiAgICAgKiByZWNvbnN0aXR1dGVkIGxhdGVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaiB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjYiB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAgKi9cbiAgICBzdGF0aWMgdG9KU09OU3RyaW5nID0gc2VyaWFsaXplci50b0pTT05TdHJpbmc7XG5cbiAgICAgICAgIC8qKlxuICAgICAvKipcbiAgICAgICogRmluZCB0aGUgcmlnaHQgc3ViY2xhc3MgdG8gaW5zdGFudGlhdGUgYnkgZWl0aGVyIGxvb2tpbmcgYXQgdGhlXG4gICAgICAqIGRlY2xhcmVkIGxpc3QgaW4gdGhlIHN1YkNsYXNzZXMgZGVmaW5lIHByb3BlcnR5IG9yIHdhbGtpbmcgdGhyb3VnaFxuICAgICAgKiB0aGUgc3ViY2xhc3NlcyBvZiB0aGUgZGVjbGFyZWQgdGVtcGxhdGVcbiAgICAgICpcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqSWQgdW5rbm93blxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IHVua25vd25cbiAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAqIEBwcml2YXRlXG4gICAgICAqL1xuICAgICBzdGF0aWMgX3Jlc29sdmVTdWJDbGFzcyh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZU5hbWUgPSAnJztcblxuICAgICAgICBpZiAob2JqSWQubWF0Y2goLy0oW0EtWmEtejAtOV86XSopLS8pKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZU5hbWUgPSBSZWdFeHAuJDE7XG4gICAgICAgIH1cblxuICAgIC8vIFJlc29sdmUgdGVtcGxhdGUgc3ViY2xhc3MgZm9yIHBvbHltb3JwaGljIGluc3RhbnRpYXRpb25cbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5ICYmIGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXMgJiYgb2JqSWQgIT0gJ2Fub255bW91cyknKSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZU5hbWUgPT0gZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlc1tpeF0uX19uYW1lX18pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlc1tpeF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzdWJDbGFzcyA9IHRoaXMuX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZSwgdGVtcGxhdGVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKHN1YkNsYXNzKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUgPSBzdWJDbGFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2FsayByZWN1cnNpdmVseSB0aHJvdWdoIGV4dGVuc2lvbnMgb2YgdGVtcGxhdGUgdmlhIF9fY2hpbGRyZW5fX1xuICAgICAqIGxvb2tpbmcgZm9yIGEgbmFtZSBtYXRjaFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZU5hbWUgdW5rbm93blxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9maW5kU3ViQ2xhc3ModGVtcGxhdGUsIHRlbXBsYXRlTmFtZSkge1xuICAgICAgICBpZiAodGVtcGxhdGUuX19uYW1lX18gPT0gdGVtcGxhdGVOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgdGVtcGxhdGUuX19jaGlsZHJlbl9fLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgY29uc3Qgc3ViQ2xhc3MgPSB0aGlzLl9maW5kU3ViQ2xhc3ModGVtcGxhdGUuX19jaGlsZHJlbl9fW2l4XSwgdGVtcGxhdGVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKHN1YkNsYXNzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YkNsYXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBoaWdoZXN0IGxldmVsIHRlbXBsYXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldEJhc2VDbGFzcyh0ZW1wbGF0ZSkge1xuICAgICAgICB3aGlsZSAodGVtcGxhdGUuX19wYXJlbnRfXykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5fX3BhcmVudF9fO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgICAgICAgLyoqXG4gICAgICAqIEFuIG92ZXJyaWRhYmxlIGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGFuIG9iamVjdCBmcm9tIGEgdGVtcGxhdGUgYW5kIG9wdGlvbmFsbHlcbiAgICAgICogbWFuYWdlIHRoZSBjYWNoaW5nIG9mIHRoYXQgb2JqZWN0ICh1c2VkIGJ5IGRlcml2YXRpdmUgdHlwZSBzeXN0ZW1zKS4gIEl0XG4gICAgICAqIHByZXNlcnZlcyB0aGUgb3JpZ2luYWwgaWQgb2YgYW4gb2JqZWN0XG4gICAgICAqXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgb2Ygb2JqZWN0XG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqSWQgYW5kIGlkIChpZiBwcmVzZW50KVxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IHVua25vd25cbiAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAqIEBwcml2YXRlXG4gICAgICAqL1xuICAgICBzdGF0aWMgX2NyZWF0ZUVtcHR5T2JqZWN0KHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9yZXNvbHZlU3ViQ2xhc3ModGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSk7XG5cbiAgICAgICAgY29uc3Qgb2xkU3Rhc2hPYmplY3QgPSB0aGlzLl9zdGFzaE9iamVjdDtcblxuICAgICAgICBpZiAob2JqSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXNoT2JqZWN0ID0gZnVuY3Rpb24gc3Rhc2hPYmplY3QoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBuZXcgdGVtcGxhdGUoKTtcbiAgICAgICAgdGhpcy5fc3Rhc2hPYmplY3QgPSBvbGRTdGFzaE9iamVjdDtcblxuICAgICAgICBpZiAob2JqSWQpIHtcbiAgICAgICAgICAgIG5ld1ZhbHVlLl9faWRfXyA9IG9iaklkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2tzIHVwIGEgcHJvcGVydHkgaW4gdGhlIGRlZmluZVByb3BlcnRpZXMgc2F2ZWQgd2l0aCB0aGUgdGVtcGxhdGUgY2FzY2FkaW5nXG4gICAgICogdXAgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBmaW5kIGl0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3AgaXMgdGhlIHByb3BlcnR5IGJlaW5nIHNvdWdodFxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgaXMgdGhlIHRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIHRoZSBvYmplY3QgY29udGFpbmluZyB0aGUgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIFwiZGVmaW5lUHJvcGVydHlcIiBzdHJ1Y3R1cmUgZm9yIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAodGVtcGxhdGUgJiYgKHRlbXBsYXRlICE9IE9iamVjdCkgJiYgdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcyAmJiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZW1wbGF0ZSAmJiB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBoYXNoIG9mIGFsbCBwcm9wZXJ0aWVzIGluY2x1ZGluZyB0aG9zZSBpbmhlcml0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgaXMgdGhlIHRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIHRoZSBvYmplY3QgY29udGFpbmluZyB0aGUgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHJldHVyblZhbHVlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGluY2x1ZGVWaXJ0dWFsIHVua25vd25cbiAgICAgKiBAcmV0dXJucyB7Kn0gYW4gYXNzb2NpYXRpdmUgYXJyYXkgb2YgZWFjaCBcImRlZmluZVByb3BlcnR5XCIgc3RydWN0dXJlIGZvciB0aGUgcHJvcGVydHlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgcmV0dXJuVmFsdWUsIGluY2x1ZGVWaXJ0dWFsKSB7XG4gICAgICAgIGlmICghcmV0dXJuVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZVZpcnR1YWwgfHwgIXRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0uaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlW3Byb3BdID0gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVtcGxhdGUucGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUucGFyZW50VGVtcGxhdGUsIHJldHVyblZhbHVlLCBpbmNsdWRlVmlydHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogR2VuZXJhbCBmdW5jdGlvbiB0byBjcmVhdGUgdGVtcGxhdGVzIHVzZWQgYnkgY3JlYXRlLCBleHRlbmQgYW5kIG1peGluXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG1peGluVGVtcGxhdGUgLSB0ZW1wbGF0ZSB1c2VkIGZvciBhIG1peGluXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnRUZW1wbGF0ZSAtIHRlbXBsYXRlIHVzZWQgZm9yIGFuIGV4dGVuZFxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydGllc09yVGVtcGxhdGUgLSBwcm9wZXJ0aWVzIHRvIGJlIGFkZGVkL214aWVkIGluXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjcmVhdGVQcm9wZXJ0aWVzIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlTmFtZSAtIHRoZSBuYW1lIG9mIHRoZSB0ZW1wbGF0ZSBhcyBpdCB3aWxsIGJlIHN0b3JlZCByZXRyaWV2ZWQgZnJvbSBkaWN0aW9uYXJ5XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF9jcmVhdGVUZW1wbGF0ZShtaXhpblRlbXBsYXRlPywgcGFyZW50VGVtcGxhdGU/LCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZT8sIGNyZWF0ZVByb3BlcnRpZXM/LCB0ZW1wbGF0ZU5hbWU/LCBjcmVhdGVUZW1wbGF0ZU5vdz8pIHtcbiAgICAgICAgLy8gV2Ugd2lsbCByZXR1cm4gYSBjb25zdHJ1Y3RvciB0aGF0IGNhbiBiZSB1c2VkIGluIGEgbmV3IGZ1bmN0aW9uXG4gICAgICAgIC8vIHRoYXQgd2lsbCBjYWxsIGFuIGluaXQoKSBmdW5jdGlvbiBmb3VuZCBpbiBwcm9wZXJ0aWVzLCBkZWZpbmUgcHJvcGVydGllcyB1c2luZyBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAgICAgICAvLyBhbmQgbWFrZSBjb3BpZXMgb2YgdGhvc2UgdGhhdCBhcmUgcmVhbGx5IG9iamVjdHNcbiAgICAgICAgdmFyIGZ1bmN0aW9uUHJvcGVydGllczphbnkgPSB7fTsgICAgLy8gV2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCBpbml0IGZ1bmN0aW9uIGZyb20gcHJvcGVydGllc1xuICAgICAgICB2YXIgb2JqZWN0UHJvcGVydGllcyA9IHt9OyAgICAvLyBMaXN0IG9mIHByb3BlcnRpZXMgdG8gYmUgcHJvY2Vzc2VkIGJ5IGhhbmRcbiAgICAgICAgdmFyIGRlZmluZVByb3BlcnRpZXMgPSB7fTsgICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIGJlIHNlbnQgdG8gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoKVxuICAgICAgICB2YXIgb2JqZWN0VGVtcGxhdGUgPSB0aGlzO1xuICAgICAgICB2YXIgdGVtcGxhdGVQcm90b3R5cGU7XG5cbiAgICAgICAgZnVuY3Rpb24gRigpIHsgfSAgICAgLy8gVXNlZCBpbiBjYXNlIG9mIGV4dGVuZFxuXG4gICAgICAgIGlmICghdGhpcy5sYXp5VGVtcGxhdGVMb2FkKSB7XG4gICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZU5vdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0dXAgdmFyaWFibGVzIGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiBjYWxsIChjcmVhdGUsIGV4dGVuZCwgbWl4aW4pXG4gICAgICAgIGlmIChjcmVhdGVUZW1wbGF0ZU5vdykge1xuICAgICAgICAgICAgaWYgKG1peGluVGVtcGxhdGUpIHsgICAgICAgIC8vIE1peGluXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChtaXhpblRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc09yVGVtcGxhdGUuaXNPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUlmTmVlZGVkKHByb3BlcnRpZXNPclRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcHAgaW4gcHJvcGVydGllc09yVGVtcGxhdGUub2JqZWN0UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzW3Byb3BwXSA9IHByb3BlcnRpZXNPclRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXNbcHJvcHBdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG8gaW4gcHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcG8gPT0gJ2luaXQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCA9IG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgfHwgW107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgcHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQucHVzaChwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdFtpeF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzW3Byb3BvXSA9IHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllc1twcm9wb107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wbiBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wRGVzYyA9IDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5wcm90b3R5cGUsIHByb3BuKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BEZXNjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1peGluVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbiwgcHJvcERlc2MpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BEZXNjLmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEdldHRlcj5PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG1peGluVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbikpLmdldC5zb3VyY2VUZW1wbGF0ZSA9IHByb3BEZXNjLmdldC5zb3VyY2VUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3RvdHlwZVtwcm9wbl0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5wcm90b3R5cGVbcHJvcG5dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm9wcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wcyA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKG1peGluVGVtcGxhdGUsIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG0gaW4gcHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvcHNbcHJvcG1dID0gcHJvcHNbcHJvcG1dO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1peGluVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RQcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvblByb3BlcnRpZXMgPSBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGUgPSBtaXhpblRlbXBsYXRlLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50VGVtcGxhdGUgPSBtaXhpblRlbXBsYXRlLnBhcmVudFRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgeyAgICAgICAgLy8gRXh0ZW5kXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChwYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBwYXJlbnRUZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGUgPSBuZXcgRigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25zdHJ1Y3RvciB0aGF0IHdpbGwgYmUgcmV0dXJuZWQgd2lsbCBvbmx5IGV2ZXIgYmUgY3JlYXRlZCBvbmNlXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgdGVtcGxhdGU6IENvbnN0cnVjdG9yVHlwZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bdGVtcGxhdGVOYW1lXSB8fFxuICAgICAgICAgICAgYmluZFBhcmFtcyh0ZW1wbGF0ZU5hbWUsIG9iamVjdFRlbXBsYXRlLCBmdW5jdGlvblByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLFxuICAgICAgICAgICAgICAgIGNyZWF0ZVByb3BlcnRpZXMsIG9iamVjdFByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLFxuICAgICAgICAgICAgICAgIGNyZWF0ZVRlbXBsYXRlTm93LCBtaXhpblRlbXBsYXRlKVxuXG5cbiAgICAgICAgdGVtcGxhdGUuaXNPYmplY3RUZW1wbGF0ZSA9IHRydWU7XG5cbiAgICAgICAgdGVtcGxhdGUuZXh0ZW5kID0gKHAxLCBwMikgPT4gb2JqZWN0VGVtcGxhdGUuZXh0ZW5kLmNhbGwob2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlLCBwMSwgcDIpO1xuICAgICAgICB0ZW1wbGF0ZS5taXhpbiA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLm1peGluLmNhbGwob2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlLCBwMSwgcDIpO1xuICAgICAgICB0ZW1wbGF0ZS5zdGF0aWNNaXhpbiA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLnN0YXRpY01peGluLmNhbGwob2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlLCBwMSwgcDIpO1xuXG4gICAgICAgIHRlbXBsYXRlLmZyb21QT0pPID0gKHBvam8pID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tUE9KTyhwb2pvLCB0ZW1wbGF0ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVtcGxhdGUuZnJvbUpTT04gPSAoc3RyLCBpZFByZWZpeCkgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRlbXBsYXRlLmZyb21KU09OKHN0ciwgdGVtcGxhdGUsIGlkUHJlZml4KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0ZW1wbGF0ZS5nZXRQcm9wZXJ0aWVzID0gKGluY2x1ZGVWaXJ0dWFsKSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUsIHVuZGVmaW5lZCwgaW5jbHVkZVZpcnR1YWwpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghY3JlYXRlVGVtcGxhdGVOb3cpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fID0gdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18gfHwgW107XG4gICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXy5wdXNoKFttaXhpblRlbXBsYXRlLCBwYXJlbnRUZW1wbGF0ZSwgcHJvcGVydGllc09yVGVtcGxhdGUsIGNyZWF0ZVByb3BlcnRpZXMsIHRlbXBsYXRlTmFtZV0pO1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcGxhdGUucHJvdG90eXBlID0gdGVtcGxhdGVQcm90b3R5cGU7XG5cbiAgICAgICAgdmFyIGNyZWF0ZVByb3BlcnR5ID0gY3JlYXRlUHJvcGVydHlGdW5jLmJpbmQobnVsbCwgZnVuY3Rpb25Qcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSwgb2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlTmFtZSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUpO1xuXG5cbiAgICAgICAgLy8gV2FsayB0aHJvdWdoIHByb3BlcnRpZXMgYW5kIGNvbnN0cnVjdCB0aGUgZGVmaW5lUHJvcGVydGllcyBoYXNoIG9mIHByb3BlcnRpZXMsIHRoZSBsaXN0IG9mXG4gICAgICAgIC8vIG9iamVjdFByb3BlcnRpZXMgdGhhdCBoYXZlIHRvIGJlIHJlaW5zdGFudGlhdGVkIGFuZCBhdHRhY2ggZnVuY3Rpb25zIHRvIHRoZSBwcm90b3R5cGVcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIHByb3BlcnRpZXNPclRlbXBsYXRlKSB7XG4gICAgICAgICAgICBjcmVhdGVQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIG51bGwsIHByb3BlcnRpZXNPclRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMgPSBkZWZpbmVQcm9wZXJ0aWVzO1xuICAgICAgICB0ZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzID0gb2JqZWN0UHJvcGVydGllcztcblxuICAgICAgICB0ZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMgPSBmdW5jdGlvblByb3BlcnRpZXM7XG4gICAgICAgIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlID0gcGFyZW50VGVtcGxhdGU7XG5cblxuICAgICAgICB0ZW1wbGF0ZS5jcmVhdGVQcm9wZXJ0eSA9IGNyZWF0ZVByb3BlcnR5O1xuXG4gICAgICAgIHRlbXBsYXRlLnByb3BzID0ge307XG5cbiAgICAgICAgdmFyIHByb3BzdCA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICAgIGZvciAodmFyIHByb3BkIGluIHByb3BzdCkge1xuICAgICAgICAgICAgdGVtcGxhdGUucHJvcHNbcHJvcGRdID0gcHJvcHN0W3Byb3BkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHRvIGNsb25lIHRoZSBUeXBlIFN5c3RlbVxuICAgICAqIEByZXR1cm5zIHtvfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9jcmVhdGVPYmplY3QoKTogT2JqZWN0VGVtcGxhdGVDbG9uZSB7XG4gICAgICAgIGNvbnN0IG5ld0ZvbyA9IE9iamVjdC5jcmVhdGUodGhpcyk7XG4gICAgICAgIG5ld0Zvby5pbml0KCk7XG4gICAgICAgIHJldHVybiBuZXdGb287XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gb3JpZ2luYWxseSB0b29rIGEgY29udGV4dCB0aGF0IGl0IHRocmV3IGF3YXlcbiAgICAqIEByZXR1cm5zIHtTdXBlcnR5cGVMb2dnZXJ9XG4gICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlTG9nZ2VyKCk6IFN1cGVydHlwZUxvZ2dlciB7XG4gICAgICAgIHJldHVybiBuZXcgU3VwZXJ0eXBlTG9nZ2VyKCk7XG4gICAgfVxuICAgIFxuXG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUHJvcGVydHlGdW5jKGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLFxuICAgIHByb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSwgcHJvcGVydGllcywgY3JlYXRlUHJvcGVydGllcykge1xuICAgIGlmICghcHJvcGVydGllcykge1xuICAgICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoZSBpbml0aWFsaXphdGlvbiBmdW5jdGlvblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgPT0gJ2luaXQnICYmIHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmdW5jdGlvblByb3BlcnRpZXMuaW5pdCA9IFtwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IG51bGw7IC8vIGRlZmluZVByb3BlcnR5IHRvIGJlIGFkZGVkIHRvIGRlZmluZVByb3BlcnRpZXNcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHByb3BlcnR5IHZhbHVlIHdoaWNoIG1heSBiZSBhIGRlZmluZVByb3BlcnRpZXMgc3RydWN0dXJlIG9yIGp1c3QgYW4gaW5pdGlhbCB2YWx1ZVxuICAgICAgICB2YXIgZGVzY3JpcHRvcjphbnkgPSB7fTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllcywgcHJvcGVydHlOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0eXBlID0gJ251bGwnO1xuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLmdldCB8fCBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgICAgICAgdHlwZSA9ICdnZXRzZXQnO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgLy8gRmlndXJlIG91dCB3aGV0aGVyIHRoaXMgaXMgYSBkZWZpbmVQcm9wZXJ0eSBzdHJ1Y3R1cmUgKGhhcyBhIGNvbnN0cnVjdG9yIG9mIG9iamVjdClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IC8vIE9yIGFycmF5XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIHJlbW90ZSBmdW5jdGlvbiBjYWxsc1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSAmJiB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdID0gb2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcGVydHlOYW1lLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9uLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS50eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zYXJyYXlfXyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fb25fXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vbjtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3ZhbGlkYXRlX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19ib2R5X18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLndyaXRhYmxlID0gdHJ1ZTsgLy8gV2UgYXJlIHVzaW5nIHNldHRlcnNcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIE90aGVyIGNyYXBcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdnZXRzZXQnOiAvLyBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGVtcGxhdGVQcm90b3R5cGUsIHByb3BlcnR5TmFtZSwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0ZW1wbGF0ZVByb3RvdHlwZSwgcHJvcGVydHlOYW1lKSkuZ2V0LnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBkZWZpbmVQcm9wZXJ0eSB0byBiZSBhZGRlZFxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci50b0NsaWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b0NsaWVudCA9IGRlc2NyaXB0b3IudG9DbGllbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudG9TZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBkZXNjcmlwdG9yLnRvU2VydmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fc2V0dXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSkge1xuXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUoKSB7XG4gICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlLCB0aGlzKTtcbiAgICAgICAgbGV0IHRlbXBsYXRlUmVmOiBDb25zdHJ1Y3RvclR5cGUgPSA8Q29uc3RydWN0b3JUeXBlPjxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlVXNhZ2VfX1t0ZW1wbGF0ZVJlZi5fX25hbWVfX10gPSB0cnVlO1xuICAgICAgICB2YXIgcGFyZW50ID0gdGVtcGxhdGVSZWYuX19wYXJlbnRfXztcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZVVzYWdlX19bcGFyZW50Ll9fbmFtZV9fXSA9IHRydWU7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRlbXBsYXRlUmVmO1xuXG4gICAgICAgIGlmIChvYmplY3RUZW1wbGF0ZS5fX3RyYW5zaWVudF9fKSB7XG4gICAgICAgICAgICB0aGlzLl9fdHJhbnNpZW50X18gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBydW5lZE9iamVjdFByb3BlcnRpZXMgPSBwcnVuZUV4aXN0aW5nKHRoaXMsIHRlbXBsYXRlUmVmLm9iamVjdFByb3BlcnRpZXMpO1xuICAgICAgICB2YXIgcHJ1bmVkRGVmaW5lUHJvcGVydGllcyA9IHBydW5lRXhpc3RpbmcodGhpcywgdGVtcGxhdGVSZWYuZGVmaW5lUHJvcGVydGllcyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBwcm9wZXJ0aWVzIGVpdGhlciB3aXRoIEVNQ0EgNSBkZWZpbmVQcm9wZXJ0aWVzIG9yIGJ5IGhhbmRcbiAgICAgICAgICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHBydW5lZERlZmluZVByb3BlcnRpZXMpOyAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGFkZGVkIHByZS1FTUNBIDVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gVE9ETzogZmluZCBhIGJldHRlciB3YXkgdG8gZGVhbCB3aXRoIGVycm9ycyB0aGF0IGFyZSB0aHJvd25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZnJvbVJlbW90ZSA9IHRoaXMuZnJvbVJlbW90ZSB8fCBvYmplY3RUZW1wbGF0ZS5fc3Rhc2hPYmplY3QodGhpcywgdGVtcGxhdGVSZWYpO1xuXG4gICAgICAgIHRoaXMuY29weVByb3BlcnRpZXMgPSBmdW5jdGlvbiBjb3B5UHJvcGVydGllcyhvYmopIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgdGhpc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHByb3BlcnRpZXMgZnJvbSB0aGUgZGVmaW5lUHJvcGVydGllcyB2YWx1ZSBwcm9wZXJ0eVxuICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gcHJ1bmVkT2JqZWN0UHJvcGVydGllcykge1xuICAgICAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gcHJ1bmVkT2JqZWN0UHJvcGVydGllc1twcm9wZXJ0eU5hbWVdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS5pbml0KSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuYnlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZV0gPSBPYmplY3RUZW1wbGF0ZS5jbG9uZShkZWZpbmVQcm9wZXJ0eS5pbml0LCBkZWZpbmVQcm9wZXJ0eS5vZiB8fCBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IChkZWZpbmVQcm9wZXJ0eS5pbml0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIFRlbXBsYXRlIGxldmVsIGluamVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHRlbXBsYXRlUmVmLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgdGVtcGxhdGVSZWYuX19pbmplY3Rpb25zX19baXhdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iYWwgaW5qZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tqXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3Byb3BfXyA9IGZ1bmN0aW9uIGcocHJvcCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0aGlzLl9fdGVtcGxhdGVfXyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fX3ZhbHVlc19fID0gZnVuY3Rpb24gZihwcm9wKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LnZhbHVlcykgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fX2Rlc2NyaXB0aW9uc19fID0gZnVuY3Rpb24gZShwcm9wKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucykgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhbiBpbml0IGZ1bmN0aW9uIG9yIGFyZSBhIHJlbW90ZSBjcmVhdGlvbiBjYWxsIHBhcmVudCBjb25zdHJ1Y3RvciBvdGhlcndpc2UgY2FsbCBpbml0XG4gICAgICAgIC8vICBmdW5jdGlvbiB3aG8gd2lsbCBiZSByZXNwb25zaWJsZSBmb3IgY2FsbGluZyBwYXJlbnQgY29uc3RydWN0b3IgdG8gYWxsb3cgZm9yIHBhcmFtZXRlciBwYXNzaW5nLlxuICAgICAgICBpZiAodGhpcy5mcm9tUmVtb3RlIHx8ICF0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCB8fCBvYmplY3RUZW1wbGF0ZS5ub0luaXQpIHtcbiAgICAgICAgICAgIGlmIChwYXJlbnRUZW1wbGF0ZSAmJiBwYXJlbnRUZW1wbGF0ZS5pc09iamVjdFRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VGVtcGxhdGUuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXRbaV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRlbXBsYXRlUmVmO1xuXG4gICAgICAgIHRoaXMudG9KU09OU3RyaW5nID0gZnVuY3Rpb24gdG9KU09OU3RyaW5nKGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUudG9KU09OU3RyaW5nKHRoaXMsIGNiKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBDbG9uZSBhbmQgb2JqZWN0IGNhbGxpbmcgYSBjYWxsYmFjayBmb3IgZWFjaCByZWZlcmVuY2VkIG9iamVjdC5cbiAgICAgICAgIFRoZSBjYWxsIGJhY2sgaXMgcGFzc2VkIChvYmosIHByb3AsIHRlbXBsYXRlKVxuICAgICAgICAgb2JqIC0gdGhlIHBhcmVudCBvYmplY3QgKGV4Y2VwdCB0aGUgaGlnaGVzdCBsZXZlbClcbiAgICAgICAgIHByb3AgLSB0aGUgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgIHRlbXBsYXRlIC0gdGhlIHRlbXBsYXRlIG9mIHRoZSBvYmplY3QgdG8gYmUgY3JlYXRlZFxuICAgICAgICAgdGhlIGZ1bmN0aW9uIHJldHVybnM6XG4gICAgICAgICAtIGZhbHN5IC0gY2xvbmUgb2JqZWN0IGFzIHVzdWFsIHdpdGggYSBuZXcgaWRcbiAgICAgICAgIC0gb2JqZWN0IHJlZmVyZW5jZSAtIHRoZSBjYWxsYmFjayBjcmVhdGVkIHRoZSBvYmplY3QgKHByZXN1bWFibHkgdG8gYmUgYWJsZSB0byBwYXNzIGluaXQgcGFyYW1ldGVycylcbiAgICAgICAgIC0gW29iamVjdF0gLSBhIG9uZSBlbGVtZW50IGFycmF5IG9mIHRoZSBvYmplY3QgbWVhbnMgZG9uJ3QgY29weSB0aGUgcHJvcGVydGllcyBvciB0cmF2ZXJzZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jcmVhdGVDb3B5ID0gZnVuY3Rpb24gY3JlYXRlQ29weShjcmVhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuY3JlYXRlQ29weSh0aGlzLCBjcmVhdG9yKTtcbiAgICAgICAgfTtcblxuICAgIH07XG5cblxuICAgIGxldCByZXR1cm5WYWwgPSA8RnVuY3Rpb24+dGVtcGxhdGU7XG5cbiAgICByZXR1cm4gcmV0dXJuVmFsIGFzIENvbnN0cnVjdG9yVHlwZTtcbn1cbiJdfQ==