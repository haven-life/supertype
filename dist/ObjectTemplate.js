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
    Object.defineProperty(ObjectTemplate, "statsDClient", {
        /**
         * Gets the statsDClient
         *
         * The statsDClient may be on the amorphic object, but it will always
         * redirect instead to the statsReference on amorphicStatic
         *
         * @static
         * @type {(StatsDClient | undefined)}
         * @memberof ObjectTemplate
         */
        get: function () {
            return this.amorphicStatic.__statsClient;
        },
        /**
         * Sets the statsDClient reference on amorphicStatic
         *
         * @static
         * @type {(StatsDClient | undefined)}
         * @memberof ObjectTemplate
         */
        set: function (statsClient) {
            this.amorphicStatic.__statsClient = statsClient;
        },
        enumerable: true,
        configurable: true
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMkM7QUFDM0MscURBQW9EO0FBZ0RwRDs7Ozs7Ozs7R0FRRztBQUNILHFCQUFxQixJQUFJLEVBQUUsT0FBTztJQUM5QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7SUFFZixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7UUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDbkM7U0FDSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDakMsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUVaLElBQUksT0FBTyxFQUFFO1lBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUk7Z0JBQ3ZCLDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDTixrQ0FBa0M7b0JBQ2xDLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO2lCQUN0QjtZQUNMLENBQUMsQ0FBQyxDQUFDO1NBQ047S0FDSjtTQUNJLElBQUksSUFBSSxZQUFZLEtBQUssRUFBRTtRQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSTtZQUN4QixHQUFHLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7S0FDTjtTQUNJO1FBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQztLQUNkO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsdUJBQXVCLEdBQUcsRUFBRSxLQUFLO0lBQzdCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUVsQixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtRQUNwQixJQUFJ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RSxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7OztXQVNHO1FBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxvQkFBb0IsT0FBTztZQUN6QyxPQUFPLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQztJQUVOLENBQUM7SUFBQSxDQUFDO0lBR0YsSUFBSSxTQUFTLEdBQWEsUUFBUSxDQUFDO0lBRW5DLE9BQU8sU0FBNEIsQ0FBQztBQUN4QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc2VyaWFsaXplciBmcm9tICcuL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHsgU3VwZXJ0eXBlTG9nZ2VyIH0gZnJvbSAnLi9TdXBlcnR5cGVMb2dnZXInO1xuaW1wb3J0IHsgU3RhdHNEQ2xpZW50IH0gZnJvbSAnLi9TdGF0c0RDbGllbnQnO1xuZXhwb3J0IHR5cGUgQ3JlYXRlVHlwZUZvck5hbWUgPSB7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICB0b0NsaWVudD86IGJvb2xlYW47XG4gICAgdG9TZXJ2ZXI/OiBib29sZWFuO1xuICAgIGlzTG9jYWw/OiBib29sZWFuO1xufVxuXG5leHBvcnQgdHlwZSBHZXR0ZXIgPSB7XG4gICAgZ2V0OiBhbnk7XG59XG5cbi8qKlxuICogdGhpcyBpcyBwcmV0dHkgbXVjaCB0aGUgY2xhc3MgKHRoZSB0ZW1wbGF0ZSBpdHNlbGYpXG4gKiBUcnkgdG8gdW5pZnkgdGhpcyB3aXRoIHRoZSBTdXBlcnR5cGUgVHlwZSAobWF5YmUgbWFrZSB0aGlzIGEgcGFydGlhbCwgaGF2ZSBzdXBlcnR5cGUgZXh0ZW5kIHRoaXMpXG4gKi9cbmV4cG9ydCB0eXBlIENvbnN0cnVjdG9yVHlwZUJhc2UgPSBGdW5jdGlvbiAmIHtcbiAgICBhbW9ycGhpY0NsYXNzTmFtZTogYW55O1xuICAgIF9fc2hhZG93UGFyZW50X186IGFueTtcbiAgICBwcm9wcz86IGFueTtcbiAgICBfX3BhcmVudF9fOiBhbnk7XG4gICAgX19uYW1lX186IGFueTtcbiAgICBfX2NyZWF0ZVBhcmFtZXRlcnNfXzogYW55O1xuICAgIGZ1bmN0aW9uUHJvcGVydGllczogYW55O1xuICAgIGlzT2JqZWN0VGVtcGxhdGU6IGFueTtcbiAgICBleHRlbmQ6IGFueTtcbiAgICBzdGF0aWNNaXhpbjogYW55O1xuICAgIG1peGluOiBhbnk7XG4gICAgZnJvbVBPSk86IGFueTtcbiAgICBmcm9tSlNPTjogYW55O1xuICAgIGdldFByb3BlcnRpZXM6IChpbmNsdWRlVmlydHVhbCkgPT4gYW55O1xuICAgIHByb3RvdHlwZTogYW55O1xuICAgIGRlZmluZVByb3BlcnRpZXM6IGFueTtcbiAgICBvYmplY3RQcm9wZXJ0aWVzOiBhbnk7XG4gICAgcGFyZW50VGVtcGxhdGU6IGFueTtcbiAgICBjcmVhdGVQcm9wZXJ0eTogYW55O1xuICAgIF9fdGVtcGxhdGVfXzogYW55O1xuICAgIF9faW5qZWN0aW9uc19fOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc3RydWN0b3JUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3JUeXBlQmFzZSB7XG4gICAgbmV3KCk7XG59XG5cbmV4cG9ydCB0eXBlIE9iamVjdFRlbXBsYXRlQ2xvbmUgPSB0eXBlb2YgT2JqZWN0VGVtcGxhdGU7XG5cblxuLyoqXG4gKiBBbGxvdyB0aGUgcHJvcGVydHkgdG8gYmUgZWl0aGVyIGEgYm9vbGVhbiBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGJvb2xlYW4gb3IgYSBzdHJpbmdcbiAqIG1hdGNoZWQgYWdhaW5zdCBhIHJ1bGUgc2V0IGFycmF5IG9mIHN0cmluZyBpbiBPYmplY3RUZW1wbGF0ZVxuICpcbiAqIEBwYXJhbSAgcHJvcCB1bmtub3duXG4gKiBAcGFyYW0gcnVsZVNldCB1bmtub3duXG4gKlxuICogQHJldHVybnMge2Z1bmN0aW9uKHRoaXM6T2JqZWN0VGVtcGxhdGUpfVxuICovXG5mdW5jdGlvbiBwcm9jZXNzUHJvcChwcm9wLCBydWxlU2V0KSB7XG4gICAgdmFyIHJldCA9IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIChwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXQgPSBwcm9wLmNhbGwoT2JqZWN0VGVtcGxhdGUpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgKHByb3ApID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXQgPSBmYWxzZTtcblxuICAgICAgICBpZiAocnVsZVNldCkge1xuICAgICAgICAgICAgcnVsZVNldC5tYXAoZnVuY3Rpb24gaShydWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIGFsd2F5cyBleGVjdXRlXG4gICAgICAgICAgICAgICAgaWYgKCFyZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG91YmxlIGVxdWFscyBvciBzaW5nbGUgZXF1YWxzP1xuICAgICAgICAgICAgICAgICAgICByZXQgPSBydWxlID09IHByb3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAocHJvcCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHByb3AuZm9yRWFjaChmdW5jdGlvbiBoKHByb3ApIHtcbiAgICAgICAgICAgIHJldCA9IHJldCB8fCBwcm9jZXNzUHJvcChwcm9wLCBydWxlU2V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXQgPSBwcm9wO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIHBydW5lRXhpc3Rpbmcob2JqLCBwcm9wcykge1xuICAgIHZhciBuZXdQcm9wcyA9IHt9O1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wcykge1xuICAgICAgICBpZiAodHlwZW9mKG9ialtwcm9wXSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBuZXdQcm9wc1twcm9wXSA9IHByb3BzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld1Byb3BzO1xufVxuXG4vKipcbiAqIHRoZSBvZyBPYmplY3RUZW1wbGF0ZSwgd2hhdCBldmVyeXRoaW5nIHBpY2tzIG9mZiBvZlxuICovXG5leHBvcnQgY2xhc3MgT2JqZWN0VGVtcGxhdGUge1xuXG4gICAgc3RhdGljIGxhenlUZW1wbGF0ZUxvYWQ6IGFueTtcbiAgICBzdGF0aWMgaXNMb2NhbFJ1bGVTZXQ6IGFueTtcbiAgICBzdGF0aWMgbmV4dElkOiBhbnk7IC8vIGZvciBzdGFzaE9iamVjdFxuICAgIHN0YXRpYyBfX2V4Y2VwdGlvbnNfXzogYW55O1xuICAgIHN0YXRpYyBfX3N0YXRzQ2xpZW50OiBTdGF0c0RDbGllbnQgfCB1bmRlZmluZWQ7XG5cbiAgICBzdGF0aWMgX190ZW1wbGF0ZXNfXzogQ29uc3RydWN0b3JUeXBlW107XG4gICAgc3RhdGljIHRvU2VydmVyUnVsZVNldDogc3RyaW5nW107XG4gICAgc3RhdGljIHRvQ2xpZW50UnVsZVNldDogc3RyaW5nW107XG5cbiAgICBzdGF0aWMgdGVtcGxhdGVJbnRlcmNlcHRvcjogYW55O1xuICAgIHN0YXRpYyBfX2RpY3Rpb25hcnlfXzogeyBba2V5OiBzdHJpbmddOiBDb25zdHJ1Y3RvclR5cGUgfTtcbiAgICBzdGF0aWMgX19hbm9ueW1vdXNJZF9fOiBudW1iZXI7XG4gICAgc3RhdGljIF9fdGVtcGxhdGVzVG9JbmplY3RfXzoge307XG4gICAgc3RhdGljIGxvZ2dlcjogYW55O1xuICAgIGxvZ2dlcjogU3VwZXJ0eXBlTG9nZ2VyO1xuICAgIHN0YXRpYyBfX3RlbXBsYXRlVXNhZ2VfXzogYW55O1xuICAgIHN0YXRpYyBfX2luamVjdGlvbnNfXzogRnVuY3Rpb25bXTtcbiAgICBzdGF0aWMgX190b0NsaWVudF9fOiBib29sZWFuO1xuICAgIHN0YXRpYyBhbW9ycGhpY1N0YXRpYyA9IE9iamVjdFRlbXBsYXRlO1xuXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBzdGF0c0RDbGllbnRcbiAgICAgKiBcbiAgICAgKiBUaGUgc3RhdHNEQ2xpZW50IG1heSBiZSBvbiB0aGUgYW1vcnBoaWMgb2JqZWN0LCBidXQgaXQgd2lsbCBhbHdheXMgXG4gICAgICogcmVkaXJlY3QgaW5zdGVhZCB0byB0aGUgc3RhdHNSZWZlcmVuY2Ugb24gYW1vcnBoaWNTdGF0aWNcbiAgICAgKiBcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHR5cGUgeyhTdGF0c0RDbGllbnQgfCB1bmRlZmluZWQpfVxuICAgICAqIEBtZW1iZXJvZiBPYmplY3RUZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgc3RhdHNEQ2xpZW50KCk6IFN0YXRzRENsaWVudCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFtb3JwaGljU3RhdGljLl9fc3RhdHNDbGllbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgc3RhdHNEQ2xpZW50IHJlZmVyZW5jZSBvbiBhbW9ycGhpY1N0YXRpY1xuICAgICAqIFxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAdHlwZSB7KFN0YXRzRENsaWVudCB8IHVuZGVmaW5lZCl9XG4gICAgICogQG1lbWJlcm9mIE9iamVjdFRlbXBsYXRlXG4gICAgICovXG4gICAgc3RhdGljIHNldCBzdGF0c0RDbGllbnQoc3RhdHNDbGllbnQ6IFN0YXRzRENsaWVudCkge1xuICAgICAgICB0aGlzLmFtb3JwaGljU3RhdGljLl9fc3RhdHNDbGllbnQgPSBzdGF0c0NsaWVudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgcGVyZm9ybUluamVjdGlvbnMoKSB7XG4gICAgICAgIHRoaXMuZ2V0Q2xhc3NlcygpO1xuICAgICAgICBpZiAodGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFRlbXBsYXRlID0gdGhpcztcblxuICAgICAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZU5hbWUgaW4gdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW3RlbXBsYXRlTmFtZV07XG5cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QoaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuaW5qZWN0KHRoaXMsIGluamVjdG9yKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5faW5qZWN0SW50b1RlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBpbml0KCkge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVVc2FnZV9fID0ge307XG4gICAgICAgIHRoaXMuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfXyA9IHt9O1xuICAgICAgICB0aGlzLl9fYW5vbnltb3VzSWRfXyA9IDE7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fID0ge307XG4gICAgICAgIHRoaXMubG9nZ2VyID0gdGhpcy5sb2dnZXIgfHwgdGhpcy5jcmVhdGVMb2dnZXIoKTsgLy8gQ3JlYXRlIGEgZGVmYXVsdCBsb2dnZXJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0VGVtcGxhdGVCeU5hbWUobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGFzc2VzKClbbmFtZV07XG4gICAgfVxuXG4gICAgLyoqXG4gKiBQdXJwb3NlIHVua25vd25cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gbmFtZSB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAqL1xuICAgIHN0YXRpYyBzZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIHByb3BzKSB7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW25hbWVdID0gdGVtcGxhdGU7XG4gICAgICAgIHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgdGVtcGxhdGUuX19uYW1lX18gPSBuYW1lO1xuICAgICAgICB0ZW1wbGF0ZS5fX2luamVjdGlvbnNfXyA9IFtdO1xuICAgICAgICB0ZW1wbGF0ZS5fX29iamVjdFRlbXBsYXRlX18gPSB0aGlzO1xuICAgICAgICB0ZW1wbGF0ZS5fX2NoaWxkcmVuX18gPSBbXTtcbiAgICAgICAgdGVtcGxhdGUuX190b0NsaWVudF9fID0gcHJvcHMuX190b0NsaWVudF9fO1xuICAgICAgICB0ZW1wbGF0ZS5fX3RvU2VydmVyX18gPSBwcm9wcy5fX3RvU2VydmVyX187XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRUZW1wbGF0ZVByb3BlcnRpZXMocHJvcHMpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlUHJvcGVydGllczogeyBfX3RvQ2xpZW50X18/OiBhbnk7IF9fdG9TZXJ2ZXJfXz86IGFueSB9ID0ge307XG5cbiAgICAgICAgaWYgKE9iamVjdFRlbXBsYXRlLl9fdG9DbGllbnRfXyA9PSBmYWxzZSkge1xuICAgICAgICAgICAgcHJvcHMudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9jZXNzUHJvcChwcm9wcy5pc0xvY2FsLCB0aGlzLmlzTG9jYWxSdWxlU2V0KSkge1xuICAgICAgICAgICAgcHJvcHMudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHByb3BzLnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZVByb3BlcnRpZXMuX190b0NsaWVudF9fID0gcHJvY2Vzc1Byb3AocHJvcHMudG9DbGllbnQsIHRoaXMudG9DbGllbnRSdWxlU2V0KSAhPSBmYWxzZTtcbiAgICAgICAgdGVtcGxhdGVQcm9wZXJ0aWVzLl9fdG9TZXJ2ZXJfXyA9IHByb2Nlc3NQcm9wKHByb3BzLnRvU2VydmVyLCB0aGlzLnRvU2VydmVyUnVsZVNldCkgIT0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlUHJvcGVydGllcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICAgKiBDcmVhdGUgYW4gb2JqZWN0IHRlbXBsYXRlIHRoYXQgaXMgaW5zdGFudGlhdGVkIHdpdGggdGhlIG5ldyBvcGVyYXRvci5cbiAgICAgICAgKiBwcm9wZXJ0aWVzIGlzXG4gICAgICAgICpcbiAgICAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFuIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIHJlcHJlc2VudCBkYXRhIGFuZCBmdW5jdGlvblxuICAgICAgICAqIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdC4gIFRoZSBkYXRhIHByb3BlcnRpZXMgbWF5IHVzZSB0aGUgZGVmaW5lUHJvcGVydHlcbiAgICAgICAgKiBmb3JtYXQgZm9yIHByb3BlcnRpZXMgb3IgbWF5IGJlIHByb3BlcnRpZXMgYXNzaWduZWQgYSBOdW1iZXIsIFN0cmluZyBvciBEYXRlLlxuICAgICAgICAqXG4gICAgICAgICogQHJldHVybnMgeyp9IHRoZSBvYmplY3QgdGVtcGxhdGVcbiAgICAgICAgKi9cblxuICAgIHN0YXRpYyBjcmVhdGUobmFtZTogc3RyaW5nIHwgQ3JlYXRlVHlwZUZvck5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgLyoqIHRoaXMgYmxvY2sgb25seSBleGVjdXRlcyBvbiBjcmVhdGV0eXBlZm9ybmFtZSAqL1xuICAgICAgICBpZiAobmFtZSAmJiAhKHR5cGVvZiAobmFtZSkgPT09ICdzdHJpbmcnKSAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gcHJvcHMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3JlYXRlUHJvcHMgPSB0aGlzLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiAodGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUludGVyY2VwdG9yKCdjcmVhdGUnLCBuYW1lLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0ZW1wbGF0ZTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBPYmplY3QsIHByb3BlcnRpZXMsIGNyZWF0ZVByb3BzLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgT2JqZWN0LCBuYW1lLCBjcmVhdGVQcm9wcywgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgY3JlYXRlUHJvcHMpO1xuICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX18gPSBwcm9wcztcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBFeHRlbmQgYW5kIGV4aXN0aW5nIChwYXJlbnQgdGVtcGxhdGUpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudFRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFyZSB0aGUgc2FtZSBhcyBmb3IgY3JlYXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIG9iamVjdCB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBleHRlbmQocGFyZW50VGVtcGxhdGUsIG5hbWU6IHN0cmluZyB8IENyZWF0ZVR5cGVGb3JOYW1lLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGxldCBwcm9wcztcbiAgICAgICAgbGV0IGNyZWF0ZVByb3BzO1xuXG4gICAgICAgIGlmICghcGFyZW50VGVtcGxhdGUuX19vYmplY3RUZW1wbGF0ZV9fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCBwYXJlbnQgdGVtcGxhdGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSBwcm9wcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMgPSBwYXJlbnRUZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX187XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhpc3RpbmdUZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV07XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18gIT0gcGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fLl9fbmFtZV9fICE9IHBhcmVudFRlbXBsYXRlLl9fbmFtZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOOiBBdHRlbXB0IHRvIGV4dGVuZCAke3BhcmVudFRlbXBsYXRlLl9fbmFtZV9ffSBhcyAke25hbWV9IGJ1dCAke25hbWV9IHdhcyBhbHJlYWR5IGV4dGVuZGVkIGZyb20gJHtleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18uX19uYW1lX199YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taXhpbihleGlzdGluZ1RlbXBsYXRlLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1RlbXBsYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICBjcmVhdGVQcm9wcyA9IHRoaXMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVJbnRlcmNlcHRvcignZXh0ZW5kJywgbmFtZSwgcHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIG5hbWUsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdGVQcm9wcykge1xuICAgICAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIGNyZWF0ZVByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBwYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQcm9wc19fID0gcHJvcHM7XG5cbiAgICAgICAgLy8gTWFpbnRhaW4gZ3JhcGggb2YgcGFyZW50IGFuZCBjaGlsZCB0ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGUuX19wYXJlbnRfXyA9IHBhcmVudFRlbXBsYXRlO1xuICAgICAgICBwYXJlbnRUZW1wbGF0ZS5fX2NoaWxkcmVuX18ucHVzaCh0ZW1wbGF0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgIHN0YXRpYyBtaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlSW50ZXJjZXB0b3IoJ2NyZWF0ZScsIHRlbXBsYXRlLl9fbmFtZV9fLCBwcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSwgbnVsbCwgcHJvcGVydGllcywgdGVtcGxhdGUsIHRlbXBsYXRlLl9fbmFtZV9fKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICpcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIHVua25vd25cbiAgICAqL1xuICAgIHN0YXRpYyBzdGF0aWNNaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGVbcHJvcF0gPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgb24gb2JqZWN0IGNyZWF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIGluamVjdCh0ZW1wbGF0ZSwgaW5qZWN0b3I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRlbXBsYXRlLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIG9uIGFsbCBvYmplY3QgY3JlYXRpb25zIChhcHBhcmVudGx5KT8gSnVzdCBhIGd1ZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciAtIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2xvYmFsSW5qZWN0KGluamVjdG9yOiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgdGVtcGxhdGUgaWYgaXQgbmVlZHMgdG8gYmUgY3JlYXRlZFxuICAgICAqIEBwYXJhbSBbdW5rbm93bn0gdGVtcGxhdGUgdG8gYmUgY3JlYXRlZFxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZT8sIHRoaXNPYmo/KSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXykge1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlUGFyYW1ldGVycyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fO1xuICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IGNyZWF0ZVBhcmFtZXRlcnMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gY3JlYXRlUGFyYW1ldGVyc1tpeF07XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlVGVtcGxhdGUocGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSwgcGFyYW1zWzNdLCBwYXJhbXNbNF0sIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlLl9pbmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX2luamVjdFByb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzT2JqKSB7XG4gICAgICAgICAgICAgICAgLy92YXIgY29weSA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3RvdHlwZXMgPSBbdGVtcGxhdGUucHJvdG90eXBlXTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50ID0gdGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZXMucHVzaChwYXJlbnQucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGl4ID0gcHJvdG90eXBlcy5sZW5ndGggLSAxOyBpeCA+PSAwOyAtLWl4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvdG90eXBlc1tpeF0pO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5mb3JFYWNoKCh2YWwsIGl4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpc09iaiwgcHJvcHNbaXhdLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZXNbaXhdLCBwcm9wc1tpeF0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXNPYmouX19wcm90b19fID0gdGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENsYXNzZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9fdGVtcGxhdGVzX18pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0aGlzLl9fdGVtcGxhdGVzX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlc19fW2l4XTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fW2NvbnN0cnVjdG9yTmFtZSh0ZW1wbGF0ZSldID0gdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bY29uc3RydWN0b3JOYW1lKHRlbXBsYXRlKV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVmZXJyZWRUeXBlcyh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9fdGVtcGxhdGVzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlTmFtZTEgaW4gdGhpcy5fX2RpY3Rpb25hcnlfXykge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bdGVtcGxhdGVOYW1lMV07XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VGVtcGxhdGVOYW1lID0gY29uc3RydWN0b3JOYW1lKE9iamVjdC5nZXRQcm90b3R5cGVPZih0ZW1wbGF0ZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fID0gdGhpcy5fX2RpY3Rpb25hcnlfX1twYXJlbnRUZW1wbGF0ZU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fc2hhZG93UGFyZW50X18uX19zaGFkb3dDaGlsZHJlbl9fLnB1c2godGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzdCA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGQgaW4gcHJvcHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fX2V4Y2VwdGlvbnNfXy5tYXAoY3JlYXRlTWVzc2FnZUxpbmUpLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVNZXNzYWdlTGluZShleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBleGNlcHRpb24uZnVuYyhleGNlcHRpb24uY2xhc3MoKSwgZXhjZXB0aW9uLnByb3ApO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEZWZlcnJlZFR5cGVzKHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmaW5lUHJvcGVydHkgPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0ZW1wbGF0ZS5wcm90b3R5cGUuX19kZWZlcnJlZFR5cGVfX1twcm9wXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LnR5cGUgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkub2YgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX19kaWN0aW9uYXJ5X187XG5cbiAgICAgICAgZnVuY3Rpb24gY29uc3RydWN0b3JOYW1lKGNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lZEZ1bmN0aW9uID0gY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvZnVuY3Rpb24gKFteKF0qKS8pO1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVkRnVuY3Rpb24gPyBuYW1lZEZ1bmN0aW9uWzFdIDogbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gY2FjaGUgb3IgZ2xvYmFsbHkgaWRlbnRpZnkgb2JqZWN0c1xuICAgICAqIEFsc28gYXNzaWducyBhIHVuaXF1ZSBpbnRlcm5hbCBJZCBzbyB0aGF0IGNvbXBsZXggc3RydWN0dXJlcyB3aXRoXG4gICAgICogcmVjdXJzaXZlIG9iamVjdHMgY2FuIGJlIHNlcmlhbGl6ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIC0gdGhlIG9iamVjdCB0byBiZSBwYXNzZWQgZHVyaW5nIGNyZWF0aW9uIHRpbWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIC0gdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc3Rhc2hPYmplY3Qob2JqLCB0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIW9iai5fX2lkX18pIHtcbiAgICAgICAgICAgIGlmICghT2JqZWN0VGVtcGxhdGUubmV4dElkKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUubmV4dElkID0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLl9faWRfXyA9ICdsb2NhbC0nICsgdGVtcGxhdGUuX19uYW1lX18gKyAnLScgKyArK09iamVjdFRlbXBsYXRlLm5leHRJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGluamVjdCBvdGhlciBlbGVtZW50c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtfdGVtcGxhdGV9IF90ZW1wbGF0ZSAtIHRoZSBvYmplY3QgdG8gYmUgcGFzc2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqICovXG4gICAgc3RhdGljIF9pbmplY3RJbnRvVGVtcGxhdGUoX3RlbXBsYXRlKSB7IH07XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIGJ5IHRlbXBsYXRlIHNldHVwIHRvIGNyZWF0ZSBhbiBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZvciB1c2UgYnkgdGhlIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnR5TmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IGlzIHRoZSBwcm9wZXJ0eSBkZXNjcmlwdG9yIHBhc3NlZCB0byB0aGUgdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iamVjdFByb3BlcnRpZXMgaXMgYWxsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIHByb2Nlc3NlZCBtYW51YWxseS4gIEEgbmV3IHByb3BlcnR5IGlzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQgdG8gdGhpcyBpZiB0aGUgcHJvcGVydHkgbmVlZHMgdG8gYmUgaW5pdGlhbGl6ZWQgYnkgdmFsdWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnRpZXMgaXMgYWxsIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIEEgbmV3IHByb3BlcnR5IHdpbGwgYmUgYWRkZWQgdG8gdGhpcyBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9zZXR1cFByb3BlcnR5KHByb3BlcnR5TmFtZSwgZGVmaW5lUHJvcGVydHksIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdmFsdWUgbmVlZHMgdG8gYmUgcmUtaW5pdGlhbGl6ZWQgaW4gY29uc3RydWN0b3JcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgY29uc3QgYnlWYWx1ZSA9IHZhbHVlICYmIHR5cGVvZiAodmFsdWUpICE9PSAnbnVtYmVyJyAmJiB0eXBlb2YgKHZhbHVlKSAhPT0gJ3N0cmluZyc7XG5cbiAgICAgICAgaWYgKGJ5VmFsdWUgfHwgIU9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIHx8IGRlZmluZVByb3BlcnR5LmdldCB8fCBkZWZpbmVQcm9wZXJ0eS5zZXQpIHtcbiAgICAgICAgICAgIG9iamVjdFByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBpbml0OiBkZWZpbmVQcm9wZXJ0eS52YWx1ZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBkZWZpbmVQcm9wZXJ0eS50eXBlLFxuICAgICAgICAgICAgICAgIG9mOiBkZWZpbmVQcm9wZXJ0eS5vZixcbiAgICAgICAgICAgICAgICBieVZhbHVlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGVuIGEgc3VwZXIgY2xhc3MgYmFzZWQgb24gb2JqZWN0VGVtcGxhdGUgZG9uJ3QgdHJhbnNwb3J0IHByb3BlcnRpZXNcbiAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydHkudG9DbGllbnQgPSBmYWxzZTtcbiAgICAgICAgZGVmaW5lUHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gZGVmaW5lUHJvcGVydHk7XG5cbiAgICAgICAgLy8gQWRkIGdldHRlcnMgYW5kIHNldHRlcnNcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmdldCB8fCBkZWZpbmVQcm9wZXJ0eS5zZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJTZXR0ZXIgPSBkZWZpbmVQcm9wZXJ0eS5zZXQ7XG5cbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnNldCA9IChmdW5jdGlvbiBkKCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBhIGNsb3N1cmUgdG8gcmVjb3JkIHRoZSBwcm9wZXJ0eSBuYW1lIHdoaWNoIGlzIG5vdCBwYXNzZWQgdG8gdGhlIHNldHRlclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBwcm9wZXJ0eU5hbWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gYyh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlclNldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1c2VyU2V0dGVyLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbYF9fJHtwcm9wfWBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgdXNlckdldHRlciA9IGRlZmluZVByb3BlcnR5LmdldDtcblxuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuZ2V0ID0gKGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgY2xvc3VyZSB0byByZWNvcmQgcHJvcGVydHkgbmFtZSB3aGljaCBpcyBub3QgcGFzc2VkIHRvIHRoZSBnZXR0ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gcHJvcGVydHlOYW1lO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGIoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJHZXR0ZXIuY2FsbCh0aGlzLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckdldHRlci5jYWxsKHRoaXMsIHRoaXNbYF9fJHtwcm9wfWBdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2BfXyR7cHJvcH1gXTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgaWYgKCFkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzW2BfXyR7cHJvcGVydHlOYW1lfWBdID0geyBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LndyaXRhYmxlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xvbmUgYW4gb2JqZWN0IGNyZWF0ZWQgZnJvbSBhbiBPYmplY3RUZW1wbGF0ZVxuICAgICAqIFVzZWQgb25seSB3aXRoaW4gc3VwZXJ0eXBlIChzZWUgY29weU9iamVjdCBmb3IgZ2VuZXJhbCBjb3B5KVxuICAgICAqXG4gICAgICogQHBhcmFtIG9iaiBpcyB0aGUgc291cmNlIG9iamVjdFxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdFxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IGEgY29weSBvZiB0aGUgb2JqZWN0XG4gICAgICovXG4gICAgLy8gRnVuY3Rpb24gdG8gY2xvbmUgc2ltcGxlIG9iamVjdHMgdXNpbmcgT2JqZWN0VGVtcGxhdGUgYXMgYSBndWlkZVxuICAgIHN0YXRpYyBjbG9uZShvYmosIHRlbXBsYXRlPykge1xuICAgICAgICBsZXQgY29weTtcblxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai5nZXRUaW1lKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBjb3B5ID0gW107XG5cbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCBvYmoubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgY29weVtpeF0gPSB0aGlzLmNsb25lKG9ialtpeF0sIHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGVtcGxhdGUgJiYgb2JqIGluc3RhbmNlb2YgdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGNvcHkgPSBuZXcgdGVtcGxhdGUoKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wICE9ICdfX2lkX18nICYmICEob2JqW3Byb3BdIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmluZVByb3BlcnR5ID0gdGhpcy5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUpIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlbcHJvcF0gPSB0aGlzLmNsb25lKG9ialtwcm9wXSwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICBjb3B5ID0ge307XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGMgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wYykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29weVtwcm9wY10gPSB0aGlzLmNsb25lKG9ialtwcm9wY10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gYmUgYWJsZSB0byBjcmVhdGUgcmVtb3RlIGZ1bmN0aW9ucyBvclxuICAgICAqIG90aGVyd2lzZSBpbnRlcmNlcHQgZnVuY3Rpb24gY2FsbHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gX3Byb3BlcnR5TmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnR5VmFsdWUgaXMgdGhlIGZ1bmN0aW9uIGl0c2VsZlxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IGEgbmV3IGZ1bmN0aW9uIHRvIGJlIGFzc2lnbmVkIHRvIHRoZSBvYmplY3QgcHJvdG90eXBlXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc2V0dXBGdW5jdGlvbihfcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgIH07XG5cbiAgICAvKipcbiAqIFB1cnBvc2UgdW5rbm93blxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRvciB1bmtub3duXG4gKlxuICogQHJldHVybnMge3Vua25vd259XG4gKi9cbiAgICBzdGF0aWMgY3JlYXRlQ29weShvYmosIGNyZWF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZnJvbVBPSk8ob2JqLCBvYmouX190ZW1wbGF0ZV9fLCBudWxsLCBudWxsLCB1bmRlZmluZWQsIG51bGwsIG51bGwsIGNyZWF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFic3RyYWN0IGZ1bmN0aW9uIGZvciBiZW5lZml0IG9mIFNlbW90dXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY2IgdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyB3aXRob3V0Q2hhbmdlVHJhY2tpbmcoY2IpIHtcbiAgICAgICAgY2IoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcG9qbyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpZE1hcCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpZFF1YWxpZmllciB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnQgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjcmVhdG9yIHVua25vd25cbiAgICAgKlxuICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbVBPSk8gPSBzZXJpYWxpemVyLmZyb21QT0pPO1xuXG4gICAgLyoqXG4gICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAqXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHN0ciB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRRdWFsaWZpZXIgdW5rbm93blxuICAgICogb2JqZWN0VGVtcGxhdGUuZnJvbUpTT04oc3RyLCB0ZW1wbGF0ZSwgaWRRdWFsaWZpZXIpXG4gICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTiA9IHNlcmlhbGl6ZXIuZnJvbUpTT047XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGFuIG9iamVjdCB0byBKU09OLCBzdHJpcHBpbmcgYW55IHJlY3Vyc2l2ZSBvYmplY3QgcmVmZXJlbmNlcyBzbyB0aGV5IGNhbiBiZVxuICAgICAqIHJlY29uc3RpdHV0ZWQgbGF0ZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNiIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuICAgIHN0YXRpYyB0b0pTT05TdHJpbmcgPSBzZXJpYWxpemVyLnRvSlNPTlN0cmluZztcblxuICAgICAgICAgLyoqXG4gICAgIC8qKlxuICAgICAgKiBGaW5kIHRoZSByaWdodCBzdWJjbGFzcyB0byBpbnN0YW50aWF0ZSBieSBlaXRoZXIgbG9va2luZyBhdCB0aGVcbiAgICAgICogZGVjbGFyZWQgbGlzdCBpbiB0aGUgc3ViQ2xhc3NlcyBkZWZpbmUgcHJvcGVydHkgb3Igd2Fsa2luZyB0aHJvdWdoXG4gICAgICAqIHRoZSBzdWJjbGFzc2VzIG9mIHRoZSBkZWNsYXJlZCB0ZW1wbGF0ZVxuICAgICAgKlxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBvYmpJZCB1bmtub3duXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgIHN0YXRpYyBfcmVzb2x2ZVN1YkNsYXNzKHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlTmFtZSA9ICcnO1xuXG4gICAgICAgIGlmIChvYmpJZC5tYXRjaCgvLShbQS1aYS16MC05XzpdKiktLykpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlTmFtZSA9IFJlZ0V4cC4kMTtcbiAgICAgICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0ZW1wbGF0ZSBzdWJjbGFzcyBmb3IgcG9seW1vcnBoaWMgaW5zdGFudGlhdGlvblxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkgJiYgZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3NlcyAmJiBvYmpJZCAhPSAnYW5vbnltb3VzKScpIHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlcy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlTmFtZSA9PSBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzW2l4XS5fX25hbWVfXykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgPSBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzW2l4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gdGhpcy5fZmluZFN1YkNsYXNzKHRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoc3ViQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IHN1YkNsYXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYWxrIHJlY3Vyc2l2ZWx5IHRocm91Z2ggZXh0ZW5zaW9ucyBvZiB0ZW1wbGF0ZSB2aWEgX19jaGlsZHJlbl9fXG4gICAgICogbG9va2luZyBmb3IgYSBuYW1lIG1hdGNoXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlTmFtZSB1bmtub3duXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZSwgdGVtcGxhdGVOYW1lKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZS5fX25hbWVfXyA9PSB0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0ZW1wbGF0ZS5fX2NoaWxkcmVuX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICBjb25zdCBzdWJDbGFzcyA9IHRoaXMuX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZS5fX2NoaWxkcmVuX19baXhdLCB0ZW1wbGF0ZU5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoc3ViQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViQ2xhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGhpZ2hlc3QgbGV2ZWwgdGVtcGxhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0QmFzZUNsYXNzKHRlbXBsYXRlKSB7XG4gICAgICAgIHdoaWxlICh0ZW1wbGF0ZS5fX3BhcmVudF9fKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgICAgICAvKipcbiAgICAgICogQW4gb3ZlcnJpZGFibGUgZnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGZyb20gYSB0ZW1wbGF0ZSBhbmQgb3B0aW9uYWxseVxuICAgICAgKiBtYW5hZ2UgdGhlIGNhY2hpbmcgb2YgdGhhdCBvYmplY3QgKHVzZWQgYnkgZGVyaXZhdGl2ZSB0eXBlIHN5c3RlbXMpLiAgSXRcbiAgICAgICogcHJlc2VydmVzIHRoZSBvcmlnaW5hbCBpZCBvZiBhbiBvYmplY3RcbiAgICAgICpcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBvZiBvYmplY3RcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBvYmpJZCBhbmQgaWQgKGlmIHByZXNlbnQpXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICogQHByaXZhdGVcbiAgICAgICovXG4gICAgIHN0YXRpYyBfY3JlYXRlRW1wdHlPYmplY3QodGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX3Jlc29sdmVTdWJDbGFzcyh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KTtcblxuICAgICAgICBjb25zdCBvbGRTdGFzaE9iamVjdCA9IHRoaXMuX3N0YXNoT2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmpJZCkge1xuICAgICAgICAgICAgdGhpcy5fc3Rhc2hPYmplY3QgPSBmdW5jdGlvbiBzdGFzaE9iamVjdCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IG5ldyB0ZW1wbGF0ZSgpO1xuICAgICAgICB0aGlzLl9zdGFzaE9iamVjdCA9IG9sZFN0YXNoT2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmpJZCkge1xuICAgICAgICAgICAgbmV3VmFsdWUuX19pZF9fID0gb2JqSWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9va3MgdXAgYSBwcm9wZXJ0eSBpbiB0aGUgZGVmaW5lUHJvcGVydGllcyBzYXZlZCB3aXRoIHRoZSB0ZW1wbGF0ZSBjYXNjYWRpbmdcbiAgICAgKiB1cCB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGZpbmQgaXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcCBpcyB0aGUgcHJvcGVydHkgYmVpbmcgc291Z2h0XG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eVxuICAgICAqIEByZXR1cm5zIHsqfSB0aGUgXCJkZWZpbmVQcm9wZXJ0eVwiIHN0cnVjdHVyZSBmb3IgdGhlIHByb3BlcnR5XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSAmJiAodGVtcGxhdGUgIT0gT2JqZWN0KSAmJiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzICYmIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRlbXBsYXRlICYmIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUucGFyZW50VGVtcGxhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGhhc2ggb2YgYWxsIHByb3BlcnRpZXMgaW5jbHVkaW5nIHRob3NlIGluaGVyaXRlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSBpcyB0aGUgdGVtcGxhdGUgdXNlZCB0byBjcmVhdGUgdGhlIG9iamVjdCBjb250YWluaW5nIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcmV0dXJuVmFsdWUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaW5jbHVkZVZpcnR1YWwgdW5rbm93blxuICAgICAqIEByZXR1cm5zIHsqfSBhbiBhc3NvY2lhdGl2ZSBhcnJheSBvZiBlYWNoIFwiZGVmaW5lUHJvcGVydHlcIiBzdHJ1Y3R1cmUgZm9yIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCByZXR1cm5WYWx1ZSwgaW5jbHVkZVZpcnR1YWwpIHtcbiAgICAgICAgaWYgKCFyZXR1cm5WYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlVmlydHVhbCB8fCAhdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWVbcHJvcF0gPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSwgcmV0dXJuVmFsdWUsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEdlbmVyYWwgZnVuY3Rpb24gdG8gY3JlYXRlIHRlbXBsYXRlcyB1c2VkIGJ5IGNyZWF0ZSwgZXh0ZW5kIGFuZCBtaXhpblxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBtaXhpblRlbXBsYXRlIC0gdGVtcGxhdGUgdXNlZCBmb3IgYSBtaXhpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50VGVtcGxhdGUgLSB0ZW1wbGF0ZSB1c2VkIGZvciBhbiBleHRlbmRcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXNPclRlbXBsYXRlIC0gcHJvcGVydGllcyB0byBiZSBhZGRlZC9teGllZCBpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRlUHJvcGVydGllcyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZU5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgYXMgaXQgd2lsbCBiZSBzdG9yZWQgcmV0cmlldmVkIGZyb20gZGljdGlvbmFyeVxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfY3JlYXRlVGVtcGxhdGUobWl4aW5UZW1wbGF0ZT8sIHBhcmVudFRlbXBsYXRlPywgcHJvcGVydGllc09yVGVtcGxhdGU/LCBjcmVhdGVQcm9wZXJ0aWVzPywgdGVtcGxhdGVOYW1lPywgY3JlYXRlVGVtcGxhdGVOb3c/KSB7XG4gICAgICAgIC8vIFdlIHdpbGwgcmV0dXJuIGEgY29uc3RydWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBpbiBhIG5ldyBmdW5jdGlvblxuICAgICAgICAvLyB0aGF0IHdpbGwgY2FsbCBhbiBpbml0KCkgZnVuY3Rpb24gZm91bmQgaW4gcHJvcGVydGllcywgZGVmaW5lIHByb3BlcnRpZXMgdXNpbmcgT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgICAgICAgLy8gYW5kIG1ha2UgY29waWVzIG9mIHRob3NlIHRoYXQgYXJlIHJlYWxseSBvYmplY3RzXG4gICAgICAgIHZhciBmdW5jdGlvblByb3BlcnRpZXM6YW55ID0ge307ICAgIC8vIFdpbGwgYmUgcG9wdWxhdGVkIHdpdGggaW5pdCBmdW5jdGlvbiBmcm9tIHByb3BlcnRpZXNcbiAgICAgICAgdmFyIG9iamVjdFByb3BlcnRpZXMgPSB7fTsgICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIGJlIHByb2Nlc3NlZCBieSBoYW5kXG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0aWVzID0ge307ICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBzZW50IHRvIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKClcbiAgICAgICAgdmFyIG9iamVjdFRlbXBsYXRlID0gdGhpcztcbiAgICAgICAgdmFyIHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIGZ1bmN0aW9uIEYoKSB7IH0gICAgIC8vIFVzZWQgaW4gY2FzZSBvZiBleHRlbmRcblxuICAgICAgICBpZiAoIXRoaXMubGF6eVRlbXBsYXRlTG9hZCkge1xuICAgICAgICAgICAgY3JlYXRlVGVtcGxhdGVOb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNldHVwIHZhcmlhYmxlcyBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgY2FsbCAoY3JlYXRlLCBleHRlbmQsIG1peGluKVxuICAgICAgICBpZiAoY3JlYXRlVGVtcGxhdGVOb3cpIHtcbiAgICAgICAgICAgIGlmIChtaXhpblRlbXBsYXRlKSB7ICAgICAgICAvLyBNaXhpblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQobWl4aW5UZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNPclRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChwcm9wZXJ0aWVzT3JUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdID0gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BwIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllc1twcm9wcF0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzW3Byb3BwXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BvIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BvID09ICdpbml0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgPSBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0Lmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0LnB1c2gocHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXRbaXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllc1twcm9wb10gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXNbcHJvcG9dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG4gaW4gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcERlc2MgPSA8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4sIHByb3BEZXNjKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYy5nZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4pKS5nZXQuc291cmNlVGVtcGxhdGUgPSBwcm9wRGVzYy5nZXQuc291cmNlVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGVbcHJvcG5dID0gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlW3Byb3BuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvcHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyhtaXhpblRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BtIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3BzW3Byb3BtXSA9IHByb3BzW3Byb3BtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaXhpblRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25Qcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFRlbXBsYXRlID0gbWl4aW5UZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgICAgICAgIC8vIEV4dGVuZFxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQocGFyZW50VGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIEYucHJvdG90eXBlID0gcGFyZW50VGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbmV3IEYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0b3IgdGhhdCB3aWxsIGJlIHJldHVybmVkIHdpbGwgb25seSBldmVyIGJlIGNyZWF0ZWQgb25jZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHRlbXBsYXRlOiBDb25zdHJ1Y3RvclR5cGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW3RlbXBsYXRlTmFtZV0gfHxcbiAgICAgICAgICAgIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSlcblxuXG4gICAgICAgIHRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUgPSB0cnVlO1xuXG4gICAgICAgIHRlbXBsYXRlLmV4dGVuZCA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLmV4dGVuZC5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUubWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5taXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUuc3RhdGljTWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5zdGF0aWNNaXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcblxuICAgICAgICB0ZW1wbGF0ZS5mcm9tUE9KTyA9IChwb2pvKSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGVtcGxhdGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRlbXBsYXRlLmZyb21KU09OID0gKHN0ciwgaWRQcmVmaXgpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFByZWZpeCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVtcGxhdGUuZ2V0UHJvcGVydGllcyA9IChpbmNsdWRlVmlydHVhbCkgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWNyZWF0ZVRlbXBsYXRlTm93KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fIHx8IFtdO1xuICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18ucHVzaChbbWl4aW5UZW1wbGF0ZSwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzLCB0ZW1wbGF0ZU5hbWVdKTtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlLnByb3RvdHlwZSA9IHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIHZhciBjcmVhdGVQcm9wZXJ0eSA9IGNyZWF0ZVByb3BlcnR5RnVuYy5iaW5kKG51bGwsIGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlKTtcblxuXG4gICAgICAgIC8vIFdhbGsgdGhyb3VnaCBwcm9wZXJ0aWVzIGFuZCBjb25zdHJ1Y3QgdGhlIGRlZmluZVByb3BlcnRpZXMgaGFzaCBvZiBwcm9wZXJ0aWVzLCB0aGUgbGlzdCBvZlxuICAgICAgICAvLyBvYmplY3RQcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0byBiZSByZWluc3RhbnRpYXRlZCBhbmQgYXR0YWNoIGZ1bmN0aW9ucyB0byB0aGUgcHJvdG90eXBlXG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlUHJvcGVydHkocHJvcGVydHlOYW1lLCBudWxsLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzID0gZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgdGVtcGxhdGUub2JqZWN0UHJvcGVydGllcyA9IG9iamVjdFByb3BlcnRpZXM7XG5cbiAgICAgICAgdGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzID0gZnVuY3Rpb25Qcm9wZXJ0aWVzO1xuICAgICAgICB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSA9IHBhcmVudFRlbXBsYXRlO1xuXG5cbiAgICAgICAgdGVtcGxhdGUuY3JlYXRlUHJvcGVydHkgPSBjcmVhdGVQcm9wZXJ0eTtcblxuICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuXG4gICAgICAgIHZhciBwcm9wc3QgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgICBmb3IgKHZhciBwcm9wZCBpbiBwcm9wc3QpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0byBjbG9uZSB0aGUgVHlwZSBTeXN0ZW1cbiAgICAgKiBAcmV0dXJucyB7b31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfY3JlYXRlT2JqZWN0KCk6IE9iamVjdFRlbXBsYXRlQ2xvbmUge1xuICAgICAgICBjb25zdCBuZXdGb28gPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xuICAgICAgICBuZXdGb28uaW5pdCgpO1xuICAgICAgICByZXR1cm4gbmV3Rm9vO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IG9yaWdpbmFsbHkgdG9vayBhIGNvbnRleHQgdGhhdCBpdCB0aHJldyBhd2F5XG4gICAgKiBAcmV0dXJucyB7U3VwZXJ0eXBlTG9nZ2VyfVxuICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUxvZ2dlcigpOiBTdXBlcnR5cGVMb2dnZXIge1xuICAgICAgICByZXR1cm4gbmV3IFN1cGVydHlwZUxvZ2dlcigpO1xuICAgIH1cblxuXG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUHJvcGVydHlGdW5jKGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLFxuICAgIHByb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSwgcHJvcGVydGllcywgY3JlYXRlUHJvcGVydGllcykge1xuICAgIGlmICghcHJvcGVydGllcykge1xuICAgICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoZSBpbml0aWFsaXphdGlvbiBmdW5jdGlvblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgPT0gJ2luaXQnICYmIHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmdW5jdGlvblByb3BlcnRpZXMuaW5pdCA9IFtwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IG51bGw7IC8vIGRlZmluZVByb3BlcnR5IHRvIGJlIGFkZGVkIHRvIGRlZmluZVByb3BlcnRpZXNcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHByb3BlcnR5IHZhbHVlIHdoaWNoIG1heSBiZSBhIGRlZmluZVByb3BlcnRpZXMgc3RydWN0dXJlIG9yIGp1c3QgYW4gaW5pdGlhbCB2YWx1ZVxuICAgICAgICB2YXIgZGVzY3JpcHRvcjphbnkgPSB7fTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllcywgcHJvcGVydHlOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0eXBlID0gJ251bGwnO1xuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLmdldCB8fCBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgICAgICAgdHlwZSA9ICdnZXRzZXQnO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgLy8gRmlndXJlIG91dCB3aGV0aGVyIHRoaXMgaXMgYSBkZWZpbmVQcm9wZXJ0eSBzdHJ1Y3R1cmUgKGhhcyBhIGNvbnN0cnVjdG9yIG9mIG9iamVjdClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IC8vIE9yIGFycmF5XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIHJlbW90ZSBmdW5jdGlvbiBjYWxsc1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSAmJiB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdID0gb2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcGVydHlOYW1lLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9uLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS50eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zYXJyYXlfXyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fb25fXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vbjtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3ZhbGlkYXRlX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19ib2R5X18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLndyaXRhYmxlID0gdHJ1ZTsgLy8gV2UgYXJlIHVzaW5nIHNldHRlcnNcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIE90aGVyIGNyYXBcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdnZXRzZXQnOiAvLyBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGVtcGxhdGVQcm90b3R5cGUsIHByb3BlcnR5TmFtZSwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0ZW1wbGF0ZVByb3RvdHlwZSwgcHJvcGVydHlOYW1lKSkuZ2V0LnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBkZWZpbmVQcm9wZXJ0eSB0byBiZSBhZGRlZFxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci50b0NsaWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b0NsaWVudCA9IGRlc2NyaXB0b3IudG9DbGllbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudG9TZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBkZXNjcmlwdG9yLnRvU2VydmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fc2V0dXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSkge1xuXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUoKSB7XG4gICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlLCB0aGlzKTtcbiAgICAgICAgbGV0IHRlbXBsYXRlUmVmOiBDb25zdHJ1Y3RvclR5cGUgPSA8Q29uc3RydWN0b3JUeXBlPjxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlVXNhZ2VfX1t0ZW1wbGF0ZVJlZi5fX25hbWVfX10gPSB0cnVlO1xuICAgICAgICB2YXIgcGFyZW50ID0gdGVtcGxhdGVSZWYuX19wYXJlbnRfXztcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZVVzYWdlX19bcGFyZW50Ll9fbmFtZV9fXSA9IHRydWU7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRlbXBsYXRlUmVmO1xuXG4gICAgICAgIGlmIChvYmplY3RUZW1wbGF0ZS5fX3RyYW5zaWVudF9fKSB7XG4gICAgICAgICAgICB0aGlzLl9fdHJhbnNpZW50X18gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBydW5lZE9iamVjdFByb3BlcnRpZXMgPSBwcnVuZUV4aXN0aW5nKHRoaXMsIHRlbXBsYXRlUmVmLm9iamVjdFByb3BlcnRpZXMpO1xuICAgICAgICB2YXIgcHJ1bmVkRGVmaW5lUHJvcGVydGllcyA9IHBydW5lRXhpc3RpbmcodGhpcywgdGVtcGxhdGVSZWYuZGVmaW5lUHJvcGVydGllcyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBwcm9wZXJ0aWVzIGVpdGhlciB3aXRoIEVNQ0EgNSBkZWZpbmVQcm9wZXJ0aWVzIG9yIGJ5IGhhbmRcbiAgICAgICAgICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHBydW5lZERlZmluZVByb3BlcnRpZXMpOyAvLyBUaGlzIG1ldGhvZCB3aWxsIGJlIGFkZGVkIHByZS1FTUNBIDVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mcm9tUmVtb3RlID0gdGhpcy5mcm9tUmVtb3RlIHx8IG9iamVjdFRlbXBsYXRlLl9zdGFzaE9iamVjdCh0aGlzLCB0ZW1wbGF0ZVJlZik7XG5cbiAgICAgICAgdGhpcy5jb3B5UHJvcGVydGllcyA9IGZ1bmN0aW9uIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICB0aGlzW3Byb3BdID0gb2JqW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgcHJvcGVydGllcyBmcm9tIHRoZSBkZWZpbmVQcm9wZXJ0aWVzIHZhbHVlIHByb3BlcnR5XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LmluaXQpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5ieVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IE9iamVjdFRlbXBsYXRlLmNsb25lKGRlZmluZVByb3BlcnR5LmluaXQsIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gKGRlZmluZVByb3BlcnR5LmluaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gVGVtcGxhdGUgbGV2ZWwgaW5qZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgdGVtcGxhdGVSZWYuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVJlZi5fX2luamVjdGlvbnNfX1tpeF0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2JhbCBpbmplY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX18ubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fW2pdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fcHJvcF9fID0gZnVuY3Rpb24gZyhwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRoaXMuX190ZW1wbGF0ZV9fKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9fdmFsdWVzX18gPSBmdW5jdGlvbiBmKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkudmFsdWVzKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9fZGVzY3JpcHRpb25zX18gPSBmdW5jdGlvbiBlKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX19wcm9wX18ocHJvcCkgfHwgdGhpcy5fX3Byb3BfXygnXycgKyBwcm9wKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGFuIGluaXQgZnVuY3Rpb24gb3IgYXJlIGEgcmVtb3RlIGNyZWF0aW9uIGNhbGwgcGFyZW50IGNvbnN0cnVjdG9yIG90aGVyd2lzZSBjYWxsIGluaXRcbiAgICAgICAgLy8gIGZ1bmN0aW9uIHdobyB3aWxsIGJlIHJlc3BvbnNpYmxlIGZvciBjYWxsaW5nIHBhcmVudCBjb25zdHJ1Y3RvciB0byBhbGxvdyBmb3IgcGFyYW1ldGVyIHBhc3NpbmcuXG4gICAgICAgIGlmICh0aGlzLmZyb21SZW1vdGUgfHwgIXRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IG9iamVjdFRlbXBsYXRlLm5vSW5pdCkge1xuICAgICAgICAgICAgaWYgKHBhcmVudFRlbXBsYXRlICYmIHBhcmVudFRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRUZW1wbGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdFtpXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZV9fID0gdGVtcGxhdGVSZWY7XG5cbiAgICAgICAgdGhpcy50b0pTT05TdHJpbmcgPSBmdW5jdGlvbiB0b0pTT05TdHJpbmcoY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS50b0pTT05TdHJpbmcodGhpcywgY2IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qIENsb25lIGFuZCBvYmplY3QgY2FsbGluZyBhIGNhbGxiYWNrIGZvciBlYWNoIHJlZmVyZW5jZWQgb2JqZWN0LlxuICAgICAgICAgVGhlIGNhbGwgYmFjayBpcyBwYXNzZWQgKG9iaiwgcHJvcCwgdGVtcGxhdGUpXG4gICAgICAgICBvYmogLSB0aGUgcGFyZW50IG9iamVjdCAoZXhjZXB0IHRoZSBoaWdoZXN0IGxldmVsKVxuICAgICAgICAgcHJvcCAtIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgdGVtcGxhdGUgLSB0aGUgdGVtcGxhdGUgb2YgdGhlIG9iamVjdCB0byBiZSBjcmVhdGVkXG4gICAgICAgICB0aGUgZnVuY3Rpb24gcmV0dXJuczpcbiAgICAgICAgIC0gZmFsc3kgLSBjbG9uZSBvYmplY3QgYXMgdXN1YWwgd2l0aCBhIG5ldyBpZFxuICAgICAgICAgLSBvYmplY3QgcmVmZXJlbmNlIC0gdGhlIGNhbGxiYWNrIGNyZWF0ZWQgdGhlIG9iamVjdCAocHJlc3VtYWJseSB0byBiZSBhYmxlIHRvIHBhc3MgaW5pdCBwYXJhbWV0ZXJzKVxuICAgICAgICAgLSBbb2JqZWN0XSAtIGEgb25lIGVsZW1lbnQgYXJyYXkgb2YgdGhlIG9iamVjdCBtZWFucyBkb24ndCBjb3B5IHRoZSBwcm9wZXJ0aWVzIG9yIHRyYXZlcnNlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNyZWF0ZUNvcHkgPSBmdW5jdGlvbiBjcmVhdGVDb3B5KGNyZWF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5jcmVhdGVDb3B5KHRoaXMsIGNyZWF0b3IpO1xuICAgICAgICB9O1xuXG4gICAgfTtcblxuXG4gICAgbGV0IHJldHVyblZhbCA9IDxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgIHJldHVybiByZXR1cm5WYWwgYXMgQ29uc3RydWN0b3JUeXBlO1xufVxuIl19