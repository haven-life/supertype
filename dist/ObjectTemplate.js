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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0VGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvT2JqZWN0VGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMkM7QUFDM0MscURBQW9EO0FBQ3BELHVEQUFzRDtBQXFCdEQ7O0dBRUc7QUFDSDtJQUFBO0lBczZCQSxDQUFDO0lBajVCRzs7T0FFRztJQUNJLGdDQUFpQixHQUF4QjtRQUNJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNsQixJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUM1QixJQUFNLGdCQUFjLEdBQUcsSUFBSSxDQUFDO1lBRTVCLEtBQUssSUFBTSxZQUFZLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFO2dCQUNuRCxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTFELFFBQVEsQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLFFBQVE7b0JBQ3RDLGdCQUFjLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDMUMsQ0FBQyxDQUFDO2dCQUVGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN0QztTQUNKO0lBQ0wsQ0FBQztJQUVNLG1CQUFJLEdBQVg7UUFDSSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQywwQkFBMEI7SUFDakUsQ0FBQztJQUVNLGdDQUFpQixHQUF4QixVQUF5QixJQUFJ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QUFvQixPQUFPO1lBQ3pDLE9BQU8sY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDO0lBRU4sQ0FBQztJQUFBLENBQUM7SUFHRixJQUFJLFNBQVMsR0FBYSxRQUFRLENBQUM7SUFFbkMsT0FBTyxTQUFpQyxDQUFDO0FBQzdDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzZXJpYWxpemVyIGZyb20gJy4vc2VyaWFsaXplcic7XG5pbXBvcnQgeyBTdXBlcnR5cGVMb2dnZXIgfSBmcm9tICcuL1N1cGVydHlwZUxvZ2dlcic7XG5pbXBvcnQgeyBVdGlsaXR5RnVuY3Rpb25zIH0gZnJvbSAnLi9VdGlsaXR5RnVuY3Rpb25zJztcbmltcG9ydCB7IFN1cGVydHlwZUNvbnN0cnVjdG9yIH0gZnJvbSAnLi9TdXBlcnR5cGUnO1xuZXhwb3J0IHR5cGUgQ3JlYXRlVHlwZUZvck5hbWUgPSB7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICB0b0NsaWVudD86IGJvb2xlYW47XG4gICAgdG9TZXJ2ZXI/OiBib29sZWFuO1xuICAgIGlzTG9jYWw/OiBib29sZWFuO1xufVxuXG5leHBvcnQgdHlwZSBHZXR0ZXIgPSB7XG4gICAgZ2V0OiBhbnk7XG59XG5cbi8vIC8qKlxuLy8gICogdGhpcyBpcyBwcmV0dHkgbXVjaCB0aGUgY2xhc3MgKHRoZSB0ZW1wbGF0ZSBpdHNlbGYpXG4vLyAgKiBUcnkgdG8gdW5pZnkgdGhpcyB3aXRoIHRoZSBTdXBlcnR5cGUgVHlwZSAobWF5YmUgbWFrZSB0aGlzIGEgcGFydGlhbCwgaGF2ZSBzdXBlcnR5cGUgZXh0ZW5kIHRoaXMpXG4vLyAgKi9cblxuZXhwb3J0IHR5cGUgT2JqZWN0VGVtcGxhdGVDbG9uZSA9IHR5cGVvZiBPYmplY3RUZW1wbGF0ZTtcblxuXG4vKipcbiAqIHRoZSBvZyBPYmplY3RUZW1wbGF0ZSwgd2hhdCBldmVyeXRoaW5nIHBpY2tzIG9mZiBvZlxuICovXG5leHBvcnQgY2xhc3MgT2JqZWN0VGVtcGxhdGUge1xuXG4gICAgc3RhdGljIGxhenlUZW1wbGF0ZUxvYWQ6IGFueTtcbiAgICBzdGF0aWMgaXNMb2NhbFJ1bGVTZXQ6IGFueTtcbiAgICBzdGF0aWMgbmV4dElkOiBhbnk7IC8vIGZvciBzdGFzaE9iamVjdFxuICAgIHN0YXRpYyBfX2V4Y2VwdGlvbnNfXzogYW55O1xuXG4gICAgc3RhdGljIF9fdGVtcGxhdGVzX186IFN1cGVydHlwZUNvbnN0cnVjdG9yW107XG4gICAgc3RhdGljIHRvU2VydmVyUnVsZVNldDogc3RyaW5nW107XG4gICAgc3RhdGljIHRvQ2xpZW50UnVsZVNldDogc3RyaW5nW107XG5cbiAgICBzdGF0aWMgX19kaWN0aW9uYXJ5X186IHsgW2tleTogc3RyaW5nXTogU3VwZXJ0eXBlQ29uc3RydWN0b3IgfTtcbiAgICBzdGF0aWMgX19hbm9ueW1vdXNJZF9fOiBudW1iZXI7XG4gICAgc3RhdGljIF9fdGVtcGxhdGVzVG9JbmplY3RfXzoge307XG4gICAgc3RhdGljIGxvZ2dlcjogYW55O1xuICAgIGxvZ2dlcjogU3VwZXJ0eXBlTG9nZ2VyO1xuICAgIHN0YXRpYyBfX3RlbXBsYXRlVXNhZ2VfXzogYW55O1xuICAgIHN0YXRpYyBfX2luamVjdGlvbnNfXzogRnVuY3Rpb25bXTtcbiAgICBzdGF0aWMgX190b0NsaWVudF9fOiBib29sZWFuO1xuXG4gICAgc3RhdGljIGFtb3JwaGljU3RhdGljID0gT2JqZWN0VGVtcGxhdGU7XG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIHBlcmZvcm1JbmplY3Rpb25zKCkge1xuICAgICAgICB0aGlzLmdldENsYXNzZXMoKTtcbiAgICAgICAgaWYgKHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fKSB7XG4gICAgICAgICAgICBjb25zdCBvYmplY3RUZW1wbGF0ZSA9IHRoaXM7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgdGVtcGxhdGVOYW1lIGluIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfX1t0ZW1wbGF0ZU5hbWVdO1xuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuaW5qZWN0ID0gZnVuY3Rpb24gaW5qZWN0KGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmluamVjdCh0aGlzLCBpbmplY3Rvcik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2luamVjdEludG9UZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlVXNhZ2VfXyA9IHt9O1xuICAgICAgICB0aGlzLl9faW5qZWN0aW9uc19fID0gW107XG4gICAgICAgIHRoaXMuX19kaWN0aW9uYXJ5X18gPSB7fTtcbiAgICAgICAgdGhpcy5fX2Fub255bW91c0lkX18gPSAxO1xuICAgICAgICB0aGlzLl9fdGVtcGxhdGVzVG9JbmplY3RfXyA9IHt9O1xuICAgICAgICB0aGlzLmxvZ2dlciA9IHRoaXMuY3JlYXRlTG9nZ2VyKCk7IC8vIENyZWF0ZSBhIGRlZmF1bHQgbG9nZ2VyXG4gICAgfVxuXG4gICAgc3RhdGljIGdldFRlbXBsYXRlQnlOYW1lKG5hbWUpOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENsYXNzZXMoKVtuYW1lXTtcbiAgICB9XG5cbi8qKlxuICogUHVycG9zZSB1bmtub3duIC0gQEpTUEFUSFxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBuYW1lIHVua25vd25cbiAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcHMgdW5rbm93blxuICovXG4gICAgc3RhdGljIHNldFRlbXBsYXRlUHJvcGVydGllcyh0ZW1wbGF0ZSwgbmFtZSwgcHJvcHMpIHtcbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlc1RvSW5qZWN0X19bbmFtZV0gPSB0ZW1wbGF0ZTtcbiAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfX1tuYW1lXSA9IHRlbXBsYXRlO1xuICAgICAgICB0ZW1wbGF0ZS5fX25hbWVfXyA9IG5hbWU7XG4gICAgICAgIHRlbXBsYXRlLl9faW5qZWN0aW9uc19fID0gW107XG4gICAgICAgIHRlbXBsYXRlLl9fb2JqZWN0VGVtcGxhdGVfXyA9IHRoaXM7XG4gICAgICAgIHRlbXBsYXRlLl9fY2hpbGRyZW5fXyA9IFtdO1xuICAgICAgICB0ZW1wbGF0ZS5fX3RvQ2xpZW50X18gPSBwcm9wcy5fX3RvQ2xpZW50X187XG4gICAgICAgIHRlbXBsYXRlLl9fdG9TZXJ2ZXJfXyA9IHByb3BzLl9fdG9TZXJ2ZXJfXztcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENyZWF0ZSBhbiBvYmplY3QgdGVtcGxhdGUgdGhhdCBpcyBpbnN0YW50aWF0ZWQgd2l0aCB0aGUgbmV3IG9wZXJhdG9yLlxuICAgICogcHJvcGVydGllcyBpc1xuICAgICpcbiAgICAqIEBKU1BBVEggPz8gXG4gICAgKiBcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgb3IgYW4gb2JqZWN0IHdpdGhcbiAgICAqICAgICAgICBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIGNsYXNzXG4gICAgKiAgICAgICAgdG9DbGllbnQgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgY2xpZW50ICh3aXRoIHNlbW90dXMpXG4gICAgKiAgICAgICAgdG9TZXJ2ZXIgLSB3aGV0aGVyIHRoZSBvYmplY3QgaXMgdG8gYmUgc2hpcHBlZCB0byB0aGUgc2VydmVyICh3aXRoIHNlbW90dXMpXG4gICAgKiAgICAgICAgaXNMb2NhbCAtIGVxdWl2YWxlbnQgdG8gc2V0dGluZyB0b0NsaWVudCAmJiB0b1NlcnZlciB0byBmYWxzZVxuICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIGFuIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIHJlcHJlc2VudCBkYXRhIGFuZCBmdW5jdGlvblxuICAgICogcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0LiAgVGhlIGRhdGEgcHJvcGVydGllcyBtYXkgdXNlIHRoZSBkZWZpbmVQcm9wZXJ0eVxuICAgICogZm9ybWF0IGZvciBwcm9wZXJ0aWVzIG9yIG1heSBiZSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGEgTnVtYmVyLCBTdHJpbmcgb3IgRGF0ZS5cbiAgICAqXG4gICAgKiBAcmV0dXJucyB7Kn0gdGhlIG9iamVjdCB0ZW1wbGF0ZSBASlNQQVRIPz8/XG4gICAgKi9cblxuICAgIHN0YXRpYyBjcmVhdGUobmFtZTogc3RyaW5nIHwgQ3JlYXRlVHlwZUZvck5hbWUsIHByb3BlcnRpZXMpIHtcbiAgICAgICAgLyoqIHRoaXMgYmxvY2sgb25seSBleGVjdXRlcyBvbiBjcmVhdGV0eXBlZm9ybmFtZSAqL1xuICAgICAgICBpZiAobmFtZSAmJiAhKHR5cGVvZiAobmFtZSkgPT09ICdzdHJpbmcnKSAmJiBuYW1lLm5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gcHJvcHMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgfHwgbmFtZS5tYXRjaCgvW15BLVphLXowLTlfXS8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luY29ycmVjdCB0ZW1wbGF0ZSBuYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9wZXJ0aWVzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyB0ZW1wbGF0ZSBwcm9wZXJ0eSBkZWZpbml0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3JlYXRlUHJvcHMgPSBVdGlsaXR5RnVuY3Rpb25zLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcywgdGhpcyk7XG5cbiAgICAgICAgbGV0IHRlbXBsYXRlO1xuXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuX2NyZWF0ZVRlbXBsYXRlKG51bGwsIE9iamVjdCwgcHJvcGVydGllcywgY3JlYXRlUHJvcHMsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGVtcGxhdGUgPSB0aGlzLl9jcmVhdGVUZW1wbGF0ZShudWxsLCBPYmplY3QsIG5hbWUsIGNyZWF0ZVByb3BzLCBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBjcmVhdGVQcm9wcyk7XG4gICAgICAgIHRlbXBsYXRlLl9fY3JlYXRlUHJvcHNfXyA9IHByb3BzO1xuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEV4dGVuZCBhbmQgZXhpc3RpbmcgKHBhcmVudCB0ZW1wbGF0ZSkgLSAgQEpTUEFUSFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwYXJlbnRUZW1wbGF0ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB0ZW1wbGF0ZSBvciBhbiBvYmplY3Qgd2l0aFxuICAgICAqICAgICAgICBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIGNsYXNzXG4gICAgICogICAgICAgIHRvQ2xpZW50IC0gd2hldGhlciB0aGUgb2JqZWN0IGlzIHRvIGJlIHNoaXBwZWQgdG8gdGhlIGNsaWVudCAod2l0aCBzZW1vdHVzKVxuICAgICAqICAgICAgICB0b1NlcnZlciAtIHdoZXRoZXIgdGhlIG9iamVjdCBpcyB0byBiZSBzaGlwcGVkIHRvIHRoZSBzZXJ2ZXIgKHdpdGggc2Vtb3R1cylcbiAgICAgKiAgICAgICAgaXNMb2NhbCAtIGVxdWl2YWxlbnQgdG8gc2V0dGluZyB0b0NsaWVudCAmJiB0b1NlcnZlciB0byBmYWxzZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydGllcyBhcmUgdGhlIHNhbWUgYXMgZm9yIGNyZWF0ZVxuICAgICAqXG4gICAgICogQHJldHVybnMgeyp9IHRoZSBvYmplY3QgdGVtcGxhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgZXh0ZW5kKHBhcmVudFRlbXBsYXRlLCBuYW1lOiBzdHJpbmcgfCBDcmVhdGVUeXBlRm9yTmFtZSwgcHJvcGVydGllcykge1xuICAgICAgICBsZXQgcHJvcHM7XG4gICAgICAgIGxldCBjcmVhdGVQcm9wcztcblxuICAgICAgICBpZiAoIXBhcmVudFRlbXBsYXRlLl9fb2JqZWN0VGVtcGxhdGVfXykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbmNvcnJlY3QgcGFyZW50IHRlbXBsYXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChuYW1lKSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIChuYW1lKSAhPT0gJ3N0cmluZycgJiYgbmFtZS5uYW1lKSB7XG4gICAgICAgICAgICBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gcHJvcHMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3BzID0gcGFyZW50VGVtcGxhdGUuX19jcmVhdGVQcm9wc19fO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAobmFtZSkgIT09ICdzdHJpbmcnIHx8IG5hbWUubWF0Y2goL1teQS1aYS16MC05X10vKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbmNvcnJlY3QgdGVtcGxhdGUgbmFtZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAocHJvcGVydGllcykgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgdGVtcGxhdGUgcHJvcGVydHkgZGVmaW5pdGlvbnMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nVGVtcGxhdGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW25hbWVdO1xuXG4gICAgICAgIGlmIChleGlzdGluZ1RlbXBsYXRlKSB7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fICE9IHBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGVtcGxhdGUuX19wYXJlbnRfXy5fX25hbWVfXyAhPSBwYXJlbnRUZW1wbGF0ZS5fX25hbWVfXykge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTjogQXR0ZW1wdCB0byBleHRlbmQgJHtwYXJlbnRUZW1wbGF0ZS5fX25hbWVfX30gYXMgJHtuYW1lfSBidXQgJHtuYW1lfSB3YXMgYWxyZWFkeSBleHRlbmRlZCBmcm9tICR7ZXhpc3RpbmdUZW1wbGF0ZS5fX3BhcmVudF9fLl9fbmFtZV9ffWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubWl4aW4oZXhpc3RpbmdUZW1wbGF0ZSwgcHJvcGVydGllcyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdUZW1wbGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9wcykge1xuICAgICAgICAgICAgY3JlYXRlUHJvcHMgPSBVdGlsaXR5RnVuY3Rpb25zLmdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcywgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGVtcGxhdGU7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGhpcy5fY3JlYXRlVGVtcGxhdGUobnVsbCwgcGFyZW50VGVtcGxhdGUsIG5hbWUsIHBhcmVudFRlbXBsYXRlLCBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjcmVhdGVQcm9wcykge1xuICAgICAgICAgICAgdGhpcy5zZXRUZW1wbGF0ZVByb3BlcnRpZXModGVtcGxhdGUsIG5hbWUsIGNyZWF0ZVByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VGVtcGxhdGVQcm9wZXJ0aWVzKHRlbXBsYXRlLCBuYW1lLCBwYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQcm9wc19fID0gcHJvcHM7XG5cbiAgICAgICAgLy8gTWFpbnRhaW4gZ3JhcGggb2YgcGFyZW50IGFuZCBjaGlsZCB0ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGUuX19wYXJlbnRfXyA9IHBhcmVudFRlbXBsYXRlO1xuICAgICAgICBwYXJlbnRUZW1wbGF0ZS5fX2NoaWxkcmVuX18ucHVzaCh0ZW1wbGF0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBKU1BBVEggPz8/XG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHsqfSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gcHJvcGVydGllc1xuICAgICAqIEByZXR1cm5zXG4gICAgICogQG1lbWJlcm9mIE9iamVjdFRlbXBsYXRlXG4gICAgICovXG4gICAgc3RhdGljIG1peGluKHRlbXBsYXRlLCBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVUZW1wbGF0ZSh0ZW1wbGF0ZSwgbnVsbCwgcHJvcGVydGllcywgdGVtcGxhdGUsIHRlbXBsYXRlLl9fbmFtZV9fKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICpcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wZXJ0aWVzIHVua25vd25cbiAgICAqL1xuICAgIHN0YXRpYyBzdGF0aWNNaXhpbih0ZW1wbGF0ZSwgcHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGVtcGxhdGVbcHJvcF0gPSBwcm9wZXJ0aWVzW3Byb3BdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgb24gb2JqZWN0IGNyZWF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIGluamVjdCh0ZW1wbGF0ZSwgaW5qZWN0b3I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRlbXBsYXRlLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIG9uIGFsbCBvYmplY3QgY3JlYXRpb25zIChhcHBhcmVudGx5KT8gSnVzdCBhIGd1ZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbmplY3RvciAtIHVua25vd25cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2xvYmFsSW5qZWN0KGluamVjdG9yOiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9faW5qZWN0aW9uc19fLnB1c2goaW5qZWN0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgdGVtcGxhdGUgaWYgaXQgbmVlZHMgdG8gYmUgY3JlYXRlZFxuICAgICAqIEBwYXJhbSBbdW5rbm93bn0gdGVtcGxhdGUgdG8gYmUgY3JlYXRlZFxuICAgICAqIFxuICAgICAqIEBKU1BBVEggPz8/XG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlPywgdGhpc09iaj8pIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fKSB7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVQYXJhbWV0ZXJzID0gdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX187XG4gICAgICAgICAgICBmb3IgKHZhciBpeCA9IDA7IGl4IDwgY3JlYXRlUGFyYW1ldGVycy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBjcmVhdGVQYXJhbWV0ZXJzW2l4XTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVUZW1wbGF0ZShwYXJhbXNbMF0sIHBhcmFtc1sxXSwgcGFyYW1zWzJdLCBwYXJhbXNbM10sIHBhcmFtc1s0XSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGVtcGxhdGUuX2luamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5faW5qZWN0UHJvcGVydGllcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXNPYmopIHtcbiAgICAgICAgICAgICAgICAvL3ZhciBjb3B5ID0gbmV3IHRlbXBsYXRlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvdG90eXBlcyA9IFt0ZW1wbGF0ZS5wcm90b3R5cGVdO1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnQgPSB0ZW1wbGF0ZS5fX3BhcmVudF9fO1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvdG90eXBlcy5wdXNoKHBhcmVudC5wcm90b3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQuX19wYXJlbnRfXztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSBwcm90b3R5cGVzLmxlbmd0aCAtIDE7IGl4ID49IDA7IC0taXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm90b3R5cGVzW2l4XSk7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzLmZvckVhY2goKHZhbCwgaXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzT2JqLCBwcm9wc1tpeF0sIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG90eXBlc1tpeF0sIHByb3BzW2l4XSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpc09iai5fX3Byb3RvX18gPSB0ZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Q2xhc3NlcygpOiB7IFtrZXk6IHN0cmluZ106IFN1cGVydHlwZUNvbnN0cnVjdG9yIH0ge1xuICAgICAgICBpZiAodGhpcy5fX3RlbXBsYXRlc19fKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpeCA9IDA7IGl4IDwgdGhpcy5fX3RlbXBsYXRlc19fLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMuX190ZW1wbGF0ZXNfX1tpeF07XG4gICAgICAgICAgICAgICAgdGhpcy5fX2RpY3Rpb25hcnlfX1tjb25zdHJ1Y3Rvck5hbWUodGVtcGxhdGUpXSA9IHRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIHRoaXMuX190ZW1wbGF0ZXNUb0luamVjdF9fW2NvbnN0cnVjdG9yTmFtZSh0ZW1wbGF0ZSldID0gdGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0RlZmVycmVkVHlwZXModGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fX3RlbXBsYXRlc19fID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZU5hbWUxIGluIHRoaXMuX19kaWN0aW9uYXJ5X18pIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLl9fZGljdGlvbmFyeV9fW3RlbXBsYXRlTmFtZTFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudFRlbXBsYXRlTmFtZSA9IGNvbnN0cnVjdG9yTmFtZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGVtcGxhdGUucHJvdG90eXBlKS5jb25zdHJ1Y3Rvcik7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUuX19zaGFkb3dQYXJlbnRfXyA9IHRoaXMuX19kaWN0aW9uYXJ5X19bcGFyZW50VGVtcGxhdGVOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGUuX19zaGFkb3dQYXJlbnRfXykge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5fX3NoYWRvd1BhcmVudF9fLl9fc2hhZG93Q2hpbGRyZW5fXy5wdXNoKHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGVtcGxhdGUucHJvcHMgPSB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wc3QgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BkIGluIHByb3BzdCkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5wcm9wc1twcm9wZF0gPSBwcm9wc3RbcHJvcGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9fZXhjZXB0aW9uc19fKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX19leGNlcHRpb25zX18ubWFwKGNyZWF0ZU1lc3NhZ2VMaW5lKS5qb2luKCdcXG4nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTWVzc2FnZUxpbmUoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhjZXB0aW9uLmZ1bmMoZXhjZXB0aW9uLmNsYXNzKCksIGV4Y2VwdGlvbi5wcm9wKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzRGVmZXJyZWRUeXBlcyh0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlLnByb3RvdHlwZS5fX2RlZmVycmVkVHlwZV9fKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRlbXBsYXRlLnByb3RvdHlwZS5fX2RlZmVycmVkVHlwZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmluZVByb3BlcnR5ID0gdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gdGVtcGxhdGUucHJvdG90eXBlLl9fZGVmZXJyZWRUeXBlX19bcHJvcF0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS50eXBlID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5Lm9mID0gdHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9fZGljdGlvbmFyeV9fO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbnN0cnVjdG9yTmFtZShjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgY29uc3QgbmFtZWRGdW5jdGlvbiA9IGNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXihdKikvKTtcbiAgICAgICAgICAgIHJldHVybiBuYW1lZEZ1bmN0aW9uID8gbmFtZWRGdW5jdGlvblsxXSA6IG51bGw7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRkZW4gYnkgb3RoZXIgVHlwZSBTeXN0ZW1zIHRvIGNhY2hlIG9yIGdsb2JhbGx5IGlkZW50aWZ5IG9iamVjdHNcbiAgICAgKiBBbHNvIGFzc2lnbnMgYSB1bmlxdWUgaW50ZXJuYWwgSWQgc28gdGhhdCBjb21wbGV4IHN0cnVjdHVyZXMgd2l0aFxuICAgICAqIHJlY3Vyc2l2ZSBvYmplY3RzIGNhbiBiZSBzZXJpYWxpemVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaiAtIHRoZSBvYmplY3QgdG8gYmUgcGFzc2VkIGR1cmluZyBjcmVhdGlvbiB0aW1lXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSAtIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX3N0YXNoT2JqZWN0KG9iaiwgdGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKCFvYmouX19pZF9fKSB7XG4gICAgICAgICAgICBpZiAoIU9iamVjdFRlbXBsYXRlLm5leHRJZCkge1xuICAgICAgICAgICAgICAgIE9iamVjdFRlbXBsYXRlLm5leHRJZCA9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9iai5fX2lkX18gPSAnbG9jYWwtJyArIHRlbXBsYXRlLl9fbmFtZV9fICsgJy0nICsgKytPYmplY3RUZW1wbGF0ZS5uZXh0SWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZGVuIGJ5IG90aGVyIFR5cGUgU3lzdGVtcyB0byBpbmplY3Qgb3RoZXIgZWxlbWVudHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7X3RlbXBsYXRlfSBfdGVtcGxhdGUgLSB0aGUgb2JqZWN0IHRvIGJlIHBhc3NlZCBkdXJpbmcgY3JlYXRpb24gdGltZVxuICAgICAqIFxuICAgICAqIEBwcml2YXRlXG4gICAgICogKi9cbiAgICBzdGF0aWMgX2luamVjdEludG9UZW1wbGF0ZShfdGVtcGxhdGUpIHsgfTtcblxuICAgIC8qKlxuICAgICAqIFVzZWQgYnkgdGVtcGxhdGUgc2V0dXAgdG8gY3JlYXRlIGFuIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yIHVzZSBieSB0aGUgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydHlOYW1lIGlzIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydHkgaXMgdGhlIHByb3BlcnR5IGRlc2NyaXB0b3IgcGFzc2VkIHRvIHRoZSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gb2JqZWN0UHJvcGVydGllcyBpcyBhbGwgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgcHJvY2Vzc2VkIG1hbnVhbGx5LiAgQSBuZXcgcHJvcGVydHkgaXNcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZCB0byB0aGlzIGlmIHRoZSBwcm9wZXJ0eSBuZWVkcyB0byBiZSBpbml0aWFsaXplZCBieSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gZGVmaW5lUHJvcGVydGllcyBpcyBhbGwgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgQSBuZXcgcHJvcGVydHkgd2lsbCBiZSBhZGRlZCB0byB0aGlzIG9iamVjdFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX3NldHVwUHJvcGVydHkocHJvcGVydHlOYW1lLCBkZWZpbmVQcm9wZXJ0eSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciB2YWx1ZSBuZWVkcyB0byBiZSByZS1pbml0aWFsaXplZCBpbiBjb25zdHJ1Y3RvclxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRlZmluZVByb3BlcnR5LnZhbHVlO1xuICAgICAgICBjb25zdCBieVZhbHVlID0gdmFsdWUgJiYgdHlwZW9mICh2YWx1ZSkgIT09ICdudW1iZXInICYmIHR5cGVvZiAodmFsdWUpICE9PSAnc3RyaW5nJztcblxuICAgICAgICBpZiAoYnlWYWx1ZSB8fCAhT2JqZWN0LmRlZmluZVByb3BlcnRpZXMgfHwgZGVmaW5lUHJvcGVydHkuZ2V0IHx8IGRlZmluZVByb3BlcnR5LnNldCkge1xuICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0ge1xuICAgICAgICAgICAgICAgIGluaXQ6IGRlZmluZVByb3BlcnR5LnZhbHVlLFxuICAgICAgICAgICAgICAgIHR5cGU6IGRlZmluZVByb3BlcnR5LnR5cGUsXG4gICAgICAgICAgICAgICAgb2Y6IGRlZmluZVByb3BlcnR5Lm9mLFxuICAgICAgICAgICAgICAgIGJ5VmFsdWVcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRlbGV0ZSBkZWZpbmVQcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZW4gYSBzdXBlciBjbGFzcyBiYXNlZCBvbiBvYmplY3RUZW1wbGF0ZSBkb24ndCB0cmFuc3BvcnQgcHJvcGVydGllc1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b1NlcnZlciA9IGZhbHNlO1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eS50b0NsaWVudCA9IGZhbHNlO1xuICAgICAgICBkZWZpbmVQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBkZWZpbmVQcm9wZXJ0eTtcblxuICAgICAgICAvLyBBZGQgZ2V0dGVycyBhbmQgc2V0dGVyc1xuICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkuZ2V0IHx8IGRlZmluZVByb3BlcnR5LnNldCkge1xuICAgICAgICAgICAgY29uc3QgdXNlclNldHRlciA9IGRlZmluZVByb3BlcnR5LnNldDtcblxuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuc2V0ID0gKGZ1bmN0aW9uIGQoKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIGEgY2xvc3VyZSB0byByZWNvcmQgdGhlIHByb3BlcnR5IG5hbWUgd2hpY2ggaXMgbm90IHBhc3NlZCB0byB0aGUgc2V0dGVyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcCA9IHByb3BlcnR5TmFtZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBjKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyU2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHVzZXJTZXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRlZmluZVByb3BlcnR5LmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1tgX18ke3Byb3B9YF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCB1c2VyR2V0dGVyID0gZGVmaW5lUHJvcGVydHkuZ2V0O1xuXG4gICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eS5nZXQgPSAoZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBjbG9zdXJlIHRvIHJlY29yZCBwcm9wZXJ0eSBuYW1lIHdoaWNoIGlzIG5vdCBwYXNzZWQgdG8gdGhlIGdldHRlclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBwcm9wZXJ0eU5hbWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gYigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJHZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eS5pc1ZpcnR1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckdldHRlci5jYWxsKHRoaXMsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1c2VyR2V0dGVyLmNhbGwodGhpcywgdGhpc1tgX18ke3Byb3B9YF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbYF9fJHtwcm9wfWBdO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBpZiAoIWRlZmluZVByb3BlcnR5LmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXNbYF9fJHtwcm9wZXJ0eU5hbWV9YF0gPSB7IGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkudmFsdWU7XG4gICAgICAgICAgICBkZWxldGUgZGVmaW5lUHJvcGVydHkud3JpdGFibGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9uZSBhbiBvYmplY3QgY3JlYXRlZCBmcm9tIGFuIE9iamVjdFRlbXBsYXRlXG4gICAgICogVXNlZCBvbmx5IHdpdGhpbiBzdXBlcnR5cGUgKHNlZSBjb3B5T2JqZWN0IGZvciBnZW5lcmFsIGNvcHkpXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBzb3VyY2Ugb2JqZWN0XG4gICAgICogQHBhcmFtIHRlbXBsYXRlIGlzIHRoZSB0ZW1wbGF0ZSB1c2VkIHRvIGNyZWF0ZSB0aGUgb2JqZWN0XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gYSBjb3B5IG9mIHRoZSBvYmplY3RcbiAgICAgKi9cbiAgICAvLyBGdW5jdGlvbiB0byBjbG9uZSBzaW1wbGUgb2JqZWN0cyB1c2luZyBPYmplY3RUZW1wbGF0ZSBhcyBhIGd1aWRlXG4gICAgc3RhdGljIGNsb25lKG9iaiwgdGVtcGxhdGU/KSB7XG4gICAgICAgIGxldCBjb3B5O1xuXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUob2JqLmdldFRpbWUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGNvcHkgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IG9iai5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgICAgICBjb3B5W2l4XSA9IHRoaXMuY2xvbmUob2JqW2l4XSwgdGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZW1wbGF0ZSAmJiBvYmogaW5zdGFuY2VvZiB0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgY29weSA9IG5ldyB0ZW1wbGF0ZSgpO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3AgIT0gJ19faWRfXycgJiYgIShvYmpbcHJvcF0gaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmaW5lUHJvcGVydHkgPSB0aGlzLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0ZW1wbGF0ZSkgfHwge307XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29weVtwcm9wXSA9IHRoaXMuY2xvbmUob2JqW3Byb3BdLCBkZWZpbmVQcm9wZXJ0eS5vZiB8fCBkZWZpbmVQcm9wZXJ0eS50eXBlIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgICAgIGNvcHkgPSB7fTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wYyBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3BjKSkge1xuICAgICAgICAgICAgICAgICAgICBjb3B5W3Byb3BjXSA9IHRoaXMuY2xvbmUob2JqW3Byb3BjXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZGVuIGJ5IG90aGVyIFR5cGUgU3lzdGVtcyB0byBiZSBhYmxlIHRvIGNyZWF0ZSByZW1vdGUgZnVuY3Rpb25zIG9yXG4gICAgICogb3RoZXJ3aXNlIGludGVyY2VwdCBmdW5jdGlvbiBjYWxsc1xuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBfcHJvcGVydHlOYW1lIGlzIHRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcHJvcGVydHlWYWx1ZSBpcyB0aGUgZnVuY3Rpb24gaXRzZWxmXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn0gYSBuZXcgZnVuY3Rpb24gdG8gYmUgYXNzaWduZWQgdG8gdGhlIG9iamVjdCBwcm90b3R5cGVcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9zZXR1cEZ1bmN0aW9uKF9wcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUsIC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG4gICAgfTtcblxuICAgIC8qKlxuICogUHVycG9zZSB1bmtub3duXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSBvYmogdW5rbm93blxuICogQHBhcmFtIHt1bmtub3dufSBjcmVhdG9yIHVua25vd25cbiAqXG4gKiBAcmV0dXJucyB7dW5rbm93bn1cbiAqL1xuICAgIHN0YXRpYyBjcmVhdGVDb3B5KG9iaiwgY3JlYXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5mcm9tUE9KTyhvYmosIG9iai5fX3RlbXBsYXRlX18sIG51bGwsIG51bGwsIHVuZGVmaW5lZCwgbnVsbCwgbnVsbCwgY3JlYXRvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWJzdHJhY3QgZnVuY3Rpb24gZm9yIGJlbmVmaXQgb2YgU2Vtb3R1c1xuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBjYiB1bmtub3duXG4gICAgICovXG4gICAgc3RhdGljIHdpdGhvdXRDaGFuZ2VUcmFja2luZyhjYikge1xuICAgICAgICBjYigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwb2pvIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGRlZmluZVByb3BlcnR5IHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGlkTWFwIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGlkUXVhbGlmaWVyIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHBhcmVudCB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wIHVua25vd25cbiAgICAgKiBAcGFyYW0ge3Vua25vd259IGNyZWF0b3IgdW5rbm93blxuICAgICAqXG4gICAgKiBAcmV0dXJucyB7dW5rbm93bn1cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tUE9KTyA9IHNlcmlhbGl6ZXIuZnJvbVBPSk87XG5cbiAgICAvKipcbiAgICAqIFB1cnBvc2UgdW5rbm93blxuICAgICpcbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gc3RyIHVua25vd25cbiAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICogQHBhcmFtIHt1bmtub3dufSBpZFF1YWxpZmllciB1bmtub3duXG4gICAgKiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFF1YWxpZmllcilcbiAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICovXG4gICAgc3RhdGljIGZyb21KU09OID0gc2VyaWFsaXplci5mcm9tSlNPTjtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgYW4gb2JqZWN0IHRvIEpTT04sIHN0cmlwcGluZyBhbnkgcmVjdXJzaXZlIG9iamVjdCByZWZlcmVuY2VzIHNvIHRoZXkgY2FuIGJlXG4gICAgICogcmVjb25zdGl0dXRlZCBsYXRlclxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBvYmogdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY2IgdW5rbm93blxuICAgICAqXG4gICAgICogQHJldHVybnMge3Vua25vd259XG4gICAgICovXG4gICAgc3RhdGljIHRvSlNPTlN0cmluZyA9IHNlcmlhbGl6ZXIudG9KU09OU3RyaW5nO1xuXG4gICAgICAgICAvKipcbiAgICAgLyoqXG4gICAgICAqIEZpbmQgdGhlIHJpZ2h0IHN1YmNsYXNzIHRvIGluc3RhbnRpYXRlIGJ5IGVpdGhlciBsb29raW5nIGF0IHRoZVxuICAgICAgKiBkZWNsYXJlZCBsaXN0IGluIHRoZSBzdWJDbGFzc2VzIGRlZmluZSBwcm9wZXJ0eSBvciB3YWxraW5nIHRocm91Z2hcbiAgICAgICogdGhlIHN1YmNsYXNzZXMgb2YgdGhlIGRlY2xhcmVkIHRlbXBsYXRlXG4gICAgICAqXG4gICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaklkIHVua25vd25cbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgKiBAcHJpdmF0ZVxuICAgICAgKi9cbiAgICAgc3RhdGljIF9yZXNvbHZlU3ViQ2xhc3ModGVtcGxhdGUsIG9iaklkLCBkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICBsZXQgdGVtcGxhdGVOYW1lID0gJyc7XG5cbiAgICAgICAgaWYgKG9iaklkLm1hdGNoKC8tKFtBLVphLXowLTlfOl0qKS0vKSkge1xuICAgICAgICAgICAgdGVtcGxhdGVOYW1lID0gUmVnRXhwLiQxO1xuICAgICAgICB9XG5cbiAgICAvLyBSZXNvbHZlIHRlbXBsYXRlIHN1YmNsYXNzIGZvciBwb2x5bW9ycGhpYyBpbnN0YW50aWF0aW9uXG4gICAgICAgIGlmIChkZWZpbmVQcm9wZXJ0eSAmJiBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzICYmIG9iaklkICE9ICdhbm9ueW1vdXMpJykge1xuICAgICAgICAgICAgaWYgKHRlbXBsYXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGl4ID0gMDsgaXggPCBkZWZpbmVQcm9wZXJ0eS5zdWJDbGFzc2VzLmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVOYW1lID09IGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXNbaXhdLl9fbmFtZV9fKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IGRlZmluZVByb3BlcnR5LnN1YkNsYXNzZXNbaXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc3ViQ2xhc3MgPSB0aGlzLl9maW5kU3ViQ2xhc3ModGVtcGxhdGUsIHRlbXBsYXRlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWJDbGFzcykge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gc3ViQ2xhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhbGsgcmVjdXJzaXZlbHkgdGhyb3VnaCBleHRlbnNpb25zIG9mIHRlbXBsYXRlIHZpYSBfX2NoaWxkcmVuX19cbiAgICAgKiBsb29raW5nIGZvciBhIG5hbWUgbWF0Y2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGUgdW5rbm93blxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gdGVtcGxhdGVOYW1lIHVua25vd25cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZmluZFN1YkNsYXNzKHRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUpIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlLl9fbmFtZV9fID09IHRlbXBsYXRlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaXggPSAwOyBpeCA8IHRlbXBsYXRlLl9fY2hpbGRyZW5fXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gdGhpcy5fZmluZFN1YkNsYXNzKHRlbXBsYXRlLl9fY2hpbGRyZW5fX1tpeF0sIHRlbXBsYXRlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWJDbGFzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJDbGFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgaGlnaGVzdCBsZXZlbCB0ZW1wbGF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIF9nZXRCYXNlQ2xhc3ModGVtcGxhdGUpIHtcbiAgICAgICAgd2hpbGUgKHRlbXBsYXRlLl9fcGFyZW50X18pIHtcbiAgICAgICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUuX19wYXJlbnRfXztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICAgICAgIC8qKlxuICAgICAgKiBBbiBvdmVycmlkYWJsZSBmdW5jdGlvbiB1c2VkIHRvIGNyZWF0ZSBhbiBvYmplY3QgZnJvbSBhIHRlbXBsYXRlIGFuZCBvcHRpb25hbGx5XG4gICAgICAqIG1hbmFnZSB0aGUgY2FjaGluZyBvZiB0aGF0IG9iamVjdCAodXNlZCBieSBkZXJpdmF0aXZlIHR5cGUgc3lzdGVtcykuICBJdFxuICAgICAgKiBwcmVzZXJ2ZXMgdGhlIG9yaWdpbmFsIGlkIG9mIGFuIG9iamVjdFxuICAgICAgKlxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIG9mIG9iamVjdFxuICAgICAgKiBAcGFyYW0ge3Vua25vd259IG9iaklkIGFuZCBpZCAoaWYgcHJlc2VudClcbiAgICAgICogQHBhcmFtIHt1bmtub3dufSBkZWZpbmVQcm9wZXJ0eSB1bmtub3duXG4gICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgKiBAcHJpdmF0ZVxuICAgICAgKi9cbiAgICAgc3RhdGljIF9jcmVhdGVFbXB0eU9iamVjdCh0ZW1wbGF0ZSwgb2JqSWQsIGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5fcmVzb2x2ZVN1YkNsYXNzKHRlbXBsYXRlLCBvYmpJZCwgZGVmaW5lUHJvcGVydHkpO1xuXG4gICAgICAgIGNvbnN0IG9sZFN0YXNoT2JqZWN0ID0gdGhpcy5fc3Rhc2hPYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iaklkKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFzaE9iamVjdCA9IGZ1bmN0aW9uIHN0YXNoT2JqZWN0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gbmV3IHRlbXBsYXRlKCk7XG4gICAgICAgIHRoaXMuX3N0YXNoT2JqZWN0ID0gb2xkU3Rhc2hPYmplY3Q7XG5cbiAgICAgICAgaWYgKG9iaklkKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZS5fX2lkX18gPSBvYmpJZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rcyB1cCBhIHByb3BlcnR5IGluIHRoZSBkZWZpbmVQcm9wZXJ0aWVzIHNhdmVkIHdpdGggdGhlIHRlbXBsYXRlIGNhc2NhZGluZ1xuICAgICAqIHVwIHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gZmluZCBpdFxuICAgICAqXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBwcm9wIGlzIHRoZSBwcm9wZXJ0eSBiZWluZyBzb3VnaHRcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIGlzIHRoZSB0ZW1wbGF0ZSB1c2VkIHRvIGNyZWF0ZSB0aGUgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHByb3BlcnR5XG4gICAgICogQHJldHVybnMgeyp9IHRoZSBcImRlZmluZVByb3BlcnR5XCIgc3RydWN0dXJlIGZvciB0aGUgcHJvcGVydHlcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKHRlbXBsYXRlICYmICh0ZW1wbGF0ZSAhPSBPYmplY3QpICYmIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMgJiYgdGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGVtcGxhdGUgJiYgdGVtcGxhdGUucGFyZW50VGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nZXREZWZpbmVQcm9wZXJ0eShwcm9wLCB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgaGFzaCBvZiBhbGwgcHJvcGVydGllcyBpbmNsdWRpbmcgdGhvc2UgaW5oZXJpdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHRlbXBsYXRlIGlzIHRoZSB0ZW1wbGF0ZSB1c2VkIHRvIGNyZWF0ZSB0aGUgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHByb3BlcnR5XG4gICAgICogQHBhcmFtIHt1bmtub3dufSByZXR1cm5WYWx1ZSB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBpbmNsdWRlVmlydHVhbCB1bmtub3duXG4gICAgICogQHJldHVybnMgeyp9IGFuIGFzc29jaWF0aXZlIGFycmF5IG9mIGVhY2ggXCJkZWZpbmVQcm9wZXJ0eVwiIHN0cnVjdHVyZSBmb3IgdGhlIHByb3BlcnR5XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgX2dldERlZmluZVByb3BlcnRpZXModGVtcGxhdGUsIHJldHVyblZhbHVlLCBpbmNsdWRlVmlydHVhbCkge1xuICAgICAgICBpZiAoIXJldHVyblZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVWaXJ0dWFsIHx8ICF0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdLmlzVmlydHVhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZVtwcm9wXSA9IHRlbXBsYXRlLmRlZmluZVByb3BlcnRpZXNbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLnBhcmVudFRlbXBsYXRlLCByZXR1cm5WYWx1ZSwgaW5jbHVkZVZpcnR1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEdlbmVyYWwgZnVuY3Rpb24gdG8gY3JlYXRlIHRlbXBsYXRlcyB1c2VkIGJ5IGNyZWF0ZSwgZXh0ZW5kIGFuZCBtaXhpblxuICAgICAqIEBKU1BBVEggPz8/XG4gICAgICogXG4gICAgICogQHBhcmFtIHt1bmtub3dufSBtaXhpblRlbXBsYXRlIC0gdGVtcGxhdGUgdXNlZCBmb3IgYSBtaXhpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gcGFyZW50VGVtcGxhdGUgLSB0ZW1wbGF0ZSB1c2VkIGZvciBhbiBleHRlbmRcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BlcnRpZXNPclRlbXBsYXRlIC0gcHJvcGVydGllcyB0byBiZSBhZGRlZC9teGllZCBpblxuICAgICAqIEBwYXJhbSB7dW5rbm93bn0gY3JlYXRlUHJvcGVydGllcyB1bmtub3duXG4gICAgICogQHBhcmFtIHt1bmtub3dufSB0ZW1wbGF0ZU5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgdGVtcGxhdGUgYXMgaXQgd2lsbCBiZSBzdG9yZWQgcmV0cmlldmVkIGZyb20gZGljdGlvbmFyeVxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfY3JlYXRlVGVtcGxhdGUobWl4aW5UZW1wbGF0ZT8sIHBhcmVudFRlbXBsYXRlPywgcHJvcGVydGllc09yVGVtcGxhdGU/LCBjcmVhdGVQcm9wZXJ0aWVzPywgdGVtcGxhdGVOYW1lPywgY3JlYXRlVGVtcGxhdGVOb3c/KSB7XG4gICAgICAgIC8vIFdlIHdpbGwgcmV0dXJuIGEgY29uc3RydWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBpbiBhIG5ldyBmdW5jdGlvblxuICAgICAgICAvLyB0aGF0IHdpbGwgY2FsbCBhbiBpbml0KCkgZnVuY3Rpb24gZm91bmQgaW4gcHJvcGVydGllcywgZGVmaW5lIHByb3BlcnRpZXMgdXNpbmcgT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgICAgICAgLy8gYW5kIG1ha2UgY29waWVzIG9mIHRob3NlIHRoYXQgYXJlIHJlYWxseSBvYmplY3RzXG4gICAgICAgIHZhciBmdW5jdGlvblByb3BlcnRpZXM6YW55ID0ge307ICAgIC8vIFdpbGwgYmUgcG9wdWxhdGVkIHdpdGggaW5pdCBmdW5jdGlvbiBmcm9tIHByb3BlcnRpZXNcbiAgICAgICAgdmFyIG9iamVjdFByb3BlcnRpZXMgPSB7fTsgICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIGJlIHByb2Nlc3NlZCBieSBoYW5kXG4gICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0aWVzID0ge307ICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBiZSBzZW50IHRvIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKClcbiAgICAgICAgdmFyIG9iamVjdFRlbXBsYXRlID0gdGhpcztcbiAgICAgICAgdmFyIHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIGZ1bmN0aW9uIEYoKSB7IH0gICAgIC8vIFVzZWQgaW4gY2FzZSBvZiBleHRlbmRcblxuICAgICAgICBpZiAoIXRoaXMubGF6eVRlbXBsYXRlTG9hZCkge1xuICAgICAgICAgICAgY3JlYXRlVGVtcGxhdGVOb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNldHVwIHZhcmlhYmxlcyBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgY2FsbCAoY3JlYXRlLCBleHRlbmQsIG1peGluKVxuICAgICAgICBpZiAoY3JlYXRlVGVtcGxhdGVOb3cpIHtcbiAgICAgICAgICAgIGlmIChtaXhpblRlbXBsYXRlKSB7ICAgICAgICAvLyBNaXhpblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQobWl4aW5UZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNPclRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJZk5lZWRlZChwcm9wZXJ0aWVzT3JUZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzW3Byb3BdID0gcHJvcGVydGllc09yVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BwIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLm9iamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllc1twcm9wcF0gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5vYmplY3RQcm9wZXJ0aWVzW3Byb3BwXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BvIGluIHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BvID09ICdpbml0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgPSBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0IHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaXggPSAwOyBpeCA8IHByb3BlcnRpZXNPclRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0Lmxlbmd0aDsgKytpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0LnB1c2gocHJvcGVydGllc09yVGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXRbaXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLmZ1bmN0aW9uUHJvcGVydGllc1twcm9wb10gPSBwcm9wZXJ0aWVzT3JUZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXNbcHJvcG9dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcG4gaW4gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcERlc2MgPSA8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlLCBwcm9wbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4sIHByb3BEZXNjKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRGVzYy5nZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxHZXR0ZXI+T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtaXhpblRlbXBsYXRlLnByb3RvdHlwZSwgcHJvcG4pKS5nZXQuc291cmNlVGVtcGxhdGUgPSBwcm9wRGVzYy5nZXQuc291cmNlVGVtcGxhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGVbcHJvcG5dID0gcHJvcGVydGllc09yVGVtcGxhdGUucHJvdG90eXBlW3Byb3BuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1peGluVGVtcGxhdGUucHJvcHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyhtaXhpblRlbXBsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BtIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpblRlbXBsYXRlLnByb3BzW3Byb3BtXSA9IHByb3BzW3Byb3BtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaXhpblRlbXBsYXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUuZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0UHJvcGVydGllcyA9IG1peGluVGVtcGxhdGUub2JqZWN0UHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25Qcm9wZXJ0aWVzID0gbWl4aW5UZW1wbGF0ZS5mdW5jdGlvblByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbWl4aW5UZW1wbGF0ZS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFRlbXBsYXRlID0gbWl4aW5UZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHsgICAgICAgIC8vIEV4dGVuZFxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSWZOZWVkZWQocGFyZW50VGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIEYucHJvdG90eXBlID0gcGFyZW50VGVtcGxhdGUucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlID0gbmV3IEYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0b3IgdGhhdCB3aWxsIGJlIHJldHVybmVkIHdpbGwgb25seSBldmVyIGJlIGNyZWF0ZWQgb25jZVxuICAgICAgICAgKiByZW1vdmluZyB0aGUgdHlwaW5nICh0aGlzIGlzIGphdmFzY3JpcHQgYW55d2F5KVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHRlbXBsYXRlOiBhbnkgPSB0aGlzLl9fZGljdGlvbmFyeV9fW3RlbXBsYXRlTmFtZV0gfHxcbiAgICAgICAgICAgIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICAgICAgICAgICAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSlcblxuXG4gICAgICAgIHRlbXBsYXRlLmlzT2JqZWN0VGVtcGxhdGUgPSB0cnVlO1xuXG4gICAgICAgIHRlbXBsYXRlLmV4dGVuZCA9IChwMSwgcDIpID0+IG9iamVjdFRlbXBsYXRlLmV4dGVuZC5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUubWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5taXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcbiAgICAgICAgdGVtcGxhdGUuc3RhdGljTWl4aW4gPSAocDEsIHAyKSA9PiBvYmplY3RUZW1wbGF0ZS5zdGF0aWNNaXhpbi5jYWxsKG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZSwgcDEsIHAyKTtcblxuICAgICAgICB0ZW1wbGF0ZS5mcm9tUE9KTyA9IChwb2pvKSA9PiB7XG4gICAgICAgICAgICBvYmplY3RUZW1wbGF0ZS5jcmVhdGVJZk5lZWRlZCh0ZW1wbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0VGVtcGxhdGUuZnJvbVBPSk8ocG9qbywgdGVtcGxhdGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRlbXBsYXRlLmZyb21KU09OID0gKHN0ciwgaWRQcmVmaXgpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3RUZW1wbGF0ZS5mcm9tSlNPTihzdHIsIHRlbXBsYXRlLCBpZFByZWZpeCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVtcGxhdGUuZ2V0UHJvcGVydGllcyA9IChpbmNsdWRlVmlydHVhbCkgPT4ge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuY3JlYXRlSWZOZWVkZWQodGVtcGxhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLl9nZXREZWZpbmVQcm9wZXJ0aWVzKHRlbXBsYXRlLCB1bmRlZmluZWQsIGluY2x1ZGVWaXJ0dWFsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWNyZWF0ZVRlbXBsYXRlTm93KSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5fX2NyZWF0ZVBhcmFtZXRlcnNfXyA9IHRlbXBsYXRlLl9fY3JlYXRlUGFyYW1ldGVyc19fIHx8IFtdO1xuICAgICAgICAgICAgdGVtcGxhdGUuX19jcmVhdGVQYXJhbWV0ZXJzX18ucHVzaChbbWl4aW5UZW1wbGF0ZSwgcGFyZW50VGVtcGxhdGUsIHByb3BlcnRpZXNPclRlbXBsYXRlLCBjcmVhdGVQcm9wZXJ0aWVzLCB0ZW1wbGF0ZU5hbWVdKTtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBsYXRlLnByb3RvdHlwZSA9IHRlbXBsYXRlUHJvdG90eXBlO1xuXG4gICAgICAgIHZhciBjcmVhdGVQcm9wZXJ0eSA9IGNyZWF0ZVByb3BlcnR5RnVuYy5iaW5kKG51bGwsIGZ1bmN0aW9uUHJvcGVydGllcywgdGVtcGxhdGVQcm90b3R5cGUsIG9iamVjdFRlbXBsYXRlLCB0ZW1wbGF0ZU5hbWUsIG9iamVjdFByb3BlcnRpZXMsIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlKTtcblxuXG4gICAgICAgIC8vIFdhbGsgdGhyb3VnaCBwcm9wZXJ0aWVzIGFuZCBjb25zdHJ1Y3QgdGhlIGRlZmluZVByb3BlcnRpZXMgaGFzaCBvZiBwcm9wZXJ0aWVzLCB0aGUgbGlzdCBvZlxuICAgICAgICAvLyBvYmplY3RQcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0byBiZSByZWluc3RhbnRpYXRlZCBhbmQgYXR0YWNoIGZ1bmN0aW9ucyB0byB0aGUgcHJvdG90eXBlXG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5TmFtZSBpbiBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlUHJvcGVydHkocHJvcGVydHlOYW1lLCBudWxsLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSwgY3JlYXRlUHJvcGVydGllcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZS5kZWZpbmVQcm9wZXJ0aWVzID0gZGVmaW5lUHJvcGVydGllcztcbiAgICAgICAgdGVtcGxhdGUub2JqZWN0UHJvcGVydGllcyA9IG9iamVjdFByb3BlcnRpZXM7XG5cbiAgICAgICAgdGVtcGxhdGUuZnVuY3Rpb25Qcm9wZXJ0aWVzID0gZnVuY3Rpb25Qcm9wZXJ0aWVzO1xuICAgICAgICB0ZW1wbGF0ZS5wYXJlbnRUZW1wbGF0ZSA9IHBhcmVudFRlbXBsYXRlO1xuXG5cbiAgICAgICAgdGVtcGxhdGUuY3JlYXRlUHJvcGVydHkgPSBjcmVhdGVQcm9wZXJ0eTtcblxuICAgICAgICB0ZW1wbGF0ZS5wcm9wcyA9IHt9O1xuXG4gICAgICAgIHZhciBwcm9wc3QgPSBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydGllcyh0ZW1wbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgICBmb3IgKHZhciBwcm9wZCBpbiBwcm9wc3QpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlLnByb3BzW3Byb3BkXSA9IHByb3BzdFtwcm9wZF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVtcGxhdGUgYXMgU3VwZXJ0eXBlQ29uc3RydWN0b3I7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0byBjbG9uZSB0aGUgVHlwZSBTeXN0ZW1cbiAgICAgKiBAcmV0dXJucyB7b31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBfY3JlYXRlT2JqZWN0KCk6IE9iamVjdFRlbXBsYXRlQ2xvbmUge1xuICAgICAgICBjb25zdCBuZXdGb28gPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xuICAgICAgICBuZXdGb28uaW5pdCgpO1xuICAgICAgICByZXR1cm4gbmV3Rm9vO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUHVycG9zZSB1bmtub3duXG4gICAgKiBAcGFyYW0ge3Vua25vd259IG9yaWdpbmFsbHkgdG9vayBhIGNvbnRleHQgdGhhdCBpdCB0aHJldyBhd2F5XG4gICAgKiBAcmV0dXJucyB7U3VwZXJ0eXBlTG9nZ2VyfVxuICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUxvZ2dlcigpOiBTdXBlcnR5cGVMb2dnZXIge1xuICAgICAgICByZXR1cm4gbmV3IFN1cGVydHlwZUxvZ2dlcigpO1xuICAgIH1cbiAgICBcblxufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVByb3BlcnR5RnVuYyhmdW5jdGlvblByb3BlcnRpZXMsIHRlbXBsYXRlUHJvdG90eXBlLCBvYmplY3RUZW1wbGF0ZSwgdGVtcGxhdGVOYW1lLCBvYmplY3RQcm9wZXJ0aWVzLCBkZWZpbmVQcm9wZXJ0aWVzLCBwYXJlbnRUZW1wbGF0ZSxcbiAgICBwcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUsIHByb3BlcnRpZXMsIGNyZWF0ZVByb3BlcnRpZXMpIHtcbiAgICBpZiAoIXByb3BlcnRpZXMpIHtcbiAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJlY29yZCB0aGUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25cbiAgICBpZiAocHJvcGVydHlOYW1lID09ICdpbml0JyAmJiB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgPSBbcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBudWxsOyAvLyBkZWZpbmVQcm9wZXJ0eSB0byBiZSBhZGRlZCB0byBkZWZpbmVQcm9wZXJ0aWVzXG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBwcm9wZXJ0eSB2YWx1ZSB3aGljaCBtYXkgYmUgYSBkZWZpbmVQcm9wZXJ0aWVzIHN0cnVjdHVyZSBvciBqdXN0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgdmFyIGRlc2NyaXB0b3I6YW55ID0ge307XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3BlcnRpZXMsIHByb3BlcnR5TmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdHlwZSA9ICdudWxsJztcblxuICAgICAgICBpZiAoZGVzY3JpcHRvci5nZXQgfHwgZGVzY3JpcHRvci5zZXQpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnZ2V0c2V0JztcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2YgKHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIC8vIEZpZ3VyZSBvdXQgd2hldGhlciB0aGlzIGlzIGEgZGVmaW5lUHJvcGVydHkgc3RydWN0dXJlIChoYXMgYSBjb25zdHJ1Y3RvciBvZiBvYmplY3QpXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiAvLyBPciBhcnJheVxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSByZW1vdGUgZnVuY3Rpb24gY2FsbHNcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHkgJiYgdHlwZW9mIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0uYm9keSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXSA9IG9iamVjdFRlbXBsYXRlLl9zZXR1cEZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHksIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS5vbiwgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnZhbGlkYXRlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0udHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub2YpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX19yZXR1cm5zX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fcmV0dXJuc2FycmF5X18gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5fX29uX18gPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0ub247XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0uX192YWxpZGF0ZV9fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnZhbGlkYXRlO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVByb3RvdHlwZVtwcm9wZXJ0eU5hbWVdLl9fYm9keV9fID0gcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmJvZHk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXS53cml0YWJsZSA9IHRydWU7IC8vIFdlIGFyZSB1c2luZyBzZXR0ZXJzXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmVudW1lcmFibGUpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLmVudW1lcmFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc1twcm9wZXJ0eU5hbWVdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNMb2NhbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBPdGhlciBjcmFwXG4gICAgICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzTG9jYWw6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBpc0xvY2FsOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHRlbXBsYXRlUHJvdG90eXBlW3Byb3BlcnR5TmFtZV0gPSBvYmplY3RUZW1wbGF0ZS5fc2V0dXBGdW5jdGlvbihwcm9wZXJ0eU5hbWUsIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVQcm90b3R5cGVbcHJvcGVydHlOYW1lXS5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZ2V0c2V0JzogLy8gZ2V0dGVycyBhbmQgc2V0dGVyc1xuICAgICAgICAgICAgICAgIGRlc2NyaXB0b3IudGVtcGxhdGVTb3VyY2UgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRlbXBsYXRlUHJvdG90eXBlLCBwcm9wZXJ0eU5hbWUsIGRlc2NyaXB0b3IpO1xuICAgICAgICAgICAgICAgICg8R2V0dGVyPk9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGVtcGxhdGVQcm90b3R5cGUsIHByb3BlcnR5TmFtZSkpLmdldC5zb3VyY2VUZW1wbGF0ZSA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZGVmaW5lUHJvcGVydHkgdG8gYmUgYWRkZWRcbiAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IudG9DbGllbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudG9DbGllbnQgPSBkZXNjcmlwdG9yLnRvQ2xpZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yLnRvU2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGRlZmluZVByb3BlcnR5LnRvU2VydmVyID0gZGVzY3JpcHRvci50b1NlcnZlcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX3NldHVwUHJvcGVydHkocHJvcGVydHlOYW1lLCBkZWZpbmVQcm9wZXJ0eSwgb2JqZWN0UHJvcGVydGllcywgZGVmaW5lUHJvcGVydGllcywgcGFyZW50VGVtcGxhdGUsIGNyZWF0ZVByb3BlcnRpZXMpO1xuICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkuc291cmNlVGVtcGxhdGUgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKiogQEpTUEFUSCAgKi9cbmZ1bmN0aW9uIGJpbmRQYXJhbXModGVtcGxhdGVOYW1lLCBvYmplY3RUZW1wbGF0ZSwgZnVuY3Rpb25Qcm9wZXJ0aWVzLFxuICAgIGRlZmluZVByb3BlcnRpZXMsIHBhcmVudFRlbXBsYXRlLCBwcm9wZXJ0aWVzT3JUZW1wbGF0ZSxcbiAgICBjcmVhdGVQcm9wZXJ0aWVzLCBvYmplY3RQcm9wZXJ0aWVzLCB0ZW1wbGF0ZVByb3RvdHlwZSxcbiAgICBjcmVhdGVUZW1wbGF0ZU5vdywgbWl4aW5UZW1wbGF0ZSkge1xuXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUoKSB7XG4gICAgICAgIG9iamVjdFRlbXBsYXRlLmNyZWF0ZUlmTmVlZGVkKHRlbXBsYXRlLCB0aGlzKTtcbiAgICAgICAgbGV0IHRlbXBsYXRlUmVmOiBTdXBlcnR5cGVDb25zdHJ1Y3RvciA9IDxTdXBlcnR5cGVDb25zdHJ1Y3Rvcj48RnVuY3Rpb24+dGVtcGxhdGU7XG5cbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuX190ZW1wbGF0ZVVzYWdlX19bdGVtcGxhdGVSZWYuX19uYW1lX19dID0gdHJ1ZTtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRlbXBsYXRlUmVmLl9fcGFyZW50X187XG4gICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgIG9iamVjdFRlbXBsYXRlLl9fdGVtcGxhdGVVc2FnZV9fW3BhcmVudC5fX25hbWVfX10gPSB0cnVlO1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHBhcmVudC5fX3BhcmVudF9fO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlX18gPSB0ZW1wbGF0ZVJlZjtcblxuICAgICAgICBpZiAob2JqZWN0VGVtcGxhdGUuX190cmFuc2llbnRfXykge1xuICAgICAgICAgICAgdGhpcy5fX3RyYW5zaWVudF9fID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcnVuZWRPYmplY3RQcm9wZXJ0aWVzID0gVXRpbGl0eUZ1bmN0aW9ucy5wcnVuZUV4aXN0aW5nKHRoaXMsIHRlbXBsYXRlUmVmLm9iamVjdFByb3BlcnRpZXMpO1xuICAgICAgICB2YXIgcHJ1bmVkRGVmaW5lUHJvcGVydGllcyA9IFV0aWxpdHlGdW5jdGlvbnMucHJ1bmVFeGlzdGluZyh0aGlzLCB0ZW1wbGF0ZVJlZi5kZWZpbmVQcm9wZXJ0aWVzKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHByb3BlcnRpZXMgZWl0aGVyIHdpdGggRU1DQSA1IGRlZmluZVByb3BlcnRpZXMgb3IgYnkgaGFuZFxuICAgICAgICAgICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywgcHJ1bmVkRGVmaW5lUHJvcGVydGllcyk7IC8vIFRoaXMgbWV0aG9kIHdpbGwgYmUgYWRkZWQgcHJlLUVNQ0EgNVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZyb21SZW1vdGUgPSB0aGlzLmZyb21SZW1vdGUgfHwgb2JqZWN0VGVtcGxhdGUuX3N0YXNoT2JqZWN0KHRoaXMsIHRlbXBsYXRlUmVmKTtcblxuICAgICAgICB0aGlzLmNvcHlQcm9wZXJ0aWVzID0gZnVuY3Rpb24gY29weVByb3BlcnRpZXMob2JqKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgICAgIHRoaXNbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBwcm9wZXJ0aWVzIGZyb20gdGhlIGRlZmluZVByb3BlcnRpZXMgdmFsdWUgcHJvcGVydHlcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIHBydW5lZE9iamVjdFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZpbmVQcm9wZXJ0eSA9IHBydW5lZE9iamVjdFByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGVmaW5lUHJvcGVydHkuaW5pdCkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LmJ5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gT2JqZWN0VGVtcGxhdGUuY2xvbmUoZGVmaW5lUHJvcGVydHkuaW5pdCwgZGVmaW5lUHJvcGVydHkub2YgfHwgZGVmaW5lUHJvcGVydHkudHlwZSB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZV0gPSAoZGVmaW5lUHJvcGVydHkuaW5pdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBUZW1wbGF0ZSBsZXZlbCBpbmplY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGl4ID0gMDsgaXggPCB0ZW1wbGF0ZVJlZi5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraXgpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlUmVmLl9faW5qZWN0aW9uc19fW2l4XS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2xvYmFsIGluamVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmplY3RUZW1wbGF0ZS5fX2luamVjdGlvbnNfXy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgb2JqZWN0VGVtcGxhdGUuX19pbmplY3Rpb25zX19bal0uY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX19wcm9wX18gPSBmdW5jdGlvbiBnKHByb3ApIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3RUZW1wbGF0ZS5fZ2V0RGVmaW5lUHJvcGVydHkocHJvcCwgdGhpcy5fX3RlbXBsYXRlX18pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX192YWx1ZXNfXyA9IGZ1bmN0aW9uIGYocHJvcCkge1xuICAgICAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gdGhpcy5fX3Byb3BfXyhwcm9wKSB8fCB0aGlzLl9fcHJvcF9fKCdfJyArIHByb3ApO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS52YWx1ZXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LnZhbHVlcy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkudmFsdWVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX19kZXNjcmlwdGlvbnNfXyA9IGZ1bmN0aW9uIGUocHJvcCkge1xuICAgICAgICAgICAgdmFyIGRlZmluZVByb3BlcnR5ID0gdGhpcy5fX3Byb3BfXyhwcm9wKSB8fCB0aGlzLl9fcHJvcF9fKCdfJyArIHByb3ApO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkZWZpbmVQcm9wZXJ0eS5kZXNjcmlwdGlvbnMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmluZVByb3BlcnR5LmRlc2NyaXB0aW9ucy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGVmaW5lUHJvcGVydHkuZGVzY3JpcHRpb25zO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gaW5pdCBmdW5jdGlvbiBvciBhcmUgYSByZW1vdGUgY3JlYXRpb24gY2FsbCBwYXJlbnQgY29uc3RydWN0b3Igb3RoZXJ3aXNlIGNhbGwgaW5pdFxuICAgICAgICAvLyAgZnVuY3Rpb24gd2hvIHdpbGwgYmUgcmVzcG9uc2libGUgZm9yIGNhbGxpbmcgcGFyZW50IGNvbnN0cnVjdG9yIHRvIGFsbG93IGZvciBwYXJhbWV0ZXIgcGFzc2luZy5cbiAgICAgICAgaWYgKHRoaXMuZnJvbVJlbW90ZSB8fCAhdGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQgfHwgb2JqZWN0VGVtcGxhdGUubm9Jbml0KSB7XG4gICAgICAgICAgICBpZiAocGFyZW50VGVtcGxhdGUgJiYgcGFyZW50VGVtcGxhdGUuaXNPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcmVudFRlbXBsYXRlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVSZWYuZnVuY3Rpb25Qcm9wZXJ0aWVzLmluaXQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlUmVmLmZ1bmN0aW9uUHJvcGVydGllcy5pbml0W2ldLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fX3RlbXBsYXRlX18gPSB0ZW1wbGF0ZVJlZjtcblxuICAgICAgICB0aGlzLnRvSlNPTlN0cmluZyA9IGZ1bmN0aW9uIHRvSlNPTlN0cmluZyhjYikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLnRvSlNPTlN0cmluZyh0aGlzLCBjYik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyogQ2xvbmUgYW5kIG9iamVjdCBjYWxsaW5nIGEgY2FsbGJhY2sgZm9yIGVhY2ggcmVmZXJlbmNlZCBvYmplY3QuXG4gICAgICAgICBUaGUgY2FsbCBiYWNrIGlzIHBhc3NlZCAob2JqLCBwcm9wLCB0ZW1wbGF0ZSlcbiAgICAgICAgIG9iaiAtIHRoZSBwYXJlbnQgb2JqZWN0IChleGNlcHQgdGhlIGhpZ2hlc3QgbGV2ZWwpXG4gICAgICAgICBwcm9wIC0gdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICB0ZW1wbGF0ZSAtIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgb2JqZWN0IHRvIGJlIGNyZWF0ZWRcbiAgICAgICAgIHRoZSBmdW5jdGlvbiByZXR1cm5zOlxuICAgICAgICAgLSBmYWxzeSAtIGNsb25lIG9iamVjdCBhcyB1c3VhbCB3aXRoIGEgbmV3IGlkXG4gICAgICAgICAtIG9iamVjdCByZWZlcmVuY2UgLSB0aGUgY2FsbGJhY2sgY3JlYXRlZCB0aGUgb2JqZWN0IChwcmVzdW1hYmx5IHRvIGJlIGFibGUgdG8gcGFzcyBpbml0IHBhcmFtZXRlcnMpXG4gICAgICAgICAtIFtvYmplY3RdIC0gYSBvbmUgZWxlbWVudCBhcnJheSBvZiB0aGUgb2JqZWN0IG1lYW5zIGRvbid0IGNvcHkgdGhlIHByb3BlcnRpZXMgb3IgdHJhdmVyc2VcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY3JlYXRlQ29weSA9IGZ1bmN0aW9uIGNyZWF0ZUNvcHkoY3JlYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdFRlbXBsYXRlLmNyZWF0ZUNvcHkodGhpcywgY3JlYXRvcik7XG4gICAgICAgIH07XG5cbiAgICB9O1xuXG5cbiAgICBsZXQgcmV0dXJuVmFsID0gPEZ1bmN0aW9uPnRlbXBsYXRlO1xuXG4gICAgcmV0dXJuIHJldHVyblZhbCBhcyBTdXBlcnR5cGVDb25zdHJ1Y3Rvcjtcbn1cbiJdfQ==