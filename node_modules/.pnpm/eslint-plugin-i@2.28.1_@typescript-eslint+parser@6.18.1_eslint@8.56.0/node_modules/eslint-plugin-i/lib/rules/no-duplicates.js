'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _semver = require('semver');var _semver2 = _interopRequireDefault(_semver);

var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}function _toArray(arr) {return Array.isArray(arr) ? arr : Array.from(arr);}

var flatMap = Function.bind.bind(Function.prototype.call)(Array.prototype.flatMap);

var typescriptPkg = void 0;
try {
  typescriptPkg = require('typescript/package.json'); // eslint-disable-line import/no-extraneous-dependencies
} catch (e) {/**/}

function checkImports(imported, context) {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
    for (var _iterator = imported.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var _ref = _step.value;var _ref2 = _slicedToArray(_ref, 2);var _module = _ref2[0];var nodes = _ref2[1];
      if (nodes.length > 1) {
        var message = '\'' + String(_module) + '\' imported multiple times.';var _nodes = _toArray(
        nodes),first = _nodes[0],rest = _nodes.slice(1);
        var sourceCode = context.getSourceCode();
        var fix = getFix(first, rest, sourceCode, context);

        context.report({
          node: first.source,
          message: message,
          fix: fix // Attach the autofix (if any) to the first import.
        });var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {

          for (var _iterator2 = rest[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var node = _step2.value;
            context.report({
              node: node.source,
              message: message });

          }} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2['return']) {_iterator2['return']();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}
      }
    }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator['return']) {_iterator['return']();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
}

function getFix(first, rest, sourceCode, context) {
  // Sorry ESLint <= 3 users, no autofix for you. Autofixing duplicate imports
  // requires multiple `fixer.whatever()` calls in the `fix`: We both need to
  // update the first one, and remove the rest. Support for multiple
  // `fixer.whatever()` in a single `fix` was added in ESLint 4.1.
  // `sourceCode.getCommentsBefore` was added in 4.0, so that's an easy thing to
  // check for.
  if (typeof sourceCode.getCommentsBefore !== 'function') {
    return undefined;
  }

  // Adjusting the first import might make it multiline, which could break
  // `eslint-disable-next-line` comments and similar, so bail if the first
  // import has comments. Also, if the first import is `import * as ns from
  // './foo'` there's nothing we can do.
  if (hasProblematicComments(first, sourceCode) || hasNamespace(first)) {
    return undefined;
  }

  var defaultImportNames = new Set(
  flatMap([].concat(first, rest || []), function (x) {return getDefaultImportName(x) || [];}));


  // Bail if there are multiple different default import names – it's up to the
  // user to choose which one to keep.
  if (defaultImportNames.size > 1) {
    return undefined;
  }

  // Leave it to the user to handle comments. Also skip `import * as ns from
  // './foo'` imports, since they cannot be merged into another import.
  var restWithoutComments = rest.filter(function (node) {return !hasProblematicComments(node, sourceCode) && !hasNamespace(node);});

  var specifiers = restWithoutComments.
  map(function (node) {
    var tokens = sourceCode.getTokens(node);
    var openBrace = tokens.find(function (token) {return isPunctuator(token, '{');});
    var closeBrace = tokens.find(function (token) {return isPunctuator(token, '}');});

    if (openBrace == null || closeBrace == null) {
      return undefined;
    }

    return {
      importNode: node,
      identifiers: sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]).split(','), // Split the text into separate identifiers (retaining any whitespace before or after)
      isEmpty: !hasSpecifiers(node) };

  }).
  filter(Boolean);

  var unnecessaryImports = restWithoutComments.filter(function (node) {return !hasSpecifiers(node) &&
    !hasNamespace(node) &&
    !specifiers.some(function (specifier) {return specifier.importNode === node;});});


  var shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1;
  var shouldAddSpecifiers = specifiers.length > 0;
  var shouldRemoveUnnecessary = unnecessaryImports.length > 0;

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined;
  }

  return function (fixer) {
    var tokens = sourceCode.getTokens(first);
    var openBrace = tokens.find(function (token) {return isPunctuator(token, '{');});
    var closeBrace = tokens.find(function (token) {return isPunctuator(token, '}');});
    var firstToken = sourceCode.getFirstToken(first);var _defaultImportNames = _slicedToArray(
    defaultImportNames, 1),defaultImportName = _defaultImportNames[0];

    var firstHasTrailingComma = closeBrace != null && isPunctuator(sourceCode.getTokenBefore(closeBrace), ',');
    var firstIsEmpty = !hasSpecifiers(first);
    var firstExistingIdentifiers = firstIsEmpty ?
    new Set() :
    new Set(sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]).
    split(',').
    map(function (x) {return x.trim();}));var _specifiers$reduce =


    specifiers.reduce(
    function (_ref3, specifier) {var _ref4 = _slicedToArray(_ref3, 3),result = _ref4[0],needsComma = _ref4[1],existingIdentifiers = _ref4[2];
      var isTypeSpecifier = specifier.importNode.importKind === 'type';

      var preferInline = context.options[0] && context.options[0]['prefer-inline'];
      // a user might set prefer-inline but not have a supporting TypeScript version.  Flow does not support inline types so this should fail in that case as well.
      if (preferInline && (!typescriptPkg || !_semver2['default'].satisfies(typescriptPkg.version, '>= 4.5'))) {
        throw new Error('Your version of TypeScript does not support inline type imports.');
      }

      // Add *only* the new identifiers that don't already exist, and track any new identifiers so we don't add them again in the next loop
      var _specifier$identifier = specifier.identifiers.reduce(function (_ref5, cur) {var _ref6 = _slicedToArray(_ref5, 2),text = _ref6[0],set = _ref6[1];
        var trimmed = cur.trim(); // Trim whitespace before/after to compare to our set of existing identifiers
        var curWithType = trimmed.length > 0 && preferInline && isTypeSpecifier ? 'type ' + String(cur) : cur;
        if (existingIdentifiers.has(trimmed)) {
          return [text, set];
        }
        return [text.length > 0 ? String(text) + ',' + String(curWithType) : curWithType, set.add(trimmed)];
      }, ['', existingIdentifiers]),_specifier$identifier2 = _slicedToArray(_specifier$identifier, 2),specifierText = _specifier$identifier2[0],updatedExistingIdentifiers = _specifier$identifier2[1];

      return [
      needsComma && !specifier.isEmpty && specifierText.length > 0 ? String(
      result) + ',' + String(specifierText) : '' + String(
      result) + String(specifierText),
      specifier.isEmpty ? needsComma : true,
      updatedExistingIdentifiers];

    },
    ['', !firstHasTrailingComma && !firstIsEmpty, firstExistingIdentifiers]),_specifiers$reduce2 = _slicedToArray(_specifiers$reduce, 1),specifiersText = _specifiers$reduce2[0];


    var fixes = [];

    if (shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      // `import './foo'` → `import def, {...} from './foo'`
      fixes.push(
      fixer.insertTextAfter(firstToken, ' ' + String(defaultImportName) + ', {' + String(specifiersText) + '} from'));

    } else if (shouldAddDefault && openBrace == null && !shouldAddSpecifiers) {
      // `import './foo'` → `import def from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ' ' + String(defaultImportName) + ' from'));
    } else if (shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} from './foo'` → `import def, {...} from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ' ' + String(defaultImportName) + ','));
      if (shouldAddSpecifiers) {
        // `import def, {...} from './foo'` → `import def, {..., ...} from './foo'`
        fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
      }
    } else if (!shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      if (first.specifiers.length === 0) {
        // `import './foo'` → `import {...} from './foo'`
        fixes.push(fixer.insertTextAfter(firstToken, ' {' + String(specifiersText) + '} from'));
      } else {
        // `import def from './foo'` → `import def, {...} from './foo'`
        fixes.push(fixer.insertTextAfter(first.specifiers[0], ', {' + String(specifiersText) + '}'));
      }
    } else if (!shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} './foo'` → `import {..., ...} from './foo'`
      fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
    }

    // Remove imports whose specifiers have been moved into the first import.
    var _iteratorNormalCompletion3 = true;var _didIteratorError3 = false;var _iteratorError3 = undefined;try {for (var _iterator3 = specifiers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {var specifier = _step3.value;
        var importNode = specifier.importNode;
        fixes.push(fixer.remove(importNode));

        var charAfterImportRange = [importNode.range[1], importNode.range[1] + 1];
        var charAfterImport = sourceCode.text.substring(charAfterImportRange[0], charAfterImportRange[1]);
        if (charAfterImport === '\n') {
          fixes.push(fixer.removeRange(charAfterImportRange));
        }
      }

      // Remove imports whose default import has been moved to the first import,
      // and side-effect-only imports that are unnecessary due to the first
      // import.
    } catch (err) {_didIteratorError3 = true;_iteratorError3 = err;} finally {try {if (!_iteratorNormalCompletion3 && _iterator3['return']) {_iterator3['return']();}} finally {if (_didIteratorError3) {throw _iteratorError3;}}}var _iteratorNormalCompletion4 = true;var _didIteratorError4 = false;var _iteratorError4 = undefined;try {for (var _iterator4 = unnecessaryImports[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {var node = _step4.value;
        fixes.push(fixer.remove(node));

        var charAfterImportRange = [node.range[1], node.range[1] + 1];
        var charAfterImport = sourceCode.text.substring(charAfterImportRange[0], charAfterImportRange[1]);
        if (charAfterImport === '\n') {
          fixes.push(fixer.removeRange(charAfterImportRange));
        }
      }} catch (err) {_didIteratorError4 = true;_iteratorError4 = err;} finally {try {if (!_iteratorNormalCompletion4 && _iterator4['return']) {_iterator4['return']();}} finally {if (_didIteratorError4) {throw _iteratorError4;}}}

    return fixes;
  };
}

function isPunctuator(node, value) {
  return node.type === 'Punctuator' && node.value === value;
}

// Get the name of the default import of `node`, if any.
function getDefaultImportName(node) {
  var defaultSpecifier = node.specifiers.
  find(function (specifier) {return specifier.type === 'ImportDefaultSpecifier';});
  return defaultSpecifier != null ? defaultSpecifier.local.name : undefined;
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  var specifiers = node.specifiers.
  filter(function (specifier) {return specifier.type === 'ImportNamespaceSpecifier';});
  return specifiers.length > 0;
}

// Checks whether `node` has any non-default specifiers.
function hasSpecifiers(node) {
  var specifiers = node.specifiers.
  filter(function (specifier) {return specifier.type === 'ImportSpecifier';});
  return specifiers.length > 0;
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode) ||
    hasCommentAfter(node, sourceCode) ||
    hasCommentInsideNonSpecifiers(node, sourceCode));

}

// Checks whether `node` has a comment (that ends) on the previous line or on
// the same line as `node` (starts).
function hasCommentBefore(node, sourceCode) {
  return sourceCode.getCommentsBefore(node).
  some(function (comment) {return comment.loc.end.line >= node.loc.start.line - 1;});
}

// Checks whether `node` has a comment (that starts) on the same line as `node`
// (ends).
function hasCommentAfter(node, sourceCode) {
  return sourceCode.getCommentsAfter(node).
  some(function (comment) {return comment.loc.start.line === node.loc.end.line;});
}

// Checks whether `node` has any comments _inside,_ except inside the `{...}`
// part (if any).
function hasCommentInsideNonSpecifiers(node, sourceCode) {
  var tokens = sourceCode.getTokens(node);
  var openBraceIndex = tokens.findIndex(function (token) {return isPunctuator(token, '{');});
  var closeBraceIndex = tokens.findIndex(function (token) {return isPunctuator(token, '}');});
  // Slice away the first token, since we're no looking for comments _before_
  // `node` (only inside). If there's a `{...}` part, look for comments before
  // the `{`, but not before the `}` (hence the `+1`s).
  var someTokens = openBraceIndex >= 0 && closeBraceIndex >= 0 ?
  tokens.slice(1, openBraceIndex + 1).concat(tokens.slice(closeBraceIndex + 1)) :
  tokens.slice(1);
  return someTokens.some(function (token) {return sourceCode.getCommentsBefore(token).length > 0;});
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Style guide',
      description: 'Forbid repeated import of the same module in multiple places.',
      url: (0, _docsUrl2['default'])('no-duplicates') },

    fixable: 'code',
    schema: [
    {
      type: 'object',
      properties: {
        considerQueryString: {
          type: 'boolean' },

        'prefer-inline': {
          type: 'boolean' } },


      additionalProperties: false }] },




  create: function () {function create(context) {
      // Prepare the resolver from options.
      var considerQueryStringOption = context.options[0] &&
      context.options[0].considerQueryString;
      var defaultResolver = function () {function defaultResolver(sourcePath) {return (0, _resolve2['default'])(sourcePath, context) || sourcePath;}return defaultResolver;}();
      var resolver = considerQueryStringOption ? function (sourcePath) {
        var parts = sourcePath.match(/^([^?]*)\?(.*)$/);
        if (!parts) {
          return defaultResolver(sourcePath);
        }
        return String(defaultResolver(parts[1])) + '?' + String(parts[2]);
      } : defaultResolver;

      var moduleMaps = new Map();

      function getImportMap(n) {
        if (!moduleMaps.has(n.parent)) {
          moduleMaps.set(n.parent, {
            imported: new Map(),
            nsImported: new Map(),
            defaultTypesImported: new Map(),
            namedTypesImported: new Map() });

        }
        var map = moduleMaps.get(n.parent);
        var preferInline = context.options[0] && context.options[0]['prefer-inline'];
        if (!preferInline && n.importKind === 'type') {
          return n.specifiers.length > 0 && n.specifiers[0].type === 'ImportDefaultSpecifier' ? map.defaultTypesImported : map.namedTypesImported;
        }
        if (!preferInline && n.specifiers.some(function (spec) {return spec.importKind === 'type';})) {
          return map.namedTypesImported;
        }

        return hasNamespace(n) ? map.nsImported : map.imported;
      }

      return {
        ImportDeclaration: function () {function ImportDeclaration(n) {
            // resolved path will cover aliased duplicates
            var resolvedPath = resolver(n.source.value);
            var importMap = getImportMap(n);

            if (importMap.has(resolvedPath)) {
              importMap.get(resolvedPath).push(n);
            } else {
              importMap.set(resolvedPath, [n]);
            }
          }return ImportDeclaration;}(),

        'Program:exit': function () {function ProgramExit() {var _iteratorNormalCompletion5 = true;var _didIteratorError5 = false;var _iteratorError5 = undefined;try {
              for (var _iterator5 = moduleMaps.values()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {var map = _step5.value;
                checkImports(map.imported, context);
                checkImports(map.nsImported, context);
                checkImports(map.defaultTypesImported, context);
                checkImports(map.namedTypesImported, context);
              }} catch (err) {_didIteratorError5 = true;_iteratorError5 = err;} finally {try {if (!_iteratorNormalCompletion5 && _iterator5['return']) {_iterator5['return']();}} finally {if (_didIteratorError5) {throw _iteratorError5;}}}
          }return ProgramExit;}() };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1kdXBsaWNhdGVzLmpzIl0sIm5hbWVzIjpbImZsYXRNYXAiLCJGdW5jdGlvbiIsImJpbmQiLCJwcm90b3R5cGUiLCJjYWxsIiwiQXJyYXkiLCJ0eXBlc2NyaXB0UGtnIiwicmVxdWlyZSIsImUiLCJjaGVja0ltcG9ydHMiLCJpbXBvcnRlZCIsImNvbnRleHQiLCJlbnRyaWVzIiwibW9kdWxlIiwibm9kZXMiLCJsZW5ndGgiLCJtZXNzYWdlIiwiZmlyc3QiLCJyZXN0Iiwic291cmNlQ29kZSIsImdldFNvdXJjZUNvZGUiLCJmaXgiLCJnZXRGaXgiLCJyZXBvcnQiLCJub2RlIiwic291cmNlIiwiZ2V0Q29tbWVudHNCZWZvcmUiLCJ1bmRlZmluZWQiLCJoYXNQcm9ibGVtYXRpY0NvbW1lbnRzIiwiaGFzTmFtZXNwYWNlIiwiZGVmYXVsdEltcG9ydE5hbWVzIiwiU2V0IiwiY29uY2F0IiwieCIsImdldERlZmF1bHRJbXBvcnROYW1lIiwic2l6ZSIsInJlc3RXaXRob3V0Q29tbWVudHMiLCJmaWx0ZXIiLCJzcGVjaWZpZXJzIiwibWFwIiwidG9rZW5zIiwiZ2V0VG9rZW5zIiwib3BlbkJyYWNlIiwiZmluZCIsInRva2VuIiwiaXNQdW5jdHVhdG9yIiwiY2xvc2VCcmFjZSIsImltcG9ydE5vZGUiLCJpZGVudGlmaWVycyIsInRleHQiLCJzbGljZSIsInJhbmdlIiwic3BsaXQiLCJpc0VtcHR5IiwiaGFzU3BlY2lmaWVycyIsIkJvb2xlYW4iLCJ1bm5lY2Vzc2FyeUltcG9ydHMiLCJzb21lIiwic3BlY2lmaWVyIiwic2hvdWxkQWRkRGVmYXVsdCIsInNob3VsZEFkZFNwZWNpZmllcnMiLCJzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSIsImZpeGVyIiwiZmlyc3RUb2tlbiIsImdldEZpcnN0VG9rZW4iLCJkZWZhdWx0SW1wb3J0TmFtZSIsImZpcnN0SGFzVHJhaWxpbmdDb21tYSIsImdldFRva2VuQmVmb3JlIiwiZmlyc3RJc0VtcHR5IiwiZmlyc3RFeGlzdGluZ0lkZW50aWZpZXJzIiwidHJpbSIsInJlZHVjZSIsInJlc3VsdCIsIm5lZWRzQ29tbWEiLCJleGlzdGluZ0lkZW50aWZpZXJzIiwiaXNUeXBlU3BlY2lmaWVyIiwiaW1wb3J0S2luZCIsInByZWZlcklubGluZSIsIm9wdGlvbnMiLCJzZW12ZXIiLCJzYXRpc2ZpZXMiLCJ2ZXJzaW9uIiwiRXJyb3IiLCJjdXIiLCJzZXQiLCJ0cmltbWVkIiwiY3VyV2l0aFR5cGUiLCJoYXMiLCJhZGQiLCJzcGVjaWZpZXJUZXh0IiwidXBkYXRlZEV4aXN0aW5nSWRlbnRpZmllcnMiLCJzcGVjaWZpZXJzVGV4dCIsImZpeGVzIiwicHVzaCIsImluc2VydFRleHRBZnRlciIsImluc2VydFRleHRCZWZvcmUiLCJyZW1vdmUiLCJjaGFyQWZ0ZXJJbXBvcnRSYW5nZSIsImNoYXJBZnRlckltcG9ydCIsInN1YnN0cmluZyIsInJlbW92ZVJhbmdlIiwidmFsdWUiLCJ0eXBlIiwiZGVmYXVsdFNwZWNpZmllciIsImxvY2FsIiwibmFtZSIsImhhc0NvbW1lbnRCZWZvcmUiLCJoYXNDb21tZW50QWZ0ZXIiLCJoYXNDb21tZW50SW5zaWRlTm9uU3BlY2lmaWVycyIsImNvbW1lbnQiLCJsb2MiLCJlbmQiLCJsaW5lIiwic3RhcnQiLCJnZXRDb21tZW50c0FmdGVyIiwib3BlbkJyYWNlSW5kZXgiLCJmaW5kSW5kZXgiLCJjbG9zZUJyYWNlSW5kZXgiLCJzb21lVG9rZW5zIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwiY2F0ZWdvcnkiLCJkZXNjcmlwdGlvbiIsInVybCIsImZpeGFibGUiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiY29uc2lkZXJRdWVyeVN0cmluZyIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwiY3JlYXRlIiwiY29uc2lkZXJRdWVyeVN0cmluZ09wdGlvbiIsImRlZmF1bHRSZXNvbHZlciIsInNvdXJjZVBhdGgiLCJyZXNvbHZlciIsInBhcnRzIiwibWF0Y2giLCJtb2R1bGVNYXBzIiwiTWFwIiwiZ2V0SW1wb3J0TWFwIiwibiIsInBhcmVudCIsIm5zSW1wb3J0ZWQiLCJkZWZhdWx0VHlwZXNJbXBvcnRlZCIsIm5hbWVkVHlwZXNJbXBvcnRlZCIsImdldCIsInNwZWMiLCJJbXBvcnREZWNsYXJhdGlvbiIsInJlc29sdmVkUGF0aCIsImltcG9ydE1hcCIsInZhbHVlcyJdLCJtYXBwaW5ncyI6InFvQkFBQSxzRDtBQUNBLGdDOztBQUVBLHFDOztBQUVBLElBQU1BLFVBQVVDLFNBQVNDLElBQVQsQ0FBY0EsSUFBZCxDQUFtQkQsU0FBU0UsU0FBVCxDQUFtQkMsSUFBdEMsRUFBNENDLE1BQU1GLFNBQU4sQ0FBZ0JILE9BQTVELENBQWhCOztBQUVBLElBQUlNLHNCQUFKO0FBQ0EsSUFBSTtBQUNGQSxrQkFBZ0JDLFFBQVEseUJBQVIsQ0FBaEIsQ0FERSxDQUNrRDtBQUNyRCxDQUZELENBRUUsT0FBT0MsQ0FBUCxFQUFVLENBQUUsSUFBTTs7QUFFcEIsU0FBU0MsWUFBVCxDQUFzQkMsUUFBdEIsRUFBZ0NDLE9BQWhDLEVBQXlDO0FBQ3ZDLHlCQUE4QkQsU0FBU0UsT0FBVCxFQUE5Qiw4SEFBa0QsZ0VBQXRDQyxPQUFzQyxnQkFBOUJDLEtBQThCO0FBQ2hELFVBQUlBLE1BQU1DLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNwQixZQUFNQyx3QkFBY0gsT0FBZCxpQ0FBTixDQURvQjtBQUVLQyxhQUZMLEVBRWJHLEtBRmEsYUFFSEMsSUFGRztBQUdwQixZQUFNQyxhQUFhUixRQUFRUyxhQUFSLEVBQW5CO0FBQ0EsWUFBTUMsTUFBTUMsT0FBT0wsS0FBUCxFQUFjQyxJQUFkLEVBQW9CQyxVQUFwQixFQUFnQ1IsT0FBaEMsQ0FBWjs7QUFFQUEsZ0JBQVFZLE1BQVIsQ0FBZTtBQUNiQyxnQkFBTVAsTUFBTVEsTUFEQztBQUViVCwwQkFGYTtBQUdiSyxrQkFIYSxDQUdSO0FBSFEsU0FBZixFQU5vQjs7QUFZcEIsZ0NBQW1CSCxJQUFuQixtSUFBeUIsS0FBZE0sSUFBYztBQUN2QmIsb0JBQVFZLE1BQVIsQ0FB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N0I7QUFDQUYsNkJBQWE4QixJQUFJd0csb0JBQWpCLEVBQXVDcEksT0FBdkM7QUFDQUYsNkJBQWE4QixJQUFJeUcsa0JBQWpCLEVBQXFDckksT0FBckM7QUFDRCxlQU5jO0FBT2hCLFdBcEJJLHdCQUFQOztBQXNCRCxLQW5GYyxtQkFBakIiLCJmaWxlIjoibm8tZHVwbGljYXRlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5cbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuXG5jb25zdCBmbGF0TWFwID0gRnVuY3Rpb24uYmluZC5iaW5kKEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsKShBcnJheS5wcm90b3R5cGUuZmxhdE1hcCk7XG5cbmxldCB0eXBlc2NyaXB0UGtnO1xudHJ5IHtcbiAgdHlwZXNjcmlwdFBrZyA9IHJlcXVpcmUoJ3R5cGVzY3JpcHQvcGFja2FnZS5qc29uJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG59IGNhdGNoIChlKSB7IC8qKi8gfVxuXG5mdW5jdGlvbiBjaGVja0ltcG9ydHMoaW1wb3J0ZWQsIGNvbnRleHQpIHtcbiAgZm9yIChjb25zdCBbbW9kdWxlLCBub2Rlc10gb2YgaW1wb3J0ZWQuZW50cmllcygpKSB7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgJyR7bW9kdWxlfScgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXMuYDtcbiAgICAgIGNvbnN0IFtmaXJzdCwgLi4ucmVzdF0gPSBub2RlcztcbiAgICAgIGNvbnN0IHNvdXJjZUNvZGUgPSBjb250ZXh0LmdldFNvdXJjZUNvZGUoKTtcbiAgICAgIGNvbnN0IGZpeCA9IGdldEZpeChmaXJzdCwgcmVzdCwgc291cmNlQ29kZSwgY29udGV4dCk7XG5cbiAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgbm9kZTogZmlyc3Quc291cmNlLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBmaXgsIC8vIEF0dGFjaCB0aGUgYXV0b2ZpeCAoaWYgYW55KSB0byB0aGUgZmlyc3QgaW1wb3J0LlxuICAgICAgfSk7XG5cbiAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiByZXN0KSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlOiBub2RlLnNvdXJjZSxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Rml4KGZpcnN0LCByZXN0LCBzb3VyY2VDb2RlLCBjb250ZXh0KSB7XG4gIC8vIFNvcnJ5IEVTTGludCA8PSAzIHVzZXJzLCBubyBhdXRvZml4IGZvciB5b3UuIEF1dG9maXhpbmcgZHVwbGljYXRlIGltcG9ydHNcbiAgLy8gcmVxdWlyZXMgbXVsdGlwbGUgYGZpeGVyLndoYXRldmVyKClgIGNhbGxzIGluIHRoZSBgZml4YDogV2UgYm90aCBuZWVkIHRvXG4gIC8vIHVwZGF0ZSB0aGUgZmlyc3Qgb25lLCBhbmQgcmVtb3ZlIHRoZSByZXN0LiBTdXBwb3J0IGZvciBtdWx0aXBsZVxuICAvLyBgZml4ZXIud2hhdGV2ZXIoKWAgaW4gYSBzaW5nbGUgYGZpeGAgd2FzIGFkZGVkIGluIEVTTGludCA0LjEuXG4gIC8vIGBzb3VyY2VDb2RlLmdldENvbW1lbnRzQmVmb3JlYCB3YXMgYWRkZWQgaW4gNC4wLCBzbyB0aGF0J3MgYW4gZWFzeSB0aGluZyB0b1xuICAvLyBjaGVjayBmb3IuXG4gIGlmICh0eXBlb2Ygc291cmNlQ29kZS5nZXRDb21tZW50c0JlZm9yZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBZGp1c3RpbmcgdGhlIGZpcnN0IGltcG9ydCBtaWdodCBtYWtlIGl0IG11bHRpbGluZSwgd2hpY2ggY291bGQgYnJlYWtcbiAgLy8gYGVzbGludC1kaXNhYmxlLW5leHQtbGluZWAgY29tbWVudHMgYW5kIHNpbWlsYXIsIHNvIGJhaWwgaWYgdGhlIGZpcnN0XG4gIC8vIGltcG9ydCBoYXMgY29tbWVudHMuIEFsc28sIGlmIHRoZSBmaXJzdCBpbXBvcnQgaXMgYGltcG9ydCAqIGFzIG5zIGZyb21cbiAgLy8gJy4vZm9vJ2AgdGhlcmUncyBub3RoaW5nIHdlIGNhbiBkby5cbiAgaWYgKGhhc1Byb2JsZW1hdGljQ29tbWVudHMoZmlyc3QsIHNvdXJjZUNvZGUpIHx8IGhhc05hbWVzcGFjZShmaXJzdCkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgZGVmYXVsdEltcG9ydE5hbWVzID0gbmV3IFNldChcbiAgICBmbGF0TWFwKFtdLmNvbmNhdChmaXJzdCwgcmVzdCB8fCBbXSksICh4KSA9PiBnZXREZWZhdWx0SW1wb3J0TmFtZSh4KSB8fCBbXSksXG4gICk7XG5cbiAgLy8gQmFpbCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgZGlmZmVyZW50IGRlZmF1bHQgaW1wb3J0IG5hbWVzIOKAkyBpdCdzIHVwIHRvIHRoZVxuICAvLyB1c2VyIHRvIGNob29zZSB3aGljaCBvbmUgdG8ga2VlcC5cbiAgaWYgKGRlZmF1bHRJbXBvcnROYW1lcy5zaXplID4gMSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBMZWF2ZSBpdCB0byB0aGUgdXNlciB0byBoYW5kbGUgY29tbWVudHMuIEFsc28gc2tpcCBgaW1wb3J0ICogYXMgbnMgZnJvbVxuICAvLyAnLi9mb28nYCBpbXBvcnRzLCBzaW5jZSB0aGV5IGNhbm5vdCBiZSBtZXJnZWQgaW50byBhbm90aGVyIGltcG9ydC5cbiAgY29uc3QgcmVzdFdpdGhvdXRDb21tZW50cyA9IHJlc3QuZmlsdGVyKChub2RlKSA9PiAhaGFzUHJvYmxlbWF0aWNDb21tZW50cyhub2RlLCBzb3VyY2VDb2RlKSAmJiAhaGFzTmFtZXNwYWNlKG5vZGUpKTtcblxuICBjb25zdCBzcGVjaWZpZXJzID0gcmVzdFdpdGhvdXRDb21tZW50c1xuICAgIC5tYXAoKG5vZGUpID0+IHtcbiAgICAgIGNvbnN0IHRva2VucyA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5zKG5vZGUpO1xuICAgICAgY29uc3Qgb3BlbkJyYWNlID0gdG9rZW5zLmZpbmQoKHRva2VuKSA9PiBpc1B1bmN0dWF0b3IodG9rZW4sICd7JykpO1xuICAgICAgY29uc3QgY2xvc2VCcmFjZSA9IHRva2Vucy5maW5kKCh0b2tlbikgPT4gaXNQdW5jdHVhdG9yKHRva2VuLCAnfScpKTtcblxuICAgICAgaWYgKG9wZW5CcmFjZSA9PSBudWxsIHx8IGNsb3NlQnJhY2UgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpbXBvcnROb2RlOiBub2RlLFxuICAgICAgICBpZGVudGlmaWVyczogc291cmNlQ29kZS50ZXh0LnNsaWNlKG9wZW5CcmFjZS5yYW5nZVsxXSwgY2xvc2VCcmFjZS5yYW5nZVswXSkuc3BsaXQoJywnKSwgLy8gU3BsaXQgdGhlIHRleHQgaW50byBzZXBhcmF0ZSBpZGVudGlmaWVycyAocmV0YWluaW5nIGFueSB3aGl0ZXNwYWNlIGJlZm9yZSBvciBhZnRlcilcbiAgICAgICAgaXNFbXB0eTogIWhhc1NwZWNpZmllcnMobm9kZSksXG4gICAgICB9O1xuICAgIH0pXG4gICAgLmZpbHRlcihCb29sZWFuKTtcblxuICBjb25zdCB1bm5lY2Vzc2FyeUltcG9ydHMgPSByZXN0V2l0aG91dENvbW1lbnRzLmZpbHRlcigobm9kZSkgPT4gIWhhc1NwZWNpZmllcnMobm9kZSlcbiAgICAmJiAhaGFzTmFtZXNwYWNlKG5vZGUpXG4gICAgJiYgIXNwZWNpZmllcnMuc29tZSgoc3BlY2lmaWVyKSA9PiBzcGVjaWZpZXIuaW1wb3J0Tm9kZSA9PT0gbm9kZSksXG4gICk7XG5cbiAgY29uc3Qgc2hvdWxkQWRkRGVmYXVsdCA9IGdldERlZmF1bHRJbXBvcnROYW1lKGZpcnN0KSA9PSBudWxsICYmIGRlZmF1bHRJbXBvcnROYW1lcy5zaXplID09PSAxO1xuICBjb25zdCBzaG91bGRBZGRTcGVjaWZpZXJzID0gc3BlY2lmaWVycy5sZW5ndGggPiAwO1xuICBjb25zdCBzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSA9IHVubmVjZXNzYXJ5SW1wb3J0cy5sZW5ndGggPiAwO1xuXG4gIGlmICghKHNob3VsZEFkZERlZmF1bHQgfHwgc2hvdWxkQWRkU3BlY2lmaWVycyB8fCBzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIChmaXhlcikgPT4ge1xuICAgIGNvbnN0IHRva2VucyA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5zKGZpcnN0KTtcbiAgICBjb25zdCBvcGVuQnJhY2UgPSB0b2tlbnMuZmluZCgodG9rZW4pID0+IGlzUHVuY3R1YXRvcih0b2tlbiwgJ3snKSk7XG4gICAgY29uc3QgY2xvc2VCcmFjZSA9IHRva2Vucy5maW5kKCh0b2tlbikgPT4gaXNQdW5jdHVhdG9yKHRva2VuLCAnfScpKTtcbiAgICBjb25zdCBmaXJzdFRva2VuID0gc291cmNlQ29kZS5nZXRGaXJzdFRva2VuKGZpcnN0KTtcbiAgICBjb25zdCBbZGVmYXVsdEltcG9ydE5hbWVdID0gZGVmYXVsdEltcG9ydE5hbWVzO1xuXG4gICAgY29uc3QgZmlyc3RIYXNUcmFpbGluZ0NvbW1hID0gY2xvc2VCcmFjZSAhPSBudWxsICYmIGlzUHVuY3R1YXRvcihzb3VyY2VDb2RlLmdldFRva2VuQmVmb3JlKGNsb3NlQnJhY2UpLCAnLCcpO1xuICAgIGNvbnN0IGZpcnN0SXNFbXB0eSA9ICFoYXNTcGVjaWZpZXJzKGZpcnN0KTtcbiAgICBjb25zdCBmaXJzdEV4aXN0aW5nSWRlbnRpZmllcnMgPSBmaXJzdElzRW1wdHlcbiAgICAgID8gbmV3IFNldCgpXG4gICAgICA6IG5ldyBTZXQoc291cmNlQ29kZS50ZXh0LnNsaWNlKG9wZW5CcmFjZS5yYW5nZVsxXSwgY2xvc2VCcmFjZS5yYW5nZVswXSlcbiAgICAgICAgLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcCgoeCkgPT4geC50cmltKCkpLFxuICAgICAgKTtcblxuICAgIGNvbnN0IFtzcGVjaWZpZXJzVGV4dF0gPSBzcGVjaWZpZXJzLnJlZHVjZShcbiAgICAgIChbcmVzdWx0LCBuZWVkc0NvbW1hLCBleGlzdGluZ0lkZW50aWZpZXJzXSwgc3BlY2lmaWVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGlzVHlwZVNwZWNpZmllciA9IHNwZWNpZmllci5pbXBvcnROb2RlLmltcG9ydEtpbmQgPT09ICd0eXBlJztcblxuICAgICAgICBjb25zdCBwcmVmZXJJbmxpbmUgPSBjb250ZXh0Lm9wdGlvbnNbMF0gJiYgY29udGV4dC5vcHRpb25zWzBdWydwcmVmZXItaW5saW5lJ107XG4gICAgICAgIC8vIGEgdXNlciBtaWdodCBzZXQgcHJlZmVyLWlubGluZSBidXQgbm90IGhhdmUgYSBzdXBwb3J0aW5nIFR5cGVTY3JpcHQgdmVyc2lvbi4gIEZsb3cgZG9lcyBub3Qgc3VwcG9ydCBpbmxpbmUgdHlwZXMgc28gdGhpcyBzaG91bGQgZmFpbCBpbiB0aGF0IGNhc2UgYXMgd2VsbC5cbiAgICAgICAgaWYgKHByZWZlcklubGluZSAmJiAoIXR5cGVzY3JpcHRQa2cgfHwgIXNlbXZlci5zYXRpc2ZpZXModHlwZXNjcmlwdFBrZy52ZXJzaW9uLCAnPj0gNC41JykpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3VyIHZlcnNpb24gb2YgVHlwZVNjcmlwdCBkb2VzIG5vdCBzdXBwb3J0IGlubGluZSB0eXBlIGltcG9ydHMuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgKm9ubHkqIHRoZSBuZXcgaWRlbnRpZmllcnMgdGhhdCBkb24ndCBhbHJlYWR5IGV4aXN0LCBhbmQgdHJhY2sgYW55IG5ldyBpZGVudGlmaWVycyBzbyB3ZSBkb24ndCBhZGQgdGhlbSBhZ2FpbiBpbiB0aGUgbmV4dCBsb29wXG4gICAgICAgIGNvbnN0IFtzcGVjaWZpZXJUZXh0LCB1cGRhdGVkRXhpc3RpbmdJZGVudGlmaWVyc10gPSBzcGVjaWZpZXIuaWRlbnRpZmllcnMucmVkdWNlKChbdGV4dCwgc2V0XSwgY3VyKSA9PiB7XG4gICAgICAgICAgY29uc3QgdHJpbW1lZCA9IGN1ci50cmltKCk7IC8vIFRyaW0gd2hpdGVzcGFjZSBiZWZvcmUvYWZ0ZXIgdG8gY29tcGFyZSB0byBvdXIgc2V0IG9mIGV4aXN0aW5nIGlkZW50aWZpZXJzXG4gICAgICAgICAgY29uc3QgY3VyV2l0aFR5cGUgPSB0cmltbWVkLmxlbmd0aCA+IDAgJiYgcHJlZmVySW5saW5lICYmIGlzVHlwZVNwZWNpZmllciA/IGB0eXBlICR7Y3VyfWAgOiBjdXI7XG4gICAgICAgICAgaWYgKGV4aXN0aW5nSWRlbnRpZmllcnMuaGFzKHRyaW1tZWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RleHQsIHNldF07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBbdGV4dC5sZW5ndGggPiAwID8gYCR7dGV4dH0sJHtjdXJXaXRoVHlwZX1gIDogY3VyV2l0aFR5cGUsIHNldC5hZGQodHJpbW1lZCldO1xuICAgICAgICB9LCBbJycsIGV4aXN0aW5nSWRlbnRpZmllcnNdKTtcblxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIG5lZWRzQ29tbWEgJiYgIXNwZWNpZmllci5pc0VtcHR5ICYmIHNwZWNpZmllclRleHQubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgJHtyZXN1bHR9LCR7c3BlY2lmaWVyVGV4dH1gXG4gICAgICAgICAgICA6IGAke3Jlc3VsdH0ke3NwZWNpZmllclRleHR9YCxcbiAgICAgICAgICBzcGVjaWZpZXIuaXNFbXB0eSA/IG5lZWRzQ29tbWEgOiB0cnVlLFxuICAgICAgICAgIHVwZGF0ZWRFeGlzdGluZ0lkZW50aWZpZXJzLFxuICAgICAgICBdO1xuICAgICAgfSxcbiAgICAgIFsnJywgIWZpcnN0SGFzVHJhaWxpbmdDb21tYSAmJiAhZmlyc3RJc0VtcHR5LCBmaXJzdEV4aXN0aW5nSWRlbnRpZmllcnNdLFxuICAgICk7XG5cbiAgICBjb25zdCBmaXhlcyA9IFtdO1xuXG4gICAgaWYgKHNob3VsZEFkZERlZmF1bHQgJiYgb3BlbkJyYWNlID09IG51bGwgJiYgc2hvdWxkQWRkU3BlY2lmaWVycykge1xuICAgICAgLy8gYGltcG9ydCAnLi9mb28nYCDihpIgYGltcG9ydCBkZWYsIHsuLi59IGZyb20gJy4vZm9vJ2BcbiAgICAgIGZpeGVzLnB1c2goXG4gICAgICAgIGZpeGVyLmluc2VydFRleHRBZnRlcihmaXJzdFRva2VuLCBgICR7ZGVmYXVsdEltcG9ydE5hbWV9LCB7JHtzcGVjaWZpZXJzVGV4dH19IGZyb21gKSxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChzaG91bGRBZGREZWZhdWx0ICYmIG9wZW5CcmFjZSA9PSBudWxsICYmICFzaG91bGRBZGRTcGVjaWZpZXJzKSB7XG4gICAgICAvLyBgaW1wb3J0ICcuL2ZvbydgIOKGkiBgaW1wb3J0IGRlZiBmcm9tICcuL2ZvbydgXG4gICAgICBmaXhlcy5wdXNoKGZpeGVyLmluc2VydFRleHRBZnRlcihmaXJzdFRva2VuLCBgICR7ZGVmYXVsdEltcG9ydE5hbWV9IGZyb21gKSk7XG4gICAgfSBlbHNlIGlmIChzaG91bGRBZGREZWZhdWx0ICYmIG9wZW5CcmFjZSAhPSBudWxsICYmIGNsb3NlQnJhY2UgIT0gbnVsbCkge1xuICAgICAgLy8gYGltcG9ydCB7Li4ufSBmcm9tICcuL2ZvbydgIOKGkiBgaW1wb3J0IGRlZiwgey4uLn0gZnJvbSAnLi9mb28nYFxuICAgICAgZml4ZXMucHVzaChmaXhlci5pbnNlcnRUZXh0QWZ0ZXIoZmlyc3RUb2tlbiwgYCAke2RlZmF1bHRJbXBvcnROYW1lfSxgKSk7XG4gICAgICBpZiAoc2hvdWxkQWRkU3BlY2lmaWVycykge1xuICAgICAgICAvLyBgaW1wb3J0IGRlZiwgey4uLn0gZnJvbSAnLi9mb28nYCDihpIgYGltcG9ydCBkZWYsIHsuLi4sIC4uLn0gZnJvbSAnLi9mb28nYFxuICAgICAgICBmaXhlcy5wdXNoKGZpeGVyLmluc2VydFRleHRCZWZvcmUoY2xvc2VCcmFjZSwgc3BlY2lmaWVyc1RleHQpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFzaG91bGRBZGREZWZhdWx0ICYmIG9wZW5CcmFjZSA9PSBudWxsICYmIHNob3VsZEFkZFNwZWNpZmllcnMpIHtcbiAgICAgIGlmIChmaXJzdC5zcGVjaWZpZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBgaW1wb3J0ICcuL2ZvbydgIOKGkiBgaW1wb3J0IHsuLi59IGZyb20gJy4vZm9vJ2BcbiAgICAgICAgZml4ZXMucHVzaChmaXhlci5pbnNlcnRUZXh0QWZ0ZXIoZmlyc3RUb2tlbiwgYCB7JHtzcGVjaWZpZXJzVGV4dH19IGZyb21gKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBgaW1wb3J0IGRlZiBmcm9tICcuL2ZvbydgIOKGkiBgaW1wb3J0IGRlZiwgey4uLn0gZnJvbSAnLi9mb28nYFxuICAgICAgICBmaXhlcy5wdXNoKGZpeGVyLmluc2VydFRleHRBZnRlcihmaXJzdC5zcGVjaWZpZXJzWzBdLCBgLCB7JHtzcGVjaWZpZXJzVGV4dH19YCkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXNob3VsZEFkZERlZmF1bHQgJiYgb3BlbkJyYWNlICE9IG51bGwgJiYgY2xvc2VCcmFjZSAhPSBudWxsKSB7XG4gICAgICAvLyBgaW1wb3J0IHsuLi59ICcuL2ZvbydgIOKGkiBgaW1wb3J0IHsuLi4sIC4uLn0gZnJvbSAnLi9mb28nYFxuICAgICAgZml4ZXMucHVzaChmaXhlci5pbnNlcnRUZXh0QmVmb3JlKGNsb3NlQnJhY2UsIHNwZWNpZmllcnNUZXh0KSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGltcG9ydHMgd2hvc2Ugc3BlY2lmaWVycyBoYXZlIGJlZW4gbW92ZWQgaW50byB0aGUgZmlyc3QgaW1wb3J0LlxuICAgIGZvciAoY29uc3Qgc3BlY2lmaWVyIG9mIHNwZWNpZmllcnMpIHtcbiAgICAgIGNvbnN0IGltcG9ydE5vZGUgPSBzcGVjaWZpZXIuaW1wb3J0Tm9kZTtcbiAgICAgIGZpeGVzLnB1c2goZml4ZXIucmVtb3ZlKGltcG9ydE5vZGUpKTtcblxuICAgICAgY29uc3QgY2hhckFmdGVySW1wb3J0UmFuZ2UgPSBbaW1wb3J0Tm9kZS5yYW5nZVsxXSwgaW1wb3J0Tm9kZS5yYW5nZVsxXSArIDFdO1xuICAgICAgY29uc3QgY2hhckFmdGVySW1wb3J0ID0gc291cmNlQ29kZS50ZXh0LnN1YnN0cmluZyhjaGFyQWZ0ZXJJbXBvcnRSYW5nZVswXSwgY2hhckFmdGVySW1wb3J0UmFuZ2VbMV0pO1xuICAgICAgaWYgKGNoYXJBZnRlckltcG9ydCA9PT0gJ1xcbicpIHtcbiAgICAgICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmVSYW5nZShjaGFyQWZ0ZXJJbXBvcnRSYW5nZSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBpbXBvcnRzIHdob3NlIGRlZmF1bHQgaW1wb3J0IGhhcyBiZWVuIG1vdmVkIHRvIHRoZSBmaXJzdCBpbXBvcnQsXG4gICAgLy8gYW5kIHNpZGUtZWZmZWN0LW9ubHkgaW1wb3J0cyB0aGF0IGFyZSB1bm5lY2Vzc2FyeSBkdWUgdG8gdGhlIGZpcnN0XG4gICAgLy8gaW1wb3J0LlxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiB1bm5lY2Vzc2FyeUltcG9ydHMpIHtcbiAgICAgIGZpeGVzLnB1c2goZml4ZXIucmVtb3ZlKG5vZGUpKTtcblxuICAgICAgY29uc3QgY2hhckFmdGVySW1wb3J0UmFuZ2UgPSBbbm9kZS5yYW5nZVsxXSwgbm9kZS5yYW5nZVsxXSArIDFdO1xuICAgICAgY29uc3QgY2hhckFmdGVySW1wb3J0ID0gc291cmNlQ29kZS50ZXh0LnN1YnN0cmluZyhjaGFyQWZ0ZXJJbXBvcnRSYW5nZVswXSwgY2hhckFmdGVySW1wb3J0UmFuZ2VbMV0pO1xuICAgICAgaWYgKGNoYXJBZnRlckltcG9ydCA9PT0gJ1xcbicpIHtcbiAgICAgICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmVSYW5nZShjaGFyQWZ0ZXJJbXBvcnRSYW5nZSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmaXhlcztcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNQdW5jdHVhdG9yKG5vZGUsIHZhbHVlKSB7XG4gIHJldHVybiBub2RlLnR5cGUgPT09ICdQdW5jdHVhdG9yJyAmJiBub2RlLnZhbHVlID09PSB2YWx1ZTtcbn1cblxuLy8gR2V0IHRoZSBuYW1lIG9mIHRoZSBkZWZhdWx0IGltcG9ydCBvZiBgbm9kZWAsIGlmIGFueS5cbmZ1bmN0aW9uIGdldERlZmF1bHRJbXBvcnROYW1lKG5vZGUpIHtcbiAgY29uc3QgZGVmYXVsdFNwZWNpZmllciA9IG5vZGUuc3BlY2lmaWVyc1xuICAgIC5maW5kKChzcGVjaWZpZXIpID0+IHNwZWNpZmllci50eXBlID09PSAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcicpO1xuICByZXR1cm4gZGVmYXVsdFNwZWNpZmllciAhPSBudWxsID8gZGVmYXVsdFNwZWNpZmllci5sb2NhbC5uYW1lIDogdW5kZWZpbmVkO1xufVxuXG4vLyBDaGVja3Mgd2hldGhlciBgbm9kZWAgaGFzIGEgbmFtZXNwYWNlIGltcG9ydC5cbmZ1bmN0aW9uIGhhc05hbWVzcGFjZShub2RlKSB7XG4gIGNvbnN0IHNwZWNpZmllcnMgPSBub2RlLnNwZWNpZmllcnNcbiAgICAuZmlsdGVyKChzcGVjaWZpZXIpID0+IHNwZWNpZmllci50eXBlID09PSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJyk7XG4gIHJldHVybiBzcGVjaWZpZXJzLmxlbmd0aCA+IDA7XG59XG5cbi8vIENoZWNrcyB3aGV0aGVyIGBub2RlYCBoYXMgYW55IG5vbi1kZWZhdWx0IHNwZWNpZmllcnMuXG5mdW5jdGlvbiBoYXNTcGVjaWZpZXJzKG5vZGUpIHtcbiAgY29uc3Qgc3BlY2lmaWVycyA9IG5vZGUuc3BlY2lmaWVyc1xuICAgIC5maWx0ZXIoKHNwZWNpZmllcikgPT4gc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnRTcGVjaWZpZXInKTtcbiAgcmV0dXJuIHNwZWNpZmllcnMubGVuZ3RoID4gMDtcbn1cblxuLy8gSXQncyBub3Qgb2J2aW91cyB3aGF0IHRoZSB1c2VyIHdhbnRzIHRvIGRvIHdpdGggY29tbWVudHMgYXNzb2NpYXRlZCB3aXRoXG4vLyBkdXBsaWNhdGUgaW1wb3J0cywgc28gc2tpcCBpbXBvcnRzIHdpdGggY29tbWVudHMgd2hlbiBhdXRvZml4aW5nLlxuZnVuY3Rpb24gaGFzUHJvYmxlbWF0aWNDb21tZW50cyhub2RlLCBzb3VyY2VDb2RlKSB7XG4gIHJldHVybiAoXG4gICAgaGFzQ29tbWVudEJlZm9yZShub2RlLCBzb3VyY2VDb2RlKVxuICAgIHx8IGhhc0NvbW1lbnRBZnRlcihub2RlLCBzb3VyY2VDb2RlKVxuICAgIHx8IGhhc0NvbW1lbnRJbnNpZGVOb25TcGVjaWZpZXJzKG5vZGUsIHNvdXJjZUNvZGUpXG4gICk7XG59XG5cbi8vIENoZWNrcyB3aGV0aGVyIGBub2RlYCBoYXMgYSBjb21tZW50ICh0aGF0IGVuZHMpIG9uIHRoZSBwcmV2aW91cyBsaW5lIG9yIG9uXG4vLyB0aGUgc2FtZSBsaW5lIGFzIGBub2RlYCAoc3RhcnRzKS5cbmZ1bmN0aW9uIGhhc0NvbW1lbnRCZWZvcmUobm9kZSwgc291cmNlQ29kZSkge1xuICByZXR1cm4gc291cmNlQ29kZS5nZXRDb21tZW50c0JlZm9yZShub2RlKVxuICAgIC5zb21lKChjb21tZW50KSA9PiBjb21tZW50LmxvYy5lbmQubGluZSA+PSBub2RlLmxvYy5zdGFydC5saW5lIC0gMSk7XG59XG5cbi8vIENoZWNrcyB3aGV0aGVyIGBub2RlYCBoYXMgYSBjb21tZW50ICh0aGF0IHN0YXJ0cykgb24gdGhlIHNhbWUgbGluZSBhcyBgbm9kZWBcbi8vIChlbmRzKS5cbmZ1bmN0aW9uIGhhc0NvbW1lbnRBZnRlcihub2RlLCBzb3VyY2VDb2RlKSB7XG4gIHJldHVybiBzb3VyY2VDb2RlLmdldENvbW1lbnRzQWZ0ZXIobm9kZSlcbiAgICAuc29tZSgoY29tbWVudCkgPT4gY29tbWVudC5sb2Muc3RhcnQubGluZSA9PT0gbm9kZS5sb2MuZW5kLmxpbmUpO1xufVxuXG4vLyBDaGVja3Mgd2hldGhlciBgbm9kZWAgaGFzIGFueSBjb21tZW50cyBfaW5zaWRlLF8gZXhjZXB0IGluc2lkZSB0aGUgYHsuLi59YFxuLy8gcGFydCAoaWYgYW55KS5cbmZ1bmN0aW9uIGhhc0NvbW1lbnRJbnNpZGVOb25TcGVjaWZpZXJzKG5vZGUsIHNvdXJjZUNvZGUpIHtcbiAgY29uc3QgdG9rZW5zID0gc291cmNlQ29kZS5nZXRUb2tlbnMobm9kZSk7XG4gIGNvbnN0IG9wZW5CcmFjZUluZGV4ID0gdG9rZW5zLmZpbmRJbmRleCgodG9rZW4pID0+IGlzUHVuY3R1YXRvcih0b2tlbiwgJ3snKSk7XG4gIGNvbnN0IGNsb3NlQnJhY2VJbmRleCA9IHRva2Vucy5maW5kSW5kZXgoKHRva2VuKSA9PiBpc1B1bmN0dWF0b3IodG9rZW4sICd9JykpO1xuICAvLyBTbGljZSBhd2F5IHRoZSBmaXJzdCB0b2tlbiwgc2luY2Ugd2UncmUgbm8gbG9va2luZyBmb3IgY29tbWVudHMgX2JlZm9yZV9cbiAgLy8gYG5vZGVgIChvbmx5IGluc2lkZSkuIElmIHRoZXJlJ3MgYSBgey4uLn1gIHBhcnQsIGxvb2sgZm9yIGNvbW1lbnRzIGJlZm9yZVxuICAvLyB0aGUgYHtgLCBidXQgbm90IGJlZm9yZSB0aGUgYH1gIChoZW5jZSB0aGUgYCsxYHMpLlxuICBjb25zdCBzb21lVG9rZW5zID0gb3BlbkJyYWNlSW5kZXggPj0gMCAmJiBjbG9zZUJyYWNlSW5kZXggPj0gMFxuICAgID8gdG9rZW5zLnNsaWNlKDEsIG9wZW5CcmFjZUluZGV4ICsgMSkuY29uY2F0KHRva2Vucy5zbGljZShjbG9zZUJyYWNlSW5kZXggKyAxKSlcbiAgICA6IHRva2Vucy5zbGljZSgxKTtcbiAgcmV0dXJuIHNvbWVUb2tlbnMuc29tZSgodG9rZW4pID0+IHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNCZWZvcmUodG9rZW4pLmxlbmd0aCA+IDApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdwcm9ibGVtJyxcbiAgICBkb2NzOiB7XG4gICAgICBjYXRlZ29yeTogJ1N0eWxlIGd1aWRlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRm9yYmlkIHJlcGVhdGVkIGltcG9ydCBvZiB0aGUgc2FtZSBtb2R1bGUgaW4gbXVsdGlwbGUgcGxhY2VzLicsXG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLWR1cGxpY2F0ZXMnKSxcbiAgICB9LFxuICAgIGZpeGFibGU6ICdjb2RlJyxcbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb25zaWRlclF1ZXJ5U3RyaW5nOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAncHJlZmVyLWlubGluZSc6IHtcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5cbiAgY3JlYXRlKGNvbnRleHQpIHtcbiAgICAvLyBQcmVwYXJlIHRoZSByZXNvbHZlciBmcm9tIG9wdGlvbnMuXG4gICAgY29uc3QgY29uc2lkZXJRdWVyeVN0cmluZ09wdGlvbiA9IGNvbnRleHQub3B0aW9uc1swXVxuICAgICAgJiYgY29udGV4dC5vcHRpb25zWzBdLmNvbnNpZGVyUXVlcnlTdHJpbmc7XG4gICAgY29uc3QgZGVmYXVsdFJlc29sdmVyID0gKHNvdXJjZVBhdGgpID0+IHJlc29sdmUoc291cmNlUGF0aCwgY29udGV4dCkgfHwgc291cmNlUGF0aDtcbiAgICBjb25zdCByZXNvbHZlciA9IGNvbnNpZGVyUXVlcnlTdHJpbmdPcHRpb24gPyAoc291cmNlUGF0aCkgPT4ge1xuICAgICAgY29uc3QgcGFydHMgPSBzb3VyY2VQYXRoLm1hdGNoKC9eKFteP10qKVxcPyguKikkLyk7XG4gICAgICBpZiAoIXBhcnRzKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0UmVzb2x2ZXIoc291cmNlUGF0aCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYCR7ZGVmYXVsdFJlc29sdmVyKHBhcnRzWzFdKX0/JHtwYXJ0c1syXX1gO1xuICAgIH0gOiBkZWZhdWx0UmVzb2x2ZXI7XG5cbiAgICBjb25zdCBtb2R1bGVNYXBzID0gbmV3IE1hcCgpO1xuXG4gICAgZnVuY3Rpb24gZ2V0SW1wb3J0TWFwKG4pIHtcbiAgICAgIGlmICghbW9kdWxlTWFwcy5oYXMobi5wYXJlbnQpKSB7XG4gICAgICAgIG1vZHVsZU1hcHMuc2V0KG4ucGFyZW50LCB7XG4gICAgICAgICAgaW1wb3J0ZWQ6IG5ldyBNYXAoKSxcbiAgICAgICAgICBuc0ltcG9ydGVkOiBuZXcgTWFwKCksXG4gICAgICAgICAgZGVmYXVsdFR5cGVzSW1wb3J0ZWQ6IG5ldyBNYXAoKSxcbiAgICAgICAgICBuYW1lZFR5cGVzSW1wb3J0ZWQ6IG5ldyBNYXAoKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBtYXAgPSBtb2R1bGVNYXBzLmdldChuLnBhcmVudCk7XG4gICAgICBjb25zdCBwcmVmZXJJbmxpbmUgPSBjb250ZXh0Lm9wdGlvbnNbMF0gJiYgY29udGV4dC5vcHRpb25zWzBdWydwcmVmZXItaW5saW5lJ107XG4gICAgICBpZiAoIXByZWZlcklubGluZSAmJiBuLmltcG9ydEtpbmQgPT09ICd0eXBlJykge1xuICAgICAgICByZXR1cm4gbi5zcGVjaWZpZXJzLmxlbmd0aCA+IDAgJiYgbi5zcGVjaWZpZXJzWzBdLnR5cGUgPT09ICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJyA/IG1hcC5kZWZhdWx0VHlwZXNJbXBvcnRlZCA6IG1hcC5uYW1lZFR5cGVzSW1wb3J0ZWQ7XG4gICAgICB9XG4gICAgICBpZiAoIXByZWZlcklubGluZSAmJiBuLnNwZWNpZmllcnMuc29tZSgoc3BlYykgPT4gc3BlYy5pbXBvcnRLaW5kID09PSAndHlwZScpKSB7XG4gICAgICAgIHJldHVybiBtYXAubmFtZWRUeXBlc0ltcG9ydGVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaGFzTmFtZXNwYWNlKG4pID8gbWFwLm5zSW1wb3J0ZWQgOiBtYXAuaW1wb3J0ZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIEltcG9ydERlY2xhcmF0aW9uKG4pIHtcbiAgICAgICAgLy8gcmVzb2x2ZWQgcGF0aCB3aWxsIGNvdmVyIGFsaWFzZWQgZHVwbGljYXRlc1xuICAgICAgICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlcihuLnNvdXJjZS52YWx1ZSk7XG4gICAgICAgIGNvbnN0IGltcG9ydE1hcCA9IGdldEltcG9ydE1hcChuKTtcblxuICAgICAgICBpZiAoaW1wb3J0TWFwLmhhcyhyZXNvbHZlZFBhdGgpKSB7XG4gICAgICAgICAgaW1wb3J0TWFwLmdldChyZXNvbHZlZFBhdGgpLnB1c2gobik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1wb3J0TWFwLnNldChyZXNvbHZlZFBhdGgsIFtuXSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICdQcm9ncmFtOmV4aXQnKCkge1xuICAgICAgICBmb3IgKGNvbnN0IG1hcCBvZiBtb2R1bGVNYXBzLnZhbHVlcygpKSB7XG4gICAgICAgICAgY2hlY2tJbXBvcnRzKG1hcC5pbXBvcnRlZCwgY29udGV4dCk7XG4gICAgICAgICAgY2hlY2tJbXBvcnRzKG1hcC5uc0ltcG9ydGVkLCBjb250ZXh0KTtcbiAgICAgICAgICBjaGVja0ltcG9ydHMobWFwLmRlZmF1bHRUeXBlc0ltcG9ydGVkLCBjb250ZXh0KTtcbiAgICAgICAgICBjaGVja0ltcG9ydHMobWFwLm5hbWVkVHlwZXNJbXBvcnRlZCwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG4iXX0=