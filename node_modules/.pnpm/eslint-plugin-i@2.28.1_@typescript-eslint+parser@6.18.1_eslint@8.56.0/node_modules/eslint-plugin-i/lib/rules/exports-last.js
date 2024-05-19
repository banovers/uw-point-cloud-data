'use strict';var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}

var findLastIndex = function findLastIndex(array, predicate) {
  var i = array.length - 1;
  while (i >= 0) {
    if (predicate(array[i])) {
      return i;
    }
    i--;
  }
  return -1;
};

function isNonExportStatement(_ref) {var type = _ref.type;
  return type !== 'ExportDefaultDeclaration' &&
  type !== 'ExportNamedDeclaration' &&
  type !== 'ExportAllDeclaration';
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Ensure all exports appear after other statements.',
      url: (0, _docsUrl2['default'])('exports-last') },

    schema: [] },


  create: function () {function create(context) {
      return {
        Program: function () {function Program(_ref2) {var body = _ref2.body;
            var lastNonExportStatementIndex = findLastIndex(body, isNonExportStatement);

            if (lastNonExportStatementIndex !== -1) {
              body.slice(0, lastNonExportStatementIndex).forEach(function (node) {
                if (!isNonExportStatement(node)) {
                  context.report({
                    node: node,
                    message: 'Export statements should appear at the end of the file' });

                }
              });
            }
          }return Program;}() };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9leHBvcnRzLWxhc3QuanMiXSwibmFtZXMiOlsiZmluZExhc3RJbmRleCIsImFycmF5IiwicHJlZGljYXRlIiwiaSIsImxlbmd0aCIsImlzTm9uRXhwb3J0U3RhdGVtZW50IiwidHlwZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwiZG9jcyIsImNhdGVnb3J5IiwiZGVzY3JpcHRpb24iLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0IiwiUHJvZ3JhbSIsImJvZHkiLCJsYXN0Tm9uRXhwb3J0U3RhdGVtZW50SW5kZXgiLCJzbGljZSIsImZvckVhY2giLCJub2RlIiwicmVwb3J0IiwibWVzc2FnZSJdLCJtYXBwaW5ncyI6ImFBQUEscUM7O0FBRUEsSUFBTUEsZ0JBQWdCLFNBQWhCQSxhQUFnQixDQUFDQyxLQUFELEVBQVFDLFNBQVIsRUFBc0I7QUFDMUMsTUFBSUMsSUFBSUYsTUFBTUcsTUFBTixHQUFlLENBQXZCO0FBQ0EsU0FBT0QsS0FBSyxDQUFaLEVBQWU7QUFDYixRQUFJRCxVQUFVRCxNQUFNRSxDQUFOLENBQVYsQ0FBSixFQUF5QjtBQUN2QixhQUFPQSxDQUFQO0FBQ0Q7QUFDREE7QUFDRDtBQUNELFNBQU8sQ0FBQyxDQUFSO0FBQ0QsQ0FURDs7QUFXQSxTQUFTRSxvQkFBVCxPQUF3QyxLQUFSQyxJQUFRLFFBQVJBLElBQVE7QUFDdEMsU0FBT0EsU0FBUywwQkFBVDtBQUNGQSxXQUFTLHdCQURQO0FBRUZBLFdBQVMsc0JBRmQ7QUFHRDs7QUFFREMsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pILFVBQU0sWUFERjtBQUVKSSxVQUFNO0FBQ0pDLGdCQUFVLGFBRE47QUFFSkMsbUJBQWEsbURBRlQ7QUFHSkMsV0FBSywwQkFBUSxjQUFSLENBSEQsRUFGRjs7QUFPSkMsWUFBUSxFQVBKLEVBRFM7OztBQVdmQyxRQVhlLCtCQVdSQyxPQVhRLEVBV0M7QUFDZCxhQUFPO0FBQ0xDLGVBREssdUNBQ2EsS0FBUkMsSUFBUSxTQUFSQSxJQUFRO0FBQ2hCLGdCQUFNQyw4QkFBOEJuQixjQUFja0IsSUFBZCxFQUFvQmIsb0JBQXBCLENBQXBDOztBQUVBLGdCQUFJYyxnQ0FBZ0MsQ0FBQyxDQUFyQyxFQUF3QztBQUN0Q0QsbUJBQUtFLEtBQUwsQ0FBVyxDQUFYLEVBQWNELDJCQUFkLEVBQTJDRSxPQUEzQyxDQUFtRCxVQUFDQyxJQUFELEVBQVU7QUFDM0Qsb0JBQUksQ0FBQ2pCLHFCQUFxQmlCLElBQXJCLENBQUwsRUFBaUM7QUFDL0JOLDBCQUFRTyxNQUFSLENBQWU7QUFDYkQsOEJBRGE7QUFFYkUsNkJBQVMsd0RBRkksRUFBZjs7QUFJRDtBQUNGLGVBUEQ7QUFRRDtBQUNGLFdBZEksb0JBQVA7O0FBZ0JELEtBNUJjLG1CQUFqQiIsImZpbGUiOiJleHBvcnRzLWxhc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuY29uc3QgZmluZExhc3RJbmRleCA9IChhcnJheSwgcHJlZGljYXRlKSA9PiB7XG4gIGxldCBpID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgd2hpbGUgKGkgPj0gMCkge1xuICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaV0pKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gICAgaS0tO1xuICB9XG4gIHJldHVybiAtMTtcbn07XG5cbmZ1bmN0aW9uIGlzTm9uRXhwb3J0U3RhdGVtZW50KHsgdHlwZSB9KSB7XG4gIHJldHVybiB0eXBlICE9PSAnRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uJ1xuICAgICYmIHR5cGUgIT09ICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJ1xuICAgICYmIHR5cGUgIT09ICdFeHBvcnRBbGxEZWNsYXJhdGlvbic7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIGNhdGVnb3J5OiAnU3R5bGUgZ3VpZGUnLFxuICAgICAgZGVzY3JpcHRpb246ICdFbnN1cmUgYWxsIGV4cG9ydHMgYXBwZWFyIGFmdGVyIG90aGVyIHN0YXRlbWVudHMuJyxcbiAgICAgIHVybDogZG9jc1VybCgnZXhwb3J0cy1sYXN0JyksXG4gICAgfSxcbiAgICBzY2hlbWE6IFtdLFxuICB9LFxuXG4gIGNyZWF0ZShjb250ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFByb2dyYW0oeyBib2R5IH0pIHtcbiAgICAgICAgY29uc3QgbGFzdE5vbkV4cG9ydFN0YXRlbWVudEluZGV4ID0gZmluZExhc3RJbmRleChib2R5LCBpc05vbkV4cG9ydFN0YXRlbWVudCk7XG5cbiAgICAgICAgaWYgKGxhc3ROb25FeHBvcnRTdGF0ZW1lbnRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBib2R5LnNsaWNlKDAsIGxhc3ROb25FeHBvcnRTdGF0ZW1lbnRJbmRleCkuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpc05vbkV4cG9ydFN0YXRlbWVudChub2RlKSkge1xuICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRXhwb3J0IHN0YXRlbWVudHMgc2hvdWxkIGFwcGVhciBhdCB0aGUgZW5kIG9mIHRoZSBmaWxlJyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=