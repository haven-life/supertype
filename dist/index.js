/* Copyright 2011-2012 Sam Elsamman
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
 * ObjectTemplate - n Type System with Benefits
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./ObjectTemplate", "./SupertypeLogger", "./Supertype", "./decorators"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ObjectTemplate_1 = require("./ObjectTemplate");
    ObjectTemplate_1.ObjectTemplate.init();
    exports.default = ObjectTemplate_1.ObjectTemplate;
    var amorphicStatic = ObjectTemplate_1.ObjectTemplate.amorphicStatic;
    exports.amorphicStatic = amorphicStatic;
    var SupertypeSession = ObjectTemplate_1.ObjectTemplate.amorphicStatic;
    exports.SupertypeSession = SupertypeSession;
    var SupertypeLogger_1 = require("./SupertypeLogger");
    exports.SupertypeLogger = SupertypeLogger_1.SupertypeLogger;
    var Supertype_1 = require("./Supertype");
    exports.Supertype = Supertype_1.Supertype;
    var decorators_1 = require("./decorators");
    exports.supertypeClass = decorators_1.supertypeClass;
    exports.property = decorators_1.property;
    exports.remote = decorators_1.remote;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSDs7R0FFRzs7Ozs7Ozs7Ozs7O0lBRUgsbURBQWdEO0lBRWhELCtCQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdEIsa0JBQWUsK0JBQWMsQ0FBQztJQUU5QixJQUFJLGNBQWMsR0FBRywrQkFBYyxDQUFDLGNBQWMsQ0FBQztJQUczQyx3Q0FBYztJQUZ0QixJQUFJLGdCQUFnQixHQUFHLCtCQUFjLENBQUMsY0FBYyxDQUFDO0lBRTdCLDRDQUFnQjtJQUN4QyxxREFBa0Q7SUFBMUMsNENBQUEsZUFBZSxDQUFBO0lBQ3ZCLHlDQUFzQztJQUE5QixnQ0FBQSxTQUFTLENBQUE7SUFDakIsMkNBQThEO0lBQXRELHNDQUFBLGNBQWMsQ0FBQTtJQUFFLGdDQUFBLFFBQVEsQ0FBQTtJQUFFLDhCQUFBLE1BQU0sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qIENvcHlyaWdodCAyMDExLTIwMTIgU2FtIEVsc2FtbWFuXG4gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRVxuIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT05cbiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuLypcbiAqIE9iamVjdFRlbXBsYXRlIC0gbiBUeXBlIFN5c3RlbSB3aXRoIEJlbmVmaXRzXG4gKi9cblxuaW1wb3J0IHtPYmplY3RUZW1wbGF0ZX0gZnJvbSAnLi9PYmplY3RUZW1wbGF0ZSc7XG5cbk9iamVjdFRlbXBsYXRlLmluaXQoKTtcbmV4cG9ydCBkZWZhdWx0IE9iamVjdFRlbXBsYXRlO1xuXG5sZXQgYW1vcnBoaWNTdGF0aWMgPSBPYmplY3RUZW1wbGF0ZS5hbW9ycGhpY1N0YXRpYztcbmxldCBTdXBlcnR5cGVTZXNzaW9uID0gT2JqZWN0VGVtcGxhdGUuYW1vcnBoaWNTdGF0aWM7XG5cbmV4cG9ydCB7YW1vcnBoaWNTdGF0aWMsIFN1cGVydHlwZVNlc3Npb259O1xuZXhwb3J0IHtTdXBlcnR5cGVMb2dnZXJ9IGZyb20gJy4vU3VwZXJ0eXBlTG9nZ2VyJztcbmV4cG9ydCB7U3VwZXJ0eXBlfSBmcm9tICcuL1N1cGVydHlwZSc7XG5leHBvcnQge3N1cGVydHlwZUNsYXNzLCBwcm9wZXJ0eSwgcmVtb3RlfSBmcm9tICcuL2RlY29yYXRvcnMnOyJdfQ==