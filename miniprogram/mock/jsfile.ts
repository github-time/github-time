export default `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Prism = require("./prism");
var htmlParser = require("../../../../lib/wxParse/htmlparser");
function highlight(codeString, type, line) {
    if (line === void 0) { line = 1; }
    var html = Prism.highlight(codeString, Prism.languages[type], type);
    var codeSegments = html.split(/\\n/);
    var codeRows = [];
    codeSegments.forEach(function (segment) {
        var res = [{ text: line }];
        if (segment === '') {
            res.push({ text: '' });
            line++;
            return codeRows.push(res);
        }
        var spaces = segment.match(/^(\s+)/);
        if (spaces) {
            res.push({
                text: spaces[1].replace(/\s/g, ' ')
            });
        }
        var className;
        htmlParser(segment, {
            start: function (_, attrs) {
                className = getClass(attrs);
            },
            end: function () {
            },
            chars: function (text) {
                if (className !== '') {
                    res.push({
                        class: className,
                        text: text
                    });
                }
                else {
                    res.push({
                        text: text
                    });
                }
                className = '';
            }
        });
        codeRows.push(res);
        line++;
    });
    return codeRows;
}
exports.default = highlight;
function getClass(attrs) {
    if (attrs === void 0) { attrs = []; }
    for (var i = 0; i < attrs.length; i++) {
        if (attrs[i].name === 'class') {
            return attrs[i].value;
        }
    }
    return '';
}`
