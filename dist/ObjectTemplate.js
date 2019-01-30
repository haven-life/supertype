"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serializer = require("./serializer");
var SupertypeLogger_1 = require("./SupertypeLogger");
var UtilityFunctions_1 = require("./UtilityFunctions");
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
     * Purpose unknown - @JSPATH
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
    * Create an object template that is instantiated with the new operator.
    * properties is
    *
    * @JSPATH ??
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
    * @returns {*} the object template @JSPATH???
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
        var createProps = UtilityFunctions_1.UtilityFunctions.getTemplateProperties(props, this);
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
     * Extend and existing (parent template) -  @JSPATH
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
            createProps = UtilityFunctions_1.UtilityFunctions.getTemplateProperties(props, this);
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
    /**
     * @JSPATH ???
     *
     * @static
     * @param {*} template
     * @param {*} properties
     * @returns
     * @memberof ObjectTemplate
     */
    ObjectTemplate.mixin = function (template, properties) {
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
     *
     * @JSPATH ???
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
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
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
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
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
     * @JSPATH ???
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
         * removing the typing (this is javascript anyway)
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
/** @JSPATH  */
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
        var prunedObjectProperties = UtilityFunctions_1.UtilityFunctions.pruneExisting(this, templateRef.objectProperties);
        var prunedDefineProperties = UtilityFunctions_1.UtilityFunctions.pruneExisting(this, templateRef.defineProperties);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMkM7QUFDM0MscURBQW9EO0FBQ3BELHVEQUFzRDtBQXFCdEQ7O0dBRUc7QUFDSDtJQUFBO0lBczZCQSxDQUFDO0lBajVCRzs7T0FFRztJQUNJLGdDQUFpQixHQUF4QjtRQUNJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNsQixJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUM1QixJQUFNLGdCQUFjLEdBQUcsSUFBSSxDQUFDO1lBRTVCLEtBQUssSUFBTSxZQUFZLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFO2dCQUNuRCxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTFELFFBQVEsQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLFFBQVE7b0JBQ3RDLGdCQUFjLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDMUMsQ0FBQyxDQUFDO2dCQUVGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN0QztTQUNKO0lBQ0wsQ0FBQztJQUVNLG1CQUFJLEdBQVg7UUFDSSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQywwQkFBMEI7SUFDakUsQ0FBQztJQUVNLGdDQUFpQixHQUF4QixVQUF5QixJQUFJ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QUMsQ0FBQztRQUVGOzs7Ozs7Ozs7V0FTRztRQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsb0JBQW9CLE9BQU87WUFDekMsT0FBTyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUM7SUFFTixDQUFDO0lBQUEsQ0FBQztJQUdGLElBQUksU0FBUyxHQUFhLFFBQVEsQ0FBQztJQUVuQyxPQUFPLFNBQWlDLENBQUM7QUFDN0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNlcmlhbGl6ZXIgZnJvbSAnLi9zZXJpYWxpemVyJztcbmltcG9ydCB7IFN1cGVydHlwZUxvZ2dlciB9IGZyb20gJy4vU3VwZXJ0eXBlTG9nZ2VyJztcbmltcG9ydCB7IFV0aWxpdHlGdW5jdGlvbnMgfSBmcm9tICcuL1V0aWxpdHlGdW5jdGlvbnMnO1xuaW1wb3J0IHsgU3VwZXJ0eXBlQ29uc3RydWN0b3IgfSBmcm9tICcuL1N1cGVydHlwZSc7XG5leHBvcnQgdHlwZSBDcmVhdGVUeXBlRm9yTmFtZSA9IHtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHRvQ2xpZW50PzogYm9vbGVhbjtcbiAgICB0b1NlcnZlcj86IGJvb2xlYW47XG4gICAgaXNMb2NhbD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCB0eXBlIEdldHRlciA9IHtcbiAgICBnZXQ6IGFueTtcbn1cblxuLy8gLyoqXG4vLyAgKiB0aGlzIGlzIHByZXR0eSBtdWNoIHRoZSBjbGFzcyAodGhlIHRlbXBsYXRlIGl0c2VsZilcbi8vICAqIFRyeSB0byB1bmlmeSB0aGlzIHdpdGggdGhlIFN1cGVydHlwZSBUeXBlIChtYXliZSBtYWtlIHRoaXMgYSBwYXJ0aWFsLCBoYXZlIHN1cGVydHlwZSBleHRlbmQgdGhpcylcbi8vICAqL1xuXG5leHBvcnQgdHlwZSBPYmplY3RUZW1wbGF0ZUNsb25lID0gdHlwZW9mIE9iamVjdFRlbXBsYXRlO1xuXG5cbi8qKlxuICogdGhlIG9nIE9iamVjdFRlbXBsYXRlLCB3aGF0IGV2ZXJ5dGhpbmcgcGlja3Mgb2ZmIG9mXG4gKi9cbmV4cG9ydCBjbGFzcyBPYmplY3RUZW1wbGF0ZSB7XG5cbiAgICBzdGF0aWMgbGF6eVRlbXBsYXRlTG9hZDogYW55O1xuICAgIHN0YXRpYyBpc0xvY2FsUnVsZVNldDogYW55O1xuICAgIHN0YXRpYyBuZXh0SWQ6IGFueTsgLy8gZm9yIHN0YXNoT2JqZWN0XG4gICAgc3RhdGljIF9fZXhjZXB0aW9uc19fOiBhbnk7XG5cbiAgICBzdGF0aWMgX190ZW1wbGF0ZXNfXzogU3VwZXJ0eXBlQ29uc3RydWN0b3JbXTtcbiAgICBzdGF0aWMgdG9TZXJ2ZXJSdWxlU2V0OiBzdHJpbmdbXTtcbiAgICBzdGF0aWMgdG9DbGllbnRSdWxlU2V0OiBzdHJpbmdbXTtcblxuICAgIHN0YXRpYyBfX2RpY3Rpb25hcnlfXzogeyBba2V5OiBzdHJpbmddOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciB9O1xuICAgIHN0YXRpYyBfX2Fub255bW91c0lkX186IG51bWJlcjtcbiAgICBzdGF0aWMgX190ZW1wbGF0ZXNUb0luamVjdF9fOiB7fTtcbiAgICBzdGF0aWMgbG9nZ2VyOiBhbnk7XG4gICAgbG9nZ2VyOiBTdXBlcnR5cGVMb2dnZXI7XG4gICAgc3RhdGljIF9fdGVtcGxhdGVVc2FnZV9fOiBhbnk7XG4gICAgc3RhdGljIF9faW5qZWN0aW9uc19fOiBGdW5jdGlvbltdO1xuICAgIHN0YXRpYyBfX3RvQ2xpZW50X186IGJvb2xlYW47XG5cbiAgICBzdGF0aWMgYW1vcnBoaWNTdGF0aWMgPSBPYmplY3RUZW1wbGF0ZTtcbiAgICAvKipcbiAgICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgcGVyZm9ybUluamVjdGlvbnMoKSB7XG4gICAgICAgIHRoaXMuZ2V0Q2xhc3NlcygpO1xuICAgICAgICBpZiAodGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgIGNvbnN0IG9iamVjdFRlbXBsYXRlID0gdGhpcztcblxuICAgICAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZU5hbWUgaW4gdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X18pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW3RlbXBsYXRlTmFtZV07XG5cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QoaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuaW5qZWN0KHRoaXMsIGluamVjdG9yKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5faW5qZWN0SW50b1RlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBpbml0KCkge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVVc2FnZV9fID0ge307XG4gICAgICAgIHRoaXMuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfXyA9IHt9O1xuICAgICAgICB0aGlzLl9fYW5vbnltb3VzSWRfXyA9IDE7XG4gICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fID0ge307XG4gICAgICAgIHRoaXMubG9nZ2VyID0gdGhpcy5jcmVhdGVMb2dnZXIoKTsgLy8gQ3JlYXRlIGEgZGVmYXVsdCBsb2dnZXJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0VGVtcGxhdGVCeU5hbWUobmFtZSk6IFN1cGVydHlwZUNvbnN0cnVjdG9yIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2xhc3NlcygpW25hbWVdO1xuICAgIH1cblxuLyoqXG4gKiBQdXJwb3NlIHVua25vd24gLSBASlNQQVRIXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBwcm9wcyB1bmtub3duXG4gKi9cbiAgICBzdGF0aWMgc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBwcm9wcykge1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfX1tuYW1lXSA9IHRlbXBsYXRlO1xuICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fW25hbWVdID0gdGVtcGxhdGU7XG4gICAgICAgIHRlbXBsYXRlLl9fbmFtZV9fID0gbmFtZTtcbiAgICAgICAgdGVtcGxhdGUuX19pbmplY3Rpb25zX18gPSBbXTtcbiAgICAgICAgdGVtcGxhdGUuX19vYmplY3RUZW1wbGF0ZV9fID0gdGhpcztcbiAgICAgICAgdGVtcGxhdGUuX19jaGlsZHJlbl9fID0gW107XG4gICAgICAgIHRlbXBsYXRlLl9fdG9DbGllbnRfXyA9IHByb3BzLl9fdG9DbGllbnRfXztcbiAgICAgICAgdGVtcGxhdGUuX190b1NlcnZlcl9fID0gcHJvcHMuX190b1NlcnZlcl9fO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogQ3JlYXRlIGFuIG9iamVjdCB0ZW1wbGF0ZSB0aGF0IGlzIGluc3RhbnRpYXRlZCB3aXRoIHRoZSBuZXcgb3BlcmF0b3IuXG4gICAgKiBwcm9wZXJ0aWVzIGlzXG4gICAgKlxuICAgICogQEpTUEFUSCA/PyBcbiAgICAqIFxuICAgICogQHBhcmFtIHt1bmtub3dufSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB0ZW1wbGF0ZSBvciBhbiBvYmplY3Qgd2l0aFxuICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAqICAgICAgICB0b0NsaWVudCAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBjbGllbnQgKHdpdGggc2Vtb3R1cylcbiAgICAqICAgICAgICB0b1NlcnZlciAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBzZXJ2ZXIgKHdpdGggc2Vtb3R1cylcbiAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXMgYW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgcmVwcmVzZW50IGRhdGEgYW5kIGZ1bmN0aW9uXG4gICAgKiBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3QuICBUaGUgZGF0YSBwcm9wZXJ0aWVzIG1heSB1c2UgdGhlIGRlZmluZVByb3BlcnR5XG4gICAgKiBmb3JtYXQgZm9yIHByb3BlcnRpZXMgb3IgbWF5IGJlIHByb3BlcnRpZXMgYXNzaWduZWQgYSBOdW1iZXIsIFN0cmluZyBvciBEYXRlLlxuICAgICpcbiAgICAqIEByZXR1cm5zIHsqfSB0aGUgb2JqZWN0IHRlbXBsYXRlIEBKU1BBVEg/Pz9cbiAgICAqL1xuXG4gICAgc3RhdGljIGNyZWF0ZShuYW1lOiBzdHJpbmcgfCBDcmVhdGVUeXBlRm9yTmFtZSwgcHJvcGVydGllcykge1xuICAgICAgICAvKiogdGhpcyBibG9jayBvbmx5IGV4ZWN1dGVzIG9uIGNyZWF0ZXR5cGVmb3JuYW1lICovXG4gICAgICAgIGlmIChuYW1lICYmICEodHlwZW9mIChuYW1lKSA9PT0gJ3N0cmluZycpICYmIG5hbWUubmFtZSkge1xuICAgICAgICAgICAgdmFyIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSBwcm9wcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyB8fCBuYW1lLm1hdGNoKC9bXkEtWmEtejAtOV9dLykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW5jb3JyZWN0IHRlbXBsYXRlIG5hbWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHByb3BlcnRpZXMpICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHRlbXBsYXRlIHByb3BlcnR5IGRlZmluaXRpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjcmVhdGVQcm9wcyA9IFV0aWxpdHlGdW5jdGlvbnMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzLCB0aGlzKTtcblxuICAgICAgICBsZXQgdGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgT2JqZWN0LCBwcm9wZXJ0aWVzLCBjcmVhdGVQcm9wcywgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2NyZWF0ZVRlbXBsYXRlKG51bGwsIE9iamVjdCwgbmFtZSwgY3JlYXRlUHJvcHMsIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIGNyZWF0ZVByb3BzKTtcbiAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQcm9wc19fID0gcHJvcHM7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogRXh0ZW5kIGFuZCBleGlzdGluZyAocGFyZW50IHRlbXBsYXRlKSAtICBASlNQQVRIXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudFRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIG9yIGFuIG9iamVjdCB3aXRoXG4gICAgICogICAgICAgIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgY2xhc3NcbiAgICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgICogICAgICAgIHRvU2VydmVyIC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIHNlcnZlciAod2l0aCBzZW1vdHVzKVxuICAgICAqICAgICAgICBpc0xvY2FsIC0gZXF1aXZhbGVudCB0byBzZXR0aW5nIHRvQ2xpZW50ICYmIHRvU2VydmVyIHRvIGZhbHNlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFyZSB0aGUgc2FtZSBhcyBmb3IgY3JlYXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIG9iamVjdCB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBleHRlbmQocGFyZW50VGVtcGxhdGUsIG5hbWU6IHN0cmluZyB8IENyZWF0ZVR5cGVGb3JOYW1lLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGxldCBwcm9wcztcbiAgICAgICAgbGV0IGNyZWF0ZVByb3BzO1xuXG4gICAgICAgIGlmICghcGFyZW50VGVtcGxhdGUuX19vYmplY3RUZW1wbGF0ZV9fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCBwYXJlbnQgdGVtcGxhdGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKG5hbWUpICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgKG5hbWUpICE9PSAnc3RyaW5nJyAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSBwcm9wcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvcHMgPSBwYXJlbnRUZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX187XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhpc3RpbmdUZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bbmFtZV07XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18gIT0gcGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fLl9fbmFtZV9fICE9IHBhcmVudFRlbXBsYXRlLl9fbmFtZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOOiBBdHRlbXB0IHRvIGV4dGVuZCAke3BhcmVudFRlbXBsYXRlLl9fbmFtZV9ffSBhcyAke25hbWV9IGJ1dCAke25hbWV9IHdhcyBhbHJlYWR5IGV4dGVuZGVkIGZyb20gJHtleGlzdGluZ1RlbXBsYXRlLl9fcGFyZW50X18uX19uYW1lX199YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taXhpbihleGlzdGluZ1RlbXBsYXRlLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1RlbXBsYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICBjcmVhdGVQcm9wcyA9IFV0aWxpdHlGdW5jdGlvbnMuZ2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHByb3BzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0ZW1wbGF0ZTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBwYXJlbnRUZW1wbGF0ZSwgcHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBwYXJlbnRUZW1wbGF0ZSwgbmFtZSwgcGFyZW50VGVtcGxhdGUsIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNyZWF0ZVByb3BzKSB7XG4gICAgICAgICAgICB0aGlzLnNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgY3JlYXRlUHJvcHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIHBhcmVudFRlbXBsYXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVByb3BzX18gPSBwcm9wcztcblxuICAgICAgICAvLyBNYWludGFpbiBncmFwaCBvZiBwYXJlbnQgYW5kIGNoaWxkIHRlbXBsYXRlc1xuICAgICAgICB0ZW1wbGF0ZS5fX3BhcmVudF9fID0gcGFyZW50VGVtcGxhdGU7XG4gICAgICAgIHBhcmVudFRlbXBsYXRlLl9fY2hpbGRyZW5fXy5wdXNoKHRlbXBsYXRlKTtcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQEpTUEFUSCA/Pz9cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0geyp9IHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHsqfSBwcm9wZXJ0aWVzXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgT2JqZWN0VGVtcGxhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgbWl4aW4odGVtcGxhdGUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZVRlbXBsYXRlKHRlbXBsYXRlLCBudWxsLCBwcm9wZXJ0aWVzLCB0ZW1wbGF0ZSwgdGVtcGxhdGUuX19uYW1lX18pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKlxuICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXMgdW5rbm93blxuICAgICovXG4gICAgc3RhdGljIHN0YXRpY01peGluKHRlbXBsYXRlLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVtwcm9wXSA9IHByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBmdW5jdGlvbiB0aGF0IHdpbGwgZmlyZSBvbiBvYmplY3QgY3JlYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGluamVjdG9yIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5qZWN0KHRlbXBsYXRlLCBpbmplY3RvcjogRnVuY3Rpb24pIHtcbiAgICAgICAgdGVtcGxhdGUuX19pbmplY3Rpb25zX18ucHVzaChpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgb24gYWxsIG9iamVjdCBjcmVhdGlvbnMgKGFwcGFyZW50bHkpPyBKdXN0IGEgZ3Vlc3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGluamVjdG9yIC0gdW5rbm93blxuICAgICAqL1xuICAgIHN0YXRpYyBnbG9iYWxJbmplY3QoaW5qZWN0b3I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX19pbmplY3Rpb25zX18ucHVzaChpbmplY3Rvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSB0ZW1wbGF0ZSBpZiBpdCBuZWVkcyB0byBiZSBjcmVhdGVkXG4gICAgICogQHBhcmFtIFt1bmtub3dufSB0ZW1wbGF0ZSB0byBiZSBjcmVhdGVkXG4gICAgICogXG4gICAgICogQEpTUEFUSCA/Pz9cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlSWZOZWVkZWQodGVtcGxhdGU/LCB0aGlzT2JqPykge1xuICAgICAgICBpZiAodGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18pIHtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZVBhcmFtZXRlcnMgPSB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXztcbiAgICAgICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCBjcmVhdGVQYXJhbWV0ZXJzLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGNyZWF0ZVBhcmFtZXRlcnNbaXhdO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVRlbXBsYXRlKHBhcmFtc1swXSwgcGFyYW1zWzFdLCBwYXJhbXNbMl0sIHBhcmFtc1szXSwgcGFyYW1zWzRdLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5faW5qZWN0UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9pbmplY3RQcm9wZXJ0aWVzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpc09iaikge1xuICAgICAgICAgICAgICAgIC8vdmFyIGNvcHkgPSBuZXcgdGVtcGxhdGUoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm90b3R5cGVzID0gW3RlbXBsYXRlLnByb3RvdHlwZV07XG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudCA9IHRlbXBsYXRlLl9fcGFyZW50X187XG4gICAgICAgICAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBwcm90b3R5cGVzLnB1c2gocGFyZW50LnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5fX3BhcmVudF9fO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpeCA9IHByb3RvdHlwZXMubGVuZ3RoIC0gMTsgaXggPj0gMDsgLS1peCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb3RvdHlwZXNbaXhdKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMuZm9yRWFjaCgodmFsLCBpeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXNPYmosIHByb3BzW2l4XSwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90b3R5cGVzW2l4XSwgcHJvcHNbaXhdKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzT2JqLl9fcHJvdG9fXyA9IHRlbXBsYXRlLnByb3RvdHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDbGFzc2VzKCk6IHsgW2tleTogc3RyaW5nXTogU3VwZXJ0eXBlQ29uc3RydWN0b3IgfSB7XG4gICAgICAgIGlmICh0aGlzLl9fdGVtcGxhdGVzX18pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCB0aGlzLl9fdGVtcGxhdGVzX18ubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5fX3RlbXBsYXRlc19fW2l4XTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZGljdGlvbmFyeV9fW2NvbnN0cnVjdG9yTmFtZSh0ZW1wbGF0ZSldID0gdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bY29uc3RydWN0b3JOYW1lKHRlbXBsYXRlKV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRGVmZXJyZWRUeXBlcyh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9fdGVtcGxhdGVzX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlTmFtZTEgaW4gdGhpcy5fX2RpY3Rpb25hcnlfXykge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bdGVtcGxhdGVOYW1lMV07XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VGVtcGxhdGVOYW1lID0gY29uc3RydWN0b3JOYW1lKE9iamVjdC5nZXRQcm90b3R5cGVPZih0ZW1wbGF0ZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fID0gdGhpcy5fX2RpY3Rpb25hcnlfX1twYXJlbnRUZW1wbGF0ZU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLl9fc2hhZG93UGFyZW50X18uX19zaGFkb3dDaGlsZHJlbl9fLnB1c2godGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzdCA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcGQgaW4gcHJvcHN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX19leGNlcHRpb25zX18pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fX2V4Y2VwdGlvbnNfXy5tYXAoY3JlYXRlTWVzc2FnZUxpbmUpLmpvaW4oJ1xcbicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVNZXNzYWdlTGluZShleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBleGNlcHRpb24uZnVuYyhleGNlcHRpb24uY2xhc3MoKSwgZXhjZXB0aW9uLnByb3ApO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEZWZlcnJlZFR5cGVzKHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX18pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmaW5lUHJvcGVydHkgPSB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0ZW1wbGF0ZS5wcm90b3R5cGUuX19kZWZlcnJlZFR5cGVfX1twcm9wXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LnR5cGUgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkub2YgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX19kaWN0aW9uYXJ5X187XG5cbiAgICAgICAgZnVuY3Rpb24gY29uc3RydWN0b3JOYW1lKGNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lZEZ1bmN0aW9uID0gY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvZnVuY3Rpb24gKFteKF0qKS8pO1xuICAgICAgICAgICAgcmV0dXJuIG5hbWVkRnVuY3Rpb24gPyBuYW1lZEZ1bmN0aW9uWzFdIDogbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGRlbiBieSBvdGhlciBUeXBlIFN5c3RlbXMgdG8gY2FjaGUgb3IgZ2xvYmFsbHkgaWRlbnRpZnkgb2JqZWN0c1xuICAgICAqIEFsc28gYXNzaWducyBhIHVuaXF1ZSBpbnRlcm5hbCBJZCBzbyB0aGF0IGNvbXBsZXggc3RydWN0dXJlcyB3aXRoXG4gICAgICogcmVjdXJzaXZlIG9iamVjdHMgY2FuIGJlIHNlcmlhbGl6ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqIC0gdGhlIG9iamVjdCB0byBiZSBwYXNzZWQgZHVyaW5nIGNyZWF0aW9uIHRpbWVcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIC0gdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc3Rhc2hPYmplY3Qob2JqLCB0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIW9iai5fX2lkX18pIHtcbiAgICAgICAgICAgIGlmICghT2JqZWN0VGVtcGxhdGUubmV4dElkKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0VGVtcGxhdGUubmV4dElkID0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLl9faWRfXyA9ICdsb2NhbC0nICsgdGVtcGxhdGUuX19uYW1lX18gKyAnLScgKyArK09iamVjdFRlbXBsYXRlLm5leHRJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGluamVjdCBvdGhlciBlbGVtZW50c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtfdGVtcGxhdGV9IF90ZW1wbGF0ZSAtIHRoZSBvYmplY3QgdG8gYmUgcGFzc2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lXG4gICAgICogXG4gICAgICogQHByaXZhdGVcbiAgICAgKiAqL1xuICAgIHN0YXRpYyBfaW5qZWN0SW50b1RlbXBsYXRlKF90ZW1wbGF0ZSkgeyB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlZCBieSB0ZW1wbGF0ZSBzZXR1cCB0byBjcmVhdGUgYW4gcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgdXNlIGJ5IHRoZSBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0eU5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSBpcyB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBwYXNzZWQgdG8gdGhlIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBvYmplY3RQcm9wZXJ0aWVzIGlzIGFsbCBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBwcm9jZXNzZWQgbWFudWFsbHkuICBBIG5ldyBwcm9wZXJ0eSBpc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkIHRvIHRoaXMgaWYgdGhlIHByb3BlcnR5IG5lZWRzIHRvIGJlIGluaXRpYWxpemVkIGJ5IHZhbHVlXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0aWVzIGlzIGFsbCBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBBIG5ldyBwcm9wZXJ0eSB3aWxsIGJlIGFkZGVkIHRvIHRoaXMgb2JqZWN0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfc2V0dXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHZhbHVlIG5lZWRzIHRvIGJlIHJlLWluaXRpYWxpemVkIGluIGNvbnN0cnVjdG9yXG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgIGNvbnN0IGJ5VmFsdWUgPSB2YWx1ZSAmJiB0eXBlb2YgKHZhbHVlKSAhPT0gJ251bWJlcicgJiYgdHlwZW9mICh2YWx1ZSkgIT09ICdzdHJpbmcnO1xuXG4gICAgICAgIGlmIChieVZhbHVlIHx8ICFPYmplY3QuZGVmaW5lUHJvcGVydGllcyB8fCBkZWZpbmVQcm9wZXJ0eS5nZXQgfHwgZGVmaW5lUHJvcGVydHkuc2V0KSB7XG4gICAgICAgICAgICBvYmplY3RQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgaW5pdDogZGVmaW5lUHJvcGVydHkudmFsdWUsXG4gICAgICAgICAgICAgICAgdHlwZTogZGVmaW5lUHJvcGVydHkudHlwZSxcbiAgICAgICAgICAgICAgICBvZjogZGVmaW5lUHJvcGVydHkub2YsXG4gICAgICAgICAgICAgICAgYnlWYWx1ZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZGVsZXRlIGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2hlbiBhIHN1cGVyIGNsYXNzIGJhc2VkIG9uIG9iamVjdFRlbXBsYXRlIGRvbid0IHRyYW5zcG9ydCBwcm9wZXJ0aWVzXG4gICAgICAgIGRlZmluZVByb3BlcnR5LnRvU2VydmVyID0gZmFsc2U7XG4gICAgICAgIGRlZmluZVByb3BlcnR5LnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIGRlZmluZVByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IGRlZmluZVByb3BlcnR5O1xuXG4gICAgICAgIC8vIEFkZCBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5nZXQgfHwgZGVmaW5lUHJvcGVydHkuc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB1c2VyU2V0dGVyID0gZGVmaW5lUHJvcGVydHkuc2V0O1xuXG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5zZXQgPSAoZnVuY3Rpb24gZCgpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgYSBjbG9zdXJlIHRvIHJlY29yZCB0aGUgcHJvcGVydHkgbmFtZSB3aGljaCBpcyBub3QgcGFzc2VkIHRvIHRoZSBzZXR0ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wID0gcHJvcGVydHlOYW1lO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGModmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJTZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdXNlclNldHRlci5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2BfXyR7cHJvcH1gXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHVzZXJHZXR0ZXIgPSBkZWZpbmVQcm9wZXJ0eS5nZXQ7XG5cbiAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LmdldCA9IChmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIGNsb3N1cmUgdG8gcmVjb3JkIHByb3BlcnR5IG5hbWUgd2hpY2ggaXMgbm90IHBhc3NlZCB0byB0aGUgZ2V0dGVyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IHByb3BlcnR5TmFtZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBiKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlckdldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1c2VyR2V0dGVyLmNhbGwodGhpcywgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJHZXR0ZXIuY2FsbCh0aGlzLCB0aGlzW2BfXyR7cHJvcH1gXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tgX18ke3Byb3B9YF07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGlmICghZGVmaW5lUHJvcGVydHkuaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllc1tgX18ke3Byb3BlcnR5TmFtZX1gXSA9IHsgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgICAgIGRlbGV0ZSBkZWZpbmVQcm9wZXJ0eS53cml0YWJsZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb25lIGFuIG9iamVjdCBjcmVhdGVkIGZyb20gYW4gT2JqZWN0VGVtcGxhdGVcbiAgICAgKiBVc2VkIG9ubHkgd2l0aGluIHN1cGVydHlwZSAoc2VlIGNvcHlPYmplY3QgZm9yIGdlbmVyYWwgY29weSlcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvYmogaXMgdGhlIHNvdXJjZSBvYmplY3RcbiAgICAgKiBAcGFyYW0gdGVtcGxhdGUgaXMgdGhlIHRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIHRoZSBvYmplY3RcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfSBhIGNvcHkgb2YgdGhlIG9iamVjdFxuICAgICAqL1xuICAgIC8vIEZ1bmN0aW9uIHRvIGNsb25lIHNpbXBsZSBvYmplY3RzIHVzaW5nIE9iamVjdFRlbXBsYXRlIGFzIGEgZ3VpZGVcbiAgICBzdGF0aWMgY2xvbmUob2JqLCB0ZW1wbGF0ZT8pIHtcbiAgICAgICAgbGV0IGNvcHk7XG5cbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouZ2V0VGltZSgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgY29weSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgb2JqLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgIGNvcHlbaXhdID0gdGhpcy5jbG9uZShvYmpbaXhdLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRlbXBsYXRlICYmIG9iaiBpbnN0YW5jZW9mIHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBjb3B5ID0gbmV3IHRlbXBsYXRlKCk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvcCAhPSAnX19pZF9fJyAmJiAhKG9ialtwcm9wXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWZpbmVQcm9wZXJ0eSA9IHRoaXMuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlKSB8fCB7fTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5W3Byb3BdID0gdGhpcy5jbG9uZShvYmpbcHJvcF0sIGRlZmluZVByb3BlcnR5Lm9mIHx8IGRlZmluZVByb3BlcnR5LnR5cGUgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICAgICAgY29weSA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BjIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcGMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcHlbcHJvcGNdID0gdGhpcy5jbG9uZShvYmpbcHJvcGNdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGJlIGFibGUgdG8gY3JlYXRlIHJlbW90ZSBmdW5jdGlvbnMgb3JcbiAgICAgKiBvdGhlcndpc2UgaW50ZXJjZXB0IGZ1bmN0aW9uIGNhbGxzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IF9wcm9wZXJ0eU5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0eVZhbHVlIGlzIHRoZSBmdW5jdGlvbiBpdHNlbGZcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfSBhIG5ldyBmdW5jdGlvbiB0byBiZSBhc3NpZ25lZCB0byB0aGUgb2JqZWN0IHByb3RvdHlwZVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX3NldHVwRnVuY3Rpb24oX3Byb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSwgLi4uYXJncykge1xuICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gKiBQdXJwb3NlIHVua25vd25cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IG9iaiB1bmtub3duXG4gKiBAcGFyYW0ge3Vua25vd259IGNyZWF0b3IgdW5rbm93blxuICpcbiAqIEByZXR1cm5zIHt1bmtub3dufVxuICovXG4gICAgc3RhdGljIGNyZWF0ZUNvcHkob2JqLCBjcmVhdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZyb21QT0pPKG9iaiwgb2JqLl9fdGVtcGxhdGVfXywgbnVsbCwgbnVsbCwgdW5kZWZpbmVkLCBudWxsLCBudWxsLCBjcmVhdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBYnN0cmFjdCBmdW5jdGlvbiBmb3IgYmVuZWZpdCBvZiBTZW1vdHVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNiIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgd2l0aG91dENoYW5nZVRyYWNraW5nKGNiKSB7XG4gICAgICAgIGNiKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBvam8gdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRNYXAgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gaWRRdWFsaWZpZXIgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50IHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3AgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRvciB1bmtub3duXG4gICAgICpcbiAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICovXG4gICAgc3RhdGljIGZyb21QT0pPID0gc2VyaWFsaXplci5mcm9tUE9KTztcblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKlxuICAgICogQHBhcmFtIHt1bmtub3dufSBzdHIgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IGlkUXVhbGlmaWVyIHVua25vd25cbiAgICAqIG9iamVjdFRlbXBsYXRlLmZyb21KU09OKHN0ciwgdGVtcGxhdGUsIGlkUXVhbGlmaWVyKVxuICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04gPSBzZXJpYWxpemVyLmZyb21KU09OO1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBhbiBvYmplY3QgdG8gSlNPTiwgc3RyaXBwaW5nIGFueSByZWN1cnNpdmUgb2JqZWN0IHJlZmVyZW5jZXMgc28gdGhleSBjYW4gYmVcbiAgICAgKiByZWNvbnN0aXR1dGVkIGxhdGVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaiB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjYiB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAgKi9cbiAgICBzdGF0aWMgdG9KU09OU3RyaW5nID0gc2VyaWFsaXplci50b0pTT05TdHJpbmc7XG5cbiAgICAgICAgIC8qKlxuICAgICAvKipcbiAgICAgICogRmluZCB0aGUgcmlnaHQgc3ViY2xhc3MgdG8gaW5zdGFudGlhdGUgYnkgZWl0aGVyIGxvb2tpbmcgYXQgdGhlXG4gICAgICAqIGRlY2xhcmVkIGxpc3QgaW4gdGhlIHN1YkNsYXNzZXMgZGVmaW5lIHByb3BlcnR5IG9yIHdhbGtpbmcgdGhyb3VnaFxuICAgICAgKiB0aGUgc3ViY2xhc3NlcyBvZiB0aGUgZGVjbGFyZWQgdGVtcGxhdGVcbiAgICAgICpcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqSWQgdW5rbm93blxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IHVua25vd25cbiAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAqIEBwcml2YXRlXG4gICAgICAqL1xuICAgICBzdGF0aWMgX3Jlc29sdmVTdWJDbGFzcyh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZU5hbWUgPSAnJztcblxuICAgICAgICBpZiAob2JqSWQubWF0Y2goLy0oW0EtWmEtejAtOV86XSopLS8pKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZU5hbWUgPSBSZWdFeHAuJDE7XG4gICAgICAgIH1cblxuICAgIC8vIFJlc29sdmUgdGVtcGxhdGUgc3ViY2xhc3MgZm9yIHBvbHltb3JwaGljIGluc3RhbnRpYXRpb25cbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5ICYmIGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXMgJiYgb2JqSWQgIT0gJ2Fub255bW91cyknKSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXMubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZU5hbWUgPT0gZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlc1tpeF0uX19uYW1lX18pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gZGVmaW5lUHJvcGVydHkuc3ViQ2xhc3Nlc1tpeF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzdWJDbGFzcyA9IHRoaXMuX2ZpbmRTdWJDbGFzcyh0ZW1wbGF0ZSwgdGVtcGxhdGVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKHN1YkNsYXNzKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUgPSBzdWJDbGFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2FsayByZWN1cnNpdmVseSB0aHJvdWdoIGV4dGVuc2lvbnMgb2YgdGVtcGxhdGUgdmlhIF9fY2hpbGRyZW5fX1xuICAgICAqIGxvb2tpbmcgZm9yIGEgbmFtZSBtYXRjaFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZU5hbWUgdW5rbm93blxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9maW5kU3ViQ2xhc3ModGVtcGxhdGUsIHRlbXBsYXRlTmFtZSkge1xuICAgICAgICBpZiAodGVtcGxhdGUuX19uYW1lX18gPT0gdGVtcGxhdGVOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgdGVtcGxhdGUuX19jaGlsZHJlbl9fLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgY29uc3Qgc3ViQ2xhc3MgPSB0aGlzLl9maW5kU3ViQ2xhc3ModGVtcGxhdGUuX19jaGlsZHJlbl9fW2l4XSwgdGVtcGxhdGVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKHN1YkNsYXNzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YkNsYXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBoaWdoZXN0IGxldmVsIHRlbXBsYXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldEJhc2VDbGFzcyh0ZW1wbGF0ZSkge1xuICAgICAgICB3aGlsZSAodGVtcGxhdGUuX19wYXJlbnRfXykge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5fX3BhcmVudF9fO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgICAgICAgLyoqXG4gICAgICAqIEFuIG92ZXJyaWRhYmxlIGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGFuIG9iamVjdCBmcm9tIGEgdGVtcGxhdGUgYW5kIG9wdGlvbmFsbHlcbiAgICAgICogbWFuYWdlIHRoZSBjYWNoaW5nIG9mIHRoYXQgb2JqZWN0ICh1c2VkIGJ5IGRlcml2YXRpdmUgdHlwZSBzeXN0ZW1zKS4gIEl0XG4gICAgICAqIHByZXNlcnZlcyB0aGUgb3JpZ2luYWwgaWQgb2YgYW4gb2JqZWN0XG4gICAgICAqXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgb2Ygb2JqZWN0XG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqSWQgYW5kIGlkIChpZiBwcmVzZW50KVxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IHVua25vd25cbiAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAqIEBwcml2YXRlXG4gICAgICAqL1xuICAgICBzdGF0aWMgX2NyZWF0ZUVtcHR5T2JqZWN0KHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHksIC4uLmFyZ3MpIHtcbiAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9yZXNvbHZlU3ViQ2xhc3ModGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSk7XG5cbiAgICAgICAgY29uc3Qgb2xkU3Rhc2hPYmplY3QgPSB0aGlzLl9zdGFzaE9iamVjdDtcblxuICAgICAgICBpZiAob2JqSWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXNoT2JqZWN0ID0gZnVuY3Rpb24gc3Rhc2hPYmplY3QoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBuZXcgdGVtcGxhdGUoKTtcbiAgICAgICAgdGhpcy5fc3Rhc2hPYmplY3QgPSBvbGRTdGFzaE9iamVjdDtcblxuICAgICAgICBpZiAob2JqSWQpIHtcbiAgICAgICAgICAgIG5ld1ZhbHVlLl9faWRfXyA9IG9iaklkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2tzIHVwIGEgcHJvcGVydHkgaW4gdGhlIGRlZmluZVByb3BlcnRpZXMgc2F2ZWQgd2l0aCB0aGUgdGVtcGxhdGUgY2FzY2FkaW5nXG4gICAgICogdXAgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBmaW5kIGl0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3AgaXMgdGhlIHByb3BlcnR5IGJlaW5nIHNvdWdodFxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgaXMgdGhlIHRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIHRoZSBvYmplY3QgY29udGFpbmluZyB0aGUgcHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7Kn0gdGhlIFwiZGVmaW5lUHJvcGVydHlcIiBzdHJ1Y3R1cmUgZm9yIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAodGVtcGxhdGUgJiYgKHRlbXBsYXRlICE9IE9iamVjdCkgJiYgdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcyAmJiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZW1wbGF0ZSAmJiB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldERlZmluZVByb3BlcnR5KHByb3AsIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBoYXNoIG9mIGFsbCBwcm9wZXJ0aWVzIGluY2x1ZGluZyB0aG9zZSBpbmhlcml0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgaXMgdGhlIHRlbXBsYXRlIHVzZWQgdG8gY3JlYXRlIHRoZSBvYmplY3QgY29udGFpbmluZyB0aGUgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHJldHVyblZhbHVlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGluY2x1ZGVWaXJ0dWFsIHVua25vd25cbiAgICAgKiBAcmV0dXJucyB7Kn0gYW4gYXNzb2NpYXRpdmUgYXJyYXkgb2YgZWFjaCBcImRlZmluZVByb3BlcnR5XCIgc3RydWN0dXJlIGZvciB0aGUgcHJvcGVydHlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgcmV0dXJuVmFsdWUsIGluY2x1ZGVWaXJ0dWFsKSB7XG4gICAgICAgIGlmICghcmV0dXJuVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZVZpcnR1YWwgfHwgIXRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0uaXNWaXJ0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlW3Byb3BdID0gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVtcGxhdGUucGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUucGFyZW50VGVtcGxhdGUsIHJldHVyblZhbHVlLCBpbmNsdWRlVmlydHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogR2VuZXJhbCBmdW5jdGlvbiB0byBjcmVhdGUgdGVtcGxhdGVzIHVzZWQgYnkgY3JlYXRlLCBleHRlbmQgYW5kIG1peGluXG4gICAgICogQEpTUEFUSCA/Pz9cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG1peGluVGVtcGxhdGUgLSB0ZW1wbGF0ZSB1c2VkIGZvciBhIG1peGluXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnRUZW1wbGF0ZSAtIHRlbXBsYXRlIHVzZWQgZm9yIGFuIGV4dGVuZFxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydGllc09yVGVtcGxhdGUgLSBwcm9wZXJ0aWVzIHRvIGJlIGFkZGVkL214aWVkIGluXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjcmVhdGVQcm9wZXJ0aWVzIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlTmFtZSAtIHRoZSBuYW1lIG9mIHRoZSB0ZW1wbGF0ZSBhcyBpdCB3aWxsIGJlIHN0b3JlZCByZXRyaWV2ZWQgZnJvbSBkaWN0aW9uYXJ5XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF9jcmVhdGVUZW1wbGF0ZShtaXhpblRlbXBsYXRlPywgcGFyZW50VGVtcGxhdGU/LCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZT8sIGNyZWF0ZVByb3BlcnRpZXM/LCB0ZW1wbGF0ZU5hbWU/LCBjcmVhdGVUZW1wbGF0ZU5vdz8pIHtcbiAgICAgICAgLy8gV2Ugd2lsbCByZXR1cm4gYSBjb25zdHJ1Y3RvciB0aGF0IGNhbiBiZSB1c2VkIGluIGEgbmV3IGZ1bmN0aW9uXG4gICAgICAgIC8vIHRoYXQgd2lsbCBjYWxsIGFuIGluaXQoKSBmdW5jdGlvbiBmb3VuZCBpbiBwcm9wZXJ0aWVzLCBkZWZpbmUgcHJvcGVydGllcyB1c2luZyBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAgICAgICAvLyBhbmQgbWFrZSBjb3BpZXMgb2YgdGhvc2UgdGhhdCBhcmUgcmVhbGx5IG9iamVjdHNcbiAgICAgICAgdmFyIGZ1bmN0aW9uUHJvcGVydGllczphbnkgPSB7fTsgICAgLy8gV2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCBpbml0IGZ1bmN0aW9uIGZyb20gcHJvcGVydGllc1xuICAgICAgICB2YXIgb2JqZWN0UHJvcGVydGllcyA9IHt9OyAgICAvLyBMaXN0IG9mIHByb3BlcnRpZXMgdG8gYmUgcHJvY2Vzc2VkIGJ5IGhhbmRcbiAgICAgICAgdmFyIGRlZmluZVByb3BlcnRpZXMgPSB7fTsgICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIGJlIHNlbnQgdG8gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoKVxuICAgICAgICB2YXIgb2JqZWN0VGVtcGxhdGUgPSB0aGlzO1xuICAgICAgICB2YXIgdGVtcGxhdGVQcm90b3R5cGU7XG5cbiAgICAgICAgZnVuY3Rpb24gRigpIHsgfSAgICAgLy8gVXNlZCBpbiBjYXNlIG9mIGV4dGVuZFxuXG4gICAgICAgIGlmICghdGhpcy5sYXp5VGVtcGxhdGVMb2FkKSB7XG4gICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZU5vdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0dXAgdmFyaWFibGVzIGRlcGVuZGluZyBvbiB0aGUgdHlwZSBvZiBjYWxsIChjcmVhdGUsIGV4dGVuZCwgbWl4aW4pXG4gICAgICAgIGlmIChjcmVhdGVUZW1wbGF0ZU5vdykge1xuICAgICAgICAgICAgaWYgKG1peGluVGVtcGxhdGUpIHsgICAgICAgIC8vIE1peGluXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChtaXhpblRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc09yVGVtcGxhdGUuaXNPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUlmTmVlZGVkKHByb3BlcnRpZXNPclRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcHAgaW4gcHJvcGVydGllc09yVGVtcGxhdGUub2JqZWN0UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzW3Byb3BwXSA9IHByb3BlcnRpZXNPclRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXNbcHJvcHBdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG8gaW4gcHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcG8gPT0gJ2luaXQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCA9IG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgfHwgW107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgcHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQubGVuZ3RoOyArK2l4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQucHVzaChwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMuaW5pdFtpeF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzW3Byb3BvXSA9IHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllc1twcm9wb107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wbiBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wRGVzYyA9IDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5wcm90b3R5cGUsIHByb3BuKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BEZXNjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1peGluVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbiwgcHJvcERlc2MpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BEZXNjLmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEdldHRlcj5PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG1peGluVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbikpLmdldC5zb3VyY2VUZW1wbGF0ZSA9IHByb3BEZXNjLmdldC5zb3VyY2VUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3RvdHlwZVtwcm9wbl0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5wcm90b3R5cGVbcHJvcG5dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm9wcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wcyA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKG1peGluVGVtcGxhdGUsIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG0gaW4gcHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvcHNbcHJvcG1dID0gcHJvcHNbcHJvcG1dO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1peGluVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RQcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvblByb3BlcnRpZXMgPSBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGUgPSBtaXhpblRlbXBsYXRlLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50VGVtcGxhdGUgPSBtaXhpblRlbXBsYXRlLnBhcmVudFRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgeyAgICAgICAgLy8gRXh0ZW5kXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChwYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBwYXJlbnRUZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGUgPSBuZXcgRigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25zdHJ1Y3RvciB0aGF0IHdpbGwgYmUgcmV0dXJuZWQgd2lsbCBvbmx5IGV2ZXIgYmUgY3JlYXRlZCBvbmNlXG4gICAgICAgICAqIHJlbW92aW5nIHRoZSB0eXBpbmcgKHRoaXMgaXMgamF2YXNjcmlwdCBhbnl3YXkpXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgdGVtcGxhdGU6IGFueSA9IHRoaXMuX19kaWN0aW9uYXJ5X19bdGVtcGxhdGVOYW1lXSB8fFxuICAgICAgICAgICAgYmluZFBhcmFtcyh0ZW1wbGF0ZU5hbWUsIG9iamVjdFRlbXBsYXRlLCBmdW5jdGlvblByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLFxuICAgICAgICAgICAgICAgIGNyZWF0ZVByb3BlcnRpZXMsIG9iamVjdFByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLFxuICAgICAgICAgICAgICAgIGNyZWF0ZVRlbXBsYXRlTm93LCBtaXhpblRlbXBsYXRlKVxuXG5cbiAgICAgICAgdGVtcGxhdGUuaXNPYmplY3RUZW1wbGF0ZSA9IHRydWU7XG5cbiAgICAgICAgdGVtcGxhdGUuZXh0ZW5kID0gKHAxLCBwMikgPT4gb2JqZWN0VGVtcGxhdGUuZXh0ZW5kLmNhbGwob2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlLCBwMSwgcDIpO1xuICAgICAgICB0ZW1wbGF0ZS5taXhpbiA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLm1peGluLmNhbGwob2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlLCBwMSwgcDIpO1xuICAgICAgICB0ZW1wbGF0ZS5zdGF0aWNNaXhpbiA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLnN0YXRpY01peGluLmNhbGwob2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlLCBwMSwgcDIpO1xuXG4gICAgICAgIHRlbXBsYXRlLmZyb21QT0pPID0gKHBvam8pID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tUE9KTyhwb2pvLCB0ZW1wbGF0ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVtcGxhdGUuZnJvbUpTT04gPSAoc3RyLCBpZFByZWZpeCkgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdFRlbXBsYXRlLmZyb21KU09OKHN0ciwgdGVtcGxhdGUsIGlkUHJlZml4KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0ZW1wbGF0ZS5nZXRQcm9wZXJ0aWVzID0gKGluY2x1ZGVWaXJ0dWFsKSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUsIHVuZGVmaW5lZCwgaW5jbHVkZVZpcnR1YWwpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghY3JlYXRlVGVtcGxhdGVOb3cpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fID0gdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18gfHwgW107XG4gICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXy5wdXNoKFttaXhpblRlbXBsYXRlLCBwYXJlbnRUZW1wbGF0ZSwgcHJvcGVydGllc09yVGVtcGxhdGUsIGNyZWF0ZVByb3BlcnRpZXMsIHRlbXBsYXRlTmFtZV0pO1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcGxhdGUucHJvdG90eXBlID0gdGVtcGxhdGVQcm90b3R5cGU7XG5cbiAgICAgICAgdmFyIGNyZWF0ZVByb3BlcnR5ID0gY3JlYXRlUHJvcGVydHlGdW5jLmJpbmQobnVsbCwgZnVuY3Rpb25Qcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSwgb2JqZWN0VGVtcGxhdGUsIHRlbXBsYXRlTmFtZSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUpO1xuXG5cbiAgICAgICAgLy8gV2FsayB0aHJvdWdoIHByb3BlcnRpZXMgYW5kIGNvbnN0cnVjdCB0aGUgZGVmaW5lUHJvcGVydGllcyBoYXNoIG9mIHByb3BlcnRpZXMsIHRoZSBsaXN0IG9mXG4gICAgICAgIC8vIG9iamVjdFByb3BlcnRpZXMgdGhhdCBoYXZlIHRvIGJlIHJlaW5zdGFudGlhdGVkIGFuZCBhdHRhY2ggZnVuY3Rpb25zIHRvIHRoZSBwcm90b3R5cGVcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIHByb3BlcnRpZXNPclRlbXBsYXRlKSB7XG4gICAgICAgICAgICBjcmVhdGVQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIG51bGwsIHByb3BlcnRpZXNPclRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMgPSBkZWZpbmVQcm9wZXJ0aWVzO1xuICAgICAgICB0ZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzID0gb2JqZWN0UHJvcGVydGllcztcblxuICAgICAgICB0ZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXMgPSBmdW5jdGlvblByb3BlcnRpZXM7XG4gICAgICAgIHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlID0gcGFyZW50VGVtcGxhdGU7XG5cblxuICAgICAgICB0ZW1wbGF0ZS5jcmVhdGVQcm9wZXJ0eSA9IGNyZWF0ZVByb3BlcnR5O1xuXG4gICAgICAgIHRlbXBsYXRlLnByb3BzID0ge307XG5cbiAgICAgICAgdmFyIHByb3BzdCA9IE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICAgIGZvciAodmFyIHByb3BkIGluIHByb3BzdCkge1xuICAgICAgICAgICAgdGVtcGxhdGUucHJvcHNbcHJvcGRdID0gcHJvcHN0W3Byb3BkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZSBhcyBTdXBlcnR5cGVDb25zdHJ1Y3RvcjtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHRvIGNsb25lIHRoZSBUeXBlIFN5c3RlbVxuICAgICAqIEByZXR1cm5zIHtvfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9jcmVhdGVPYmplY3QoKTogT2JqZWN0VGVtcGxhdGVDbG9uZSB7XG4gICAgICAgIGNvbnN0IG5ld0ZvbyA9IE9iamVjdC5jcmVhdGUodGhpcyk7XG4gICAgICAgIG5ld0Zvby5pbml0KCk7XG4gICAgICAgIHJldHVybiBuZXdGb287XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBQdXJwb3NlIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gb3JpZ2luYWxseSB0b29rIGEgY29udGV4dCB0aGF0IGl0IHRocmV3IGF3YXlcbiAgICAqIEByZXR1cm5zIHtTdXBlcnR5cGVMb2dnZXJ9XG4gICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlTG9nZ2VyKCk6IFN1cGVydHlwZUxvZ2dlciB7XG4gICAgICAgIHJldHVybiBuZXcgU3VwZXJ0eXBlTG9nZ2VyKCk7XG4gICAgfVxuICAgIFxuXG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUHJvcGVydHlGdW5jKGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLFxuICAgIHByb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSwgcHJvcGVydGllcywgY3JlYXRlUHJvcGVydGllcykge1xuICAgIGlmICghcHJvcGVydGllcykge1xuICAgICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoZSBpbml0aWFsaXphdGlvbiBmdW5jdGlvblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgPT0gJ2luaXQnICYmIHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmdW5jdGlvblByb3BlcnRpZXMuaW5pdCA9IFtwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV1dO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IG51bGw7IC8vIGRlZmluZVByb3BlcnR5IHRvIGJlIGFkZGVkIHRvIGRlZmluZVByb3BlcnRpZXNcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHByb3BlcnR5IHZhbHVlIHdoaWNoIG1heSBiZSBhIGRlZmluZVByb3BlcnRpZXMgc3RydWN0dXJlIG9yIGp1c3QgYW4gaW5pdGlhbCB2YWx1ZVxuICAgICAgICB2YXIgZGVzY3JpcHRvcjphbnkgPSB7fTtcblxuICAgICAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllcywgcHJvcGVydHlOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0eXBlID0gJ251bGwnO1xuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLmdldCB8fCBkZXNjcmlwdG9yLnNldCkge1xuICAgICAgICAgICAgdHlwZSA9ICdnZXRzZXQnO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgLy8gRmlndXJlIG91dCB3aGV0aGVyIHRoaXMgaXMgYSBkZWZpbmVQcm9wZXJ0eSBzdHJ1Y3R1cmUgKGhhcyBhIGNvbnN0cnVjdG9yIG9mIG9iamVjdClcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IC8vIE9yIGFycmF5XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIHJlbW90ZSBmdW5jdGlvbiBjYWxsc1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSAmJiB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5ib2R5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdID0gb2JqZWN0VGVtcGxhdGUuX3NldHVwRnVuY3Rpb24ocHJvcGVydHlOYW1lLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLm9uLCBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS50eXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3JldHVybnNfXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zYXJyYXlfXyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fb25fXyA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vbjtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX3ZhbGlkYXRlX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udmFsaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19ib2R5X18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLndyaXRhYmxlID0gdHJ1ZTsgLy8gV2UgYXJlIHVzaW5nIHNldHRlcnNcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uZW51bWVyYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIE90aGVyIGNyYXBcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdnZXRzZXQnOiAvLyBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGVtcGxhdGVQcm90b3R5cGUsIHByb3BlcnR5TmFtZSwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0ZW1wbGF0ZVByb3RvdHlwZSwgcHJvcGVydHlOYW1lKSkuZ2V0LnNvdXJjZVRlbXBsYXRlID0gdGVtcGxhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBkZWZpbmVQcm9wZXJ0eSB0byBiZSBhZGRlZFxuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci50b0NsaWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b0NsaWVudCA9IGRlc2NyaXB0b3IudG9DbGllbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudG9TZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudG9TZXJ2ZXIgPSBkZXNjcmlwdG9yLnRvU2VydmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fc2V0dXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIGRlZmluZVByb3BlcnR5LCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKiBASlNQQVRIICAqL1xuZnVuY3Rpb24gYmluZFBhcmFtcyh0ZW1wbGF0ZU5hbWUsIG9iamVjdFRlbXBsYXRlLCBmdW5jdGlvblByb3BlcnRpZXMsXG4gICAgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLFxuICAgIGNyZWF0ZVByb3BlcnRpZXMsIG9iamVjdFByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLFxuICAgIGNyZWF0ZVRlbXBsYXRlTm93LCBtaXhpblRlbXBsYXRlKSB7XG5cbiAgICBmdW5jdGlvbiB0ZW1wbGF0ZSgpIHtcbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUsIHRoaXMpO1xuICAgICAgICBsZXQgdGVtcGxhdGVSZWY6IFN1cGVydHlwZUNvbnN0cnVjdG9yID0gPFN1cGVydHlwZUNvbnN0cnVjdG9yPjxGdW5jdGlvbj50ZW1wbGF0ZTtcblxuICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX3RlbXBsYXRlVXNhZ2VfX1t0ZW1wbGF0ZVJlZi5fX25hbWVfX10gPSB0cnVlO1xuICAgICAgICB2YXIgcGFyZW50ID0gdGVtcGxhdGVSZWYuX19wYXJlbnRfXztcbiAgICAgICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZVVzYWdlX19bcGFyZW50Ll9fbmFtZV9fXSA9IHRydWU7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gcGFyZW50Ll9fcGFyZW50X187XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRlbXBsYXRlUmVmO1xuXG4gICAgICAgIGlmIChvYmplY3RUZW1wbGF0ZS5fX3RyYW5zaWVudF9fKSB7XG4gICAgICAgICAgICB0aGlzLl9fdHJhbnNpZW50X18gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBydW5lZE9iamVjdFByb3BlcnRpZXMgPSBVdGlsaXR5RnVuY3Rpb25zLnBydW5lRXhpc3RpbmcodGhpcywgdGVtcGxhdGVSZWYub2JqZWN0UHJvcGVydGllcyk7XG4gICAgICAgIHZhciBwcnVuZWREZWZpbmVQcm9wZXJ0aWVzID0gVXRpbGl0eUZ1bmN0aW9ucy5wcnVuZUV4aXN0aW5nKHRoaXMsIHRlbXBsYXRlUmVmLmRlZmluZVByb3BlcnRpZXMpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgcHJvcGVydGllcyBlaXRoZXIgd2l0aCBFTUNBIDUgZGVmaW5lUHJvcGVydGllcyBvciBieSBoYW5kXG4gICAgICAgICAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCBwcnVuZWREZWZpbmVQcm9wZXJ0aWVzKTsgLy8gVGhpcyBtZXRob2Qgd2lsbCBiZSBhZGRlZCBwcmUtRU1DQSA1XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZnJvbVJlbW90ZSA9IHRoaXMuZnJvbVJlbW90ZSB8fCBvYmplY3RUZW1wbGF0ZS5fc3Rhc2hPYmplY3QodGhpcywgdGVtcGxhdGVSZWYpO1xuXG4gICAgICAgIHRoaXMuY29weVByb3BlcnRpZXMgPSBmdW5jdGlvbiBjb3B5UHJvcGVydGllcyhvYmopIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgdGhpc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHByb3BlcnRpZXMgZnJvbSB0aGUgZGVmaW5lUHJvcGVydGllcyB2YWx1ZSBwcm9wZXJ0eVxuICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gcHJ1bmVkT2JqZWN0UHJvcGVydGllcykge1xuICAgICAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gcHJ1bmVkT2JqZWN0UHJvcGVydGllc1twcm9wZXJ0eU5hbWVdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS5pbml0KSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuYnlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZV0gPSBPYmplY3RUZW1wbGF0ZS5jbG9uZShkZWZpbmVQcm9wZXJ0eS5pbml0LCBkZWZpbmVQcm9wZXJ0eS5vZiB8fCBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSA9IChkZWZpbmVQcm9wZXJ0eS5pbml0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIFRlbXBsYXRlIGxldmVsIGluamVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHRlbXBsYXRlUmVmLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgdGVtcGxhdGVSZWYuX19pbmplY3Rpb25zX19baXhdLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iYWwgaW5qZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdFRlbXBsYXRlLl9faW5qZWN0aW9uc19fLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfX1tqXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3Byb3BfXyA9IGZ1bmN0aW9uIGcocHJvcCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0aGlzLl9fdGVtcGxhdGVfXyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fX3ZhbHVlc19fID0gZnVuY3Rpb24gZihwcm9wKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LnZhbHVlcykgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS52YWx1ZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fX2Rlc2NyaXB0aW9uc19fID0gZnVuY3Rpb24gZShwcm9wKSB7XG4gICAgICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9fcHJvcF9fKHByb3ApIHx8IHRoaXMuX19wcm9wX18oJ18nICsgcHJvcCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucykgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhbiBpbml0IGZ1bmN0aW9uIG9yIGFyZSBhIHJlbW90ZSBjcmVhdGlvbiBjYWxsIHBhcmVudCBjb25zdHJ1Y3RvciBvdGhlcndpc2UgY2FsbCBpbml0XG4gICAgICAgIC8vICBmdW5jdGlvbiB3aG8gd2lsbCBiZSByZXNwb25zaWJsZSBmb3IgY2FsbGluZyBwYXJlbnQgY29uc3RydWN0b3IgdG8gYWxsb3cgZm9yIHBhcmFtZXRlciBwYXNzaW5nLlxuICAgICAgICBpZiAodGhpcy5mcm9tUmVtb3RlIHx8ICF0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCB8fCBvYmplY3RUZW1wbGF0ZS5ub0luaXQpIHtcbiAgICAgICAgICAgIGlmIChwYXJlbnRUZW1wbGF0ZSAmJiBwYXJlbnRUZW1wbGF0ZS5pc09iamVjdFRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VGVtcGxhdGUuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVJlZi5mdW5jdGlvblByb3BlcnRpZXMuaW5pdCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXRbaV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fdGVtcGxhdGVfXyA9IHRlbXBsYXRlUmVmO1xuXG4gICAgICAgIHRoaXMudG9KU09OU3RyaW5nID0gZnVuY3Rpb24gdG9KU09OU3RyaW5nKGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUudG9KU09OU3RyaW5nKHRoaXMsIGNiKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBDbG9uZSBhbmQgb2JqZWN0IGNhbGxpbmcgYSBjYWxsYmFjayBmb3IgZWFjaCByZWZlcmVuY2VkIG9iamVjdC5cbiAgICAgICAgIFRoZSBjYWxsIGJhY2sgaXMgcGFzc2VkIChvYmosIHByb3AsIHRlbXBsYXRlKVxuICAgICAgICAgb2JqIC0gdGhlIHBhcmVudCBvYmplY3QgKGV4Y2VwdCB0aGUgaGlnaGVzdCBsZXZlbClcbiAgICAgICAgIHByb3AgLSB0aGUgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgIHRlbXBsYXRlIC0gdGhlIHRlbXBsYXRlIG9mIHRoZSBvYmplY3QgdG8gYmUgY3JlYXRlZFxuICAgICAgICAgdGhlIGZ1bmN0aW9uIHJldHVybnM6XG4gICAgICAgICAtIGZhbHN5IC0gY2xvbmUgb2JqZWN0IGFzIHVzdWFsIHdpdGggYSBuZXcgaWRcbiAgICAgICAgIC0gb2JqZWN0IHJlZmVyZW5jZSAtIHRoZSBjYWxsYmFjayBjcmVhdGVkIHRoZSBvYmplY3QgKHByZXN1bWFibHkgdG8gYmUgYWJsZSB0byBwYXNzIGluaXQgcGFyYW1ldGVycylcbiAgICAgICAgIC0gW29iamVjdF0gLSBhIG9uZSBlbGVtZW50IGFycmF5IG9mIHRoZSBvYmplY3QgbWVhbnMgZG9uJ3QgY29weSB0aGUgcHJvcGVydGllcyBvciB0cmF2ZXJzZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jcmVhdGVDb3B5ID0gZnVuY3Rpb24gY3JlYXRlQ29weShjcmVhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0VGVtcGxhdGUuY3JlYXRlQ29weSh0aGlzLCBjcmVhdG9yKTtcbiAgICAgICAgfTtcblxuICAgIH07XG5cblxuICAgIGxldCByZXR1cm5WYWwgPSA8RnVuY3Rpb24+dGVtcGxhdGU7XG5cbiAgICByZXR1cm4gcmV0dXJuVmFsIGFzIFN1cGVydHlwZUNvbnN0cnVjdG9yO1xufVxuIl19