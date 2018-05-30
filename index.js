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
    var x = ObjectTemplate_1.ObjectTemplate;
    exports.default = x;
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
//# sourceMappingURL=index.js.map