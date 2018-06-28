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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMkM7QUFDM0MscURBQW9EO0FBMkNwRDs7Ozs7Ozs7R0FRRztBQUNILHFCQUFxQixJQUFJLEVBQUUsT0FBTztJQUM5QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7SUFFZixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7UUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDbkM7U0FDSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDakMsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUVaLElBQUksT0FBTyxFQUFFO1lBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUk7Z0JBQ3ZCLDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDTixrQ0FBa0M7b0JBQ2xDLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO2lCQUN0QjtZQUNMLENBQUMsQ0FBQyxDQUFDO1NBQ047S0FDSjtTQUNJLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSTtZQUN4QixHQUFHLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7S0FDTjtTQUNJO1FBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQztLQUNkO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsdUJBQXVCLEdBQUcsRUFBRSxLQUFLO0lBQzdCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUVsQixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtRQUNwQixJQUFJ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UUFBUSxDQUFDO0lBRW5DLE9BQU8sU0FBNEIsQ0FBQztBQUN4QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc2VyaWFsaXplciBmcm9tICcuL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHsgU3VwZXJ0eXBlTG9nZ2VyIH0gZnJvbSAnLi9TdXBlcnR5cGVMb2dnZXInO1xuZXhwb3J0IHR5cGUgQ3JlYXRlVHlwZUZvck5hbWUgPSB7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICB0b0NsaWVudD86IGJvb2xlYW47XG4gICAgdG9TZXJ2ZXI/OiBib29sZWFuO1xuICAgIGlzTG9jYWw/OiBib29sZWFuO1xufVxuXG5leHBvcnQgdHlwZSBHZXR0ZXIgPSB7XG4gICAgZ2V0OiBhbnk7XG59XG5cbi8qKlxuICogdGhpcyBpcyBwcmV0dHkgbXVjaCB0aGUgY2xhc3MgKHRoZSB0ZW1wbGF0ZSBpdHNlbGYpXG4gKiBUcnkgdG8gdW5pZnkgdGhpcyB3aXRoIHRoZSBTdXBlcnR5cGUgVHlwZSAobWF5YmUgbWFrZSB0aGlzIGEgcGFydGlhbCwgaGF2ZSBzdXBlcnR5cGUgZXh0ZW5kIHRoaXMpXG4gKi9cbmV4cG9ydCB0eXBlIENvbnN0cnVjdG9yVHlwZSA9IEZ1bmN0aW9uICYge1xuICAgIGFtb3JwaGljQ2xhc3NOYW1lOiBhbnk7XG4gICAgX19zaGFkb3dQYXJlbnRfXzogYW55O1xuICAgIHByb3BzPzogYW55O1xuICAgIF9fcGFyZW50X186IGFueTtcbiAgICBfX25hbWVfXzogYW55O1xuICAgIF9fY3JlYXRlUGFyYW1ldGVyc19fOiBhbnk7XG4gICAgZnVuY3Rpb25Qcm9wZXJ0aWVzOiBhbnk7XG4gICAgaXNPYmplY3RUZW1wbGF0ZTogYW55O1xuICAgIGV4dGVuZDogYW55O1xuICAgIHN0YXRpY01peGluOiBhbnk7XG4gICAgbWl4aW46IGFueTtcbiAgICBmcm9tUE9KTzogYW55O1xuICAgIGZyb21KU09OOiBhbnk7XG4gICAgZ2V0UHJvcGVydGllczogKGluY2x1ZGVWaXJ0dWFsKSA9PiBhbnk7XG4gICAgcHJvdG90eXBlOiBhbnk7XG4gICAgZGVmaW5lUHJvcGVydGllczogYW55O1xuICAgIG9iamVjdFByb3BlcnRpZXM6IGFueTtcbiAgICBwYXJlbnRUZW1wbGF0ZTogYW55O1xuICAgIGNyZWF0ZVByb3BlcnR5OiBhbnk7XG4gICAgX190ZW1wbGF0ZV9fOiBhbnk7XG4gICAgX19pbmplY3Rpb25zX186IGFueTtcbn1cblxuZXhwb3J0IHR5cGUgT2JqZWN0VGVtcGxhdGVDbG9uZSA9IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcblxuXG4vKipcbiAqIEFsbG93IHRoZSBwcm9wZXJ0eSB0byBiZSBlaXRoZXIgYSBib29sZWFuIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgYm9vbGVhbiBvciBhIHN0cmluZ1xuICogbWF0Y2hlZCBhZ2FpbnN0IGEgcnVsZSBzZXQgYXJyYXkgb2Ygc3RyaW5nIGluIE9iamVjdFRlbXBsYXRlXG4gKlxuICogQHBhcmFtICBwcm9wIHVua25vd25cbiAqIEBwYXJhbSBydWxlU2V0IHVua25vd25cbiAqXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb24odGhpczpPYmplY3RUZW1wbGF0ZSl9XG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NQcm9wKHByb3AsIHJ1bGVTZXQpIHtcbiAgICB2YXIgcmV0ID0gbnVsbDtcblxuICAgIGlmICh0eXBlb2YgKHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldCA9IHByb3AuY2FsbChPYmplY3RUZW1wbGF0ZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiAocHJvcCkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldCA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChydWxlU2V0KSB7XG4gICAgICAgICAgICBydWxlU2V0Lm1hcChmdW5jdGlvbiBpKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgYWx3YXlzIGV4ZWN1dGVcbiAgICAgICAgICAgICAgICBpZiAoIXJldCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkb3VibGUgZXF1YWxzIG9yIHNpbmdsZSBlcXVhbHM/XG4gICAgICAgICAgICAgICAgICAgIHJldCA9IHJ1bGUgPT0gcHJvcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChwcm9wIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgcHJvcC5mb3JFYWNoKGZ1bmN0aW9uIGgocHJvcCkge1xuICAgICAgICAgICAgcmV0ID0gcmV0IHx8IHByb2Nlc3NQcm9wKHByb3AsIHJ1bGVTZXQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldCA9IHByb3A7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gcHJ1bmVFeGlzdGluZyhvYmosIHByb3BzKSB7XG4gICAgdmFyIG5ld1Byb3BzID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHByb3BzKSB7XG4gICAgICAgIGlmICh0eXBlb2Yob2JqW3Byb3BdKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG5ld1Byb3BzW3Byb3BdID0gcHJvcHNbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3UHJvcHM7XG59XG5cbi8qKlxuICogdGhlIG9nIE9iamVjdFRlbXBsYXRlLCB3aGF0IGV2ZXJ5dGhpbmcgcGlja3Mgb2ZmIG9mXG4gKi9cbmV4cG9ydCBjbGFzcyBPYmplY3RUZW1wbGF0ZSB7XG5cbiAgICBzdGF0aWMgbGF6eVRlbXBsYXRlTG9hZDogYW55O1xuICAgIHN0YXRpYyBpc0xvY2FsUnVsZVNldDogYW55O1xuICAgIHN0YXRpYyBuZXh0SWQ6IGFueTsgLy8gZm9yIHN0YXNoT2JqZWN0XG4gICAgc3RhdGljIF9fZXhjZXB0aW9uc19fOiBhbnk7XG5cbiAgICBzdGF0aWMgX190ZW1wbGF0ZXNfXzogQ29uc3RydWN0b3JUeXBlW107XG4gICAgc3RhdGljIHRvU2VydmVyUnVsZVNldDogc3RyaW5nW107XG4gICAgc3RhdGljIHRvQ2xpZW50UnVsZVNldDogc3RyaW5nW107XG5cbiAgICBzdGF0aWMgdGVtcGxhdGVJbnRlcmNlcHRvcjogYW55O1xuICAgIHN0YXRpYyBfX2RpY3Rpb25hcnlfXzogeyBba2V5OiBzdHJpbmddOiBDb25zdHJ1Y3RvclR5cGUgfTtcbiAgICBzdGF0aWMgX19hbm9ueW1vdXNJZF9fOiBudW1iZXI7XG4gICAgc3RhdGljIF9fdGVtcGxhdGVzVG9JbmplY3RfXzoge307XG4gICAgc3RhdGljIGxvZ2dlcjogYW55O1xuICAgIHN0YXRpYyBfX3RlbXBsYXRlVXNhZ2VfXzogYW55O1xuICAgIHN0YXRpYyBfX2luamVjdGlvbnNfXzogRnVuY3Rpb25bXTtcbiAgICBzdGF0aWMgX190b0NsaWVudF9fOiBib29sZWFuO1xuXG4gICAgc3RhdGljIGFtb3JwaGljU3RhdGljID0gT2JqZWN0VGVtcGxhdGU7XG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIHBlcmZvcm1JbmplY3Rpb25zKCkge1xuICAgICAgICB0aGlzLmdldENsYXNzZXMoKTtcbiAgICAgICAgaWYgKHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fKSB7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RUZW1wbGF0ZSA9IHRoaXM7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgdGVtcGxhdGVOYW1lIGluIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfX1t0ZW1wbGF0ZU5hbWVdO1xuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuaW5qZWN0ID0gZnVuY3Rpb24gaW5qZWN0KGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmluamVjdCh0aGlzLCBpbmplY3Rvcik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2luamVjdEludG9UZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlVXNhZ2VfXyA9IHt9O1xuICAgICAgICB0aGlzLl9faW5qZWN0aW9uc19fID0gW107XG4gICAgICAgIHRoaXMuX19kaWN0aW9uYXJ5X18gPSB7fTtcbiAgICAgICAgdGhpcy5fX2Fub255bW91c0lkX18gPSAxO1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfXyA9IHt9O1xuICAgICAgICB0aGlzLmxvZ2dlciA9IHRoaXMuY3JlYXRlTG9nZ2VyKCk7IC8vIENyZWF0ZSBhIGRlZmF1bHQgbG9nZ2VyXG4gICAgfVxuXG4gICAgc3RhdGljIGdldFRlbXBsYXRlQnlOYW1lKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2xhc3NlcygpW25hbWVdO1xuICAgIH1cblxuICAgIC8qKlxuICogUHVycG9zZSB1bmtub3duXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBwcm9wcyB1bmtub3duXG4gKi9cbiAgICBzdGF0aWMgc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBwcm9wcykge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfX1tuYW1lXSA9IHRlbXBsYXRlO1xuICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fW25hbWVdID0gdGVtcGxhdGU7XG4gICAgICAgIHRlbXBsYXRlLl9fbmFtZV9fID0gbmFtZTtcbiAgICAgICAgdGVtcGxhdGUuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGVtcGxhdGUuX19vYmplY3RUZW1wbGF0ZV9fID0gdGhpcztcbiAgICAgICAgdGVtcGxhdGUuX19jaGlsZHJlbl9fID0gW107XG4gICAgICAgIHRlbXBsYXRlLl9fdG9DbGllbnRfXyA9IHByb3BzLl9fdG9DbGllbnRfXztcbiAgICAgICAgdGVtcGxhdGUuX190b1NlcnZlcl9fID0gcHJvcHMuX190b1NlcnZlcl9fO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wcyB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzKSB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZVByb3BlcnRpZXM6IHsgX190b0NsaWVudF9fPzogYW55OyBfX3RvU2VydmVyX18/OiBhbnkgfSA9IHt9O1xuXG4gICAgICAgIGlmIChPYmplY3RUZW1wbGF0ZS5fX3RvQ2xpZW50X18gPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHByb3BzLnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvY2Vzc1Byb3AocHJvcHMuaXNMb2NhbCwgdGhpcy5pc0xvY2FsUnVsZVNldCkpIHtcbiAgICAgICAgICAgIHByb3BzLnRvU2VydmVyID0gZmFsc2U7XG4gICAgICAgICAgICBwcm9wcy50b0NsaWVudCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcGxhdGVQcm9wZXJ0aWVzLl9fdG9DbGllbnRfXyA9IHByb2Nlc3NQcm9wKHByb3BzLnRvQ2xpZW50LCB0aGlzLnRvQ2xpZW50UnVsZVNldCkgIT0gZmFsc2U7XG4gICAgICAgIHRlbXBsYXRlUHJvcGVydGllcy5fX3RvU2VydmVyX18gPSBwcm9jZXNzUHJvcChwcm9wcy50b1NlcnZlciwgdGhpcy50b1NlcnZlclJ1bGVTZXQpICE9IGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZVByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICAgICogQ3JlYXRlIGFuIG9iamVjdCB0ZW1wbGF0ZSB0aGF0IGlzIGluc3RhbnRpYXRlZCB3aXRoIHRoZSBuZXcgb3BlcmF0b3IuXG4gICAgICAgICogcHJvcGVydGllcyBpc1xuICAgICAgICAqXG4gICAgICAgICogQHBhcmFtIHt1bmtub3dufSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB0ZW1wbGF0ZSBvciBhbiBvYmplY3Qgd2l0aFxuICAgICAgICAqICAgICAgICBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIGNsYXNzXG4gICAgICAgICogICAgICAgIHRvQ2xpZW50IC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIGNsaWVudCAod2l0aCBzZW1vdHVzKVxuICAgICAgICAqICAgICAgICB0b1NlcnZlciAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBzZXJ2ZXIgKHdpdGggc2Vtb3R1cylcbiAgICAgICAgKiAgICAgICAgaXNMb2NhbCAtIGVxdWl2YWxlbnQgdG8gc2V0dGluZyB0b0NsaWVudCAmJiB0b1NlcnZlciB0byBmYWxzZVxuICAgICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydGllcyBhbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyByZXByZXNlbnQgZGF0YSBhbmQgZnVuY3Rpb25cbiAgICAgICAgKiBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3QuICBUaGUgZGF0YSBwcm9wZXJ0aWVzIG1heSB1c2UgdGhlIGRlZmluZVByb3BlcnR5XG4gICAgICAgICogZm9ybWF0IGZvciBwcm9wZXJ0aWVzIG9yIG1heSBiZSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGEgTnVtYmVyLCBTdHJpbmcgb3IgRGF0ZS5cbiAgICAgICAgKlxuICAgICAgICAqIEByZXR1cm5zIHsqfSB0aGUgb2JqZWN0IHRlbXBsYXRlXG4gICAgICAgICovXG5cbiAgICBzdGF0aWMgY3JlYXRlKG5hbWU6IHN0cmluZyB8IENyZWF0ZVR5cGVGb3JOYW1lLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIC8qKiB0aGlzIGJsb2NrIG9ubHkgZXhlY3V0ZXMgb24gY3JlYXRldHlwZWZvcm5hbWUgKi9cbiAgICAgICAgaWYgKG5hbWUgJiYgISh0eXBlb2YgKG5hbWUpID09PSAnc3RyaW5nJykgJiYgbmFtZS5uYW1lKSB7XG4gICAgICAgICAgICB2YXIgcHJvcHMgPSBuYW1lO1xuICAgICAgICAgICAgbmFtZSA9IHByb3BzLm5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcm9wcyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAobmFtZSkgIT09ICdzdHJpbmcnIHx8IG5hbWUubWF0Y2goL1teQS1aYS16MC05X10vKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbmNvcnJlY3QgdGVtcGxhdGUgbmFtZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAocHJvcGVydGllcykgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgdGVtcGxhdGUgcHJvcGVydHkgZGVmaW5pdGlvbnMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNyZWF0ZVByb3BzID0gdGhpcy5nZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgKHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcignY3JlYXRlJywgbmFtZSwgcHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgT2JqZWN0LCBwcm9wZXJ0aWVzLCBjcmVhdGVQcm9wcywgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2NyZWF0ZVRlbXBsYXRlKG51bGwsIE9iamVjdCwgbmFtZSwgY3JlYXRlUHJvcHMsIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIGNyZWF0ZVByb3BzKTtcbiAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQcm9wc19fID0gcHJvcHM7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogRXh0ZW5kIGFuZCBleGlzdGluZyAocGFyZW50IHRlbXBsYXRlKVxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnRUZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB0ZW1wbGF0ZSBvciBhbiBvYmplY3Qgd2l0aFxuICAgICAqICAgICAgICBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIGNsYXNzXG4gICAgICogICAgICAgIHRvQ2xpZW50IC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIGNsaWVudCAod2l0aCBzZW1vdHVzKVxuICAgICAqICAgICAgICB0b1NlcnZlciAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBzZXJ2ZXIgKHdpdGggc2Vtb3R1cylcbiAgICAgKiAgICAgICAgaXNMb2NhbCAtIGVxdWl2YWxlbnQgdG8gc2V0dGluZyB0b0NsaWVudCAmJiB0b1NlcnZlciB0byBmYWxzZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydGllcyBhcmUgdGhlIHNhbWUgYXMgZm9yIGNyZWF0ZVxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IHRoZSBvYmplY3QgdGVtcGxhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgZXh0ZW5kKHBhcmVudFRlbXBsYXRlLCBuYW1lOiBzdHJpbmcgfCBDcmVhdGVUeXBlRm9yTmFtZSwgcHJvcGVydGllcykge1xuICAgICAgICBsZXQgcHJvcHM7XG4gICAgICAgIGxldCBjcmVhdGVQcm9wcztcblxuICAgICAgICBpZiAoIXBhcmVudFRlbXBsYXRlLl9fb2JqZWN0VGVtcGxhdGVfXykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbmNvcnJlY3QgcGFyZW50IHRlbXBsYXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgJiYgbmFtZS5uYW1lKSB7XG4gICAgICAgICAgICBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gcHJvcHMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzID0gcGFyZW50VGVtcGxhdGUuX19jcmVhdGVQcm9wc19fO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAobmFtZSkgIT09ICdzdHJpbmcnIHx8IG5hbWUubWF0Y2goL1teQS1aYS16MC05X10vKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbmNvcnJlY3QgdGVtcGxhdGUgbmFtZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAocHJvcGVydGllcykgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgdGVtcGxhdGUgcHJvcGVydHkgZGVmaW5pdGlvbnMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nVGVtcGxhdGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW25hbWVdO1xuXG4gICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fICE9IHBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUuX19wYXJlbnRfXy5fX25hbWVfXyAhPSBwYXJlbnRUZW1wbGF0ZS5fX25hbWVfXykge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTjogQXR0ZW1wdCB0byBleHRlbmQgJHtwYXJlbnRUZW1wbGF0ZS5fX25hbWVfX30gYXMgJHtuYW1lfSBidXQgJHtuYW1lfSB3YXMgYWxyZWFkeSBleHRlbmRlZCBmcm9tICR7ZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fLl9fbmFtZV9ffWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubWl4aW4oZXhpc3RpbmdUZW1wbGF0ZSwgcHJvcGVydGllcyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdUZW1wbGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9wcykge1xuICAgICAgICAgICAgY3JlYXRlUHJvcHMgPSB0aGlzLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mICh0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IoJ2V4dGVuZCcsIG5hbWUsIHByb3BlcnRpZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRlbXBsYXRlO1xuXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2NyZWF0ZVRlbXBsYXRlKG51bGwsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2NyZWF0ZVRlbXBsYXRlKG51bGwsIHBhcmVudFRlbXBsYXRlLCBuYW1lLCBwYXJlbnRUZW1wbGF0ZSwgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3JlYXRlUHJvcHMpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBjcmVhdGVQcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgcGFyZW50VGVtcGxhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUHJvcHNfXyA9IHByb3BzO1xuXG4gICAgICAgIC8vIE1haW50YWluIGdyYXBoIG9mIHBhcmVudCBhbmQgY2hpbGQgdGVtcGxhdGVzXG4gICAgICAgIHRlbXBsYXRlLl9fcGFyZW50X18gPSBwYXJlbnRUZW1wbGF0ZTtcbiAgICAgICAgcGFyZW50VGVtcGxhdGUuX19jaGlsZHJlbl9fLnB1c2godGVtcGxhdGUpO1xuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWl4aW4odGVtcGxhdGUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAodGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKCdjcmVhdGUnLCB0ZW1wbGF0ZS5fX25hbWVfXywgcHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlVGVtcGxhdGUodGVtcGxhdGUsIG51bGwsIHByb3BlcnRpZXMsIHRlbXBsYXRlLCB0ZW1wbGF0ZS5fX25hbWVfXyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAqXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydGllcyB1bmtub3duXG4gICAgKi9cbiAgICBzdGF0aWMgc3RhdGljTWl4aW4odGVtcGxhdGUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlW3Byb3BdID0gcHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIG9uIG9iamVjdCBjcmVhdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaW5qZWN0b3IgdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyBpbmplY3QodGVtcGxhdGUsIGluamVjdG9yOiBGdW5jdGlvbikge1xuICAgICAgICB0ZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5wdXNoKGluamVjdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBmdW5jdGlvbiB0aGF0IHdpbGwgZmlyZSBvbiBhbGwgb2JqZWN0IGNyZWF0aW9ucyAoYXBwYXJlbnRseSk/IEp1c3QgYSBndWVzc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaW5qZWN0b3IgLSB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIGdsb2JhbEluamVjdChpbmplY3RvcjogRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fX2luamVjdGlvbnNfXy5wdXNoKGluamVjdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGhlIHRlbXBsYXRlIGlmIGl0IG5lZWRzIHRvIGJlIGNyZWF0ZWRcbiAgICAgKiBAcGFyYW0gW3Vua25vd259IHRlbXBsYXRlIHRvIGJlIGNyZWF0ZWRcbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlSWZOZWVkZWQodGVtcGxhdGU/LCB0aGlzT2JqPykge1xuICAgICAgICBpZiAodGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18pIHtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZVBhcmFtZXRlcnMgPSB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXztcbiAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCBjcmVhdGVQYXJhbWV0ZXJzLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGNyZWF0ZVBhcmFtZXRlcnNbaXhdO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVRlbXBsYXRlKHBhcmFtc1swXSwgcGFyYW1zWzFdLCBwYXJhbXNbMl0sIHBhcmFtc1szXSwgcGFyYW1zWzRdLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5faW5qZWN0UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9pbmplY3RQcm9wZXJ0aWVzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpc09iaikge1xuICAgICAgICAgICAgICAgIC8vdmFyIGNvcHkgPSBuZXcgdGVtcGxhdGUoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm90b3R5cGVzID0gW3RlbXBsYXRlLnByb3RvdHlwZV07XG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudCA9IHRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgICAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBwcm90b3R5cGVzLnB1c2gocGFyZW50LnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5fX3BhcmVudF9fO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpeCA9IHByb3RvdHlwZXMubGVuZ3RoIC0gMTsgaXggPj0gMDsgLS1peCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb3RvdHlwZXNbaXhdKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMuZm9yRWFjaCgodmFsLCBpeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXNPYmosIHByb3BzW2l4XSwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90b3R5cGVzW2l4XSwgcHJvcHNbaXhdKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzT2JqLl9fcHJvdG9fXyA9IHRlbXBsYXRlLnByb3RvdHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDbGFzc2VzKCkge1xuICAgICAgICBpZiAodGhpcy5fX3RlbXBsYXRlc19fKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgdGhpcy5fX3RlbXBsYXRlc19fLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZXNfX1tpeF07XG4gICAgICAgICAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfX1tjb25zdHJ1Y3Rvck5hbWUodGVtcGxhdGUpXSA9IHRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW2NvbnN0cnVjdG9yTmFtZSh0ZW1wbGF0ZSldID0gdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlZmVycmVkVHlwZXModGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fX3RlbXBsYXRlc19fID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZU5hbWUxIGluIHRoaXMuX19kaWN0aW9uYXJ5X18pIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW3RlbXBsYXRlTmFtZTFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudFRlbXBsYXRlTmFtZSA9IGNvbnN0cnVjdG9yTmFtZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGVtcGxhdGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcik7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX19zaGFkb3dQYXJlbnRfXyA9IHRoaXMuX19kaWN0aW9uYXJ5X19bcGFyZW50VGVtcGxhdGVOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGUuX19zaGFkb3dQYXJlbnRfXykge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fLl9fc2hhZG93Q2hpbGRyZW5fXy5wdXNoKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucHJvcHMgPSB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wc3QgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BkIGluIHByb3BzdCkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wc1twcm9wZF0gPSBwcm9wc3RbcHJvcGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX19leGNlcHRpb25zX18ubWFwKGNyZWF0ZU1lc3NhZ2VMaW5lKS5qb2luKCdcXG4nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTWVzc2FnZUxpbmUoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhjZXB0aW9uLmZ1bmMoZXhjZXB0aW9uLmNsYXNzKCksIGV4Y2VwdGlvbi5wcm9wKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzRGVmZXJyZWRUeXBlcyh0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlLnByb3RvdHlwZS5fX2RlZmVycmVkVHlwZV9fKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRlbXBsYXRlLnByb3RvdHlwZS5fX2RlZmVycmVkVHlwZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmluZVByb3BlcnR5ID0gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gdGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX19bcHJvcF0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS50eXBlID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5Lm9mID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9fZGljdGlvbmFyeV9fO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbnN0cnVjdG9yTmFtZShjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgY29uc3QgbmFtZWRGdW5jdGlvbiA9IGNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXihdKikvKTtcbiAgICAgICAgICAgIHJldHVybiBuYW1lZEZ1bmN0aW9uID8gbmFtZWRGdW5jdGlvblsxXSA6IG51bGw7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGNhY2hlIG9yIGdsb2JhbGx5IGlkZW50aWZ5IG9iamVjdHNcbiAgICAgKiBBbHNvIGFzc2lnbnMgYSB1bmlxdWUgaW50ZXJuYWwgSWQgc28gdGhhdCBjb21wbGV4IHN0cnVjdHVyZXMgd2l0aFxuICAgICAqIHJlY3Vyc2l2ZSBvYmplY3RzIGNhbiBiZSBzZXJpYWxpemVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaiAtIHRoZSBvYmplY3QgdG8gYmUgcGFzc2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSAtIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX3N0YXNoT2JqZWN0KG9iaiwgdGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKCFvYmouX19pZF9fKSB7XG4gICAgICAgICAgICBpZiAoIU9iamVjdFRlbXBsYXRlLm5leHRJZCkge1xuICAgICAgICAgICAgICAgIE9iamVjdFRlbXBsYXRlLm5leHRJZCA9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9iai5fX2lkX18gPSAnbG9jYWwtJyArIHRlbXBsYXRlLl9fbmFtZV9fICsgJy0nICsgKytPYmplY3RUZW1wbGF0ZS5uZXh0SWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZGVuIGJ5IG90aGVyIFR5cGUgU3lzdGVtcyB0byBpbmplY3Qgb3RoZXIgZWxlbWVudHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7X3RlbXBsYXRlfSBfdGVtcGxhdGUgLSB0aGUgb2JqZWN0IHRvIGJlIHBhc3NlZCBkdXJpbmcgY3JlYXRpb24gdGltZVxuICAgICAqIFxuICAgICAqIEBwcml2YXRlXG4gICAgICogKi9cbiAgICBzdGF0aWMgX2luamVjdEludG9UZW1wbGF0ZShfdGVtcGxhdGUpIHsgfTtcblxuICAgIC8qKlxuICAgICAqIFVzZWQgYnkgdGVtcGxhdGUgc2V0dXAgdG8gY3JlYXRlIGFuIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yIHVzZSBieSB0aGUgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydHlOYW1lIGlzIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgaXMgdGhlIHByb3BlcnR5IGRlc2NyaXB0b3IgcGFzc2VkIHRvIHRoZSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqZWN0UHJvcGVydGllcyBpcyBhbGwgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgcHJvY2Vzc2VkIG1hbnVhbGx5LiAgQSBuZXcgcHJvcGVydHkgaXNcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZCB0byB0aGlzIGlmIHRoZSBwcm9wZXJ0eSBuZWVkcyB0byBiZSBpbml0aWFsaXplZCBieSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydGllcyBpcyBhbGwgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgQSBuZXcgcHJvcGVydHkgd2lsbCBiZSBhZGRlZCB0byB0aGlzIG9iamVjdFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX3NldHVwUHJvcGVydHkocHJvcGVydHlOYW1lLCBkZWZpbmVQcm9wZXJ0eSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB2YWx1ZSBuZWVkcyB0byBiZSByZS1pbml0aWFsaXplZCBpbiBjb25zdHJ1Y3RvclxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICBjb25zdCBieVZhbHVlID0gdmFsdWUgJiYgdHlwZW9mICh2YWx1ZSkgIT09ICdudW1iZXInICYmIHR5cGVvZiAodmFsdWUpICE9PSAnc3RyaW5nJztcblxuICAgICAgICBpZiAoYnlWYWx1ZSB8fCAhT2JqZWN0LmRlZmluZVByb3BlcnRpZXMgfHwgZGVmaW5lUHJvcGVydHkuZ2V0IHx8IGRlZmluZVByb3BlcnR5LnNldCkge1xuICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0ge1xuICAgICAgICAgICAgICAgIGluaXQ6IGRlZmluZVByb3BlcnR5LnZhbHVlLFxuICAgICAgICAgICAgICAgIHR5cGU6IGRlZmluZVByb3BlcnR5LnR5cGUsXG4gICAgICAgICAgICAgICAgb2Y6IGRlZmluZVByb3BlcnR5Lm9mLFxuICAgICAgICAgICAgICAgIGJ5VmFsdWVcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRlbGV0ZSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZW4gYSBzdXBlciBjbGFzcyBiYXNlZCBvbiBvYmplY3RUZW1wbGF0ZSBkb24ndCB0cmFuc3BvcnQgcHJvcGVydGllc1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b1NlcnZlciA9IGZhbHNlO1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b0NsaWVudCA9IGZhbHNlO1xuICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBkZWZpbmVQcm9wZXJ0eTtcblxuICAgICAgICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVyc1xuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuZ2V0IHx8IGRlZmluZVByb3BlcnR5LnNldCkge1xuICAgICAgICAgICAgY29uc3QgdXNlclNldHRlciA9IGRlZmluZVByb3BlcnR5LnNldDtcblxuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuc2V0ID0gKGZ1bmN0aW9uIGQoKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIGEgY2xvc3VyZSB0byByZWNvcmQgdGhlIHByb3BlcnR5IG5hbWUgd2hpY2ggaXMgbm90IHBhc3NlZCB0byB0aGUgc2V0dGVyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IHByb3BlcnR5TmFtZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBjKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyU2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHVzZXJTZXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRlZmluZVByb3BlcnR5LmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1tgX18ke3Byb3B9YF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCB1c2VyR2V0dGVyID0gZGVmaW5lUHJvcGVydHkuZ2V0O1xuXG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5nZXQgPSAoZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBjbG9zdXJlIHRvIHJlY29yZCBwcm9wZXJ0eSBuYW1lIHdoaWNoIGlzIG5vdCBwYXNzZWQgdG8gdGhlIGdldHRlclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBwcm9wZXJ0eU5hbWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gYigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckdldHRlci5jYWxsKHRoaXMsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1c2VyR2V0dGVyLmNhbGwodGhpcywgdGhpc1tgX18ke3Byb3B9YF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbYF9fJHtwcm9wfWBdO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBpZiAoIWRlZmluZVByb3BlcnR5LmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXNbYF9fJHtwcm9wZXJ0eU5hbWV9YF0gPSB7IGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkud3JpdGFibGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9uZSBhbiBvYmplY3QgY3JlYXRlZCBmcm9tIGFuIE9iamVjdFRlbXBsYXRlXG4gICAgICogVXNlZCBvbmx5IHdpdGhpbiBzdXBlcnR5cGUgKHNlZSBjb3B5T2JqZWN0IGZvciBnZW5lcmFsIGNvcHkpXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBzb3VyY2Ugb2JqZWN0XG4gICAgICogQHBhcmFtIHRlbXBsYXRlIGlzIHRoZSB0ZW1wbGF0ZSB1c2VkIHRvIGNyZWF0ZSB0aGUgb2JqZWN0XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gYSBjb3B5IG9mIHRoZSBvYmplY3RcbiAgICAgKi9cbiAgICAvLyBGdW5jdGlvbiB0byBjbG9uZSBzaW1wbGUgb2JqZWN0cyB1c2luZyBPYmplY3RUZW1wbGF0ZSBhcyBhIGd1aWRlXG4gICAgc3RhdGljIGNsb25lKG9iaiwgdGVtcGxhdGU/KSB7XG4gICAgICAgIGxldCBjb3B5O1xuXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUob2JqLmdldFRpbWUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGNvcHkgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IG9iai5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICBjb3B5W2l4XSA9IHRoaXMuY2xvbmUob2JqW2l4XSwgdGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZW1wbGF0ZSAmJiBvYmogaW5zdGFuY2VvZiB0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgY29weSA9IG5ldyB0ZW1wbGF0ZSgpO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3AgIT0gJ19faWRfXycgJiYgIShvYmpbcHJvcF0gaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0ZW1wbGF0ZSkgfHwge307XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29weVtwcm9wXSA9IHRoaXMuY2xvbmUob2JqW3Byb3BdLCBkZWZpbmVQcm9wZXJ0eS5vZiB8fCBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgICAgIGNvcHkgPSB7fTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wYyBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3BjKSkge1xuICAgICAgICAgICAgICAgICAgICBjb3B5W3Byb3BjXSA9IHRoaXMuY2xvbmUob2JqW3Byb3BjXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZGVuIGJ5IG90aGVyIFR5cGUgU3lzdGVtcyB0byBiZSBhYmxlIHRvIGNyZWF0ZSByZW1vdGUgZnVuY3Rpb25zIG9yXG4gICAgICogb3RoZXJ3aXNlIGludGVyY2VwdCBmdW5jdGlvbiBjYWxsc1xuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBfcHJvcGVydHlOYW1lIGlzIHRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydHlWYWx1ZSBpcyB0aGUgZnVuY3Rpb24gaXRzZWxmXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gYSBuZXcgZnVuY3Rpb24gdG8gYmUgYXNzaWduZWQgdG8gdGhlIG9iamVjdCBwcm90b3R5cGVcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9zZXR1cEZ1bmN0aW9uKF9wcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG4gICAgfTtcblxuICAgIC8qKlxuICogUHVycG9zZSB1bmtub3duXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSBvYmogdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBjcmVhdG9yIHVua25vd25cbiAqXG4gKiBAcmV0dXJucyB7dW5rbm93bn1cbiAqL1xuICAgIHN0YXRpYyBjcmVhdGVDb3B5KG9iaiwgY3JlYXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5mcm9tUE9KTyhvYmosIG9iai5fX3RlbXBsYXRlX18sIG51bGwsIG51bGwsIHVuZGVmaW5lZCwgbnVsbCwgbnVsbCwgY3JlYXRvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWJzdHJhY3QgZnVuY3Rpb24gZm9yIGJlbmVmaXQgb2YgU2Vtb3R1c1xuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjYiB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIHdpdGhvdXRDaGFuZ2VUcmFja2luZyhjYikge1xuICAgICAgICBjYigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwb2pvIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGlkTWFwIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGlkUXVhbGlmaWVyIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNyZWF0b3IgdW5rbm93blxuICAgICAqXG4gICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tUE9KTyA9IHNlcmlhbGl6ZXIuZnJvbVBPSk87XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICpcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gc3RyIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBpZFF1YWxpZmllciB1bmtub3duXG4gICAgKiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFF1YWxpZmllcilcbiAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICovXG4gICAgc3RhdGljIGZyb21KU09OID0gc2VyaWFsaXplci5mcm9tSlNPTjtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYW4gb2JqZWN0IHRvIEpTT04sIHN0cmlwcGluZyBhbnkgcmVjdXJzaXZlIG9iamVjdCByZWZlcmVuY2VzIHNvIHRoZXkgY2FuIGJlXG4gICAgICogcmVjb25zdGl0dXRlZCBsYXRlclxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBvYmogdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY2IgdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICovXG4gICAgc3RhdGljIHRvSlNPTlN0cmluZyA9IHNlcmlhbGl6ZXIudG9KU09OU3RyaW5nO1xuXG4gICAgICAgICAvKipcbiAgICAgLyoqXG4gICAgICAqIEZpbmQgdGhlIHJpZ2h0IHN1YmNsYXNzIHRvIGluc3RhbnRpYXRlIGJ5IGVpdGhlciBsb29raW5nIGF0IHRoZVxuICAgICAgKiBkZWNsYXJlZCBsaXN0IGluIHRoZSBzdWJDbGFzc2VzIGRlZmluZSBwcm9wZXJ0eSBvciB3YWxraW5nIHRocm91Z2hcbiAgICAgICogdGhlIHN1YmNsYXNzZXMgb2YgdGhlIGRlY2xhcmVkIHRlbXBsYXRlXG4gICAgICAqXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaklkIHVua25vd25cbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgKiBAcHJpdmF0ZVxuICAgICAgKi9cbiAgICAgc3RhdGljIF9yZXNvbHZlU3ViQ2xhc3ModGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICBsZXQgdGVtcGxhdGVOYW1lID0gJyc7XG5cbiAgICAgICAgaWYgKG9iaklkLm1hdGNoKC8tKFtBLVphLXowLTlfOl0qKS0vKSkge1xuICAgICAgICAgICAgdGVtcGxhdGVOYW1lID0gUmVnRXhwLiQxO1xuICAgICAgICB9XG5cbiAgICAvLyBSZXNvbHZlIHRlbXBsYXRlIHN1YmNsYXNzIGZvciBwb2x5bW9ycGhpYyBpbnN0YW50aWF0aW9uXG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eSAmJiBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzICYmIG9iaklkICE9ICdhbm9ueW1vdXMpJykge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVOYW1lID09IGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXNbaXhdLl9fbmFtZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXNbaXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3ViQ2xhc3MgPSB0aGlzLl9maW5kU3ViQ2xhc3ModGVtcGxhdGUsIHRlbXBsYXRlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWJDbGFzcykge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gc3ViQ2xhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhbGsgcmVjdXJzaXZlbHkgdGhyb3VnaCBleHRlbnNpb25zIG9mIHRlbXBsYXRlIHZpYSBfX2NoaWxkcmVuX19cbiAgICAgKiBsb29raW5nIGZvciBhIG5hbWUgbWF0Y2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGVOYW1lIHVua25vd25cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZmluZFN1YkNsYXNzKHRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlLl9fbmFtZV9fID09IHRlbXBsYXRlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IHRlbXBsYXRlLl9fY2hpbGRyZW5fXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gdGhpcy5fZmluZFN1YkNsYXNzKHRlbXBsYXRlLl9fY2hpbGRyZW5fX1tpeF0sIHRlbXBsYXRlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWJDbGFzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJDbGFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgaGlnaGVzdCBsZXZlbCB0ZW1wbGF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXRCYXNlQ2xhc3ModGVtcGxhdGUpIHtcbiAgICAgICAgd2hpbGUgKHRlbXBsYXRlLl9fcGFyZW50X18pIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICAgICAgIC8qKlxuICAgICAgKiBBbiBvdmVycmlkYWJsZSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhbiBvYmplY3QgZnJvbSBhIHRlbXBsYXRlIGFuZCBvcHRpb25hbGx5XG4gICAgICAqIG1hbmFnZSB0aGUgY2FjaGluZyBvZiB0aGF0IG9iamVjdCAodXNlZCBieSBkZXJpdmF0aXZlIHR5cGUgc3lzdGVtcykuICBJdFxuICAgICAgKiBwcmVzZXJ2ZXMgdGhlIG9yaWdpbmFsIGlkIG9mIGFuIG9iamVjdFxuICAgICAgKlxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIG9mIG9iamVjdFxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaklkIGFuZCBpZCAoaWYgcHJlc2VudClcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgKiBAcHJpdmF0ZVxuICAgICAgKi9cbiAgICAgc3RhdGljIF9jcmVhdGVFbXB0eU9iamVjdCh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5fcmVzb2x2ZVN1YkNsYXNzKHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHkpO1xuXG4gICAgICAgIGNvbnN0IG9sZFN0YXNoT2JqZWN0ID0gdGhpcy5fc3Rhc2hPYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iaklkKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFzaE9iamVjdCA9IGZ1bmN0aW9uIHN0YXNoT2JqZWN0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gbmV3IHRlbXBsYXRlKCk7XG4gICAgICAgIHRoaXMuX3N0YXNoT2JqZWN0ID0gb2xkU3Rhc2hPYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iaklkKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZS5fX2lkX18gPSBvYmpJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rcyB1cCBhIHByb3BlcnR5IGluIHRoZSBkZWZpbmVQcm9wZXJ0aWVzIHNhdmVkIHdpdGggdGhlIHRlbXBsYXRlIGNhc2NhZGluZ1xuICAgICAqIHVwIHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gZmluZCBpdFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wIGlzIHRoZSBwcm9wZXJ0eSBiZWluZyBzb3VnaHRcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIGlzIHRoZSB0ZW1wbGF0ZSB1c2VkIHRvIGNyZWF0ZSB0aGUgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHByb3BlcnR5XG4gICAgICogQHJldHVybnMgeyp9IHRoZSBcImRlZmluZVByb3BlcnR5XCIgc3RydWN0dXJlIGZvciB0aGUgcHJvcGVydHlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlICYmICh0ZW1wbGF0ZSAhPSBPYmplY3QpICYmIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMgJiYgdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGVtcGxhdGUgJiYgdGVtcGxhdGUucGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgaGFzaCBvZiBhbGwgcHJvcGVydGllcyBpbmNsdWRpbmcgdGhvc2UgaW5oZXJpdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIGlzIHRoZSB0ZW1wbGF0ZSB1c2VkIHRvIGNyZWF0ZSB0aGUgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHByb3BlcnR5XG4gICAgICogQHBhcmFtIHt1bmtub3dufSByZXR1cm5WYWx1ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpbmNsdWRlVmlydHVhbCB1bmtub3duXG4gICAgICogQHJldHVybnMgeyp9IGFuIGFzc29jaWF0aXZlIGFycmF5IG9mIGVhY2ggXCJkZWZpbmVQcm9wZXJ0eVwiIHN0cnVjdHVyZSBmb3IgdGhlIHByb3BlcnR5XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUsIHJldHVyblZhbHVlLCBpbmNsdWRlVmlydHVhbCkge1xuICAgICAgICBpZiAoIXJldHVyblZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVWaXJ0dWFsIHx8ICF0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdLmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZVtwcm9wXSA9IHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlLCByZXR1cm5WYWx1ZSwgaW5jbHVkZVZpcnR1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEdlbmVyYWwgZnVuY3Rpb24gdG8gY3JlYXRlIHRlbXBsYXRlcyB1c2VkIGJ5IGNyZWF0ZSwgZXh0ZW5kIGFuZCBtaXhpblxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBtaXhpblRlbXBsYXRlIC0gdGVtcGxhdGUgdXNlZCBmb3IgYSBtaXhpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50VGVtcGxhdGUgLSB0ZW1wbGF0ZSB1c2VkIGZvciBhbiBleHRlbmRcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXNPclRlbXBsYXRlIC0gcHJvcGVydGllcyB0byBiZSBhZGRlZC9teGllZCBpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRlUHJvcGVydGllcyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZU5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgYXMgaXQgd2lsbCBiZSBzdG9yZWQgcmV0cmlldmVkIGZyb20gZGljdGlvbmFyeVxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfY3JlYXRlVGVtcGxhdGUobWl4aW5UZW1wbGF0ZT8sIHBhcmVudFRlbXBsYXRlPywgcHJvcGVydGllc09yVGVtcGxhdGU/LCBjcmVhdGVQcm9wZXJ0aWVzPywgdGVtcGxhdGVOYW1lPywgY3JlYXRlVGVtcGxhdGVOb3c/KSB7XG4gICAgICAgIC8vIFdlIHdpbGwgcmV0dXJuIGEgY29uc3RydWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBpbiBhIG5ldyBmdW5jdGlvblxuICAgICAgICAvLyB0aGF0IHdpbGwgY2FsbCBhbiBpbml0KCkgZnVuY3Rpb24gZm91bmQgaW4gcHJvcGVydGllcywgZGVmaW5lIHByb3BlcnRpZXMgdXNpbmcgT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgICAgICAgLy8gYW5kIG1ha2UgY29waWVzIG9mIHRob3NlIHRoYXQgYXJlIHJlYWxseSBvYmplY3RzXG4gICAgICAgIHZhciBmdW5jdGlvblByb3BlcnRpZXM6YW55ID0ge307ICAgIC8vIFdpbGwgYmUgcG9wdWxhdGVkIHdpdGggaW5pdCBmdW5jdGlvbiBmcm9tIHByb3BlcnRpZXNcbiAgICAgICAgdmFyIG9iamVjdFByb3BlcnRpZXMgPSB7fTsgICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIGJlIHByb2Nlc3NlZCBieSBoYW5kXG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0aWVzID0ge307ICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBzZW50IHRvIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKClcbiAgICAgICAgdmFyIG9iamVjdFRlbXBsYXRlID0gdGhpcztcbiAgICAgICAgdmFyIHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIGZ1bmN0aW9uIEYoKSB7IH0gICAgIC8vIFVzZWQgaW4gY2FzZSBvZiBleHRlbmRcblxuICAgICAgICBpZiAoIXRoaXMubGF6eVRlbXBsYXRlTG9hZCkge1xuICAgICAgICAgICAgY3JlYXRlVGVtcGxhdGVOb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNldHVwIHZhcmlhYmxlcyBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgY2FsbCAoY3JlYXRlLCBleHRlbmQsIG1peGluKVxuICAgICAgICBpZiAoY3JlYXRlVGVtcGxhdGVOb3cpIHtcbiAgICAgICAgICAgIGlmIChtaXhpblRlbXBsYXRlKSB7ICAgICAgICAvLyBNaXhpblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQobWl4aW5UZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNPclRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChwcm9wZXJ0aWVzT3JUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdID0gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BwIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllc1twcm9wcF0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzW3Byb3BwXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BvIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BvID09ICdpbml0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgPSBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0Lmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0LnB1c2gocHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXRbaXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllc1twcm9wb10gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXNbcHJvcG9dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG4gaW4gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcERlc2MgPSA8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4sIHByb3BEZXNjKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYy5nZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4pKS5nZXQuc291cmNlVGVtcGxhdGUgPSBwcm9wRGVzYy5nZXQuc291cmNlVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGVbcHJvcG5dID0gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlW3Byb3BuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvcHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyhtaXhpblRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BtIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3BzW3Byb3BtXSA9IHByb3BzW3Byb3BtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaXhpblRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25Qcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFRlbXBsYXRlID0gbWl4aW5UZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgICAgICAgIC8vIEV4dGVuZFxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQocGFyZW50VGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIEYucHJvdG90eXBlID0gcGFyZW50VGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbmV3IEYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0b3IgdGhhdCB3aWxsIGJlIHJldHVybmVkIHdpbGwgb25seSBldmVyIGJlIGNyZWF0ZWQgb25jZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHRlbXBsYXRlOiBDb25zdHJ1Y3RvclR5cGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW3RlbXBsYXRlTmFtZV0gfHxcbiAgICAgICAgICAgIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSlcblxuXG4gICAgICAgIHRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUgPSB0cnVlO1xuXG4gICAgICAgIHRlbXBsYXRlLmV4dGVuZCA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLmV4dGVuZC5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUubWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5taXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUuc3RhdGljTWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5zdGF0aWNNaXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcblxuICAgICAgICB0ZW1wbGF0ZS5mcm9tUE9KTyA9IChwb2pvKSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGVtcGxhdGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRlbXBsYXRlLmZyb21KU09OID0gKHN0ciwgaWRQcmVmaXgpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFByZWZpeCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVtcGxhdGUuZ2V0UHJvcGVydGllcyA9IChpbmNsdWRlVmlydHVhbCkgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWNyZWF0ZVRlbXBsYXRlTm93KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fIHx8IFtdO1xuICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18ucHVzaChbbWl4aW5UZW1wbGF0ZSwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzLCB0ZW1wbGF0ZU5hbWVdKTtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlLnByb3RvdHlwZSA9IHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIHZhciBjcmVhdGVQcm9wZXJ0eSA9IGNyZWF0ZVByb3BlcnR5RnVuYy5iaW5kKG51bGwsIGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlKTtcblxuXG4gICAgICAgIC8vIFdhbGsgdGhyb3VnaCBwcm9wZXJ0aWVzIGFuZCBjb25zdHJ1Y3QgdGhlIGRlZmluZVByb3BlcnRpZXMgaGFzaCBvZiBwcm9wZXJ0aWVzLCB0aGUgbGlzdCBvZlxuICAgICAgICAvLyBvYmplY3RQcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0byBiZSByZWluc3RhbnRpYXRlZCBhbmQgYXR0YWNoIGZ1bmN0aW9ucyB0byB0aGUgcHJvdG90eXBlXG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlUHJvcGVydHkocHJvcGVydHlOYW1lLCBudWxsLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzID0gZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgdGVtcGxhdGUub2JqZWN0UHJvcGVydGllcyA9IG9iamVjdFByb3BlcnRpZXM7XG5cbiAgICAgICAgdGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzID0gZnVuY3Rpb25Qcm9wZXJ0aWVzO1xuICAgICAgICB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSA9IHBhcmVudFRlbXBsYXRlO1xuXG5cbiAgICAgICAgdGVtcGxhdGUuY3JlYXRlUHJvcGVydHkgPSBjcmVhdGVQcm9wZXJ0eTtcblxuICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuXG4gICAgICAgIHZhciBwcm9wc3QgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgICBmb3IgKHZhciBwcm9wZCBpbiBwcm9wc3QpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0byBjbG9uZSB0aGUgVHlwZSBTeXN0ZW1cbiAgICAgKiBAcmV0dXJucyB7b31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfY3JlYXRlT2JqZWN0KCk6IE9iamVjdFRlbXBsYXRlQ2xvbmUge1xuICAgICAgICBjb25zdCBuZXdGb28gPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xuICAgICAgICBuZXdGb28uaW5pdCgpO1xuICAgICAgICByZXR1cm4gbmV3Rm9vO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IG9yaWdpbmFsbHkgdG9vayBhIGNvbnRleHQgdGhhdCBpdCB0aHJldyBhd2F5XG4gICAgKiBAcmV0dXJucyB7U3VwZXJ0eXBlTG9nZ2VyfVxuICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUxvZ2dlcigpOiBTdXBlcnR5cGVMb2dnZXIge1xuICAgICAgICByZXR1cm4gbmV3IFN1cGVydHlwZUxvZ2dlcigpO1xuICAgIH1cbiAgICBcblxufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVByb3BlcnR5RnVuYyhmdW5jdGlvblByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLCBvYmplY3RUZW1wbGF0ZSwgdGVtcGxhdGVOYW1lLCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSxcbiAgICBwcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUsIHByb3BlcnRpZXMsIGNyZWF0ZVByb3BlcnRpZXMpIHtcbiAgICBpZiAoIXByb3BlcnRpZXMpIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJlY29yZCB0aGUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25cbiAgICBpZiAocHJvcGVydHlOYW1lID09ICdpbml0JyAmJiB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgPSBbcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBudWxsOyAvLyBkZWZpbmVQcm9wZXJ0eSB0byBiZSBhZGRlZCB0byBkZWZpbmVQcm9wZXJ0aWVzXG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBwcm9wZXJ0eSB2YWx1ZSB3aGljaCBtYXkgYmUgYSBkZWZpbmVQcm9wZXJ0aWVzIHN0cnVjdHVyZSBvciBqdXN0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgdmFyIGRlc2NyaXB0b3I6YW55ID0ge307XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3BlcnRpZXMsIHByb3BlcnR5TmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdHlwZSA9ICdudWxsJztcblxuICAgICAgICBpZiAoZGVzY3JpcHRvci5nZXQgfHwgZGVzY3JpcHRvci5zZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZ2V0c2V0JztcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIC8vIEZpZ3VyZSBvdXQgd2hldGhlciB0aGlzIGlzIGEgZGVmaW5lUHJvcGVydHkgc3RydWN0dXJlIChoYXMgYSBjb25zdHJ1Y3RvciBvZiBvYmplY3QpXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiAvLyBPciBhcnJheVxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSByZW1vdGUgZnVuY3Rpb24gY2FsbHNcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHkgJiYgdHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHksIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vbiwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnZhbGlkYXRlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub2YpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fcmV0dXJuc2FycmF5X18gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX29uX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub247XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX192YWxpZGF0ZV9fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnZhbGlkYXRlO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fYm9keV9fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS53cml0YWJsZSA9IHRydWU7IC8vIFdlIGFyZSB1c2luZyBzZXR0ZXJzXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmVudW1lcmFibGUpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmVudW1lcmFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBPdGhlciBjcmFwXG4gICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0gPSBvYmplY3RUZW1wbGF0ZS5fc2V0dXBGdW5jdGlvbihwcm9wZXJ0eU5hbWUsIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZ2V0c2V0JzogLy8gZ2V0dGVycyBhbmQgc2V0dGVyc1xuICAgICAgICAgICAgICAgIGRlc2NyaXB0b3IudGVtcGxhdGVTb3VyY2UgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRlbXBsYXRlUHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsIGRlc2NyaXB0b3IpO1xuICAgICAgICAgICAgICAgICg8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGVtcGxhdGVQcm90b3R5cGUsIHByb3BlcnR5TmFtZSkpLmdldC5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZGVmaW5lUHJvcGVydHkgdG8gYmUgYWRkZWRcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudG9DbGllbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudG9DbGllbnQgPSBkZXNjcmlwdG9yLnRvQ2xpZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yLnRvU2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnRvU2VydmVyID0gZGVzY3JpcHRvci50b1NlcnZlcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX3NldHVwUHJvcGVydHkocHJvcGVydHlOYW1lLCBkZWZpbmVQcm9wZXJ0eSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIGNyZWF0ZVByb3BlcnRpZXMpO1xuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuc291cmNlVGVtcGxhdGUgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5mdW5jdGlvbiBiaW5kUGFyYW1zKHRlbXBsYXRlTmFtZSwgb2JqZWN0VGVtcGxhdGUsIGZ1bmN0aW9uUHJvcGVydGllcyxcbiAgICBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgcHJvcGVydGllc09yVGVtcGxhdGUsXG4gICAgY3JlYXRlUHJvcGVydGllcywgb2JqZWN0UHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsXG4gICAgY3JlYXRlVGVtcGxhdGVOb3csIG1peGluVGVtcGxhdGUpIHtcblxuICAgIGZ1bmN0aW9uIHRlbXBsYXRlKCkge1xuICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSwgdGhpcyk7XG4gICAgICAgIGxldCB0ZW1wbGF0ZVJlZjogQ29uc3RydWN0b3JUeXBlID0gPENvbnN0cnVjdG9yVHlwZT48RnVuY3Rpb24+dGVtcGxhdGU7XG5cbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZVVzYWdlX19bdGVtcGxhdGVSZWYuX19uYW1lX19dID0gdHJ1ZTtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRlbXBsYXRlUmVmLl9fcGFyZW50X187XG4gICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVVc2FnZV9fW3BhcmVudC5fX25hbWVfX10gPSB0cnVlO1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHBhcmVudC5fX3BhcmVudF9fO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlX18gPSB0ZW1wbGF0ZVJlZjtcblxuICAgICAgICBpZiAob2JqZWN0VGVtcGxhdGUuX190cmFuc2llbnRfXykge1xuICAgICAgICAgICAgdGhpcy5fX3RyYW5zaWVudF9fID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzID0gcHJ1bmVFeGlzdGluZyh0aGlzLCB0ZW1wbGF0ZVJlZi5vYmplY3RQcm9wZXJ0aWVzKTtcbiAgICAgICAgdmFyIHBydW5lZERlZmluZVByb3BlcnRpZXMgPSBwcnVuZUV4aXN0aW5nKHRoaXMsIHRlbXBsYXRlUmVmLmRlZmluZVByb3BlcnRpZXMpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgcHJvcGVydGllcyBlaXRoZXIgd2l0aCBFTUNBIDUgZGVmaW5lUHJvcGVydGllcyBvciBieSBoYW5kXG4gICAgICAgICAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCBwcnVuZWREZWZpbmVQcm9wZXJ0aWVzKTsgLy8gVGhpcyBtZXRob2Qgd2lsbCBiZSBhZGRlZCBwcmUtRU1DQSA1XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGZpbmQgYSBiZXR0ZXIgd2F5IHRvIGRlYWwgd2l0aCBlcnJvcnMgdGhhdCBhcmUgdGhyb3duXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZyb21SZW1vdGUgPSB0aGlzLmZyb21SZW1vdGUgfHwgb2JqZWN0VGVtcGxhdGUuX3N0YXNoT2JqZWN0KHRoaXMsIHRlbXBsYXRlUmVmKTtcblxuICAgICAgICB0aGlzLmNvcHlQcm9wZXJ0aWVzID0gZnVuY3Rpb24gY29weVByb3BlcnRpZXMob2JqKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgICAgIHRoaXNbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBwcm9wZXJ0aWVzIGZyb20gdGhlIGRlZmluZVByb3BlcnRpZXMgdmFsdWUgcHJvcGVydHlcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIHBydW5lZE9iamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHBydW5lZE9iamVjdFByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkuaW5pdCkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmJ5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gT2JqZWN0VGVtcGxhdGUuY2xvbmUoZGVmaW5lUHJvcGVydHkuaW5pdCwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZV0gPSAoZGVmaW5lUHJvcGVydHkuaW5pdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBUZW1wbGF0ZSBsZXZlbCBpbmplY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCB0ZW1wbGF0ZVJlZi5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlUmVmLl9faW5qZWN0aW9uc19fW2l4XS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2xvYmFsIGluamVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX19bal0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX19wcm9wX18gPSBmdW5jdGlvbiBnKHByb3ApIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGhpcy5fX3RlbXBsYXRlX18pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX192YWx1ZXNfXyA9IGZ1bmN0aW9uIGYocHJvcCkge1xuICAgICAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gdGhpcy5fX3Byb3BfXyhwcm9wKSB8fCB0aGlzLl9fcHJvcF9fKCdfJyArIHByb3ApO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS52YWx1ZXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX19kZXNjcmlwdGlvbnNfXyA9IGZ1bmN0aW9uIGUocHJvcCkge1xuICAgICAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gdGhpcy5fX3Byb3BfXyhwcm9wKSB8fCB0aGlzLl9fcHJvcF9fKCdfJyArIHByb3ApO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gaW5pdCBmdW5jdGlvbiBvciBhcmUgYSByZW1vdGUgY3JlYXRpb24gY2FsbCBwYXJlbnQgY29uc3RydWN0b3Igb3RoZXJ3aXNlIGNhbGwgaW5pdFxuICAgICAgICAvLyAgZnVuY3Rpb24gd2hvIHdpbGwgYmUgcmVzcG9uc2libGUgZm9yIGNhbGxpbmcgcGFyZW50IGNvbnN0cnVjdG9yIHRvIGFsbG93IGZvciBwYXJhbWV0ZXIgcGFzc2luZy5cbiAgICAgICAgaWYgKHRoaXMuZnJvbVJlbW90ZSB8fCAhdGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgfHwgb2JqZWN0VGVtcGxhdGUubm9Jbml0KSB7XG4gICAgICAgICAgICBpZiAocGFyZW50VGVtcGxhdGUgJiYgcGFyZW50VGVtcGxhdGUuaXNPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcmVudFRlbXBsYXRlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0W2ldLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlX18gPSB0ZW1wbGF0ZVJlZjtcblxuICAgICAgICB0aGlzLnRvSlNPTlN0cmluZyA9IGZ1bmN0aW9uIHRvSlNPTlN0cmluZyhjYikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLnRvSlNPTlN0cmluZyh0aGlzLCBjYik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyogQ2xvbmUgYW5kIG9iamVjdCBjYWxsaW5nIGEgY2FsbGJhY2sgZm9yIGVhY2ggcmVmZXJlbmNlZCBvYmplY3QuXG4gICAgICAgICBUaGUgY2FsbCBiYWNrIGlzIHBhc3NlZCAob2JqLCBwcm9wLCB0ZW1wbGF0ZSlcbiAgICAgICAgIG9iaiAtIHRoZSBwYXJlbnQgb2JqZWN0IChleGNlcHQgdGhlIGhpZ2hlc3QgbGV2ZWwpXG4gICAgICAgICBwcm9wIC0gdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICB0ZW1wbGF0ZSAtIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgb2JqZWN0IHRvIGJlIGNyZWF0ZWRcbiAgICAgICAgIHRoZSBmdW5jdGlvbiByZXR1cm5zOlxuICAgICAgICAgLSBmYWxzeSAtIGNsb25lIG9iamVjdCBhcyB1c3VhbCB3aXRoIGEgbmV3IGlkXG4gICAgICAgICAtIG9iamVjdCByZWZlcmVuY2UgLSB0aGUgY2FsbGJhY2sgY3JlYXRlZCB0aGUgb2JqZWN0IChwcmVzdW1hYmx5IHRvIGJlIGFibGUgdG8gcGFzcyBpbml0IHBhcmFtZXRlcnMpXG4gICAgICAgICAtIFtvYmplY3RdIC0gYSBvbmUgZWxlbWVudCBhcnJheSBvZiB0aGUgb2JqZWN0IG1lYW5zIGRvbid0IGNvcHkgdGhlIHByb3BlcnRpZXMgb3IgdHJhdmVyc2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY3JlYXRlQ29weSA9IGZ1bmN0aW9uIGNyZWF0ZUNvcHkoY3JlYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLmNyZWF0ZUNvcHkodGhpcywgY3JlYXRvcik7XG4gICAgICAgIH07XG5cbiAgICB9O1xuXG5cbiAgICBsZXQgcmV0dXJuVmFsID0gPEZ1bmN0aW9uPnRlbXBsYXRlO1xuXG4gICAgcmV0dXJuIHJldHVyblZhbCBhcyBDb25zdHJ1Y3RvclR5cGU7XG59XG4iXX0=