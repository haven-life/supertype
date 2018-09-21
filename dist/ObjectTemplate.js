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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMkM7QUFDM0MscURBQW9EO0FBK0NwRDs7Ozs7Ozs7R0FRRztBQUNILHFCQUFxQixJQUFJLEVBQUUsT0FBTztJQUM5QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7SUFFZixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7UUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDbkM7U0FDSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDakMsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUVaLElBQUksT0FBTyxFQUFFO1lBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUk7Z0JBQ3ZCLDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDTixrQ0FBa0M7b0JBQ2xDLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO2lCQUN0QjtZQUNMLENBQUMsQ0FBQyxDQUFDO1NBQ047S0FDSjtTQUNJLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSTtZQUN4QixHQUFHLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7S0FDTjtTQUNJO1FBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQztLQUNkO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsdUJBQXVCLEdBQUcsRUFBRSxLQUFLO0lBQzdCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUVsQixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtRQUNwQixJQUFJ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UUFBUSxDQUFDO0lBRW5DLE9BQU8sU0FBNEIsQ0FBQztBQUN4QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc2VyaWFsaXplciBmcm9tICcuL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHsgU3VwZXJ0eXBlTG9nZ2VyIH0gZnJvbSAnLi9TdXBlcnR5cGVMb2dnZXInO1xuZXhwb3J0IHR5cGUgQ3JlYXRlVHlwZUZvck5hbWUgPSB7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICB0b0NsaWVudD86IGJvb2xlYW47XG4gICAgdG9TZXJ2ZXI/OiBib29sZWFuO1xuICAgIGlzTG9jYWw/OiBib29sZWFuO1xufVxuXG5leHBvcnQgdHlwZSBHZXR0ZXIgPSB7XG4gICAgZ2V0OiBhbnk7XG59XG5cbi8qKlxuICogdGhpcyBpcyBwcmV0dHkgbXVjaCB0aGUgY2xhc3MgKHRoZSB0ZW1wbGF0ZSBpdHNlbGYpXG4gKiBUcnkgdG8gdW5pZnkgdGhpcyB3aXRoIHRoZSBTdXBlcnR5cGUgVHlwZSAobWF5YmUgbWFrZSB0aGlzIGEgcGFydGlhbCwgaGF2ZSBzdXBlcnR5cGUgZXh0ZW5kIHRoaXMpXG4gKi9cbmV4cG9ydCB0eXBlIENvbnN0cnVjdG9yVHlwZUJhc2UgPSBGdW5jdGlvbiAmIHtcbiAgICBhbW9ycGhpY0NsYXNzTmFtZTogYW55O1xuICAgIF9fc2hhZG93UGFyZW50X186IGFueTtcbiAgICBwcm9wcz86IGFueTtcbiAgICBfX3BhcmVudF9fOiBhbnk7XG4gICAgX19uYW1lX186IGFueTtcbiAgICBfX2NyZWF0ZVBhcmFtZXRlcnNfXzogYW55O1xuICAgIGZ1bmN0aW9uUHJvcGVydGllczogYW55O1xuICAgIGlzT2JqZWN0VGVtcGxhdGU6IGFueTtcbiAgICBleHRlbmQ6IGFueTtcbiAgICBzdGF0aWNNaXhpbjogYW55O1xuICAgIG1peGluOiBhbnk7XG4gICAgZnJvbVBPSk86IGFueTtcbiAgICBmcm9tSlNPTjogYW55O1xuICAgIGdldFByb3BlcnRpZXM6IChpbmNsdWRlVmlydHVhbCkgPT4gYW55O1xuICAgIHByb3RvdHlwZTogYW55O1xuICAgIGRlZmluZVByb3BlcnRpZXM6IGFueTtcbiAgICBvYmplY3RQcm9wZXJ0aWVzOiBhbnk7XG4gICAgcGFyZW50VGVtcGxhdGU6IGFueTtcbiAgICBjcmVhdGVQcm9wZXJ0eTogYW55O1xuICAgIF9fdGVtcGxhdGVfXzogYW55O1xuICAgIF9faW5qZWN0aW9uc19fOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc3RydWN0b3JUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3JUeXBlQmFzZSB7XG4gICAgbmV3KCk7XG59XG5cbmV4cG9ydCB0eXBlIE9iamVjdFRlbXBsYXRlQ2xvbmUgPSB0eXBlb2YgT2JqZWN0VGVtcGxhdGU7XG5cblxuLyoqXG4gKiBBbGxvdyB0aGUgcHJvcGVydHkgdG8gYmUgZWl0aGVyIGEgYm9vbGVhbiBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGJvb2xlYW4gb3IgYSBzdHJpbmdcbiAqIG1hdGNoZWQgYWdhaW5zdCBhIHJ1bGUgc2V0IGFycmF5IG9mIHN0cmluZyBpbiBPYmplY3RUZW1wbGF0ZVxuICpcbiAqIEBwYXJhbSAgcHJvcCB1bmtub3duXG4gKiBAcGFyYW0gcnVsZVNldCB1bmtub3duXG4gKlxuICogQHJldHVybnMge2Z1bmN0aW9uKHRoaXM6T2JqZWN0VGVtcGxhdGUpfVxuICovXG5mdW5jdGlvbiBwcm9jZXNzUHJvcChwcm9wLCBydWxlU2V0KSB7XG4gICAgdmFyIHJldCA9IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIChwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXQgPSBwcm9wLmNhbGwoT2JqZWN0VGVtcGxhdGUpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgKHByb3ApID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXQgPSBmYWxzZTtcblxuICAgICAgICBpZiAocnVsZVNldCkge1xuICAgICAgICAgICAgcnVsZVNldC5tYXAoZnVuY3Rpb24gaShydWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIGFsd2F5cyBleGVjdXRlXG4gICAgICAgICAgICAgICAgaWYgKCFyZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG91YmxlIGVxdWFscyBvciBzaW5nbGUgZXF1YWxzP1xuICAgICAgICAgICAgICAgICAgICByZXQgPSBydWxlID09IHByb3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAocHJvcCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHByb3AuZm9yRWFjaChmdW5jdGlvbiBoKHByb3ApIHtcbiAgICAgICAgICAgIHJldCA9IHJldCB8fCBwcm9jZXNzUHJvcChwcm9wLCBydWxlU2V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXQgPSBwcm9wO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIHBydW5lRXhpc3Rpbmcob2JqLCBwcm9wcykge1xuICAgIHZhciBuZXdQcm9wcyA9IHt9O1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wcykge1xuICAgICAgICBpZiAodHlwZW9mKG9ialtwcm9wXSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBuZXdQcm9wc1twcm9wXSA9IHByb3BzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld1Byb3BzO1xufVxuXG4vKipcbiAqIHRoZSBvZyBPYmplY3RUZW1wbGF0ZSwgd2hhdCBldmVyeXRoaW5nIHBpY2tzIG9mZiBvZlxuICovXG5leHBvcnQgY2xhc3MgT2JqZWN0VGVtcGxhdGUge1xuXG4gICAgc3RhdGljIGxhenlUZW1wbGF0ZUxvYWQ6IGFueTtcbiAgICBzdGF0aWMgaXNMb2NhbFJ1bGVTZXQ6IGFueTtcbiAgICBzdGF0aWMgbmV4dElkOiBhbnk7IC8vIGZvciBzdGFzaE9iamVjdFxuICAgIHN0YXRpYyBfX2V4Y2VwdGlvbnNfXzogYW55O1xuXG4gICAgc3RhdGljIF9fdGVtcGxhdGVzX186IENvbnN0cnVjdG9yVHlwZVtdO1xuICAgIHN0YXRpYyB0b1NlcnZlclJ1bGVTZXQ6IHN0cmluZ1tdO1xuICAgIHN0YXRpYyB0b0NsaWVudFJ1bGVTZXQ6IHN0cmluZ1tdO1xuXG4gICAgc3RhdGljIHRlbXBsYXRlSW50ZXJjZXB0b3I6IGFueTtcbiAgICBzdGF0aWMgX19kaWN0aW9uYXJ5X186IHsgW2tleTogc3RyaW5nXTogQ29uc3RydWN0b3JUeXBlIH07XG4gICAgc3RhdGljIF9fYW5vbnltb3VzSWRfXzogbnVtYmVyO1xuICAgIHN0YXRpYyBfX3RlbXBsYXRlc1RvSW5qZWN0X186IHt9O1xuICAgIHN0YXRpYyBsb2dnZXI6IGFueTtcbiAgICBsb2dnZXI6IFN1cGVydHlwZUxvZ2dlcjtcbiAgICBzdGF0aWMgX190ZW1wbGF0ZVVzYWdlX186IGFueTtcbiAgICBzdGF0aWMgX19pbmplY3Rpb25zX186IEZ1bmN0aW9uW107XG4gICAgc3RhdGljIF9fdG9DbGllbnRfXzogYm9vbGVhbjtcblxuICAgIHN0YXRpYyBhbW9ycGhpY1N0YXRpYyA9IE9iamVjdFRlbXBsYXRlO1xuICAgIC8qKlxuICAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyBwZXJmb3JtSW5qZWN0aW9ucygpIHtcbiAgICAgICAgdGhpcy5nZXRDbGFzc2VzKCk7XG4gICAgICAgIGlmICh0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfXykge1xuICAgICAgICAgICAgY29uc3Qgb2JqZWN0VGVtcGxhdGUgPSB0aGlzO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlTmFtZSBpbiB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfXykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bdGVtcGxhdGVOYW1lXTtcblxuICAgICAgICAgICAgICAgIHRlbXBsYXRlLmluamVjdCA9IGZ1bmN0aW9uIGluamVjdChpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5pbmplY3QodGhpcywgaW5qZWN0b3IpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9pbmplY3RJbnRvVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGluaXQoKSB7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZVVzYWdlX18gPSB7fTtcbiAgICAgICAgdGhpcy5fX2luamVjdGlvbnNfXyA9IFtdO1xuICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fID0ge307XG4gICAgICAgIHRoaXMuX19hbm9ueW1vdXNJZF9fID0gMTtcbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18gPSB7fTtcbiAgICAgICAgdGhpcy5sb2dnZXIgPSB0aGlzLmNyZWF0ZUxvZ2dlcigpOyAvLyBDcmVhdGUgYSBkZWZhdWx0IGxvZ2dlclxuICAgIH1cblxuICAgIHN0YXRpYyBnZXRUZW1wbGF0ZUJ5TmFtZShuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENsYXNzZXMoKVtuYW1lXTtcbiAgICB9XG5cbiAgICAvKipcbiAqIFB1cnBvc2UgdW5rbm93blxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBuYW1lIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcHMgdW5rbm93blxuICovXG4gICAgc3RhdGljIHNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgcHJvcHMpIHtcbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bbmFtZV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfX1tuYW1lXSA9IHRlbXBsYXRlO1xuICAgICAgICB0ZW1wbGF0ZS5fX25hbWVfXyA9IG5hbWU7XG4gICAgICAgIHRlbXBsYXRlLl9faW5qZWN0aW9uc19fID0gW107XG4gICAgICAgIHRlbXBsYXRlLl9fb2JqZWN0VGVtcGxhdGVfXyA9IHRoaXM7XG4gICAgICAgIHRlbXBsYXRlLl9fY2hpbGRyZW5fXyA9IFtdO1xuICAgICAgICB0ZW1wbGF0ZS5fX3RvQ2xpZW50X18gPSBwcm9wcy5fX3RvQ2xpZW50X187XG4gICAgICAgIHRlbXBsYXRlLl9fdG9TZXJ2ZXJfXyA9IHByb3BzLl9fdG9TZXJ2ZXJfXztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcHMgdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICovXG4gICAgc3RhdGljIGdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcykge1xuICAgICAgICBsZXQgdGVtcGxhdGVQcm9wZXJ0aWVzOiB7IF9fdG9DbGllbnRfXz86IGFueTsgX190b1NlcnZlcl9fPzogYW55IH0gPSB7fTtcblxuICAgICAgICBpZiAoT2JqZWN0VGVtcGxhdGUuX190b0NsaWVudF9fID09IGZhbHNlKSB7XG4gICAgICAgICAgICBwcm9wcy50b0NsaWVudCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2Nlc3NQcm9wKHByb3BzLmlzTG9jYWwsIHRoaXMuaXNMb2NhbFJ1bGVTZXQpKSB7XG4gICAgICAgICAgICBwcm9wcy50b1NlcnZlciA9IGZhbHNlO1xuICAgICAgICAgICAgcHJvcHMudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlUHJvcGVydGllcy5fX3RvQ2xpZW50X18gPSBwcm9jZXNzUHJvcChwcm9wcy50b0NsaWVudCwgdGhpcy50b0NsaWVudFJ1bGVTZXQpICE9IGZhbHNlO1xuICAgICAgICB0ZW1wbGF0ZVByb3BlcnRpZXMuX190b1NlcnZlcl9fID0gcHJvY2Vzc1Byb3AocHJvcHMudG9TZXJ2ZXIsIHRoaXMudG9TZXJ2ZXJSdWxlU2V0KSAhPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGVQcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAgICAqIENyZWF0ZSBhbiBvYmplY3QgdGVtcGxhdGUgdGhhdCBpcyBpbnN0YW50aWF0ZWQgd2l0aCB0aGUgbmV3IG9wZXJhdG9yLlxuICAgICAgICAqIHByb3BlcnRpZXMgaXNcbiAgICAgICAgKlxuICAgICAgICAqIEBwYXJhbSB7dW5rbm93bn0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgb3IgYW4gb2JqZWN0IHdpdGhcbiAgICAgICAgKiAgICAgICAgbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBjbGFzc1xuICAgICAgICAqICAgICAgICB0b0NsaWVudCAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBjbGllbnQgKHdpdGggc2Vtb3R1cylcbiAgICAgICAgKiAgICAgICAgdG9TZXJ2ZXIgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgc2VydmVyICh3aXRoIHNlbW90dXMpXG4gICAgICAgICogICAgICAgIGlzTG9jYWwgLSBlcXVpdmFsZW50IHRvIHNldHRpbmcgdG9DbGllbnQgJiYgdG9TZXJ2ZXIgdG8gZmFsc2VcbiAgICAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXMgYW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgcmVwcmVzZW50IGRhdGEgYW5kIGZ1bmN0aW9uXG4gICAgICAgICogcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0LiAgVGhlIGRhdGEgcHJvcGVydGllcyBtYXkgdXNlIHRoZSBkZWZpbmVQcm9wZXJ0eVxuICAgICAgICAqIGZvcm1hdCBmb3IgcHJvcGVydGllcyBvciBtYXkgYmUgcHJvcGVydGllcyBhc3NpZ25lZCBhIE51bWJlciwgU3RyaW5nIG9yIERhdGUuXG4gICAgICAgICpcbiAgICAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIG9iamVjdCB0ZW1wbGF0ZVxuICAgICAgICAqL1xuXG4gICAgc3RhdGljIGNyZWF0ZShuYW1lOiBzdHJpbmcgfCBDcmVhdGVUeXBlRm9yTmFtZSwgcHJvcGVydGllcykge1xuICAgICAgICAvKiogdGhpcyBibG9jayBvbmx5IGV4ZWN1dGVzIG9uIGNyZWF0ZXR5cGVmb3JuYW1lICovXG4gICAgICAgIGlmIChuYW1lICYmICEodHlwZW9mIChuYW1lKSA9PT0gJ3N0cmluZycpICYmIG5hbWUubmFtZSkge1xuICAgICAgICAgICAgdmFyIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSBwcm9wcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyB8fCBuYW1lLm1hdGNoKC9bXkEtWmEtejAtOV9dLykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW5jb3JyZWN0IHRlbXBsYXRlIG5hbWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHByb3BlcnRpZXMpICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHRlbXBsYXRlIHByb3BlcnR5IGRlZmluaXRpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjcmVhdGVQcm9wcyA9IHRoaXMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzKTtcblxuICAgICAgICBpZiAodHlwZW9mICh0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IoJ2NyZWF0ZScsIG5hbWUsIHByb3BlcnRpZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRlbXBsYXRlO1xuXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2NyZWF0ZVRlbXBsYXRlKG51bGwsIE9iamVjdCwgcHJvcGVydGllcywgY3JlYXRlUHJvcHMsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBPYmplY3QsIG5hbWUsIGNyZWF0ZVByb3BzLCBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBjcmVhdGVQcm9wcyk7XG4gICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUHJvcHNfXyA9IHByb3BzO1xuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEV4dGVuZCBhbmQgZXhpc3RpbmcgKHBhcmVudCB0ZW1wbGF0ZSlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50VGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgb3IgYW4gb2JqZWN0IHdpdGhcbiAgICAgKiAgICAgICAgbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBjbGFzc1xuICAgICAqICAgICAgICB0b0NsaWVudCAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBjbGllbnQgKHdpdGggc2Vtb3R1cylcbiAgICAgKiAgICAgICAgdG9TZXJ2ZXIgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgc2VydmVyICh3aXRoIHNlbW90dXMpXG4gICAgICogICAgICAgIGlzTG9jYWwgLSBlcXVpdmFsZW50IHRvIHNldHRpbmcgdG9DbGllbnQgJiYgdG9TZXJ2ZXIgdG8gZmFsc2VcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXMgYXJlIHRoZSBzYW1lIGFzIGZvciBjcmVhdGVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfSB0aGUgb2JqZWN0IHRlbXBsYXRlXG4gICAgICovXG4gICAgc3RhdGljIGV4dGVuZChwYXJlbnRUZW1wbGF0ZSwgbmFtZTogc3RyaW5nIHwgQ3JlYXRlVHlwZUZvck5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgbGV0IHByb3BzO1xuICAgICAgICBsZXQgY3JlYXRlUHJvcHM7XG5cbiAgICAgICAgaWYgKCFwYXJlbnRUZW1wbGF0ZS5fX29iamVjdFRlbXBsYXRlX18pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW5jb3JyZWN0IHBhcmVudCB0ZW1wbGF0ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAobmFtZSkgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiAobmFtZSkgIT09ICdzdHJpbmcnICYmIG5hbWUubmFtZSkge1xuICAgICAgICAgICAgcHJvcHMgPSBuYW1lO1xuICAgICAgICAgICAgbmFtZSA9IHByb3BzLm5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcm9wcyA9IHBhcmVudFRlbXBsYXRlLl9fY3JlYXRlUHJvcHNfXztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyB8fCBuYW1lLm1hdGNoKC9bXkEtWmEtejAtOV9dLykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW5jb3JyZWN0IHRlbXBsYXRlIG5hbWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHByb3BlcnRpZXMpICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHRlbXBsYXRlIHByb3BlcnR5IGRlZmluaXRpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleGlzdGluZ1RlbXBsYXRlID0gdGhpcy5fX2RpY3Rpb25hcnlfX1tuYW1lXTtcblxuICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZSkge1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUuX19wYXJlbnRfXyAhPSBwYXJlbnRUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18uX19uYW1lX18gIT0gcGFyZW50VGVtcGxhdGUuX19uYW1lX18pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk46IEF0dGVtcHQgdG8gZXh0ZW5kICR7cGFyZW50VGVtcGxhdGUuX19uYW1lX199IGFzICR7bmFtZX0gYnV0ICR7bmFtZX0gd2FzIGFscmVhZHkgZXh0ZW5kZWQgZnJvbSAke2V4aXN0aW5nVGVtcGxhdGUuX19wYXJlbnRfXy5fX25hbWVfX31gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1peGluKGV4aXN0aW5nVGVtcGxhdGUsIHByb3BlcnRpZXMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nVGVtcGxhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgICAgIGNyZWF0ZVByb3BzID0gdGhpcy5nZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAodGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKCdleHRlbmQnLCBuYW1lLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0ZW1wbGF0ZTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBwYXJlbnRUZW1wbGF0ZSwgcHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBwYXJlbnRUZW1wbGF0ZSwgbmFtZSwgcGFyZW50VGVtcGxhdGUsIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNyZWF0ZVByb3BzKSB7XG4gICAgICAgICAgICB0aGlzLnNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgY3JlYXRlUHJvcHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIHBhcmVudFRlbXBsYXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX18gPSBwcm9wcztcblxuICAgICAgICAvLyBNYWludGFpbiBncmFwaCBvZiBwYXJlbnQgYW5kIGNoaWxkIHRlbXBsYXRlc1xuICAgICAgICB0ZW1wbGF0ZS5fX3BhcmVudF9fID0gcGFyZW50VGVtcGxhdGU7XG4gICAgICAgIHBhcmVudFRlbXBsYXRlLl9fY2hpbGRyZW5fXy5wdXNoKHRlbXBsYXRlKTtcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgc3RhdGljIG1peGluKHRlbXBsYXRlLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgKHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcignY3JlYXRlJywgdGVtcGxhdGUuX19uYW1lX18sIHByb3BlcnRpZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZVRlbXBsYXRlKHRlbXBsYXRlLCBudWxsLCBwcm9wZXJ0aWVzLCB0ZW1wbGF0ZSwgdGVtcGxhdGUuX19uYW1lX18pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKlxuICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXMgdW5rbm93blxuICAgICovXG4gICAgc3RhdGljIHN0YXRpY01peGluKHRlbXBsYXRlLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVtwcm9wXSA9IHByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBmdW5jdGlvbiB0aGF0IHdpbGwgZmlyZSBvbiBvYmplY3QgY3JlYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGluamVjdG9yIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5qZWN0KHRlbXBsYXRlLCBpbmplY3RvcjogRnVuY3Rpb24pIHtcbiAgICAgICAgdGVtcGxhdGUuX19pbmplY3Rpb25zX18ucHVzaChpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgb24gYWxsIG9iamVjdCBjcmVhdGlvbnMgKGFwcGFyZW50bHkpPyBKdXN0IGEgZ3Vlc3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGluamVjdG9yIC0gdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyBnbG9iYWxJbmplY3QoaW5qZWN0b3I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX19pbmplY3Rpb25zX18ucHVzaChpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSB0ZW1wbGF0ZSBpZiBpdCBuZWVkcyB0byBiZSBjcmVhdGVkXG4gICAgICogQHBhcmFtIFt1bmtub3dufSB0ZW1wbGF0ZSB0byBiZSBjcmVhdGVkXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlPywgdGhpc09iaj8pIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fKSB7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVQYXJhbWV0ZXJzID0gdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX187XG4gICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgY3JlYXRlUGFyYW1ldGVycy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBjcmVhdGVQYXJhbWV0ZXJzW2l4XTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVUZW1wbGF0ZShwYXJhbXNbMF0sIHBhcmFtc1sxXSwgcGFyYW1zWzJdLCBwYXJhbXNbM10sIHBhcmFtc1s0XSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGVtcGxhdGUuX2luamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5faW5qZWN0UHJvcGVydGllcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXNPYmopIHtcbiAgICAgICAgICAgICAgICAvL3ZhciBjb3B5ID0gbmV3IHRlbXBsYXRlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvdG90eXBlcyA9IFt0ZW1wbGF0ZS5wcm90b3R5cGVdO1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnQgPSB0ZW1wbGF0ZS5fX3BhcmVudF9fO1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvdG90eXBlcy5wdXNoKHBhcmVudC5wcm90b3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQuX19wYXJlbnRfXztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSBwcm90b3R5cGVzLmxlbmd0aCAtIDE7IGl4ID49IDA7IC0taXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm90b3R5cGVzW2l4XSk7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzLmZvckVhY2goKHZhbCwgaXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzT2JqLCBwcm9wc1tpeF0sIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG90eXBlc1tpeF0sIHByb3BzW2l4XSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpc09iai5fX3Byb3RvX18gPSB0ZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q2xhc3NlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuX190ZW1wbGF0ZXNfXykge1xuICAgICAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IHRoaXMuX190ZW1wbGF0ZXNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLl9fdGVtcGxhdGVzX19baXhdO1xuICAgICAgICAgICAgICAgIHRoaXMuX19kaWN0aW9uYXJ5X19bY29uc3RydWN0b3JOYW1lKHRlbXBsYXRlKV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfX1tjb25zdHJ1Y3Rvck5hbWUodGVtcGxhdGUpXSA9IHRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIHByb2Nlc3NEZWZlcnJlZFR5cGVzKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX190ZW1wbGF0ZXNfXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdGVtcGxhdGVOYW1lMSBpbiB0aGlzLl9fZGljdGlvbmFyeV9fKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX2RpY3Rpb25hcnlfX1t0ZW1wbGF0ZU5hbWUxXTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRUZW1wbGF0ZU5hbWUgPSBjb25zdHJ1Y3Rvck5hbWUoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRlbXBsYXRlLnByb3RvdHlwZSkuY29uc3RydWN0b3IpO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fc2hhZG93UGFyZW50X18gPSB0aGlzLl9fZGljdGlvbmFyeV9fW3BhcmVudFRlbXBsYXRlTmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlLl9fc2hhZG93UGFyZW50X18pIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUuX19zaGFkb3dQYXJlbnRfXy5fX3NoYWRvd0NoaWxkcmVuX18ucHVzaCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzID0ge307XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHN0ID0gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wZCBpbiBwcm9wc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUucHJvcHNbcHJvcGRdID0gcHJvcHN0W3Byb3BkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fX2V4Y2VwdGlvbnNfXykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLl9fZXhjZXB0aW9uc19fLm1hcChjcmVhdGVNZXNzYWdlTGluZSkuam9pbignXFxuJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU1lc3NhZ2VMaW5lKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGV4Y2VwdGlvbi5mdW5jKGV4Y2VwdGlvbi5jbGFzcygpLCBleGNlcHRpb24ucHJvcCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc0RlZmVycmVkVHlwZXModGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5wcm90b3R5cGUuX19kZWZlcnJlZFR5cGVfXykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0ZW1wbGF0ZS5wcm90b3R5cGUuX19kZWZlcnJlZFR5cGVfXykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWZpbmVQcm9wZXJ0eSA9IHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IHRlbXBsYXRlLnByb3RvdHlwZS5fX2RlZmVycmVkVHlwZV9fW3Byb3BdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkudHlwZSA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5vZiA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50eXBlID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fX2RpY3Rpb25hcnlfXztcblxuICAgICAgICBmdW5jdGlvbiBjb25zdHJ1Y3Rvck5hbWUoY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVkRnVuY3Rpb24gPSBjb25zdHJ1Y3Rvci50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvbiAoW14oXSopLyk7XG4gICAgICAgICAgICByZXR1cm4gbmFtZWRGdW5jdGlvbiA/IG5hbWVkRnVuY3Rpb25bMV0gOiBudWxsO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZGVuIGJ5IG90aGVyIFR5cGUgU3lzdGVtcyB0byBjYWNoZSBvciBnbG9iYWxseSBpZGVudGlmeSBvYmplY3RzXG4gICAgICogQWxzbyBhc3NpZ25zIGEgdW5pcXVlIGludGVybmFsIElkIHNvIHRoYXQgY29tcGxleCBzdHJ1Y3R1cmVzIHdpdGhcbiAgICAgKiByZWN1cnNpdmUgb2JqZWN0cyBjYW4gYmUgc2VyaWFsaXplZFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBvYmogLSB0aGUgb2JqZWN0IHRvIGJlIHBhc3NlZCBkdXJpbmcgY3JlYXRpb24gdGltZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgLSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9zdGFzaE9iamVjdChvYmosIHRlbXBsYXRlKSB7XG4gICAgICAgIGlmICghb2JqLl9faWRfXykge1xuICAgICAgICAgICAgaWYgKCFPYmplY3RUZW1wbGF0ZS5uZXh0SWQpIHtcbiAgICAgICAgICAgICAgICBPYmplY3RUZW1wbGF0ZS5uZXh0SWQgPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmouX19pZF9fID0gJ2xvY2FsLScgKyB0ZW1wbGF0ZS5fX25hbWVfXyArICctJyArICsrT2JqZWN0VGVtcGxhdGUubmV4dElkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gaW5qZWN0IG90aGVyIGVsZW1lbnRzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge190ZW1wbGF0ZX0gX3RlbXBsYXRlIC0gdGhlIG9iamVjdCB0byBiZSBwYXNzZWQgZHVyaW5nIGNyZWF0aW9uIHRpbWVcbiAgICAgKiBcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqICovXG4gICAgc3RhdGljIF9pbmplY3RJbnRvVGVtcGxhdGUoX3RlbXBsYXRlKSB7IH07XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIGJ5IHRlbXBsYXRlIHNldHVwIHRvIGNyZWF0ZSBhbiBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZvciB1c2UgYnkgdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnR5TmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IGlzIHRoZSBwcm9wZXJ0eSBkZXNjcmlwdG9yIHBhc3NlZCB0byB0aGUgdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iamVjdFByb3BlcnRpZXMgaXMgYWxsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIHByb2Nlc3NlZCBtYW51YWxseS4gIEEgbmV3IHByb3BlcnR5IGlzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQgdG8gdGhpcyBpZiB0aGUgcHJvcGVydHkgbmVlZHMgdG8gYmUgaW5pdGlhbGl6ZWQgYnkgdmFsdWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnRpZXMgaXMgYWxsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIEEgbmV3IHByb3BlcnR5IHdpbGwgYmUgYWRkZWQgdG8gdGhpcyBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9zZXR1cFByb3BlcnR5KHByb3BlcnR5TmFtZSwgZGVmaW5lUHJvcGVydHksIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdmFsdWUgbmVlZHMgdG8gYmUgcmUtaW5pdGlhbGl6ZWQgaW4gY29uc3RydWN0b3JcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgY29uc3QgYnlWYWx1ZSA9IHZhbHVlICYmIHR5cGVvZiAodmFsdWUpICE9PSAnbnVtYmVyJyAmJiB0eXBlb2YgKHZhbHVlKSAhPT0gJ3N0cmluZyc7XG5cbiAgICAgICAgaWYgKGJ5VmFsdWUgfHwgIU9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIHx8IGRlZmluZVByb3BlcnR5LmdldCB8fCBkZWZpbmVQcm9wZXJ0eS5zZXQpIHtcbiAgICAgICAgICAgIG9iamVjdFByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBpbml0OiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBkZWZpbmVQcm9wZXJ0eS50eXBlLFxuICAgICAgICAgICAgICAgIG9mOiBkZWZpbmVQcm9wZXJ0eS5vZixcbiAgICAgICAgICAgICAgICBieVZhbHVlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGVuIGEgc3VwZXIgY2xhc3MgYmFzZWQgb24gb2JqZWN0VGVtcGxhdGUgZG9uJ3QgdHJhbnNwb3J0IHByb3BlcnRpZXNcbiAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydHkudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gZGVmaW5lUHJvcGVydHk7XG5cbiAgICAgICAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnNcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmdldCB8fCBkZWZpbmVQcm9wZXJ0eS5zZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJTZXR0ZXIgPSBkZWZpbmVQcm9wZXJ0eS5zZXQ7XG5cbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnNldCA9IChmdW5jdGlvbiBkKCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBhIGNsb3N1cmUgdG8gcmVjb3JkIHRoZSBwcm9wZXJ0eSBuYW1lIHdoaWNoIGlzIG5vdCBwYXNzZWQgdG8gdGhlIHNldHRlclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBwcm9wZXJ0eU5hbWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gYyh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlclNldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1c2VyU2V0dGVyLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbYF9fJHtwcm9wfWBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgdXNlckdldHRlciA9IGRlZmluZVByb3BlcnR5LmdldDtcblxuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuZ2V0ID0gKGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgY2xvc3VyZSB0byByZWNvcmQgcHJvcGVydHkgbmFtZSB3aGljaCBpcyBub3QgcGFzc2VkIHRvIHRoZSBnZXR0ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gcHJvcGVydHlOYW1lO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGIoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJHZXR0ZXIuY2FsbCh0aGlzLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckdldHRlci5jYWxsKHRoaXMsIHRoaXNbYF9fJHtwcm9wfWBdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2BfXyR7cHJvcH1gXTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgaWYgKCFkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzW2BfXyR7cHJvcGVydHlOYW1lfWBdID0geyBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LndyaXRhYmxlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xvbmUgYW4gb2JqZWN0IGNyZWF0ZWQgZnJvbSBhbiBPYmplY3RUZW1wbGF0ZVxuICAgICAqIFVzZWQgb25seSB3aXRoaW4gc3VwZXJ0eXBlIChzZWUgY29weU9iamVjdCBmb3IgZ2VuZXJhbCBjb3B5KVxuICAgICAqXG4gICAgICogQHBhcmFtIG9iaiBpcyB0aGUgc291cmNlIG9iamVjdFxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdFxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IGEgY29weSBvZiB0aGUgb2JqZWN0XG4gICAgICovXG4gICAgLy8gRnVuY3Rpb24gdG8gY2xvbmUgc2ltcGxlIG9iamVjdHMgdXNpbmcgT2JqZWN0VGVtcGxhdGUgYXMgYSBndWlkZVxuICAgIHN0YXRpYyBjbG9uZShvYmosIHRlbXBsYXRlPykge1xuICAgICAgICBsZXQgY29weTtcblxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai5nZXRUaW1lKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBjb3B5ID0gW107XG5cbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCBvYmoubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgY29weVtpeF0gPSB0aGlzLmNsb25lKG9ialtpeF0sIHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGVtcGxhdGUgJiYgb2JqIGluc3RhbmNlb2YgdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGNvcHkgPSBuZXcgdGVtcGxhdGUoKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wICE9ICdfX2lkX18nICYmICEob2JqW3Byb3BdIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmluZVByb3BlcnR5ID0gdGhpcy5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUpIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlbcHJvcF0gPSB0aGlzLmNsb25lKG9ialtwcm9wXSwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICBjb3B5ID0ge307XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGMgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wYykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29weVtwcm9wY10gPSB0aGlzLmNsb25lKG9ialtwcm9wY10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gYmUgYWJsZSB0byBjcmVhdGUgcmVtb3RlIGZ1bmN0aW9ucyBvclxuICAgICAqIG90aGVyd2lzZSBpbnRlcmNlcHQgZnVuY3Rpb24gY2FsbHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gX3Byb3BlcnR5TmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnR5VmFsdWUgaXMgdGhlIGZ1bmN0aW9uIGl0c2VsZlxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IGEgbmV3IGZ1bmN0aW9uIHRvIGJlIGFzc2lnbmVkIHRvIHRoZSBvYmplY3QgcHJvdG90eXBlXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc2V0dXBGdW5jdGlvbihfcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgIH07XG5cbiAgICAvKipcbiAqIFB1cnBvc2UgdW5rbm93blxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRvciB1bmtub3duXG4gKlxuICogQHJldHVybnMge3Vua25vd259XG4gKi9cbiAgICBzdGF0aWMgY3JlYXRlQ29weShvYmosIGNyZWF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZnJvbVBPSk8ob2JqLCBvYmouX190ZW1wbGF0ZV9fLCBudWxsLCBudWxsLCB1bmRlZmluZWQsIG51bGwsIG51bGwsIGNyZWF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFic3RyYWN0IGZ1bmN0aW9uIGZvciBiZW5lZml0IG9mIFNlbW90dXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY2IgdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyB3aXRob3V0Q2hhbmdlVHJhY2tpbmcoY2IpIHtcbiAgICAgICAgY2IoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcG9qbyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpZE1hcCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpZFF1YWxpZmllciB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnQgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjcmVhdG9yIHVua25vd25cbiAgICAgKlxuICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbVBPSk8gPSBzZXJpYWxpemVyLmZyb21QT0pPO1xuXG4gICAgLyoqXG4gICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAqXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHN0ciB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRRdWFsaWZpZXIgdW5rbm93blxuICAgICogb2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oc3RyLCB0ZW1wbGF0ZSwgaWRRdWFsaWZpZXIpXG4gICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTiA9IHNlcmlhbGl6ZXIuZnJvbUpTT047XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGFuIG9iamVjdCB0byBKU09OLCBzdHJpcHBpbmcgYW55IHJlY3Vyc2l2ZSBvYmplY3QgcmVmZXJlbmNlcyBzbyB0aGV5IGNhbiBiZVxuICAgICAqIHJlY29uc3RpdHV0ZWQgbGF0ZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNiIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuICAgIHN0YXRpYyB0b0pTT05TdHJpbmcgPSBzZXJpYWxpemVyLnRvSlNPTlN0cmluZztcblxuICAgICAgICAgLyoqXG4gICAgIC8qKlxuICAgICAgKiBGaW5kIHRoZSByaWdodCBzdWJjbGFzcyB0byBpbnN0YW50aWF0ZSBieSBlaXRoZXIgbG9va2luZyBhdCB0aGVcbiAgICAgICogZGVjbGFyZWQgbGlzdCBpbiB0aGUgc3ViQ2xhc3NlcyBkZWZpbmUgcHJvcGVydHkgb3Igd2Fsa2luZyB0aHJvdWdoXG4gICAgICAqIHRoZSBzdWJjbGFzc2VzIG9mIHRoZSBkZWNsYXJlZCB0ZW1wbGF0ZVxuICAgICAgKlxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBvYmpJZCB1bmtub3duXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgIHN0YXRpYyBfcmVzb2x2ZVN1YkNsYXNzKHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlTmFtZSA9ICcnO1xuXG4gICAgICAgIGlmIChvYmpJZC5tYXRjaCgvLShbQS1aYS16MC05XzpdKiktLykpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlTmFtZSA9IFJlZ0V4cC4kMTtcbiAgICAgICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0ZW1wbGF0ZSBzdWJjbGFzcyBmb3IgcG9seW1vcnBoaWMgaW5zdGFudGlhdGlvblxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkgJiYgZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3NlcyAmJiBvYmpJZCAhPSAnYW5vbnltb3VzKScpIHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlcy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlTmFtZSA9PSBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzW2l4XS5fX25hbWVfXykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgPSBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzW2l4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gdGhpcy5fZmluZFN1YkNsYXNzKHRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoc3ViQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IHN1YkNsYXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYWxrIHJlY3Vyc2l2ZWx5IHRocm91Z2ggZXh0ZW5zaW9ucyBvZiB0ZW1wbGF0ZSB2aWEgX19jaGlsZHJlbl9fXG4gICAgICogbG9va2luZyBmb3IgYSBuYW1lIG1hdGNoXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlTmFtZSB1bmtub3duXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZSwgdGVtcGxhdGVOYW1lKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5fX25hbWVfXyA9PSB0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0ZW1wbGF0ZS5fX2NoaWxkcmVuX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICBjb25zdCBzdWJDbGFzcyA9IHRoaXMuX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZS5fX2NoaWxkcmVuX19baXhdLCB0ZW1wbGF0ZU5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoc3ViQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViQ2xhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGhpZ2hlc3QgbGV2ZWwgdGVtcGxhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0QmFzZUNsYXNzKHRlbXBsYXRlKSB7XG4gICAgICAgIHdoaWxlICh0ZW1wbGF0ZS5fX3BhcmVudF9fKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgICAgICAvKipcbiAgICAgICogQW4gb3ZlcnJpZGFibGUgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGZyb20gYSB0ZW1wbGF0ZSBhbmQgb3B0aW9uYWxseVxuICAgICAgKiBtYW5hZ2UgdGhlIGNhY2hpbmcgb2YgdGhhdCBvYmplY3QgKHVzZWQgYnkgZGVyaXZhdGl2ZSB0eXBlIHN5c3RlbXMpLiAgSXRcbiAgICAgICogcHJlc2VydmVzIHRoZSBvcmlnaW5hbCBpZCBvZiBhbiBvYmplY3RcbiAgICAgICpcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBvZiBvYmplY3RcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBvYmpJZCBhbmQgaWQgKGlmIHByZXNlbnQpXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgIHN0YXRpYyBfY3JlYXRlRW1wdHlPYmplY3QodGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX3Jlc29sdmVTdWJDbGFzcyh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KTtcblxuICAgICAgICBjb25zdCBvbGRTdGFzaE9iamVjdCA9IHRoaXMuX3N0YXNoT2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmpJZCkge1xuICAgICAgICAgICAgdGhpcy5fc3Rhc2hPYmplY3QgPSBmdW5jdGlvbiBzdGFzaE9iamVjdCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICB0aGlzLl9zdGFzaE9iamVjdCA9IG9sZFN0YXNoT2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmpJZCkge1xuICAgICAgICAgICAgbmV3VmFsdWUuX19pZF9fID0gb2JqSWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9va3MgdXAgYSBwcm9wZXJ0eSBpbiB0aGUgZGVmaW5lUHJvcGVydGllcyBzYXZlZCB3aXRoIHRoZSB0ZW1wbGF0ZSBjYXNjYWRpbmdcbiAgICAgKiB1cCB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGZpbmQgaXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcCBpcyB0aGUgcHJvcGVydHkgYmVpbmcgc291Z2h0XG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm5zIHsqfSB0aGUgXCJkZWZpbmVQcm9wZXJ0eVwiIHN0cnVjdHVyZSBmb3IgdGhlIHByb3BlcnR5XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSAmJiAodGVtcGxhdGUgIT0gT2JqZWN0KSAmJiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzICYmIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRlbXBsYXRlICYmIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUucGFyZW50VGVtcGxhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGhhc2ggb2YgYWxsIHByb3BlcnRpZXMgaW5jbHVkaW5nIHRob3NlIGluaGVyaXRlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcmV0dXJuVmFsdWUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaW5jbHVkZVZpcnR1YWwgdW5rbm93blxuICAgICAqIEByZXR1cm5zIHsqfSBhbiBhc3NvY2lhdGl2ZSBhcnJheSBvZiBlYWNoIFwiZGVmaW5lUHJvcGVydHlcIiBzdHJ1Y3R1cmUgZm9yIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCByZXR1cm5WYWx1ZSwgaW5jbHVkZVZpcnR1YWwpIHtcbiAgICAgICAgaWYgKCFyZXR1cm5WYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlVmlydHVhbCB8fCAhdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWVbcHJvcF0gPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSwgcmV0dXJuVmFsdWUsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBHZW5lcmFsIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0ZW1wbGF0ZXMgdXNlZCBieSBjcmVhdGUsIGV4dGVuZCBhbmQgbWl4aW5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gbWl4aW5UZW1wbGF0ZSAtIHRlbXBsYXRlIHVzZWQgZm9yIGEgbWl4aW5cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudFRlbXBsYXRlIC0gdGVtcGxhdGUgdXNlZCBmb3IgYW4gZXh0ZW5kXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSAtIHByb3BlcnRpZXMgdG8gYmUgYWRkZWQvbXhpZWQgaW5cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNyZWF0ZVByb3BlcnRpZXMgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGVOYW1lIC0gdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIGFzIGl0IHdpbGwgYmUgc3RvcmVkIHJldHJpZXZlZCBmcm9tIGRpY3Rpb25hcnlcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2NyZWF0ZVRlbXBsYXRlKG1peGluVGVtcGxhdGU/LCBwYXJlbnRUZW1wbGF0ZT8sIHByb3BlcnRpZXNPclRlbXBsYXRlPywgY3JlYXRlUHJvcGVydGllcz8sIHRlbXBsYXRlTmFtZT8sIGNyZWF0ZVRlbXBsYXRlTm93Pykge1xuICAgICAgICAvLyBXZSB3aWxsIHJldHVybiBhIGNvbnN0cnVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgaW4gYSBuZXcgZnVuY3Rpb25cbiAgICAgICAgLy8gdGhhdCB3aWxsIGNhbGwgYW4gaW5pdCgpIGZ1bmN0aW9uIGZvdW5kIGluIHByb3BlcnRpZXMsIGRlZmluZSBwcm9wZXJ0aWVzIHVzaW5nIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzXG4gICAgICAgIC8vIGFuZCBtYWtlIGNvcGllcyBvZiB0aG9zZSB0aGF0IGFyZSByZWFsbHkgb2JqZWN0c1xuICAgICAgICB2YXIgZnVuY3Rpb25Qcm9wZXJ0aWVzOmFueSA9IHt9OyAgICAvLyBXaWxsIGJlIHBvcHVsYXRlZCB3aXRoIGluaXQgZnVuY3Rpb24gZnJvbSBwcm9wZXJ0aWVzXG4gICAgICAgIHZhciBvYmplY3RQcm9wZXJ0aWVzID0ge307ICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBwcm9jZXNzZWQgYnkgaGFuZFxuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydGllcyA9IHt9OyAgICAvLyBMaXN0IG9mIHByb3BlcnRpZXMgdG8gYmUgc2VudCB0byBPYmplY3QuZGVmaW5lUHJvcGVydGllcygpXG4gICAgICAgIHZhciBvYmplY3RUZW1wbGF0ZSA9IHRoaXM7XG4gICAgICAgIHZhciB0ZW1wbGF0ZVByb3RvdHlwZTtcblxuICAgICAgICBmdW5jdGlvbiBGKCkgeyB9ICAgICAvLyBVc2VkIGluIGNhc2Ugb2YgZXh0ZW5kXG5cbiAgICAgICAgaWYgKCF0aGlzLmxhenlUZW1wbGF0ZUxvYWQpIHtcbiAgICAgICAgICAgIGNyZWF0ZVRlbXBsYXRlTm93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBTZXR1cCB2YXJpYWJsZXMgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIGNhbGwgKGNyZWF0ZSwgZXh0ZW5kLCBtaXhpbilcbiAgICAgICAgaWYgKGNyZWF0ZVRlbXBsYXRlTm93KSB7XG4gICAgICAgICAgICBpZiAobWl4aW5UZW1wbGF0ZSkgeyAgICAgICAgLy8gTWl4aW5cbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUlmTmVlZGVkKG1peGluVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5pc09iamVjdFRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQocHJvcGVydGllc09yVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXSA9IHByb3BlcnRpZXNPclRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wcCBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXNbcHJvcHBdID0gcHJvcGVydGllc09yVGVtcGxhdGUub2JqZWN0UHJvcGVydGllc1twcm9wcF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wbyBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wbyA9PSAnaW5pdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0ID0gbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCB8fCBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdC5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdC5wdXNoKHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0W2l4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXNbcHJvcG9dID0gcHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzW3Byb3BvXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BuIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLnByb3RvdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BEZXNjID0gPEdldHRlcj5PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3BlcnRpZXNPclRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcERlc2MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobWl4aW5UZW1wbGF0ZS5wcm90b3R5cGUsIHByb3BuLCBwcm9wRGVzYyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcERlc2MuZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobWl4aW5UZW1wbGF0ZS5wcm90b3R5cGUsIHByb3BuKSkuZ2V0LnNvdXJjZVRlbXBsYXRlID0gcHJvcERlc2MuZ2V0LnNvdXJjZVRlbXBsYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvdG90eXBlW3Byb3BuXSA9IHByb3BlcnRpZXNPclRlbXBsYXRlLnByb3RvdHlwZVtwcm9wbl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3BzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BzID0gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXMobWl4aW5UZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wbSBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm9wc1twcm9wbV0gPSBwcm9wc1twcm9wbV07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWl4aW5UZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXMgPSBtaXhpblRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFByb3BlcnRpZXMgPSBtaXhpblRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uUHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZSA9IG1peGluVGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRUZW1wbGF0ZSA9IG1peGluVGVtcGxhdGUucGFyZW50VGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7ICAgICAgICAvLyBFeHRlbmRcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUlmTmVlZGVkKHBhcmVudFRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICBGLnByb3RvdHlwZSA9IHBhcmVudFRlbXBsYXRlLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZSA9IG5ldyBGKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnN0cnVjdG9yIHRoYXQgd2lsbCBiZSByZXR1cm5lZCB3aWxsIG9ubHkgZXZlciBiZSBjcmVhdGVkIG9uY2VcbiAgICAgICAgICovXG4gICAgICAgIHZhciB0ZW1wbGF0ZTogQ29uc3RydWN0b3JUeXBlID0gdGhpcy5fX2RpY3Rpb25hcnlfX1t0ZW1wbGF0ZU5hbWVdIHx8XG4gICAgICAgICAgICBiaW5kUGFyYW1zKHRlbXBsYXRlTmFtZSwgb2JqZWN0VGVtcGxhdGUsIGZ1bmN0aW9uUHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgcHJvcGVydGllc09yVGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgY3JlYXRlUHJvcGVydGllcywgb2JqZWN0UHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsXG4gICAgICAgICAgICAgICAgY3JlYXRlVGVtcGxhdGVOb3csIG1peGluVGVtcGxhdGUpXG5cblxuICAgICAgICB0ZW1wbGF0ZS5pc09iamVjdFRlbXBsYXRlID0gdHJ1ZTtcblxuICAgICAgICB0ZW1wbGF0ZS5leHRlbmQgPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5leHRlbmQuY2FsbChvYmplY3RUZW1wbGF0ZSwgdGVtcGxhdGUsIHAxLCBwMik7XG4gICAgICAgIHRlbXBsYXRlLm1peGluID0gKHAxLCBwMikgPT4gb2JqZWN0VGVtcGxhdGUubWl4aW4uY2FsbChvYmplY3RUZW1wbGF0ZSwgdGVtcGxhdGUsIHAxLCBwMik7XG4gICAgICAgIHRlbXBsYXRlLnN0YXRpY01peGluID0gKHAxLCBwMikgPT4gb2JqZWN0VGVtcGxhdGUuc3RhdGljTWl4aW4uY2FsbChvYmplY3RUZW1wbGF0ZSwgdGVtcGxhdGUsIHAxLCBwMik7XG5cbiAgICAgICAgdGVtcGxhdGUuZnJvbVBPSk8gPSAocG9qbykgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRlbXBsYXRlLmZyb21QT0pPKHBvam8sIHRlbXBsYXRlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0ZW1wbGF0ZS5mcm9tSlNPTiA9IChzdHIsIGlkUHJlZml4KSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oc3RyLCB0ZW1wbGF0ZSwgaWRQcmVmaXgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRlbXBsYXRlLmdldFByb3BlcnRpZXMgPSAoaW5jbHVkZVZpcnR1YWwpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCBpbmNsdWRlVmlydHVhbCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFjcmVhdGVUZW1wbGF0ZU5vdykge1xuICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18gPSB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyB8fCBbXTtcbiAgICAgICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fLnB1c2goW21peGluVGVtcGxhdGUsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcywgdGVtcGxhdGVOYW1lXSk7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZS5wcm90b3R5cGUgPSB0ZW1wbGF0ZVByb3RvdHlwZTtcblxuICAgICAgICB2YXIgY3JlYXRlUHJvcGVydHkgPSBjcmVhdGVQcm9wZXJ0eUZ1bmMuYmluZChudWxsLCBmdW5jdGlvblByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLCBvYmplY3RUZW1wbGF0ZSwgdGVtcGxhdGVOYW1lLCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSk7XG5cblxuICAgICAgICAvLyBXYWxrIHRocm91Z2ggcHJvcGVydGllcyBhbmQgY29uc3RydWN0IHRoZSBkZWZpbmVQcm9wZXJ0aWVzIGhhc2ggb2YgcHJvcGVydGllcywgdGhlIGxpc3Qgb2ZcbiAgICAgICAgLy8gb2JqZWN0UHJvcGVydGllcyB0aGF0IGhhdmUgdG8gYmUgcmVpbnN0YW50aWF0ZWQgYW5kIGF0dGFjaCBmdW5jdGlvbnMgdG8gdGhlIHByb3RvdHlwZVxuICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gcHJvcGVydGllc09yVGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGNyZWF0ZVByb3BlcnR5KHByb3BlcnR5TmFtZSwgbnVsbCwgcHJvcGVydGllc09yVGVtcGxhdGUsIGNyZWF0ZVByb3BlcnRpZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcyA9IGRlZmluZVByb3BlcnRpZXM7XG4gICAgICAgIHRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXMgPSBvYmplY3RQcm9wZXJ0aWVzO1xuXG4gICAgICAgIHRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcyA9IGZ1bmN0aW9uUHJvcGVydGllcztcbiAgICAgICAgdGVtcGxhdGUucGFyZW50VGVtcGxhdGUgPSBwYXJlbnRUZW1wbGF0ZTtcblxuXG4gICAgICAgIHRlbXBsYXRlLmNyZWF0ZVByb3BlcnR5ID0gY3JlYXRlUHJvcGVydHk7XG5cbiAgICAgICAgdGVtcGxhdGUucHJvcHMgPSB7fTtcblxuICAgICAgICB2YXIgcHJvcHN0ID0gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUsIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgICAgZm9yICh2YXIgcHJvcGQgaW4gcHJvcHN0KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wc1twcm9wZF0gPSBwcm9wc3RbcHJvcGRdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH07XG5cblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gdG8gY2xvbmUgdGhlIFR5cGUgU3lzdGVtXG4gICAgICogQHJldHVybnMge299XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2NyZWF0ZU9iamVjdCgpOiBPYmplY3RUZW1wbGF0ZUNsb25lIHtcbiAgICAgICAgY29uc3QgbmV3Rm9vID0gT2JqZWN0LmNyZWF0ZSh0aGlzKTtcbiAgICAgICAgbmV3Rm9vLmluaXQoKTtcbiAgICAgICAgcmV0dXJuIG5ld0ZvbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBvcmlnaW5hbGx5IHRvb2sgYSBjb250ZXh0IHRoYXQgaXQgdGhyZXcgYXdheVxuICAgICogQHJldHVybnMge1N1cGVydHlwZUxvZ2dlcn1cbiAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVMb2dnZXIoKTogU3VwZXJ0eXBlTG9nZ2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdXBlcnR5cGVMb2dnZXIoKTtcbiAgICB9XG4gICAgXG5cbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVQcm9wZXJ0eUZ1bmMoZnVuY3Rpb25Qcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSwgb2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlTmFtZSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsXG4gICAgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlLCBwcm9wZXJ0aWVzLCBjcmVhdGVQcm9wZXJ0aWVzKSB7XG4gICAgaWYgKCFwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcbiAgICB9XG5cbiAgICAvLyBSZWNvcmQgdGhlIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9uXG4gICAgaWYgKHByb3BlcnR5TmFtZSA9PSAnaW5pdCcgJiYgdHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZ1bmN0aW9uUHJvcGVydGllcy5pbml0ID0gW3Byb3BlcnRpZXNbcHJvcGVydHlOYW1lXV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gbnVsbDsgLy8gZGVmaW5lUHJvcGVydHkgdG8gYmUgYWRkZWQgdG8gZGVmaW5lUHJvcGVydGllc1xuXG4gICAgICAgIC8vIERldGVybWluZSB0aGUgcHJvcGVydHkgdmFsdWUgd2hpY2ggbWF5IGJlIGEgZGVmaW5lUHJvcGVydGllcyBzdHJ1Y3R1cmUgb3IganVzdCBhbiBpbml0aWFsIHZhbHVlXG4gICAgICAgIHZhciBkZXNjcmlwdG9yOmFueSA9IHt9O1xuXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm9wZXJ0aWVzLCBwcm9wZXJ0eU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHR5cGUgPSAnbnVsbCc7XG5cbiAgICAgICAgaWYgKGRlc2NyaXB0b3IuZ2V0IHx8IGRlc2NyaXB0b3Iuc2V0KSB7XG4gICAgICAgICAgICB0eXBlID0gJ2dldHNldCc7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAvLyBGaWd1cmUgb3V0IHdoZXRoZXIgdGhpcyBpcyBhIGRlZmluZVByb3BlcnR5IHN0cnVjdHVyZSAoaGFzIGEgY29uc3RydWN0b3Igb2Ygb2JqZWN0KVxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzogLy8gT3IgYXJyYXlcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgcmVtb3RlIGZ1bmN0aW9uIGNhbGxzXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5ICYmIHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHkpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0gPSBvYmplY3RUZW1wbGF0ZS5fc2V0dXBGdW5jdGlvbihwcm9wZXJ0eU5hbWUsIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5LCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub24sIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS52YWxpZGF0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fcmV0dXJuc19fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fcmV0dXJuc19fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9mO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNhcnJheV9fID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19vbl9fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9uO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fdmFsaWRhdGVfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS52YWxpZGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX2JvZHlfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ud3JpdGFibGUgPSB0cnVlOyAvLyBXZSBhcmUgdXNpbmcgc2V0dGVyc1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5lbnVtZXJhYmxlKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5lbnVtZXJhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gT3RoZXIgY3JhcFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdID0gb2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcGVydHlOYW1lLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0pO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uc291cmNlVGVtcGxhdGUgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2dldHNldCc6IC8vIGdldHRlcnMgYW5kIHNldHRlcnNcbiAgICAgICAgICAgICAgICBkZXNjcmlwdG9yLnRlbXBsYXRlU291cmNlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0ZW1wbGF0ZVByb3RvdHlwZSwgcHJvcGVydHlOYW1lLCBkZXNjcmlwdG9yKTtcbiAgICAgICAgICAgICAgICAoPEdldHRlcj5PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRlbXBsYXRlUHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUpKS5nZXQuc291cmNlVGVtcGxhdGUgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGRlZmluZVByb3BlcnR5IHRvIGJlIGFkZGVkXG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yLnRvQ2xpZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnRvQ2xpZW50ID0gZGVzY3JpcHRvci50b0NsaWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci50b1NlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b1NlcnZlciA9IGRlc2NyaXB0b3IudG9TZXJ2ZXI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9zZXR1cFByb3BlcnR5KHByb3BlcnR5TmFtZSwgZGVmaW5lUHJvcGVydHksIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gYmluZFBhcmFtcyh0ZW1wbGF0ZU5hbWUsIG9iamVjdFRlbXBsYXRlLCBmdW5jdGlvblByb3BlcnRpZXMsXG4gICAgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLFxuICAgIGNyZWF0ZVByb3BlcnRpZXMsIG9iamVjdFByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLFxuICAgIGNyZWF0ZVRlbXBsYXRlTm93LCBtaXhpblRlbXBsYXRlKSB7XG5cbiAgICBmdW5jdGlvbiB0ZW1wbGF0ZSgpIHtcbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUsIHRoaXMpO1xuICAgICAgICBsZXQgdGVtcGxhdGVSZWY6IENvbnN0cnVjdG9yVHlwZSA9IDxDb25zdHJ1Y3RvclR5cGU+PEZ1bmN0aW9uPnRlbXBsYXRlO1xuXG4gICAgICAgIG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVVc2FnZV9fW3RlbXBsYXRlUmVmLl9fbmFtZV9fXSA9IHRydWU7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0ZW1wbGF0ZVJlZi5fX3BhcmVudF9fO1xuICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlVXNhZ2VfX1twYXJlbnQuX19uYW1lX19dID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBwYXJlbnQuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZV9fID0gdGVtcGxhdGVSZWY7XG5cbiAgICAgICAgaWYgKG9iamVjdFRlbXBsYXRlLl9fdHJhbnNpZW50X18pIHtcbiAgICAgICAgICAgIHRoaXMuX190cmFuc2llbnRfXyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJ1bmVkT2JqZWN0UHJvcGVydGllcyA9IHBydW5lRXhpc3RpbmcodGhpcywgdGVtcGxhdGVSZWYub2JqZWN0UHJvcGVydGllcyk7XG4gICAgICAgIHZhciBwcnVuZWREZWZpbmVQcm9wZXJ0aWVzID0gcHJ1bmVFeGlzdGluZyh0aGlzLCB0ZW1wbGF0ZVJlZi5kZWZpbmVQcm9wZXJ0aWVzKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHByb3BlcnRpZXMgZWl0aGVyIHdpdGggRU1DQSA1IGRlZmluZVByb3BlcnRpZXMgb3IgYnkgaGFuZFxuICAgICAgICAgICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywgcHJ1bmVkRGVmaW5lUHJvcGVydGllcyk7IC8vIFRoaXMgbWV0aG9kIHdpbGwgYmUgYWRkZWQgcHJlLUVNQ0EgNVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIGEgYmV0dGVyIHdheSB0byBkZWFsIHdpdGggZXJyb3JzIHRoYXQgYXJlIHRocm93blxuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mcm9tUmVtb3RlID0gdGhpcy5mcm9tUmVtb3RlIHx8IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZVJlZik7XG5cbiAgICAgICAgdGhpcy5jb3B5UHJvcGVydGllcyA9IGZ1bmN0aW9uIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICB0aGlzW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgcHJvcGVydGllcyBmcm9tIHRoZSBkZWZpbmVQcm9wZXJ0aWVzIHZhbHVlIHByb3BlcnR5XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LmluaXQpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5ieVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IE9iamVjdFRlbXBsYXRlLmNsb25lKGRlZmluZVByb3BlcnR5LmluaXQsIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gKGRlZmluZVByb3BlcnR5LmluaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgdGVtcGxhdGVSZWYuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVJlZi5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fW2pdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fcHJvcF9fID0gZnVuY3Rpb24gZyhwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRoaXMuX190ZW1wbGF0ZV9fKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9fdmFsdWVzX18gPSBmdW5jdGlvbiBmKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkudmFsdWVzKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9fZGVzY3JpcHRpb25zX18gPSBmdW5jdGlvbiBlKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGFuIGluaXQgZnVuY3Rpb24gb3IgYXJlIGEgcmVtb3RlIGNyZWF0aW9uIGNhbGwgcGFyZW50IGNvbnN0cnVjdG9yIG90aGVyd2lzZSBjYWxsIGluaXRcbiAgICAgICAgLy8gIGZ1bmN0aW9uIHdobyB3aWxsIGJlIHJlc3BvbnNpYmxlIGZvciBjYWxsaW5nIHBhcmVudCBjb25zdHJ1Y3RvciB0byBhbGxvdyBmb3IgcGFyYW1ldGVyIHBhc3NpbmcuXG4gICAgICAgIGlmICh0aGlzLmZyb21SZW1vdGUgfHwgIXRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IG9iamVjdFRlbXBsYXRlLm5vSW5pdCkge1xuICAgICAgICAgICAgaWYgKHBhcmVudFRlbXBsYXRlICYmIHBhcmVudFRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRUZW1wbGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdFtpXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZV9fID0gdGVtcGxhdGVSZWY7XG5cbiAgICAgICAgdGhpcy50b0pTT05TdHJpbmcgPSBmdW5jdGlvbiB0b0pTT05TdHJpbmcoY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS50b0pTT05TdHJpbmcodGhpcywgY2IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qIENsb25lIGFuZCBvYmplY3QgY2FsbGluZyBhIGNhbGxiYWNrIGZvciBlYWNoIHJlZmVyZW5jZWQgb2JqZWN0LlxuICAgICAgICAgVGhlIGNhbGwgYmFjayBpcyBwYXNzZWQgKG9iaiwgcHJvcCwgdGVtcGxhdGUpXG4gICAgICAgICBvYmogLSB0aGUgcGFyZW50IG9iamVjdCAoZXhjZXB0IHRoZSBoaWdoZXN0IGxldmVsKVxuICAgICAgICAgcHJvcCAtIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgdGVtcGxhdGUgLSB0aGUgdGVtcGxhdGUgb2YgdGhlIG9iamVjdCB0byBiZSBjcmVhdGVkXG4gICAgICAgICB0aGUgZnVuY3Rpb24gcmV0dXJuczpcbiAgICAgICAgIC0gZmFsc3kgLSBjbG9uZSBvYmplY3QgYXMgdXN1YWwgd2l0aCBhIG5ldyBpZFxuICAgICAgICAgLSBvYmplY3QgcmVmZXJlbmNlIC0gdGhlIGNhbGxiYWNrIGNyZWF0ZWQgdGhlIG9iamVjdCAocHJlc3VtYWJseSB0byBiZSBhYmxlIHRvIHBhc3MgaW5pdCBwYXJhbWV0ZXJzKVxuICAgICAgICAgLSBbb2JqZWN0XSAtIGEgb25lIGVsZW1lbnQgYXJyYXkgb2YgdGhlIG9iamVjdCBtZWFucyBkb24ndCBjb3B5IHRoZSBwcm9wZXJ0aWVzIG9yIHRyYXZlcnNlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNyZWF0ZUNvcHkgPSBmdW5jdGlvbiBjcmVhdGVDb3B5KGNyZWF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5jcmVhdGVDb3B5KHRoaXMsIGNyZWF0b3IpO1xuICAgICAgICB9O1xuXG4gICAgfTtcblxuXG4gICAgbGV0IHJldHVyblZhbCA9IDxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgIHJldHVybiByZXR1cm5WYWwgYXMgQ29uc3RydWN0b3JUeXBlO1xufVxuIl19