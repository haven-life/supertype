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
        this.logger = this.logger || this.createLogger(); // Create a default logger
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMkM7QUFDM0MscURBQW9EO0FBK0NwRDs7Ozs7Ozs7R0FRRztBQUNILHFCQUFxQixJQUFJLEVBQUUsT0FBTztJQUM5QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7SUFFZixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7UUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDbkM7U0FDSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDakMsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUVaLElBQUksT0FBTyxFQUFFO1lBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUk7Z0JBQ3ZCLDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDTixrQ0FBa0M7b0JBQ2xDLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO2lCQUN0QjtZQUNMLENBQUMsQ0FBQyxDQUFDO1NBQ047S0FDSjtTQUNJLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSTtZQUN4QixHQUFHLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7S0FDTjtTQUNJO1FBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQztLQUNkO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsdUJBQXVCLEdBQUcsRUFBRSxLQUFLO0lBQzdCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUVsQixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtRQUNwQixJQUFJ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UyxHQUFhLFFBQVEsQ0FBQztJQUVuQyxPQUFPLFNBQTRCLENBQUM7QUFDeEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNlcmlhbGl6ZXIgZnJvbSAnLi9zZXJpYWxpemVyJztcbmltcG9ydCB7IFN1cGVydHlwZUxvZ2dlciB9IGZyb20gJy4vU3VwZXJ0eXBlTG9nZ2VyJztcbmV4cG9ydCB0eXBlIENyZWF0ZVR5cGVGb3JOYW1lID0ge1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgdG9DbGllbnQ/OiBib29sZWFuO1xuICAgIHRvU2VydmVyPzogYm9vbGVhbjtcbiAgICBpc0xvY2FsPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IHR5cGUgR2V0dGVyID0ge1xuICAgIGdldDogYW55O1xufVxuXG4vKipcbiAqIHRoaXMgaXMgcHJldHR5IG11Y2ggdGhlIGNsYXNzICh0aGUgdGVtcGxhdGUgaXRzZWxmKVxuICogVHJ5IHRvIHVuaWZ5IHRoaXMgd2l0aCB0aGUgU3VwZXJ0eXBlIFR5cGUgKG1heWJlIG1ha2UgdGhpcyBhIHBhcnRpYWwsIGhhdmUgc3VwZXJ0eXBlIGV4dGVuZCB0aGlzKVxuICovXG5leHBvcnQgdHlwZSBDb25zdHJ1Y3RvclR5cGVCYXNlID0gRnVuY3Rpb24gJiB7XG4gICAgYW1vcnBoaWNDbGFzc05hbWU6IGFueTtcbiAgICBfX3NoYWRvd1BhcmVudF9fOiBhbnk7XG4gICAgcHJvcHM/OiBhbnk7XG4gICAgX19wYXJlbnRfXzogYW55O1xuICAgIF9fbmFtZV9fOiBhbnk7XG4gICAgX19jcmVhdGVQYXJhbWV0ZXJzX186IGFueTtcbiAgICBmdW5jdGlvblByb3BlcnRpZXM6IGFueTtcbiAgICBpc09iamVjdFRlbXBsYXRlOiBhbnk7XG4gICAgZXh0ZW5kOiBhbnk7XG4gICAgc3RhdGljTWl4aW46IGFueTtcbiAgICBtaXhpbjogYW55O1xuICAgIGZyb21QT0pPOiBhbnk7XG4gICAgZnJvbUpTT046IGFueTtcbiAgICBnZXRQcm9wZXJ0aWVzOiAoaW5jbHVkZVZpcnR1YWwpID0+IGFueTtcbiAgICBwcm90b3R5cGU6IGFueTtcbiAgICBkZWZpbmVQcm9wZXJ0aWVzOiBhbnk7XG4gICAgb2JqZWN0UHJvcGVydGllczogYW55O1xuICAgIHBhcmVudFRlbXBsYXRlOiBhbnk7XG4gICAgY3JlYXRlUHJvcGVydHk6IGFueTtcbiAgICBfX3RlbXBsYXRlX186IGFueTtcbiAgICBfX2luamVjdGlvbnNfXzogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnN0cnVjdG9yVHlwZSBleHRlbmRzIENvbnN0cnVjdG9yVHlwZUJhc2Uge1xuICAgIG5ldygpO1xufVxuXG5leHBvcnQgdHlwZSBPYmplY3RUZW1wbGF0ZUNsb25lID0gdHlwZW9mIE9iamVjdFRlbXBsYXRlO1xuXG5cbi8qKlxuICogQWxsb3cgdGhlIHByb3BlcnR5IHRvIGJlIGVpdGhlciBhIGJvb2xlYW4gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBib29sZWFuIG9yIGEgc3RyaW5nXG4gKiBtYXRjaGVkIGFnYWluc3QgYSBydWxlIHNldCBhcnJheSBvZiBzdHJpbmcgaW4gT2JqZWN0VGVtcGxhdGVcbiAqXG4gKiBAcGFyYW0gIHByb3AgdW5rbm93blxuICogQHBhcmFtIHJ1bGVTZXQgdW5rbm93blxuICpcbiAqIEByZXR1cm5zIHtmdW5jdGlvbih0aGlzOk9iamVjdFRlbXBsYXRlKX1cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1Byb3AocHJvcCwgcnVsZVNldCkge1xuICAgIHZhciByZXQgPSBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiAocHJvcCkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0ID0gcHJvcC5jYWxsKE9iamVjdFRlbXBsYXRlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIChwcm9wKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0ID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHJ1bGVTZXQpIHtcbiAgICAgICAgICAgIHJ1bGVTZXQubWFwKGZ1bmN0aW9uIGkocnVsZSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCBhbHdheXMgZXhlY3V0ZVxuICAgICAgICAgICAgICAgIGlmICghcmV0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvdWJsZSBlcXVhbHMgb3Igc2luZ2xlIGVxdWFscz9cbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gcnVsZSA9PSBwcm9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb3AgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBwcm9wLmZvckVhY2goZnVuY3Rpb24gaChwcm9wKSB7XG4gICAgICAgICAgICByZXQgPSByZXQgfHwgcHJvY2Vzc1Byb3AocHJvcCwgcnVsZVNldCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0ID0gcHJvcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBwcnVuZUV4aXN0aW5nKG9iaiwgcHJvcHMpIHtcbiAgICB2YXIgbmV3UHJvcHMgPSB7fTtcblxuICAgIGZvciAodmFyIHByb3AgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKHR5cGVvZihvYmpbcHJvcF0pID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbmV3UHJvcHNbcHJvcF0gPSBwcm9wc1twcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdQcm9wcztcbn1cblxuLyoqXG4gKiB0aGUgb2cgT2JqZWN0VGVtcGxhdGUsIHdoYXQgZXZlcnl0aGluZyBwaWNrcyBvZmYgb2ZcbiAqL1xuZXhwb3J0IGNsYXNzIE9iamVjdFRlbXBsYXRlIHtcblxuICAgIHN0YXRpYyBsYXp5VGVtcGxhdGVMb2FkOiBhbnk7XG4gICAgc3RhdGljIGlzTG9jYWxSdWxlU2V0OiBhbnk7XG4gICAgc3RhdGljIG5leHRJZDogYW55OyAvLyBmb3Igc3Rhc2hPYmplY3RcbiAgICBzdGF0aWMgX19leGNlcHRpb25zX186IGFueTtcblxuICAgIHN0YXRpYyBfX3RlbXBsYXRlc19fOiBDb25zdHJ1Y3RvclR5cGVbXTtcbiAgICBzdGF0aWMgdG9TZXJ2ZXJSdWxlU2V0OiBzdHJpbmdbXTtcbiAgICBzdGF0aWMgdG9DbGllbnRSdWxlU2V0OiBzdHJpbmdbXTtcblxuICAgIHN0YXRpYyB0ZW1wbGF0ZUludGVyY2VwdG9yOiBhbnk7XG4gICAgc3RhdGljIF9fZGljdGlvbmFyeV9fOiB7IFtrZXk6IHN0cmluZ106IENvbnN0cnVjdG9yVHlwZSB9O1xuICAgIHN0YXRpYyBfX2Fub255bW91c0lkX186IG51bWJlcjtcbiAgICBzdGF0aWMgX190ZW1wbGF0ZXNUb0luamVjdF9fOiB7fTtcbiAgICBzdGF0aWMgbG9nZ2VyOiBhbnk7XG4gICAgbG9nZ2VyOiBTdXBlcnR5cGVMb2dnZXI7XG4gICAgc3RhdGljIF9fdGVtcGxhdGVVc2FnZV9fOiBhbnk7XG4gICAgc3RhdGljIF9faW5qZWN0aW9uc19fOiBGdW5jdGlvbltdO1xuICAgIHN0YXRpYyBfX3RvQ2xpZW50X186IGJvb2xlYW47XG5cbiAgICBzdGF0aWMgYW1vcnBoaWNTdGF0aWMgPSBPYmplY3RUZW1wbGF0ZTtcbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgcGVyZm9ybUluamVjdGlvbnMoKSB7XG4gICAgICAgIHRoaXMuZ2V0Q2xhc3NlcygpO1xuICAgICAgICBpZiAodGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFRlbXBsYXRlID0gdGhpcztcblxuICAgICAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZU5hbWUgaW4gdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW3RlbXBsYXRlTmFtZV07XG5cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QoaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuaW5qZWN0KHRoaXMsIGluamVjdG9yKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5faW5qZWN0SW50b1RlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBpbml0KCkge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVVc2FnZV9fID0ge307XG4gICAgICAgIHRoaXMuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfXyA9IHt9O1xuICAgICAgICB0aGlzLl9fYW5vbnltb3VzSWRfXyA9IDE7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fID0ge307XG4gICAgICAgIHRoaXMubG9nZ2VyID0gdGhpcy5sb2dnZXIgfHwgdGhpcy5jcmVhdGVMb2dnZXIoKTsgLy8gQ3JlYXRlIGEgZGVmYXVsdCBsb2dnZXJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0VGVtcGxhdGVCeU5hbWUobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGFzc2VzKClbbmFtZV07XG4gICAgfVxuXG4gICAgLyoqXG4gKiBQdXJwb3NlIHVua25vd25cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gbmFtZSB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAqL1xuICAgIHN0YXRpYyBzZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIHByb3BzKSB7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW25hbWVdID0gdGVtcGxhdGU7XG4gICAgICAgIHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgdGVtcGxhdGUuX19uYW1lX18gPSBuYW1lO1xuICAgICAgICB0ZW1wbGF0ZS5fX2luamVjdGlvbnNfXyA9IFtdO1xuICAgICAgICB0ZW1wbGF0ZS5fX29iamVjdFRlbXBsYXRlX18gPSB0aGlzO1xuICAgICAgICB0ZW1wbGF0ZS5fX2NoaWxkcmVuX18gPSBbXTtcbiAgICAgICAgdGVtcGxhdGUuX190b0NsaWVudF9fID0gcHJvcHMuX190b0NsaWVudF9fO1xuICAgICAgICB0ZW1wbGF0ZS5fX3RvU2VydmVyX18gPSBwcm9wcy5fX3RvU2VydmVyX187XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlUHJvcGVydGllczogeyBfX3RvQ2xpZW50X18/OiBhbnk7IF9fdG9TZXJ2ZXJfXz86IGFueSB9ID0ge307XG5cbiAgICAgICAgaWYgKE9iamVjdFRlbXBsYXRlLl9fdG9DbGllbnRfXyA9PSBmYWxzZSkge1xuICAgICAgICAgICAgcHJvcHMudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9jZXNzUHJvcChwcm9wcy5pc0xvY2FsLCB0aGlzLmlzTG9jYWxSdWxlU2V0KSkge1xuICAgICAgICAgICAgcHJvcHMudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHByb3BzLnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZVByb3BlcnRpZXMuX190b0NsaWVudF9fID0gcHJvY2Vzc1Byb3AocHJvcHMudG9DbGllbnQsIHRoaXMudG9DbGllbnRSdWxlU2V0KSAhPSBmYWxzZTtcbiAgICAgICAgdGVtcGxhdGVQcm9wZXJ0aWVzLl9fdG9TZXJ2ZXJfXyA9IHByb2Nlc3NQcm9wKHByb3BzLnRvU2VydmVyLCB0aGlzLnRvU2VydmVyUnVsZVNldCkgIT0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlUHJvcGVydGllcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICAgKiBDcmVhdGUgYW4gb2JqZWN0IHRlbXBsYXRlIHRoYXQgaXMgaW5zdGFudGlhdGVkIHdpdGggdGhlIG5ldyBvcGVyYXRvci5cbiAgICAgICAgKiBwcm9wZXJ0aWVzIGlzXG4gICAgICAgICpcbiAgICAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFuIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIHJlcHJlc2VudCBkYXRhIGFuZCBmdW5jdGlvblxuICAgICAgICAqIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdC4gIFRoZSBkYXRhIHByb3BlcnRpZXMgbWF5IHVzZSB0aGUgZGVmaW5lUHJvcGVydHlcbiAgICAgICAgKiBmb3JtYXQgZm9yIHByb3BlcnRpZXMgb3IgbWF5IGJlIHByb3BlcnRpZXMgYXNzaWduZWQgYSBOdW1iZXIsIFN0cmluZyBvciBEYXRlLlxuICAgICAgICAqXG4gICAgICAgICogQHJldHVybnMgeyp9IHRoZSBvYmplY3QgdGVtcGxhdGVcbiAgICAgICAgKi9cblxuICAgIHN0YXRpYyBjcmVhdGUobmFtZTogc3RyaW5nIHwgQ3JlYXRlVHlwZUZvck5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgLyoqIHRoaXMgYmxvY2sgb25seSBleGVjdXRlcyBvbiBjcmVhdGV0eXBlZm9ybmFtZSAqL1xuICAgICAgICBpZiAobmFtZSAmJiAhKHR5cGVvZiAobmFtZSkgPT09ICdzdHJpbmcnKSAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gcHJvcHMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3JlYXRlUHJvcHMgPSB0aGlzLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiAodGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKCdjcmVhdGUnLCBuYW1lLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0ZW1wbGF0ZTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBPYmplY3QsIHByb3BlcnRpZXMsIGNyZWF0ZVByb3BzLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgT2JqZWN0LCBuYW1lLCBjcmVhdGVQcm9wcywgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgY3JlYXRlUHJvcHMpO1xuICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX18gPSBwcm9wcztcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBFeHRlbmQgYW5kIGV4aXN0aW5nIChwYXJlbnQgdGVtcGxhdGUpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudFRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFyZSB0aGUgc2FtZSBhcyBmb3IgY3JlYXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIG9iamVjdCB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBleHRlbmQocGFyZW50VGVtcGxhdGUsIG5hbWU6IHN0cmluZyB8IENyZWF0ZVR5cGVGb3JOYW1lLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGxldCBwcm9wcztcbiAgICAgICAgbGV0IGNyZWF0ZVByb3BzO1xuXG4gICAgICAgIGlmICghcGFyZW50VGVtcGxhdGUuX19vYmplY3RUZW1wbGF0ZV9fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCBwYXJlbnQgdGVtcGxhdGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSBwcm9wcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMgPSBwYXJlbnRUZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX187XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhpc3RpbmdUZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV07XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18gIT0gcGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fLl9fbmFtZV9fICE9IHBhcmVudFRlbXBsYXRlLl9fbmFtZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOOiBBdHRlbXB0IHRvIGV4dGVuZCAke3BhcmVudFRlbXBsYXRlLl9fbmFtZV9ffSBhcyAke25hbWV9IGJ1dCAke25hbWV9IHdhcyBhbHJlYWR5IGV4dGVuZGVkIGZyb20gJHtleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18uX19uYW1lX199YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taXhpbihleGlzdGluZ1RlbXBsYXRlLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1RlbXBsYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICBjcmVhdGVQcm9wcyA9IHRoaXMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcignZXh0ZW5kJywgbmFtZSwgcHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIG5hbWUsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdGVQcm9wcykge1xuICAgICAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIGNyZWF0ZVByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBwYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQcm9wc19fID0gcHJvcHM7XG5cbiAgICAgICAgLy8gTWFpbnRhaW4gZ3JhcGggb2YgcGFyZW50IGFuZCBjaGlsZCB0ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGUuX19wYXJlbnRfXyA9IHBhcmVudFRlbXBsYXRlO1xuICAgICAgICBwYXJlbnRUZW1wbGF0ZS5fX2NoaWxkcmVuX18ucHVzaCh0ZW1wbGF0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgIHN0YXRpYyBtaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IoJ2NyZWF0ZScsIHRlbXBsYXRlLl9fbmFtZV9fLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSwgbnVsbCwgcHJvcGVydGllcywgdGVtcGxhdGUsIHRlbXBsYXRlLl9fbmFtZV9fKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICpcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIHVua25vd25cbiAgICAqL1xuICAgIHN0YXRpYyBzdGF0aWNNaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGVbcHJvcF0gPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgb24gb2JqZWN0IGNyZWF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIGluamVjdCh0ZW1wbGF0ZSwgaW5qZWN0b3I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRlbXBsYXRlLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIG9uIGFsbCBvYmplY3QgY3JlYXRpb25zIChhcHBhcmVudGx5KT8gSnVzdCBhIGd1ZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciAtIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2xvYmFsSW5qZWN0KGluamVjdG9yOiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgdGVtcGxhdGUgaWYgaXQgbmVlZHMgdG8gYmUgY3JlYXRlZFxuICAgICAqIEBwYXJhbSBbdW5rbm93bn0gdGVtcGxhdGUgdG8gYmUgY3JlYXRlZFxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZT8sIHRoaXNPYmo/KSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXykge1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlUGFyYW1ldGVycyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fO1xuICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IGNyZWF0ZVBhcmFtZXRlcnMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gY3JlYXRlUGFyYW1ldGVyc1tpeF07XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlVGVtcGxhdGUocGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSwgcGFyYW1zWzNdLCBwYXJhbXNbNF0sIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlLl9pbmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX2luamVjdFByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzT2JqKSB7XG4gICAgICAgICAgICAgICAgLy92YXIgY29weSA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3RvdHlwZXMgPSBbdGVtcGxhdGUucHJvdG90eXBlXTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50ID0gdGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZXMucHVzaChwYXJlbnQucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGl4ID0gcHJvdG90eXBlcy5sZW5ndGggLSAxOyBpeCA+PSAwOyAtLWl4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvdG90eXBlc1tpeF0pO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5mb3JFYWNoKCh2YWwsIGl4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpc09iaiwgcHJvcHNbaXhdLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZXNbaXhdLCBwcm9wc1tpeF0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXNPYmouX19wcm90b19fID0gdGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENsYXNzZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9fdGVtcGxhdGVzX18pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0aGlzLl9fdGVtcGxhdGVzX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlc19fW2l4XTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fW2NvbnN0cnVjdG9yTmFtZSh0ZW1wbGF0ZSldID0gdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bY29uc3RydWN0b3JOYW1lKHRlbXBsYXRlKV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVmZXJyZWRUeXBlcyh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9fdGVtcGxhdGVzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlTmFtZTEgaW4gdGhpcy5fX2RpY3Rpb25hcnlfXykge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bdGVtcGxhdGVOYW1lMV07XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VGVtcGxhdGVOYW1lID0gY29uc3RydWN0b3JOYW1lKE9iamVjdC5nZXRQcm90b3R5cGVPZih0ZW1wbGF0ZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fID0gdGhpcy5fX2RpY3Rpb25hcnlfX1twYXJlbnRUZW1wbGF0ZU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fc2hhZG93UGFyZW50X18uX19zaGFkb3dDaGlsZHJlbl9fLnB1c2godGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzdCA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGQgaW4gcHJvcHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fX2V4Y2VwdGlvbnNfXy5tYXAoY3JlYXRlTWVzc2FnZUxpbmUpLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVNZXNzYWdlTGluZShleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBleGNlcHRpb24uZnVuYyhleGNlcHRpb24uY2xhc3MoKSwgZXhjZXB0aW9uLnByb3ApO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEZWZlcnJlZFR5cGVzKHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmaW5lUHJvcGVydHkgPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0ZW1wbGF0ZS5wcm90b3R5cGUuX19kZWZlcnJlZFR5cGVfX1twcm9wXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LnR5cGUgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkub2YgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX19kaWN0aW9uYXJ5X187XG5cbiAgICAgICAgZnVuY3Rpb24gY29uc3RydWN0b3JOYW1lKGNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lZEZ1bmN0aW9uID0gY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvZnVuY3Rpb24gKFteKF0qKS8pO1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVkRnVuY3Rpb24gPyBuYW1lZEZ1bmN0aW9uWzFdIDogbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gY2FjaGUgb3IgZ2xvYmFsbHkgaWRlbnRpZnkgb2JqZWN0c1xuICAgICAqIEFsc28gYXNzaWducyBhIHVuaXF1ZSBpbnRlcm5hbCBJZCBzbyB0aGF0IGNvbXBsZXggc3RydWN0dXJlcyB3aXRoXG4gICAgICogcmVjdXJzaXZlIG9iamVjdHMgY2FuIGJlIHNlcmlhbGl6ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIC0gdGhlIG9iamVjdCB0byBiZSBwYXNzZWQgZHVyaW5nIGNyZWF0aW9uIHRpbWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIC0gdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc3Rhc2hPYmplY3Qob2JqLCB0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIW9iai5fX2lkX18pIHtcbiAgICAgICAgICAgIGlmICghT2JqZWN0VGVtcGxhdGUubmV4dElkKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUubmV4dElkID0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLl9faWRfXyA9ICdsb2NhbC0nICsgdGVtcGxhdGUuX19uYW1lX18gKyAnLScgKyArK09iamVjdFRlbXBsYXRlLm5leHRJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGluamVjdCBvdGhlciBlbGVtZW50c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtfdGVtcGxhdGV9IF90ZW1wbGF0ZSAtIHRoZSBvYmplY3QgdG8gYmUgcGFzc2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqICovXG4gICAgc3RhdGljIF9pbmplY3RJbnRvVGVtcGxhdGUoX3RlbXBsYXRlKSB7IH07XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIGJ5IHRlbXBsYXRlIHNldHVwIHRvIGNyZWF0ZSBhbiBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZvciB1c2UgYnkgdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnR5TmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IGlzIHRoZSBwcm9wZXJ0eSBkZXNjcmlwdG9yIHBhc3NlZCB0byB0aGUgdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iamVjdFByb3BlcnRpZXMgaXMgYWxsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIHByb2Nlc3NlZCBtYW51YWxseS4gIEEgbmV3IHByb3BlcnR5IGlzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQgdG8gdGhpcyBpZiB0aGUgcHJvcGVydHkgbmVlZHMgdG8gYmUgaW5pdGlhbGl6ZWQgYnkgdmFsdWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnRpZXMgaXMgYWxsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIEEgbmV3IHByb3BlcnR5IHdpbGwgYmUgYWRkZWQgdG8gdGhpcyBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9zZXR1cFByb3BlcnR5KHByb3BlcnR5TmFtZSwgZGVmaW5lUHJvcGVydHksIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdmFsdWUgbmVlZHMgdG8gYmUgcmUtaW5pdGlhbGl6ZWQgaW4gY29uc3RydWN0b3JcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgY29uc3QgYnlWYWx1ZSA9IHZhbHVlICYmIHR5cGVvZiAodmFsdWUpICE9PSAnbnVtYmVyJyAmJiB0eXBlb2YgKHZhbHVlKSAhPT0gJ3N0cmluZyc7XG5cbiAgICAgICAgaWYgKGJ5VmFsdWUgfHwgIU9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIHx8IGRlZmluZVByb3BlcnR5LmdldCB8fCBkZWZpbmVQcm9wZXJ0eS5zZXQpIHtcbiAgICAgICAgICAgIG9iamVjdFByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBpbml0OiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBkZWZpbmVQcm9wZXJ0eS50eXBlLFxuICAgICAgICAgICAgICAgIG9mOiBkZWZpbmVQcm9wZXJ0eS5vZixcbiAgICAgICAgICAgICAgICBieVZhbHVlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGVuIGEgc3VwZXIgY2xhc3MgYmFzZWQgb24gb2JqZWN0VGVtcGxhdGUgZG9uJ3QgdHJhbnNwb3J0IHByb3BlcnRpZXNcbiAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydHkudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gZGVmaW5lUHJvcGVydHk7XG5cbiAgICAgICAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnNcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmdldCB8fCBkZWZpbmVQcm9wZXJ0eS5zZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJTZXR0ZXIgPSBkZWZpbmVQcm9wZXJ0eS5zZXQ7XG5cbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnNldCA9IChmdW5jdGlvbiBkKCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBhIGNsb3N1cmUgdG8gcmVjb3JkIHRoZSBwcm9wZXJ0eSBuYW1lIHdoaWNoIGlzIG5vdCBwYXNzZWQgdG8gdGhlIHNldHRlclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBwcm9wZXJ0eU5hbWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gYyh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlclNldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1c2VyU2V0dGVyLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbYF9fJHtwcm9wfWBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgdXNlckdldHRlciA9IGRlZmluZVByb3BlcnR5LmdldDtcblxuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuZ2V0ID0gKGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgY2xvc3VyZSB0byByZWNvcmQgcHJvcGVydHkgbmFtZSB3aGljaCBpcyBub3QgcGFzc2VkIHRvIHRoZSBnZXR0ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gcHJvcGVydHlOYW1lO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGIoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJHZXR0ZXIuY2FsbCh0aGlzLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckdldHRlci5jYWxsKHRoaXMsIHRoaXNbYF9fJHtwcm9wfWBdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2BfXyR7cHJvcH1gXTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgaWYgKCFkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzW2BfXyR7cHJvcGVydHlOYW1lfWBdID0geyBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LndyaXRhYmxlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xvbmUgYW4gb2JqZWN0IGNyZWF0ZWQgZnJvbSBhbiBPYmplY3RUZW1wbGF0ZVxuICAgICAqIFVzZWQgb25seSB3aXRoaW4gc3VwZXJ0eXBlIChzZWUgY29weU9iamVjdCBmb3IgZ2VuZXJhbCBjb3B5KVxuICAgICAqXG4gICAgICogQHBhcmFtIG9iaiBpcyB0aGUgc291cmNlIG9iamVjdFxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdFxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IGEgY29weSBvZiB0aGUgb2JqZWN0XG4gICAgICovXG4gICAgLy8gRnVuY3Rpb24gdG8gY2xvbmUgc2ltcGxlIG9iamVjdHMgdXNpbmcgT2JqZWN0VGVtcGxhdGUgYXMgYSBndWlkZVxuICAgIHN0YXRpYyBjbG9uZShvYmosIHRlbXBsYXRlPykge1xuICAgICAgICBsZXQgY29weTtcblxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai5nZXRUaW1lKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBjb3B5ID0gW107XG5cbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCBvYmoubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgY29weVtpeF0gPSB0aGlzLmNsb25lKG9ialtpeF0sIHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGVtcGxhdGUgJiYgb2JqIGluc3RhbmNlb2YgdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGNvcHkgPSBuZXcgdGVtcGxhdGUoKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wICE9ICdfX2lkX18nICYmICEob2JqW3Byb3BdIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmluZVByb3BlcnR5ID0gdGhpcy5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUpIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlbcHJvcF0gPSB0aGlzLmNsb25lKG9ialtwcm9wXSwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICBjb3B5ID0ge307XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGMgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wYykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29weVtwcm9wY10gPSB0aGlzLmNsb25lKG9ialtwcm9wY10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gYmUgYWJsZSB0byBjcmVhdGUgcmVtb3RlIGZ1bmN0aW9ucyBvclxuICAgICAqIG90aGVyd2lzZSBpbnRlcmNlcHQgZnVuY3Rpb24gY2FsbHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gX3Byb3BlcnR5TmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnR5VmFsdWUgaXMgdGhlIGZ1bmN0aW9uIGl0c2VsZlxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IGEgbmV3IGZ1bmN0aW9uIHRvIGJlIGFzc2lnbmVkIHRvIHRoZSBvYmplY3QgcHJvdG90eXBlXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc2V0dXBGdW5jdGlvbihfcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgIH07XG5cbiAgICAvKipcbiAqIFB1cnBvc2UgdW5rbm93blxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRvciB1bmtub3duXG4gKlxuICogQHJldHVybnMge3Vua25vd259XG4gKi9cbiAgICBzdGF0aWMgY3JlYXRlQ29weShvYmosIGNyZWF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZnJvbVBPSk8ob2JqLCBvYmouX190ZW1wbGF0ZV9fLCBudWxsLCBudWxsLCB1bmRlZmluZWQsIG51bGwsIG51bGwsIGNyZWF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFic3RyYWN0IGZ1bmN0aW9uIGZvciBiZW5lZml0IG9mIFNlbW90dXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY2IgdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyB3aXRob3V0Q2hhbmdlVHJhY2tpbmcoY2IpIHtcbiAgICAgICAgY2IoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcG9qbyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpZE1hcCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpZFF1YWxpZmllciB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnQgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjcmVhdG9yIHVua25vd25cbiAgICAgKlxuICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbVBPSk8gPSBzZXJpYWxpemVyLmZyb21QT0pPO1xuXG4gICAgLyoqXG4gICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAqXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHN0ciB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRRdWFsaWZpZXIgdW5rbm93blxuICAgICogb2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oc3RyLCB0ZW1wbGF0ZSwgaWRRdWFsaWZpZXIpXG4gICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTiA9IHNlcmlhbGl6ZXIuZnJvbUpTT047XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGFuIG9iamVjdCB0byBKU09OLCBzdHJpcHBpbmcgYW55IHJlY3Vyc2l2ZSBvYmplY3QgcmVmZXJlbmNlcyBzbyB0aGV5IGNhbiBiZVxuICAgICAqIHJlY29uc3RpdHV0ZWQgbGF0ZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNiIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuICAgIHN0YXRpYyB0b0pTT05TdHJpbmcgPSBzZXJpYWxpemVyLnRvSlNPTlN0cmluZztcblxuICAgICAgICAgLyoqXG4gICAgIC8qKlxuICAgICAgKiBGaW5kIHRoZSByaWdodCBzdWJjbGFzcyB0byBpbnN0YW50aWF0ZSBieSBlaXRoZXIgbG9va2luZyBhdCB0aGVcbiAgICAgICogZGVjbGFyZWQgbGlzdCBpbiB0aGUgc3ViQ2xhc3NlcyBkZWZpbmUgcHJvcGVydHkgb3Igd2Fsa2luZyB0aHJvdWdoXG4gICAgICAqIHRoZSBzdWJjbGFzc2VzIG9mIHRoZSBkZWNsYXJlZCB0ZW1wbGF0ZVxuICAgICAgKlxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBvYmpJZCB1bmtub3duXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgIHN0YXRpYyBfcmVzb2x2ZVN1YkNsYXNzKHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlTmFtZSA9ICcnO1xuXG4gICAgICAgIGlmIChvYmpJZC5tYXRjaCgvLShbQS1aYS16MC05XzpdKiktLykpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlTmFtZSA9IFJlZ0V4cC4kMTtcbiAgICAgICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0ZW1wbGF0ZSBzdWJjbGFzcyBmb3IgcG9seW1vcnBoaWMgaW5zdGFudGlhdGlvblxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkgJiYgZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3NlcyAmJiBvYmpJZCAhPSAnYW5vbnltb3VzKScpIHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlcy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlTmFtZSA9PSBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzW2l4XS5fX25hbWVfXykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgPSBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzW2l4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gdGhpcy5fZmluZFN1YkNsYXNzKHRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoc3ViQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IHN1YkNsYXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYWxrIHJlY3Vyc2l2ZWx5IHRocm91Z2ggZXh0ZW5zaW9ucyBvZiB0ZW1wbGF0ZSB2aWEgX19jaGlsZHJlbl9fXG4gICAgICogbG9va2luZyBmb3IgYSBuYW1lIG1hdGNoXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlTmFtZSB1bmtub3duXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZSwgdGVtcGxhdGVOYW1lKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5fX25hbWVfXyA9PSB0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0ZW1wbGF0ZS5fX2NoaWxkcmVuX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICBjb25zdCBzdWJDbGFzcyA9IHRoaXMuX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZS5fX2NoaWxkcmVuX19baXhdLCB0ZW1wbGF0ZU5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoc3ViQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViQ2xhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGhpZ2hlc3QgbGV2ZWwgdGVtcGxhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0QmFzZUNsYXNzKHRlbXBsYXRlKSB7XG4gICAgICAgIHdoaWxlICh0ZW1wbGF0ZS5fX3BhcmVudF9fKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgICAgICAvKipcbiAgICAgICogQW4gb3ZlcnJpZGFibGUgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGZyb20gYSB0ZW1wbGF0ZSBhbmQgb3B0aW9uYWxseVxuICAgICAgKiBtYW5hZ2UgdGhlIGNhY2hpbmcgb2YgdGhhdCBvYmplY3QgKHVzZWQgYnkgZGVyaXZhdGl2ZSB0eXBlIHN5c3RlbXMpLiAgSXRcbiAgICAgICogcHJlc2VydmVzIHRoZSBvcmlnaW5hbCBpZCBvZiBhbiBvYmplY3RcbiAgICAgICpcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBvZiBvYmplY3RcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBvYmpJZCBhbmQgaWQgKGlmIHByZXNlbnQpXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgIHN0YXRpYyBfY3JlYXRlRW1wdHlPYmplY3QodGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX3Jlc29sdmVTdWJDbGFzcyh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KTtcblxuICAgICAgICBjb25zdCBvbGRTdGFzaE9iamVjdCA9IHRoaXMuX3N0YXNoT2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmpJZCkge1xuICAgICAgICAgICAgdGhpcy5fc3Rhc2hPYmplY3QgPSBmdW5jdGlvbiBzdGFzaE9iamVjdCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICB0aGlzLl9zdGFzaE9iamVjdCA9IG9sZFN0YXNoT2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmpJZCkge1xuICAgICAgICAgICAgbmV3VmFsdWUuX19pZF9fID0gb2JqSWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9va3MgdXAgYSBwcm9wZXJ0eSBpbiB0aGUgZGVmaW5lUHJvcGVydGllcyBzYXZlZCB3aXRoIHRoZSB0ZW1wbGF0ZSBjYXNjYWRpbmdcbiAgICAgKiB1cCB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGZpbmQgaXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcCBpcyB0aGUgcHJvcGVydHkgYmVpbmcgc291Z2h0XG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm5zIHsqfSB0aGUgXCJkZWZpbmVQcm9wZXJ0eVwiIHN0cnVjdHVyZSBmb3IgdGhlIHByb3BlcnR5XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSAmJiAodGVtcGxhdGUgIT0gT2JqZWN0KSAmJiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzICYmIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRlbXBsYXRlICYmIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUucGFyZW50VGVtcGxhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGhhc2ggb2YgYWxsIHByb3BlcnRpZXMgaW5jbHVkaW5nIHRob3NlIGluaGVyaXRlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcmV0dXJuVmFsdWUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaW5jbHVkZVZpcnR1YWwgdW5rbm93blxuICAgICAqIEByZXR1cm5zIHsqfSBhbiBhc3NvY2lhdGl2ZSBhcnJheSBvZiBlYWNoIFwiZGVmaW5lUHJvcGVydHlcIiBzdHJ1Y3R1cmUgZm9yIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCByZXR1cm5WYWx1ZSwgaW5jbHVkZVZpcnR1YWwpIHtcbiAgICAgICAgaWYgKCFyZXR1cm5WYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlVmlydHVhbCB8fCAhdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWVbcHJvcF0gPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSwgcmV0dXJuVmFsdWUsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEdlbmVyYWwgZnVuY3Rpb24gdG8gY3JlYXRlIHRlbXBsYXRlcyB1c2VkIGJ5IGNyZWF0ZSwgZXh0ZW5kIGFuZCBtaXhpblxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBtaXhpblRlbXBsYXRlIC0gdGVtcGxhdGUgdXNlZCBmb3IgYSBtaXhpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50VGVtcGxhdGUgLSB0ZW1wbGF0ZSB1c2VkIGZvciBhbiBleHRlbmRcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXNPclRlbXBsYXRlIC0gcHJvcGVydGllcyB0byBiZSBhZGRlZC9teGllZCBpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRlUHJvcGVydGllcyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZU5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgYXMgaXQgd2lsbCBiZSBzdG9yZWQgcmV0cmlldmVkIGZyb20gZGljdGlvbmFyeVxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfY3JlYXRlVGVtcGxhdGUobWl4aW5UZW1wbGF0ZT8sIHBhcmVudFRlbXBsYXRlPywgcHJvcGVydGllc09yVGVtcGxhdGU/LCBjcmVhdGVQcm9wZXJ0aWVzPywgdGVtcGxhdGVOYW1lPywgY3JlYXRlVGVtcGxhdGVOb3c/KSB7XG4gICAgICAgIC8vIFdlIHdpbGwgcmV0dXJuIGEgY29uc3RydWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBpbiBhIG5ldyBmdW5jdGlvblxuICAgICAgICAvLyB0aGF0IHdpbGwgY2FsbCBhbiBpbml0KCkgZnVuY3Rpb24gZm91bmQgaW4gcHJvcGVydGllcywgZGVmaW5lIHByb3BlcnRpZXMgdXNpbmcgT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgICAgICAgLy8gYW5kIG1ha2UgY29waWVzIG9mIHRob3NlIHRoYXQgYXJlIHJlYWxseSBvYmplY3RzXG4gICAgICAgIHZhciBmdW5jdGlvblByb3BlcnRpZXM6YW55ID0ge307ICAgIC8vIFdpbGwgYmUgcG9wdWxhdGVkIHdpdGggaW5pdCBmdW5jdGlvbiBmcm9tIHByb3BlcnRpZXNcbiAgICAgICAgdmFyIG9iamVjdFByb3BlcnRpZXMgPSB7fTsgICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIGJlIHByb2Nlc3NlZCBieSBoYW5kXG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0aWVzID0ge307ICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBzZW50IHRvIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKClcbiAgICAgICAgdmFyIG9iamVjdFRlbXBsYXRlID0gdGhpcztcbiAgICAgICAgdmFyIHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIGZ1bmN0aW9uIEYoKSB7IH0gICAgIC8vIFVzZWQgaW4gY2FzZSBvZiBleHRlbmRcblxuICAgICAgICBpZiAoIXRoaXMubGF6eVRlbXBsYXRlTG9hZCkge1xuICAgICAgICAgICAgY3JlYXRlVGVtcGxhdGVOb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNldHVwIHZhcmlhYmxlcyBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgY2FsbCAoY3JlYXRlLCBleHRlbmQsIG1peGluKVxuICAgICAgICBpZiAoY3JlYXRlVGVtcGxhdGVOb3cpIHtcbiAgICAgICAgICAgIGlmIChtaXhpblRlbXBsYXRlKSB7ICAgICAgICAvLyBNaXhpblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQobWl4aW5UZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNPclRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChwcm9wZXJ0aWVzT3JUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdID0gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BwIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllc1twcm9wcF0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzW3Byb3BwXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BvIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BvID09ICdpbml0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgPSBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0Lmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0LnB1c2gocHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXRbaXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllc1twcm9wb10gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXNbcHJvcG9dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG4gaW4gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcERlc2MgPSA8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4sIHByb3BEZXNjKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYy5nZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4pKS5nZXQuc291cmNlVGVtcGxhdGUgPSBwcm9wRGVzYy5nZXQuc291cmNlVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGVbcHJvcG5dID0gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlW3Byb3BuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvcHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyhtaXhpblRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BtIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3BzW3Byb3BtXSA9IHByb3BzW3Byb3BtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaXhpblRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25Qcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFRlbXBsYXRlID0gbWl4aW5UZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgICAgICAgIC8vIEV4dGVuZFxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQocGFyZW50VGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIEYucHJvdG90eXBlID0gcGFyZW50VGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbmV3IEYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0b3IgdGhhdCB3aWxsIGJlIHJldHVybmVkIHdpbGwgb25seSBldmVyIGJlIGNyZWF0ZWQgb25jZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHRlbXBsYXRlOiBDb25zdHJ1Y3RvclR5cGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW3RlbXBsYXRlTmFtZV0gfHxcbiAgICAgICAgICAgIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSlcblxuXG4gICAgICAgIHRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUgPSB0cnVlO1xuXG4gICAgICAgIHRlbXBsYXRlLmV4dGVuZCA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLmV4dGVuZC5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUubWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5taXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUuc3RhdGljTWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5zdGF0aWNNaXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcblxuICAgICAgICB0ZW1wbGF0ZS5mcm9tUE9KTyA9IChwb2pvKSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGVtcGxhdGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRlbXBsYXRlLmZyb21KU09OID0gKHN0ciwgaWRQcmVmaXgpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFByZWZpeCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVtcGxhdGUuZ2V0UHJvcGVydGllcyA9IChpbmNsdWRlVmlydHVhbCkgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWNyZWF0ZVRlbXBsYXRlTm93KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fIHx8IFtdO1xuICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18ucHVzaChbbWl4aW5UZW1wbGF0ZSwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzLCB0ZW1wbGF0ZU5hbWVdKTtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlLnByb3RvdHlwZSA9IHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIHZhciBjcmVhdGVQcm9wZXJ0eSA9IGNyZWF0ZVByb3BlcnR5RnVuYy5iaW5kKG51bGwsIGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlKTtcblxuXG4gICAgICAgIC8vIFdhbGsgdGhyb3VnaCBwcm9wZXJ0aWVzIGFuZCBjb25zdHJ1Y3QgdGhlIGRlZmluZVByb3BlcnRpZXMgaGFzaCBvZiBwcm9wZXJ0aWVzLCB0aGUgbGlzdCBvZlxuICAgICAgICAvLyBvYmplY3RQcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0byBiZSByZWluc3RhbnRpYXRlZCBhbmQgYXR0YWNoIGZ1bmN0aW9ucyB0byB0aGUgcHJvdG90eXBlXG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlUHJvcGVydHkocHJvcGVydHlOYW1lLCBudWxsLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzID0gZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgdGVtcGxhdGUub2JqZWN0UHJvcGVydGllcyA9IG9iamVjdFByb3BlcnRpZXM7XG5cbiAgICAgICAgdGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzID0gZnVuY3Rpb25Qcm9wZXJ0aWVzO1xuICAgICAgICB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSA9IHBhcmVudFRlbXBsYXRlO1xuXG5cbiAgICAgICAgdGVtcGxhdGUuY3JlYXRlUHJvcGVydHkgPSBjcmVhdGVQcm9wZXJ0eTtcblxuICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuXG4gICAgICAgIHZhciBwcm9wc3QgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgICBmb3IgKHZhciBwcm9wZCBpbiBwcm9wc3QpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0byBjbG9uZSB0aGUgVHlwZSBTeXN0ZW1cbiAgICAgKiBAcmV0dXJucyB7b31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfY3JlYXRlT2JqZWN0KCk6IE9iamVjdFRlbXBsYXRlQ2xvbmUge1xuICAgICAgICBjb25zdCBuZXdGb28gPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xuICAgICAgICBuZXdGb28uaW5pdCgpO1xuICAgICAgICByZXR1cm4gbmV3Rm9vO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IG9yaWdpbmFsbHkgdG9vayBhIGNvbnRleHQgdGhhdCBpdCB0aHJldyBhd2F5XG4gICAgKiBAcmV0dXJucyB7U3VwZXJ0eXBlTG9nZ2VyfVxuICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUxvZ2dlcigpOiBTdXBlcnR5cGVMb2dnZXIge1xuICAgICAgICByZXR1cm4gbmV3IFN1cGVydHlwZUxvZ2dlcigpO1xuICAgIH1cblxuXG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUHJvcGVydHlGdW5jKGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLFxuICAgIHByb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSwgcHJvcGVydGllcywgY3JlYXRlUHJvcGVydGllcykge1xuICAgIGlmICghcHJvcGVydGllcykge1xuICAgICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoZSBpbml0aWFsaXphdGlvbiBmdW5jdGlvblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgPT0gJ2luaXQnICYmIHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmdW5jdGlvblByb3BlcnRpZXMuaW5pdCA9IFtwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IG51bGw7IC8vIGRlZmluZVByb3BlcnR5IHRvIGJlIGFkZGVkIHRvIGRlZmluZVByb3BlcnRpZXNcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHByb3BlcnR5IHZhbHVlIHdoaWNoIG1heSBiZSBhIGRlZmluZVByb3BlcnRpZXMgc3RydWN0dXJlIG9yIGp1c3QgYW4gaW5pdGlhbCB2YWx1ZVxuICAgICAgICB2YXIgZGVzY3JpcHRvcjphbnkgPSB7fTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllcywgcHJvcGVydHlOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0eXBlID0gJ251bGwnO1xuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLmdldCB8fCBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgICAgICAgdHlwZSA9ICdnZXRzZXQnO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgLy8gRmlndXJlIG91dCB3aGV0aGVyIHRoaXMgaXMgYSBkZWZpbmVQcm9wZXJ0eSBzdHJ1Y3R1cmUgKGhhcyBhIGNvbnN0cnVjdG9yIG9mIG9iamVjdClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IC8vIE9yIGFycmF5XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIHJlbW90ZSBmdW5jdGlvbiBjYWxsc1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSAmJiB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdID0gb2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcGVydHlOYW1lLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9uLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS50eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zYXJyYXlfXyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fb25fXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vbjtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3ZhbGlkYXRlX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19ib2R5X18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLndyaXRhYmxlID0gdHJ1ZTsgLy8gV2UgYXJlIHVzaW5nIHNldHRlcnNcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIE90aGVyIGNyYXBcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdnZXRzZXQnOiAvLyBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGVtcGxhdGVQcm90b3R5cGUsIHByb3BlcnR5TmFtZSwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0ZW1wbGF0ZVByb3RvdHlwZSwgcHJvcGVydHlOYW1lKSkuZ2V0LnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBkZWZpbmVQcm9wZXJ0eSB0byBiZSBhZGRlZFxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci50b0NsaWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b0NsaWVudCA9IGRlc2NyaXB0b3IudG9DbGllbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudG9TZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBkZXNjcmlwdG9yLnRvU2VydmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fc2V0dXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSkge1xuXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUoKSB7XG4gICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlLCB0aGlzKTtcbiAgICAgICAgbGV0IHRlbXBsYXRlUmVmOiBDb25zdHJ1Y3RvclR5cGUgPSA8Q29uc3RydWN0b3JUeXBlPjxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlVXNhZ2VfX1t0ZW1wbGF0ZVJlZi5fX25hbWVfX10gPSB0cnVlO1xuICAgICAgICB2YXIgcGFyZW50ID0gdGVtcGxhdGVSZWYuX19wYXJlbnRfXztcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZVVzYWdlX19bcGFyZW50Ll9fbmFtZV9fXSA9IHRydWU7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRlbXBsYXRlUmVmO1xuXG4gICAgICAgIGlmIChvYmplY3RUZW1wbGF0ZS5fX3RyYW5zaWVudF9fKSB7XG4gICAgICAgICAgICB0aGlzLl9fdHJhbnNpZW50X18gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBydW5lZE9iamVjdFByb3BlcnRpZXMgPSBwcnVuZUV4aXN0aW5nKHRoaXMsIHRlbXBsYXRlUmVmLm9iamVjdFByb3BlcnRpZXMpO1xuICAgICAgICB2YXIgcHJ1bmVkRGVmaW5lUHJvcGVydGllcyA9IHBydW5lRXhpc3RpbmcodGhpcywgdGVtcGxhdGVSZWYuZGVmaW5lUHJvcGVydGllcyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBwcm9wZXJ0aWVzIGVpdGhlciB3aXRoIEVNQ0EgNSBkZWZpbmVQcm9wZXJ0aWVzIG9yIGJ5IGhhbmRcbiAgICAgICAgICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHBydW5lZERlZmluZVByb3BlcnRpZXMpOyAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGFkZGVkIHByZS1FTUNBIDVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mcm9tUmVtb3RlID0gdGhpcy5mcm9tUmVtb3RlIHx8IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZVJlZik7XG5cbiAgICAgICAgdGhpcy5jb3B5UHJvcGVydGllcyA9IGZ1bmN0aW9uIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICB0aGlzW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgcHJvcGVydGllcyBmcm9tIHRoZSBkZWZpbmVQcm9wZXJ0aWVzIHZhbHVlIHByb3BlcnR5XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LmluaXQpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5ieVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IE9iamVjdFRlbXBsYXRlLmNsb25lKGRlZmluZVByb3BlcnR5LmluaXQsIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gKGRlZmluZVByb3BlcnR5LmluaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgdGVtcGxhdGVSZWYuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVJlZi5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fW2pdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fcHJvcF9fID0gZnVuY3Rpb24gZyhwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRoaXMuX190ZW1wbGF0ZV9fKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9fdmFsdWVzX18gPSBmdW5jdGlvbiBmKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkudmFsdWVzKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9fZGVzY3JpcHRpb25zX18gPSBmdW5jdGlvbiBlKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGFuIGluaXQgZnVuY3Rpb24gb3IgYXJlIGEgcmVtb3RlIGNyZWF0aW9uIGNhbGwgcGFyZW50IGNvbnN0cnVjdG9yIG90aGVyd2lzZSBjYWxsIGluaXRcbiAgICAgICAgLy8gIGZ1bmN0aW9uIHdobyB3aWxsIGJlIHJlc3BvbnNpYmxlIGZvciBjYWxsaW5nIHBhcmVudCBjb25zdHJ1Y3RvciB0byBhbGxvdyBmb3IgcGFyYW1ldGVyIHBhc3NpbmcuXG4gICAgICAgIGlmICh0aGlzLmZyb21SZW1vdGUgfHwgIXRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IG9iamVjdFRlbXBsYXRlLm5vSW5pdCkge1xuICAgICAgICAgICAgaWYgKHBhcmVudFRlbXBsYXRlICYmIHBhcmVudFRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRUZW1wbGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdFtpXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZV9fID0gdGVtcGxhdGVSZWY7XG5cbiAgICAgICAgdGhpcy50b0pTT05TdHJpbmcgPSBmdW5jdGlvbiB0b0pTT05TdHJpbmcoY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS50b0pTT05TdHJpbmcodGhpcywgY2IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qIENsb25lIGFuZCBvYmplY3QgY2FsbGluZyBhIGNhbGxiYWNrIGZvciBlYWNoIHJlZmVyZW5jZWQgb2JqZWN0LlxuICAgICAgICAgVGhlIGNhbGwgYmFjayBpcyBwYXNzZWQgKG9iaiwgcHJvcCwgdGVtcGxhdGUpXG4gICAgICAgICBvYmogLSB0aGUgcGFyZW50IG9iamVjdCAoZXhjZXB0IHRoZSBoaWdoZXN0IGxldmVsKVxuICAgICAgICAgcHJvcCAtIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgdGVtcGxhdGUgLSB0aGUgdGVtcGxhdGUgb2YgdGhlIG9iamVjdCB0byBiZSBjcmVhdGVkXG4gICAgICAgICB0aGUgZnVuY3Rpb24gcmV0dXJuczpcbiAgICAgICAgIC0gZmFsc3kgLSBjbG9uZSBvYmplY3QgYXMgdXN1YWwgd2l0aCBhIG5ldyBpZFxuICAgICAgICAgLSBvYmplY3QgcmVmZXJlbmNlIC0gdGhlIGNhbGxiYWNrIGNyZWF0ZWQgdGhlIG9iamVjdCAocHJlc3VtYWJseSB0byBiZSBhYmxlIHRvIHBhc3MgaW5pdCBwYXJhbWV0ZXJzKVxuICAgICAgICAgLSBbb2JqZWN0XSAtIGEgb25lIGVsZW1lbnQgYXJyYXkgb2YgdGhlIG9iamVjdCBtZWFucyBkb24ndCBjb3B5IHRoZSBwcm9wZXJ0aWVzIG9yIHRyYXZlcnNlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNyZWF0ZUNvcHkgPSBmdW5jdGlvbiBjcmVhdGVDb3B5KGNyZWF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5jcmVhdGVDb3B5KHRoaXMsIGNyZWF0b3IpO1xuICAgICAgICB9O1xuXG4gICAgfTtcblxuXG4gICAgbGV0IHJldHVyblZhbCA9IDxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgIHJldHVybiByZXR1cm5WYWwgYXMgQ29uc3RydWN0b3JUeXBlO1xufVxuIl19