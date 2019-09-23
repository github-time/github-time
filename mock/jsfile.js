"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = `"use strict";
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
}`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNmaWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsianNmaWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsa0JBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUEwRGIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGBcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQcmlzbSA9IHJlcXVpcmUoXCIuL3ByaXNtXCIpO1xudmFyIGh0bWxQYXJzZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vLi4vbGliL3d4UGFyc2UvaHRtbHBhcnNlclwiKTtcbmZ1bmN0aW9uIGhpZ2hsaWdodChjb2RlU3RyaW5nLCB0eXBlLCBsaW5lKSB7XG4gICAgaWYgKGxpbmUgPT09IHZvaWQgMCkgeyBsaW5lID0gMTsgfVxuICAgIHZhciBodG1sID0gUHJpc20uaGlnaGxpZ2h0KGNvZGVTdHJpbmcsIFByaXNtLmxhbmd1YWdlc1t0eXBlXSwgdHlwZSk7XG4gICAgdmFyIGNvZGVTZWdtZW50cyA9IGh0bWwuc3BsaXQoL1xcXFxuLyk7XG4gICAgdmFyIGNvZGVSb3dzID0gW107XG4gICAgY29kZVNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24gKHNlZ21lbnQpIHtcbiAgICAgICAgdmFyIHJlcyA9IFt7IHRleHQ6IGxpbmUgfV07XG4gICAgICAgIGlmIChzZWdtZW50ID09PSAnJykge1xuICAgICAgICAgICAgcmVzLnB1c2goeyB0ZXh0OiAnJyB9KTtcbiAgICAgICAgICAgIGxpbmUrKztcbiAgICAgICAgICAgIHJldHVybiBjb2RlUm93cy5wdXNoKHJlcyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNwYWNlcyA9IHNlZ21lbnQubWF0Y2goL14oXFxzKykvKTtcbiAgICAgICAgaWYgKHNwYWNlcykge1xuICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHRleHQ6IHNwYWNlc1sxXS5yZXBsYWNlKC9cXHMvZywgJyAnKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNsYXNzTmFtZTtcbiAgICAgICAgaHRtbFBhcnNlcihzZWdtZW50LCB7XG4gICAgICAgICAgICBzdGFydDogZnVuY3Rpb24gKF8sIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MoYXR0cnMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoYXJzOiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb2RlUm93cy5wdXNoKHJlcyk7XG4gICAgICAgIGxpbmUrKztcbiAgICB9KTtcbiAgICByZXR1cm4gY29kZVJvd3M7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBoaWdobGlnaHQ7XG5mdW5jdGlvbiBnZXRDbGFzcyhhdHRycykge1xuICAgIGlmIChhdHRycyA9PT0gdm9pZCAwKSB7IGF0dHJzID0gW107IH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhdHRyc1tpXS5uYW1lID09PSAnY2xhc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gYXR0cnNbaV0udmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICcnO1xufWBcbiJdfQ==