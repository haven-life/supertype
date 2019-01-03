import { ObjectTemplate } from './ObjectTemplate';

export namespace UtilityFunctions {
    export function constructorName(constructor) {
        var namedFunction = constructor.toString().match(/function ([^(]*)/);
        return namedFunction ? namedFunction[1] : null;
    }

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


    /**
     * Purpose unknown
     *
     * @param {unknown} props unknown
     *
     * @returns {unknown}
     */

    export function getTemplateProperties(props, objectTemplateRef: typeof ObjectTemplate) {
        let templateProperties: { __toClient__?: any; __toServer__?: any } = {};

        if (ObjectTemplate.__toClient__ == false) {
            props.toClient = false;
        }

        if (processProp(props.isLocal, objectTemplateRef.isLocalRuleSet)) {
            props.toServer = false;
            props.toClient = false;
        }

        templateProperties.__toClient__ = processProp(props.toClient, objectTemplateRef.toClientRuleSet) != false;
        templateProperties.__toServer__ = processProp(props.toServer, objectTemplateRef.toServerRuleSet) != false;

        return templateProperties;
    }

    export function pruneExisting(obj, props) {
        var newProps = {};

        for (var prop in props) {
            if (typeof (obj[prop]) === 'undefined') {
                newProps[prop] = props[prop];
            }
        }

        return newProps;
    }

    export function getName(target) {
        return target.toString().match(/function ([^(]*)/)[1];
    }

    export function defineProperties(target) {
        return target.prototype.__amorphicprops__;
    }

    export function getDictionary(objectTemplate) {
        objectTemplate.getClasses();
    }
    export function getParent(target, objectTemplate) {
        getDictionary(objectTemplate);
        return target.__shadowParent__;
    }
    
    export function getChildren(target, objectTemplate) {
        getDictionary(objectTemplate);
        return target.__shadowChildren__;
    }
}