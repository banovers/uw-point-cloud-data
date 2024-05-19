'use strict';




var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}

var has = Function.bind.bind(Function.prototype.call)(Object.prototype.hasOwnProperty); /**
                                                                                         * @fileoverview Rule to disallow anonymous default exports.
                                                                                         * @author Duncan Beevers
                                                                                         */var fromEntries = Object.fromEntries,values = Object.values;var defs = {
  ArrayExpression: {
    option: 'allowArray',
    description: 'If `false`, will report default export of an array',
    message: 'Assign array to a variable before exporting as module default' },

  ArrowFunctionExpression: {
    option: 'allowArrowFunction',
    description: 'If `false`, will report default export of an arrow function',
    message: 'Assign arrow function to a variable before exporting as module default' },

  CallExpression: {
    option: 'allowCallExpression',
    description: 'If `false`, will report default export of a function call',
    message: 'Assign call result to a variable before exporting as module default',
    'default': true },

  ClassDeclaration: {
    option: 'allowAnonymousClass',
    description: 'If `false`, will report default export of an anonymous class',
    message: 'Unexpected default export of anonymous class',
    forbid: function () {function forbid(node) {return !node.declaration.id;}return forbid;}() },

  FunctionDeclaration: {
    option: 'allowAnonymousFunction',
    description: 'If `false`, will report default export of an anonymous function',
    message: 'Unexpected default export of anonymous function',
    forbid: function () {function forbid(node) {return !node.declaration.id;}return forbid;}() },

  Literal: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default' },

  ObjectExpression: {
    option: 'allowObject',
    description: 'If `false`, will report default export of an object expression',
    message: 'Assign object to a variable before exporting as module default' },

  TemplateLiteral: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default' },

  NewExpression: {
    option: 'allowNew',
    description: 'If `false`, will report default export of a class instantiation',
    message: 'Assign instance to a variable before exporting as module default' } };



var schemaProperties = fromEntries(values(defs).map(function (def) {return [def.option, {
    description: def.description,
    type: 'boolean' }];}));


var defaults = fromEntries(values(defs).map(function (def) {return [def.option, has(def, 'default') ? def['default'] : false];}));

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Forbid anonymous values as default exports.',
      url: (0, _docsUrl2['default'])('no-anonymous-default-export') },


    schema: [
    {
      type: 'object',
      properties: schemaProperties,
      additionalProperties: false }] },




  create: function () {function create(context) {
      var options = Object.assign({}, defaults, context.options[0]);

      return {
        ExportDefaultDeclaration: function () {function ExportDefaultDeclaration(node) {
            var def = defs[node.declaration.type];

            // Recognized node type and allowed by configuration,
            //   and has no forbid check, or forbid check return value is truthy
            if (def && !options[def.option] && (!def.forbid || def.forbid(node))) {
              context.report({ node: node, message: def.message });
            }
          }return ExportDefaultDeclaration;}() };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1hbm9ueW1vdXMtZGVmYXVsdC1leHBvcnQuanMiXSwibmFtZXMiOlsiaGFzIiwiRnVuY3Rpb24iLCJiaW5kIiwicHJvdG90eXBlIiwiY2FsbCIsIk9iamVjdCIsImhhc093blByb3BlcnR5IiwiZnJvbUVudHJpZXMiLCJ2YWx1ZXMiLCJkZWZzIiwiQXJyYXlFeHByZXNzaW9uIiwib3B0aW9uIiwiZGVzY3JpcHRpb24iLCJtZXNzYWdlIiwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24iLCJDYWxsRXhwcmVzc2lvbiIsIkNsYXNzRGVjbGFyYXRpb24iLCJmb3JiaWQiLCJub2RlIiwiZGVjbGFyYXRpb24iLCJpZCIsIkZ1bmN0aW9uRGVjbGFyYXRpb24iLCJMaXRlcmFsIiwiT2JqZWN0RXhwcmVzc2lvbiIsIlRlbXBsYXRlTGl0ZXJhbCIsIk5ld0V4cHJlc3Npb24iLCJzY2hlbWFQcm9wZXJ0aWVzIiwibWFwIiwiZGVmIiwidHlwZSIsImRlZmF1bHRzIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwiY2F0ZWdvcnkiLCJ1cmwiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiYWRkaXRpb25hbFByb3BlcnRpZXMiLCJjcmVhdGUiLCJjb250ZXh0Iiwib3B0aW9ucyIsIkV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiIsInJlcG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxxQzs7QUFFQSxJQUFNQSxNQUFNQyxTQUFTQyxJQUFULENBQWNBLElBQWQsQ0FBbUJELFNBQVNFLFNBQVQsQ0FBbUJDLElBQXRDLEVBQTRDQyxPQUFPRixTQUFQLENBQWlCRyxjQUE3RCxDQUFaLEMsQ0FQQTs7OytGQVFRQyxXLEdBQXdCRixNLENBQXhCRSxXLENBQWFDLE0sR0FBV0gsTSxDQUFYRyxNLENBRXJCLElBQU1DLE9BQU87QUFDWEMsbUJBQWlCO0FBQ2ZDLFlBQVEsWUFETztBQUVmQyxpQkFBYSxvREFGRTtBQUdmQyxhQUFTLCtEQUhNLEVB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KipcbiAqIEBmaWxlb3ZlcnZpZXcgUnVsZSB0byBkaXNhbGxvdyBhbm9ueW1vdXMgZGVmYXVsdCBleHBvcnRzLlxuICogQGF1dGhvciBEdW5jYW4gQmVldmVyc1xuICovXG5cbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5jb25zdCBoYXMgPSBGdW5jdGlvbi5iaW5kLmJpbmQoRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwpKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuY29uc3QgeyBmcm9tRW50cmllcywgdmFsdWVzIH0gPSBPYmplY3Q7XG5cbmNvbnN0IGRlZnMgPSB7XG4gIEFycmF5RXhwcmVzc2lvbjoge1xuICAgIG9wdGlvbjogJ2FsbG93QXJyYXknLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYW4gYXJyYXknLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gYXJyYXkgdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgfSxcbiAgQXJyb3dGdW5jdGlvbkV4cHJlc3Npb246IHtcbiAgICBvcHRpb246ICdhbGxvd0Fycm93RnVuY3Rpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYW4gYXJyb3cgZnVuY3Rpb24nLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gYXJyb3cgZnVuY3Rpb24gdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgfSxcbiAgQ2FsbEV4cHJlc3Npb246IHtcbiAgICBvcHRpb246ICdhbGxvd0NhbGxFeHByZXNzaW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGEgZnVuY3Rpb24gY2FsbCcsXG4gICAgbWVzc2FnZTogJ0Fzc2lnbiBjYWxsIHJlc3VsdCB0byBhIHZhcmlhYmxlIGJlZm9yZSBleHBvcnRpbmcgYXMgbW9kdWxlIGRlZmF1bHQnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gIH0sXG4gIENsYXNzRGVjbGFyYXRpb246IHtcbiAgICBvcHRpb246ICdhbGxvd0Fub255bW91c0NsYXNzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGFuIGFub255bW91cyBjbGFzcycsXG4gICAgbWVzc2FnZTogJ1VuZXhwZWN0ZWQgZGVmYXVsdCBleHBvcnQgb2YgYW5vbnltb3VzIGNsYXNzJyxcbiAgICBmb3JiaWQ6IChub2RlKSA9PiAhbm9kZS5kZWNsYXJhdGlvbi5pZCxcbiAgfSxcbiAgRnVuY3Rpb25EZWNsYXJhdGlvbjoge1xuICAgIG9wdGlvbjogJ2FsbG93QW5vbnltb3VzRnVuY3Rpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYW4gYW5vbnltb3VzIGZ1bmN0aW9uJyxcbiAgICBtZXNzYWdlOiAnVW5leHBlY3RlZCBkZWZhdWx0IGV4cG9ydCBvZiBhbm9ueW1vdXMgZnVuY3Rpb24nLFxuICAgIGZvcmJpZDogKG5vZGUpID0+ICFub2RlLmRlY2xhcmF0aW9uLmlkLFxuICB9LFxuICBMaXRlcmFsOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dMaXRlcmFsJyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGEgbGl0ZXJhbCcsXG4gICAgbWVzc2FnZTogJ0Fzc2lnbiBsaXRlcmFsIHRvIGEgdmFyaWFibGUgYmVmb3JlIGV4cG9ydGluZyBhcyBtb2R1bGUgZGVmYXVsdCcsXG4gIH0sXG4gIE9iamVjdEV4cHJlc3Npb246IHtcbiAgICBvcHRpb246ICdhbGxvd09iamVjdCcsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhbiBvYmplY3QgZXhwcmVzc2lvbicsXG4gICAgbWVzc2FnZTogJ0Fzc2lnbiBvYmplY3QgdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgfSxcbiAgVGVtcGxhdGVMaXRlcmFsOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dMaXRlcmFsJyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGEgbGl0ZXJhbCcsXG4gICAgbWVzc2FnZTogJ0Fzc2lnbiBsaXRlcmFsIHRvIGEgdmFyaWFibGUgYmVmb3JlIGV4cG9ydGluZyBhcyBtb2R1bGUgZGVmYXVsdCcsXG4gIH0sXG4gIE5ld0V4cHJlc3Npb246IHtcbiAgICBvcHRpb246ICdhbGxvd05ldycsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhIGNsYXNzIGluc3RhbnRpYXRpb24nLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gaW5zdGFuY2UgdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgfSxcbn07XG5cbmNvbnN0IHNjaGVtYVByb3BlcnRpZXMgPSBmcm9tRW50cmllcyh2YWx1ZXMoZGVmcykubWFwKChkZWYpID0+IFtkZWYub3B0aW9uLCB7XG4gIGRlc2NyaXB0aW9uOiBkZWYuZGVzY3JpcHRpb24sXG4gIHR5cGU6ICdib29sZWFuJyxcbn1dKSk7XG5cbmNvbnN0IGRlZmF1bHRzID0gZnJvbUVudHJpZXModmFsdWVzKGRlZnMpLm1hcCgoZGVmKSA9PiBbZGVmLm9wdGlvbiwgaGFzKGRlZiwgJ2RlZmF1bHQnKSA/IGRlZi5kZWZhdWx0IDogZmFsc2VdKSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIGNhdGVnb3J5OiAnU3R5bGUgZ3VpZGUnLFxuICAgICAgZGVzY3JpcHRpb246ICdGb3JiaWQgYW5vbnltb3VzIHZhbHVlcyBhcyBkZWZhdWx0IGV4cG9ydHMuJyxcbiAgICAgIHVybDogZG9jc1VybCgnbm8tYW5vbnltb3VzLWRlZmF1bHQtZXhwb3J0JyksXG4gICAgfSxcblxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczogc2NoZW1hUHJvcGVydGllcyxcbiAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXG4gIGNyZWF0ZShjb250ZXh0KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHsgLi4uZGVmYXVsdHMsIC4uLmNvbnRleHQub3B0aW9uc1swXSB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbihub2RlKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRlZnNbbm9kZS5kZWNsYXJhdGlvbi50eXBlXTtcblxuICAgICAgICAvLyBSZWNvZ25pemVkIG5vZGUgdHlwZSBhbmQgYWxsb3dlZCBieSBjb25maWd1cmF0aW9uLFxuICAgICAgICAvLyAgIGFuZCBoYXMgbm8gZm9yYmlkIGNoZWNrLCBvciBmb3JiaWQgY2hlY2sgcmV0dXJuIHZhbHVlIGlzIHRydXRoeVxuICAgICAgICBpZiAoZGVmICYmICFvcHRpb25zW2RlZi5vcHRpb25dICYmICghZGVmLmZvcmJpZCB8fCBkZWYuZm9yYmlkKG5vZGUpKSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogZGVmLm1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=