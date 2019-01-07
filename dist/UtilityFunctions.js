"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ObjectTemplate_1 = require("./ObjectTemplate");
var UtilityFunctions;
(function (UtilityFunctions) {
    function constructorName(constructor) {
        var namedFunction = constructor.toString().match(/function ([^(]*)/);
        return namedFunction ? namedFunction[1] : null;
    }
    UtilityFunctions.constructorName = constructorName;
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
            ret = prop.call(ObjectTemplate_1.ObjectTemplate);
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
    function getTemplateProperties(props, objectTemplateRef) {
        var templateProperties = {};
        if (ObjectTemplate_1.ObjectTemplate.__toClient__ == false) {
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
    UtilityFunctions.getTemplateProperties = getTemplateProperties;
    function pruneExisting(obj, props) {
        var newProps = {};
        for (var prop in props) {
            if (typeof (obj[prop]) === 'undefined') {
                newProps[prop] = props[prop];
            }
        }
        return newProps;
    }
    UtilityFunctions.pruneExisting = pruneExisting;
    function getName(target) {
        return target.toString().match(/function ([^(]*)/)[1];
    }
    UtilityFunctions.getName = getName;
    function defineProperties(target) {
        return target.prototype.__amorphicprops__;
    }
    UtilityFunctions.defineProperties = defineProperties;
    function getDictionary(objectTemplate) {
        objectTemplate.getClasses();
    }
    UtilityFunctions.getDictionary = getDictionary;
    function getParent(target, objectTemplate) {
        getDictionary(objectTemplate);
        return target.__shadowParent__;
    }
    UtilityFunctions.getParent = getParent;
    function getChildren(target, objectTemplate) {
        getDictionary(objectTemplate);
        return target.__shadowChildren__;
    }
    UtilityFunctions.getChildren = getChildren;
})(UtilityFunctions = exports.UtilityFunctions || (exports.UtilityFunctions = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbGl0eUZ1bmN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9VdGlsaXR5RnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBQWtEO0FBRWxELElBQWlCLGdCQUFnQixDQXlHaEM7QUF6R0QsV0FBaUIsZ0JBQWdCO0lBQzdCLHlCQUFnQyxXQUFXO1FBQ3ZDLElBQUksYUFBYSxHQUFHLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyRSxPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDbkQsQ0FBQztJQUhlLGdDQUFlLGtCQUc5QixDQUFBO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxxQkFBcUIsSUFBSSxFQUFFLE9BQU87UUFDOUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO1FBRWYsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssVUFBVSxFQUFFO1lBQzlCLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLCtCQUFjLENBQUMsQ0FBQztTQUNuQzthQUNJLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtZQUNqQyxHQUFHLEdBQUcsS0FBSyxDQUFDO1lBRVosSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUk7b0JBQ3ZCLDJCQUEyQjtvQkFDM0IsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDTixrQ0FBa0M7d0JBQ2xDLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDO3FCQUN0QjtnQkFDTCxDQUFDLENBQUMsQ0FBQzthQUNOO1NBQ0o7YUFDSSxJQUFJLElBQUksWUFBWSxLQUFLLEVBQUU7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUk7Z0JBQ3hCLEdBQUcsR0FBRyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUMsQ0FBQztTQUNOO2FBQ0k7WUFDRCxHQUFHLEdBQUcsSUFBSSxDQUFDO1NBQ2Q7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFHRDs7Ozs7O09BTUc7SUFFSCwrQkFBc0MsS0FBSyxFQUFFLGlCQUF3QztRQUNqRixJQUFJLGtCQUFrQixHQUErQyxFQUFFLENBQUM7UUFFeEUsSUFBSSwrQkFBYyxDQUFDLFlBQVksSUFBSSxLQUFLLEVBQUU7WUFDdEMsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7U0FDMUI7UUFFRCxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQzlELEtBQUssQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQzFCO1FBRUQsa0JBQWtCLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQztRQUMxRyxrQkFBa0IsQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxDQUFDO1FBRTFHLE9BQU8sa0JBQWtCLENBQUM7SUFDOUIsQ0FBQztJQWhCZSxzQ0FBcUIsd0JBZ0JwQyxDQUFBO0lBRUQsdUJBQThCLEdBQUcsRUFBRSxLQUFLO1FBQ3BDLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVsQixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtZQUNwQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxXQUFXLEVBQUU7Z0JBQ3BDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDaEM7U0FDSjtRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFWZSw4QkFBYSxnQkFVNUIsQ0FBQTtJQUVELGlCQUF3QixNQUFNO1FBQzFCLE9BQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFGZSx3QkFBTyxVQUV0QixDQUFBO0lBRUQsMEJBQWlDLE1BQU07UUFDbkMsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDO0lBQzlDLENBQUM7SUFGZSxpQ0FBZ0IsbUJBRS9CLENBQUE7SUFFRCx1QkFBOEIsY0FBYztRQUN4QyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUZlLDhCQUFhLGdCQUU1QixDQUFBO0lBQ0QsbUJBQTBCLE1BQU0sRUFBRSxjQUFjO1FBQzVDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM5QixPQUFPLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztJQUNuQyxDQUFDO0lBSGUsMEJBQVMsWUFHeEIsQ0FBQTtJQUVELHFCQUE0QixNQUFNLEVBQUUsY0FBYztRQUM5QyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDOUIsT0FBTyxNQUFNLENBQUMsa0JBQWtCLENBQUM7SUFDckMsQ0FBQztJQUhlLDRCQUFXLGNBRzFCLENBQUE7QUFDTCxDQUFDLEVBekdnQixnQkFBZ0IsR0FBaEIsd0JBQWdCLEtBQWhCLHdCQUFnQixRQXlHaEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYmplY3RUZW1wbGF0ZSB9IGZyb20gJy4vT2JqZWN0VGVtcGxhdGUnO1xuXG5leHBvcnQgbmFtZXNwYWNlIFV0aWxpdHlGdW5jdGlvbnMge1xuICAgIGV4cG9ydCBmdW5jdGlvbiBjb25zdHJ1Y3Rvck5hbWUoY29uc3RydWN0b3IpIHtcbiAgICAgICAgdmFyIG5hbWVkRnVuY3Rpb24gPSBjb25zdHJ1Y3Rvci50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvbiAoW14oXSopLyk7XG4gICAgICAgIHJldHVybiBuYW1lZEZ1bmN0aW9uID8gbmFtZWRGdW5jdGlvblsxXSA6IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgdGhlIHByb3BlcnR5IHRvIGJlIGVpdGhlciBhIGJvb2xlYW4gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBib29sZWFuIG9yIGEgc3RyaW5nXG4gICAgICogbWF0Y2hlZCBhZ2FpbnN0IGEgcnVsZSBzZXQgYXJyYXkgb2Ygc3RyaW5nIGluIE9iamVjdFRlbXBsYXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHByb3AgdW5rbm93blxuICAgICAqIEBwYXJhbSBydWxlU2V0IHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbih0aGlzOk9iamVjdFRlbXBsYXRlKX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm9jZXNzUHJvcChwcm9wLCBydWxlU2V0KSB7XG4gICAgICAgIHZhciByZXQgPSBudWxsO1xuXG4gICAgICAgIGlmICh0eXBlb2YgKHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXQgPSBwcm9wLmNhbGwoT2JqZWN0VGVtcGxhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiAocHJvcCkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHJ1bGVTZXQpIHtcbiAgICAgICAgICAgICAgICBydWxlU2V0Lm1hcChmdW5jdGlvbiBpKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIGFsd2F5cyBleGVjdXRlXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmV0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb3VibGUgZXF1YWxzIG9yIHNpbmdsZSBlcXVhbHM/XG4gICAgICAgICAgICAgICAgICAgICAgICByZXQgPSBydWxlID09IHByb3A7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcm9wIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHByb3AuZm9yRWFjaChmdW5jdGlvbiBoKHByb3ApIHtcbiAgICAgICAgICAgICAgICByZXQgPSByZXQgfHwgcHJvY2Vzc1Byb3AocHJvcCwgcnVsZVNldCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHByb3A7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUHVycG9zZSB1bmtub3duXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3Vua25vd259IHByb3BzIHVua25vd25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt1bmtub3dufVxuICAgICAqL1xuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldFRlbXBsYXRlUHJvcGVydGllcyhwcm9wcywgb2JqZWN0VGVtcGxhdGVSZWY6IHR5cGVvZiBPYmplY3RUZW1wbGF0ZSkge1xuICAgICAgICBsZXQgdGVtcGxhdGVQcm9wZXJ0aWVzOiB7IF9fdG9DbGllbnRfXz86IGFueTsgX190b1NlcnZlcl9fPzogYW55IH0gPSB7fTtcblxuICAgICAgICBpZiAoT2JqZWN0VGVtcGxhdGUuX190b0NsaWVudF9fID09IGZhbHNlKSB7XG4gICAgICAgICAgICBwcm9wcy50b0NsaWVudCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2Nlc3NQcm9wKHByb3BzLmlzTG9jYWwsIG9iamVjdFRlbXBsYXRlUmVmLmlzTG9jYWxSdWxlU2V0KSkge1xuICAgICAgICAgICAgcHJvcHMudG9TZXJ2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIHByb3BzLnRvQ2xpZW50ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wbGF0ZVByb3BlcnRpZXMuX190b0NsaWVudF9fID0gcHJvY2Vzc1Byb3AocHJvcHMudG9DbGllbnQsIG9iamVjdFRlbXBsYXRlUmVmLnRvQ2xpZW50UnVsZVNldCkgIT0gZmFsc2U7XG4gICAgICAgIHRlbXBsYXRlUHJvcGVydGllcy5fX3RvU2VydmVyX18gPSBwcm9jZXNzUHJvcChwcm9wcy50b1NlcnZlciwgb2JqZWN0VGVtcGxhdGVSZWYudG9TZXJ2ZXJSdWxlU2V0KSAhPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGVtcGxhdGVQcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBwcnVuZUV4aXN0aW5nKG9iaiwgcHJvcHMpIHtcbiAgICAgICAgdmFyIG5ld1Byb3BzID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiAob2JqW3Byb3BdKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9wc1twcm9wXSA9IHByb3BzW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld1Byb3BzO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBnZXROYW1lKHRhcmdldCkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXihdKikvKVsxXTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5wcm90b3R5cGUuX19hbW9ycGhpY3Byb3BzX187XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldERpY3Rpb25hcnkob2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgb2JqZWN0VGVtcGxhdGUuZ2V0Q2xhc3NlcygpO1xuICAgIH1cbiAgICBleHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50KHRhcmdldCwgb2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgZ2V0RGljdGlvbmFyeShvYmplY3RUZW1wbGF0ZSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQuX19zaGFkb3dQYXJlbnRfXztcbiAgICB9XG4gICAgXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkcmVuKHRhcmdldCwgb2JqZWN0VGVtcGxhdGUpIHtcbiAgICAgICAgZ2V0RGljdGlvbmFyeShvYmplY3RUZW1wbGF0ZSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQuX19zaGFkb3dDaGlsZHJlbl9fO1xuICAgIH1cbn0iXX0=