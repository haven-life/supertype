import * as serializer from './serializer';

/**
 * Allow the property to be either a boolean a function that returns a boolean or a string
 * matched against a rule set array of string in ObjectTemplate
 *
 * @param {unknown} prop unknown
 * @param {unknown} ruleSet unknown
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
        if (typeof(obj[prop]) === 'undefined') {
            newProps[prop] = props[prop];
        }
    }

    return newProps;
}

type CreateTypeForName = {
    name?: string;
    toClient?: boolean;
    toServer?: boolean;
    isLocal?: boolean;
}

type ConstructorType = Function & {
    __shadowParent__: any;
    props?: any;
}

export class ObjectTemplate {

    static isLocalRuleSet: any;
    static nextId: any; // for stashObject
    static __exceptions__: any;

    static __templates__: ConstructorType[];
    static toServerRuleSet: string[];
    static toClientRuleSet: string[];

    static templateInterceptor: any;
    static __dictionary__: { [key: string]: ConstructorType };
    static __anonymousId__: number;
    static __templatesToInject__: {};
    static logger: any;
    static __templateUsage__: any;
    static __injections__: Function[];
    static __toClient__: boolean;

    /**
     * Purpose unknown
     */
    static performInjections() {
        this.getClasses();
        if (this.__templatesToInject__) {
            const objectTemplate = this;

            for (const templateName in this.__templatesToInject__) {
                const template = this.__templatesToInject__[templateName];

                template.inject = function inject(injector) {
                    objectTemplate.inject(this, injector);
                };

                this._injectIntoTemplate(template);
            }
        }
    }

    static init() {
        this.__templateUsage__ = {};
        this.__injections__ = [];
        this.__dictionary__ = {};
        this.__anonymousId__ = 1;
        this.__templatesToInject__ = {};
        this.logger = this.createLogger(); // Create a default logger
    }

    static getTemplateByName(name) {
        return this.getClasses()[name];
    }

    /**
 * Purpose unknown
 *
 * @param {unknown} template unknown
 * @param {unknown} name unknown
 * @param {unknown} props unknown
 */
    static setTemplateProperties(template, name, props) {
        this.__templatesToInject__[name] = template;
        this.__dictionary__[name] = template;
        template.__name__ = name;
        template.__injections__ = [];
        template.__objectTemplate__ = this;
        template.__children__ = [];
        template.__toClient__ = props.__toClient__;
        template.__toServer__ = props.__toServer__;
    }

    /**
     * Purpose unknown
     *
     * @param {unknown} props unknown
     *
     * @returns {unknown}
     */
    static getTemplateProperties(props) {
        let templateProperties: { __toClient__?: any; __toServer__?: any } = {};

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
    }

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

    static create(name: string | CreateTypeForName, properties) {
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

        const createProps = this.getTemplateProperties(props);

        if (typeof (this.templateInterceptor) === 'function') {
            this.templateInterceptor('create', name, properties);
        }

        let template;

        if (properties) {
            template = this._createTemplate(null, Object, properties, createProps, name);
        }
        else {
            template = this._createTemplate(null, Object, name, createProps, name);
        }

        this.setTemplateProperties(template, name, createProps);
        template.__createProps__ = props;

        return template;
    }


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
    static extend(parentTemplate, name: string | CreateTypeForName, properties) {
        let props;
        let createProps;

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

        const existingTemplate = this.__dictionary__[name];

        if (existingTemplate) {
            if (existingTemplate.__parent__ != parentTemplate) {
                if (existingTemplate.__parent__.__name__ != parentTemplate.__name__) {
                    // eslint-disable-next-line no-console
                    console.log(`WARN: Attempt to extend ${parentTemplate.__name__} as ${name} but ${name} was already extended from ${existingTemplate.__parent__.__name__}`);
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

        let template;

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
    }

    static mixin(template, properties) {
        if (typeof (this.templateInterceptor) === 'function') {
            this.templateInterceptor('create', template.__name__, properties);
        }

        return this._createTemplate(template, null, properties, template, template.__name__);
    }

    /**
    * Purpose unknown
    *
    * @param {unknown} template unknown
    * @param {unknown} properties unknown
    */
    static staticMixin(template, properties) {
        for (const prop in properties) {
            template[prop] = properties[prop];
        }
    }

    /**
     * Add a function that will fire on object creation
     *
     * @param {unknown} template unknown
     * @param {Function} injector unknown
     */
    static inject(template, injector: Function) {
        template.__injections__.push(injector);
    }

    /**
     * Add a function that will fire on all object creations (apparently)? Just a guess
     *
     * @param {Function} injector - unknown
     */
    static globalInject(injector: Function) {
        this.__injections__.push(injector);
    }

    /**
     * Create the template if it needs to be created
     * @param [unknown} template to be created
     */
    static createIfNeeded(template, thisObj) {
        if (template.__createParameters__) {
            const createParameters = template.__createParameters__;
            for (var ix = 0; ix < createParameters.length; ++ix) {
                const params = createParameters[ix];
                template.__createParameters__ = undefined;
                this._createTemplate(params[0], params[1], params[2], params[3], params[4], true);
            }
            if (template._injectProperties) {
                template._injectProperties();
            }
            if (thisObj) {
                //var copy = new template();
                const prototypes = [template.prototype];
                let parent = template.__parent__;
                while (parent) {
                    prototypes.push(parent.prototype);
                    parent = parent.__parent__;
                }
                for (var ix = prototypes.length - 1; ix >= 0; --ix) {
                    const props = Object.getOwnPropertyNames(prototypes[ix]);
                    props.forEach((val, ix) => {
                        Object.defineProperty(thisObj, props[ix], Object.getOwnPropertyDescriptor(prototypes[ix], props[ix]));
                    });
                }
                thisObj.__proto__ = template.prototype;
            }
        }
    }

    static getClasses() {
        if (this.__templates__) {
            for (let ix = 0; ix < this.__templates__.length; ++ix) {
                var template = this.__templates__[ix];
                this.__dictionary__[constructorName(template)] = template;
                this.__templatesToInject__[constructorName(template)] = template;
                processDeferredTypes(template);
            }
            this.__templates__ = undefined;
            for (const templateName1 in this.__dictionary__) {
                var template = this.__dictionary__[templateName1];
                const parentTemplateName = constructorName(Object.getPrototypeOf(template.prototype).constructor);
                template.__shadowParent__ = this.__dictionary__[parentTemplateName];
                if (template.__shadowParent__) {
                    template.__shadowParent__.__shadowChildren__.push(template);
                }
                template.props = {};
                const propst = ObjectTemplate._getDefineProperties(template, undefined, true);
                for (const propd in propst) {
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
                for (const prop in template.prototype.__deferredType__) {
                    const defineProperty = template.defineProperties[prop];
                    if (defineProperty) {
                        const type = template.prototype.__deferredType__[prop]();
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
            const namedFunction = constructor.toString().match(/function ([^(]*)/);
            return namedFunction ? namedFunction[1] : null;
        }

    }

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
    static _stashObject(obj, template) {
        if (!obj.__id__) {
            if (!ObjectTemplate.nextId) {
                ObjectTemplate.nextId = 1;
            }

            obj.__id__ = 'local-' + template.__name__ + '-' + ++ObjectTemplate.nextId;
        }

        return false;
    }


    /**
     * Overridden by other Type Systems to inject other elements
     *
     * @param {_template} _template - the object to be passed during creation time
     * 
     * @private
     * */
    static _injectIntoTemplate(_template) { };

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
    static _setupProperty(propertyName, defineProperty, objectProperties, defineProperties) {
        // Determine whether value needs to be re-initialized in constructor
        const value = defineProperty.value;
        const byValue = value && typeof (value) !== 'number' && typeof (value) !== 'string';

        if (byValue || !Object.defineProperties || defineProperty.get || defineProperty.set) {
            objectProperties[propertyName] = {
                init: defineProperty.value,
                type: defineProperty.type,
                of: defineProperty.of,
                byValue
            };

            delete defineProperty.value;
        }

        // When a super class based on objectTemplate don't transport properties
        defineProperty.toServer = false;
        defineProperty.toClient = false;
        defineProperties[propertyName] = defineProperty;

        // Add getters and setters
        if (defineProperty.get || defineProperty.set) {
            const userSetter = defineProperty.set;

            defineProperty.set = (function d() {
                // Use a closure to record the property name which is not passed to the setter
                const prop = propertyName;

                return function c(value) {
                    if (userSetter) {
                        value = userSetter.call(this, value);
                    }

                    if (!defineProperty.isVirtual) {
                        this[`__${prop}`] = value;
                    }
                };
            })();

            const userGetter = defineProperty.get;

            defineProperty.get = (function get() {
                // Use closure to record property name which is not passed to the getter
                const prop = propertyName;

                return function b() {
                    if (userGetter) {
                        if (defineProperty.isVirtual) {
                            return userGetter.call(this, undefined);
                        }

                        return userGetter.call(this, this[`__${prop}`]);
                    }

                    return this[`__${prop}`];
                };
            })();

            if (!defineProperty.isVirtual) {
                defineProperties[`__${propertyName}`] = { enumerable: false, writable: true };
            }

            delete defineProperty.value;
            delete defineProperty.writable;
        }
    }

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
    static clone(obj, template?) {
        let copy;

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        else if (obj instanceof Array) {
            copy = [];

            for (let ix = 0; ix < obj.length; ++ix) {
                copy[ix] = this.clone(obj[ix], template);
            }

            return copy;
        }
        else if (template && obj instanceof template) {
            copy = new template();

            for (const prop in obj) {
                if (prop != '__id__' && !(obj[prop] instanceof Function)) {
                    const defineProperty = this._getDefineProperty(prop, template) || {};

                    if (obj.hasOwnProperty(prop)) {
                        copy[prop] = this.clone(obj[prop], defineProperty.of || defineProperty.type || null);
                    }
                }
            }

            return copy;
        }
        else if (obj instanceof Object) {
            copy = {};

            for (const propc in obj) {
                if (obj.hasOwnProperty(propc)) {
                    copy[propc] = this.clone(obj[propc]);
                }
            }

            return copy;
        }
        else {
            return obj;
        }
    }

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
    static setupFunction(_propertyName, propertyValue) {
        return propertyValue;
    };

    /**
 * Purpose unknown
 *
 * @param {unknown} obj unknown
 * @param {unknown} creator unknown
 *
 * @returns {unknown}
 */
    static createCopy(obj, creator) {
        return this.fromPOJO(obj, obj.__template__, null, null, undefined, null, null, creator);
    }

    /**
     * Abstract function for benefit of Semotus
     *
     * @param {unknown} cb unknown
     */
    static withoutChangeTracking(cb) {
        cb();
    }

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
    static fromPOJO = serializer.fromPOJO;

    /**
    * Purpose unknown
    *
    * @param {unknown} str unknown
    * @param {unknown} template unknown
    * @param {unknown} idQualifier unknown
    * objectTemplate.fromJSON(str, template, idQualifier)
    * @returns {unknown}
    */
    static fromJSON = serializer.fromJSON;

    /**
     * Convert an object to JSON, stripping any recursive object references so they can be
     * reconstituted later
     *
     * @param {unknown} obj unknown
     * @param {unknown} cb unknown
     *
     * @returns {unknown}
     */
    static toJSONString = serializer.toJSONString;

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
     static _resolveSubClass(template, objId, defineProperty) {
        let templateName = '';

        if (objId.match(/-([A-Za-z0-9_:]*)-/)) {
            templateName = RegExp.$1;
        }

    // Resolve template subclass for polymorphic instantiation
        if (defineProperty && defineProperty.subClasses && objId != 'anonymous)') {
            if (templateName) {
                for (let ix = 0; ix < defineProperty.subClasses.length; ++ix) {
                    if (templateName == defineProperty.subClasses[ix].__name__) {
                        template = defineProperty.subClasses[ix];
                    }
                }
            }
        }
        else {
            const subClass = this._findSubClass(template, templateName);

            if (subClass) {
                template = subClass;
            }
        }
        return template;
    }

    /**
     * Walk recursively through extensions of template via __children__
     * looking for a name match
     *
     * @param {unknown} template unknown
     * @param {unknown} templateName unknown
     * @returns {*}
     * @private
     */
    static _findSubClass(template, templateName) {
        if (template.__name__ == templateName) {
            return template;
        }

        for (let ix = 0; ix < template.__children__.length; ++ix) {
            const subClass = this._findSubClass(template.__children__[ix], templateName);

            if (subClass) {
                return subClass;
            }
        }

        return null;
    }

    /**
     * Return the highest level template
     *
     * @param {unknown} template unknown
     *
     * @returns {*}
     *
     * @private
     */
    static _getBaseClass(template) {
        while (template.__parent__) {
            template = template.__parent__;
        }

        return template;
    }

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
     static _createEmptyObject(template, objId, defineProperty) {
        template = this._resolveSubClass(template, objId, defineProperty);

        const oldStashObject = this._stashObject;

        if (objId) {
            this._stashObject = function stashObject() {
                return true;
            };
        }

        const newValue = new template();
        this._stashObject = oldStashObject;

        if (objId) {
            newValue.__id__ = objId;
        }

        return newValue;
    }

    /**
     * Looks up a property in the defineProperties saved with the template cascading
     * up the prototype chain to find it
     *
     * @param {unknown} prop is the property being sought
     * @param {unknown} template is the template used to create the object containing the property
     * @returns {*} the "defineProperty" structure for the property
     * @private
     */
    static _getDefineProperty(prop, template) {
        if (template && (template != Object) && template.defineProperties && template.defineProperties[prop]) {
            return template.defineProperties[prop];
        }
        else if (template && template.parentTemplate) {
            return this._getDefineProperty(prop, template.parentTemplate);
        }

        return null;
    }

    /**
     * Returns a hash of all properties including those inherited
     *
     * @param {unknown} template is the template used to create the object containing the property
     * @param {unknown} returnValue unknown
     * @param {unknown} includeVirtual unknown
     * @returns {*} an associative array of each "defineProperty" structure for the property
     * @private
     */
    static _getDefineProperties(template, returnValue, includeVirtual) {
        if (!returnValue) {
            returnValue = {};
        }

        if (template.defineProperties) {
            for (const prop in template.defineProperties) {
                if (includeVirtual || !template.defineProperties[prop].isVirtual) {
                    returnValue[prop] = template.defineProperties[prop];
                }
            }
        }

        if (template.parentTemplate) {
            this._getDefineProperties(template.parentTemplate, returnValue, includeVirtual);
        }

        return returnValue;
    }

    /**
     * A function to clone the Type System
     * @returns {F}
     * @private
     */
    static _createObject() {
        function F() {}
        F.prototype = this;
        const newF =  new F();
        newF.init();
        return newF;
    }
    /**
    * Purpose unknown
    * @param {unknown} originally took a context that it threw away
    * @returns {SupertypeLogger}
    */
    static createLogger(): SupertypeLogger {
        return new SupertypeLogger();
    }

    

}
