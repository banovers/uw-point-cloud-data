'use strict';Object.defineProperty(exports, "__esModule", { value: true });var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();exports.




































































































































































































































































































































































































































































































































































































































































































































































recursivePatternCapture = recursivePatternCapture;var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);var _path = require('path');var _doctrine = require('doctrine');var _doctrine2 = _interopRequireDefault(_doctrine);var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);var _eslint = require('eslint');var _parse = require('eslint-module-utils/parse');var _parse2 = _interopRequireDefault(_parse);var _visit = require('eslint-module-utils/visit');var _visit2 = _interopRequireDefault(_visit);var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);var _ignore = require('eslint-module-utils/ignore');var _ignore2 = _interopRequireDefault(_ignore);var _hash = require('eslint-module-utils/hash');var _unambiguous = require('eslint-module-utils/unambiguous');var unambiguous = _interopRequireWildcard(_unambiguous);var _getTsconfig = require('get-tsconfig');function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];}}newObj['default'] = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var includes = Function.bind.bind(Function.prototype.call)(Array.prototype.includes);var log = (0, _debug2['default'])('eslint-plugin-import:ExportMap');var exportCache = new Map();var tsconfigCache = new Map();var ExportMap = function () {function ExportMap(path) {_classCallCheck(this, ExportMap);this.path = path;this.namespace = new Map(); // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map(); /**
                                 * star-exports
                                 * @type {Set} of () => ExportMap
                                 */this.dependencies = new Set(); /**
                                                                   * dependencies of this module that are not explicitly re-exported
                                                                   * @type {Map} from path = () => ExportMap
                                                                   */this.imports = new Map();this.errors = []; /**
                                                                                                                 * type {'ambiguous' | 'Module' | 'Script'}
                                                                                                                 */this.parseGoal = 'ambiguous';}_createClass(ExportMap, [{ key: 'has', /**
                                                                                                                                                                                         * Note that this does not check explicitly re-exported names for existence
                                                                                                                                                                                         * in the base namespace, but it will expand all `export * from '...'` exports
                                                                                                                                                                                         * if not found in the explicit namespace.
                                                                                                                                                                                         * @param  {string}  name
                                                                                                                                                                                         * @return {Boolean} true if `name` is exported by this module.
                                                                                                                                                                                         */value: function () {function has(name) {if (this.namespace.has(name)) {return true;}if (this.reexports.has(name)) {return true;} // default exports must be explicitly re-exported (#328)
        if (name !== 'default') {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {for (var _iterator = this.dependencies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var dep = _step.value;var innerMap = dep(); // todo: report as unresolved?
              if (!innerMap) {continue;}if (innerMap.has(name)) {return true;}}} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator['return']) {_iterator['return']();}} finally {if (_didIteratorError) {throw _iteratorError;}}}}return false;}return has;}() /**
                                                                                                                                                                                                                                                                                                                                     * ensure that imported name fully resolves.
                                                                                                                                                                                                                                                                                                                                     * @param  {string} name
                                                                                                                                                                                                                                                                                                                                     * @return {{ found: boolean, path: ExportMap[] }}
                                                                                                                                                                                                                                                                                                                                     */ }, { key: 'hasDeep', value: function () {function hasDeep(name) {if (this.namespace.has(name)) {return { found: true, path: [this] };}if (this.reexports.has(name)) {var reexports = this.reexports.get(name);var imported = reexports.getImport(); // if import is ignored, return explicit 'null'
          if (imported == null) {return { found: true, path: [this] };} // safeguard against cycles, only if name matches
          if (imported.path === this.path && reexports.local === name) {return { found: false, path: [this] };}var deep = imported.hasDeep(reexports.local);deep.path.unshift(this);return deep;} // default exports must be explicitly re-exported (#328)
        if (name !== 'default') {var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {for (var _iterator2 = this.dependencies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var dep = _step2.value;var innerMap = dep();if (innerMap == null) {return { found: true, path: [this] };} // todo: report as unresolved?
              if (!innerMap) {continue;} // safeguard against cycles
              if (innerMap.path === this.path) {continue;}var innerValue = innerMap.hasDeep(name);if (innerValue.found) {innerValue.path.unshift(this);return innerValue;}}} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2['return']) {_iterator2['return']();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}}return { found: false, path: [this] };}return hasDeep;}() }, { key: 'get', value: function () {function get(name) {if (this.namespace.has(name)) {return this.namespace.get(name);}if (this.reexports.has(name)) {var reexports = this.reexports.get(name);var imported = reexports.getImport(); // if import is ignored, return explicit 'null'
          if (imported == null) {return null;} // safeguard against cycles, only if name matches
          if (imported.path === this.path && reexports.local === name) {return undefined;}return imported.get(reexports.local);} // default exports must be explicitly re-exported (#328)
        if (name !== 'default') {var _iteratorNormalCompletion3 = true;var _didIteratorError3 = false;var _iteratorError3 = undefined;try {for (var _iterator3 = this.dependencies[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {var dep = _step3.value;var innerMap = dep(); // todo: report as unresolved?
              if (!innerMap) {continue;} // safeguard against cycles
              if (innerMap.path === this.path) {continue;}var innerValue = innerMap.get(name);if (innerValue !== undefined) {return innerValue;}}} catch (err) {_didIteratorError3 = true;_iteratorError3 = err;} finally {try {if (!_iteratorNormalCompletion3 && _iterator3['return']) {_iterator3['return']();}} finally {if (_didIteratorError3) {throw _iteratorError3;}}}}return undefined;}return get;}() }, { key: 'forEach', value: function () {function forEach(callback, thisArg) {var _this = this;this.namespace.forEach(function (v, n) {callback.call(thisArg, v, n, _this);});this.reexports.forEach(function (reexports, name) {var reexported = reexports.getImport(); // can't look up meta for ignored re-exports (#348)
          callback.call(thisArg, reexported && reexported.get(reexports.local), name, _this);});this.dependencies.forEach(function (dep) {var d = dep(); // CJS / ignored dependencies won't exist (#717)
          if (d == null) {return;}d.forEach(function (v, n) {if (n !== 'default') {callback.call(thisArg, v, n, _this);}});});}return forEach;}() // todo: keys, values, entries?
  }, { key: 'reportErrors', value: function () {function reportErrors(context, declaration) {var msg = this.errors.map(function (e) {return String(e.message) + ' (' + String(e.lineNumber) + ':' + String(e.column) + ')';}).join(', ');context.report({ node: declaration.source, message: 'Parse errors in imported module \'' + String(declaration.source.value) + '\': ' + String(msg) });}return reportErrors;}() }, { key: 'hasDefault', get: function () {function get() {return this.get('default') != null;}return get;}() // stronger than this.has
  }, { key: 'size', get: function () {function get() {var size = this.namespace.size + this.reexports.size;this.dependencies.forEach(function (dep) {var d = dep(); // CJS / ignored dependencies won't exist (#717)
          if (d == null) {return;}size += d.size;});return size;}return get;}() }]);return ExportMap;}(); /**
                                                                                                           * parse docs from the first node that has leading comments
                                                                                                           */exports['default'] = ExportMap;function captureDoc(source, docStyleParsers) {var metadata = {}; // 'some' short-circuits on first 'true'
  for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {nodes[_key - 2] = arguments[_key];}nodes.some(function (n) {try {var leadingComments = void 0; // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {leadingComments = n.leadingComments;} else if (n.range) {leadingComments = source.getCommentsBefore(n);}if (!leadingComments || leadingComments.length === 0) {return false;}for (var name in docStyleParsers) {var doc = docStyleParsers[name](leadingComments);if (doc) {metadata.doc = doc;}}return true;} catch (err) {return false;}});return metadata;}var availableDocStyleParsers = { jsdoc: captureJsDoc, tomdoc: captureTomDoc }; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * parse JSDoc from leading comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @param {object[]} comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @return {{ doc: object }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */function captureJsDoc(comments) {var doc = void 0; // capture XSDoc
  comments.forEach(function (comment) {// skip non-block comments
    if (comment.type !== 'Block') {return;}try {doc = _doctrine2['default'].parse(comment.value, { unwrap: true });} catch (err) {/* don't care, for now? maybe add to `errors?` */}});return doc;} /**
                                                                                                                                                                                                      * parse TomDoc section from comments
                                                                                                                                                                                                      */function captureTomDoc(comments) {// collect lines up to first paragraph break
  var lines = [];for (var i = 0; i < comments.length; i++) {var comment = comments[i];if (comment.value.match(/^\s*$/)) {break;}lines.push(comment.value.trim());} // return doctrine-like object
  var statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);if (statusMatch) {return { description: statusMatch[2], tags: [{ title: statusMatch[1].toLowerCase(), description: statusMatch[2] }] };}}var supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);ExportMap.get = function (source, context) {var path = (0, _resolve2['default'])(source, context);if (path == null) {return null;}return ExportMap['for'](childContext(path, context));};ExportMap['for'] = function (context) {var path = context.path;var cacheKey = context.cacheKey || (0, _hash.hashObject)(context).digest('hex');var exportMap = exportCache.get(cacheKey); // return cached ignore
  if (exportMap === null) {return null;}var stats = _fs2['default'].statSync(path);if (exportMap != null) {// date equality check
    if (exportMap.mtime - stats.mtime === 0) {return exportMap;} // future: check content equality?
  } // check valid extensions first
  if (!(0, _ignore.hasValidExtension)(path, context)) {exportCache.set(cacheKey, null);return null;} // check for and cache ignore
  if ((0, _ignore2['default'])(path, context)) {log('ignored path due to ignore settings:', path);exportCache.set(cacheKey, null);return null;}var content = _fs2['default'].readFileSync(path, { encoding: 'utf8' }); // check for and cache unambiguous modules
  if (!unambiguous.test(content)) {log('ignored path due to unambiguous regex:', path);exportCache.set(cacheKey, null);return null;}log('cache miss', cacheKey, 'for path', path);exportMap = ExportMap.parse(path, content, context); // ambiguous modules return null
  if (exportMap == null) {log('ignored path due to ambiguous parse:', path);exportCache.set(cacheKey, null);return null;}exportMap.mtime = stats.mtime;exportCache.set(cacheKey, exportMap);return exportMap;};ExportMap.parse = function (path, content, context) {var m = new ExportMap(path);var isEsModuleInteropTrue = isEsModuleInterop();var ast = void 0;var visitorKeys = void 0;try {var result = (0, _parse2['default'])(path, content, context);ast = result.ast;visitorKeys = result.visitorKeys;} catch (err) {m.errors.push(err);return m; // can't continue
  }m.visitorKeys = visitorKeys;var hasDynamicImports = false;function processDynamicImport(source) {hasDynamicImports = true;if (source.type !== 'Literal') {return null;}var p = remotePath(source.value);if (p == null) {return null;}var importedSpecifiers = new Set();importedSpecifiers.add('ImportNamespaceSpecifier');var getter = thunkFor(p, context);m.imports.set(p, { getter: getter, declarations: new Set([{ source: { // capturing actual node reference holds full AST in memory!
          value: source.value, loc: source.loc }, importedSpecifiers: importedSpecifiers, dynamic: true }]) });}(0, _visit2['default'])(ast, visitorKeys, { ImportExpression: function () {function ImportExpression(node) {processDynamicImport(node.source);}return ImportExpression;}(), CallExpression: function () {function CallExpression(node) {if (node.callee.type === 'Import') {processDynamicImport(node.arguments[0]);}}return CallExpression;}() });var unambiguouslyESM = unambiguous.isModule(ast);if (!unambiguouslyESM && !hasDynamicImports) {return null;}var docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];var docStyleParsers = {};docstyle.forEach(function (style) {docStyleParsers[style] = availableDocStyleParsers[style];}); // attempt to collect module doc
  if (ast.comments) {ast.comments.some(function (c) {if (c.type !== 'Block') {return false;}try {var doc = _doctrine2['default'].parse(c.value, { unwrap: true });if (doc.tags.some(function (t) {return t.title === 'module';})) {m.doc = doc;return true;}} catch (err) {/* ignore */}return false;});}var namespaces = new Map();function remotePath(value) {return _resolve2['default'].relative(value, path, context.settings);}function resolveImport(value) {var rp = remotePath(value);if (rp == null) {return null;}return ExportMap['for'](childContext(rp, context));}function getNamespace(identifier) {if (!namespaces.has(identifier.name)) {return;}return function () {return resolveImport(namespaces.get(identifier.name));};}function addNamespace(object, identifier) {var nsfn = getNamespace(identifier);if (nsfn) {Object.defineProperty(object, 'namespace', { get: nsfn });}return object;}function processSpecifier(s, n, m) {var nsource = n.source && n.source.value;var exportMeta = {};var local = void 0;switch (s.type) {case 'ExportDefaultSpecifier':if (!nsource) {return;}local = 'default';break;case 'ExportNamespaceSpecifier':m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', { get: function () {function get() {return resolveImport(nsource);}return get;}() }));return;case 'ExportAllDeclaration':m.namespace.set(s.exported.name || s.exported.value, addNamespace(exportMeta, s.source.value));return;case 'ExportSpecifier':if (!n.source) {m.namespace.set(s.exported.name || s.exported.value, addNamespace(exportMeta, s.local));return;} // else falls through
      default:local = s.local.name;break;} // todo: JSDoc
    m.reexports.set(s.exported.name, { local: local, getImport: function () {function getImport() {return resolveImport(nsource);}return getImport;}() });}function captureDependencyWithSpecifiers(n) {// import type { Foo } (TS and Flow); import typeof { Foo } (Flow)
    var declarationIsType = n.importKind === 'type' || n.importKind === 'typeof'; // import './foo' or import {} from './foo' (both 0 specifiers) is a side effect and
    // shouldn't be considered to be just importing types
    var specifiersOnlyImportingTypes = n.specifiers.length > 0;var importedSpecifiers = new Set();n.specifiers.forEach(function (specifier) {if (specifier.type === 'ImportSpecifier') {importedSpecifiers.add(specifier.imported.name || specifier.imported.value);} else if (supportedImportTypes.has(specifier.type)) {importedSpecifiers.add(specifier.type);} // import { type Foo } (Flow); import { typeof Foo } (Flow)
      specifiersOnlyImportingTypes = specifiersOnlyImportingTypes && (specifier.importKind === 'type' || specifier.importKind === 'typeof');});captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, importedSpecifiers);}function captureDependency(_ref, isOnlyImportingTypes) {var source = _ref.source;var importedSpecifiers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();if (source == null) {return null;}var p = remotePath(source.value);if (p == null) {return null;}var declarationMetadata = { // capturing actual node reference holds full AST in memory!
      source: { value: source.value, loc: source.loc }, isOnlyImportingTypes: isOnlyImportingTypes, importedSpecifiers: importedSpecifiers };var existing = m.imports.get(p);if (existing != null) {existing.declarations.add(declarationMetadata);return existing.getter;}var getter = thunkFor(p, context);m.imports.set(p, { getter: getter, declarations: new Set([declarationMetadata]) });return getter;}var source = makeSourceCode(content, ast);function isEsModuleInterop() {var parserOptions = context.parserOptions || {};var tsconfigRootDir = parserOptions.tsconfigRootDir;var project = parserOptions.project;var cacheKey = (0, _hash.hashObject)({ tsconfigRootDir: tsconfigRootDir, project: project }).digest('hex');var tsConfig = tsconfigCache.get(cacheKey);if (typeof tsConfig === 'undefined') {tsconfigRootDir = tsconfigRootDir || process.cwd();var tsconfigResult = void 0;if (project) {var projects = Array.isArray(project) ? project : [project];var _iteratorNormalCompletion4 = true;var _didIteratorError4 = false;var _iteratorError4 = undefined;try {for (var _iterator4 = projects[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {var _project = _step4.value;tsconfigResult = (0, _getTsconfig.getTsconfig)(_project === true ? context.filename : (0, _path.resolve)(tsconfigRootDir, _project));if (tsconfigResult) {break;}}} catch (err) {_didIteratorError4 = true;_iteratorError4 = err;} finally {try {if (!_iteratorNormalCompletion4 && _iterator4['return']) {_iterator4['return']();}} finally {if (_didIteratorError4) {throw _iteratorError4;}}}} else {tsconfigResult = (0, _getTsconfig.getTsconfig)(tsconfigRootDir);}tsConfig = tsconfigResult && tsconfigResult.config || null;tsconfigCache.set(cacheKey, tsConfig);}return tsConfig && tsConfig.compilerOptions ? tsConfig.compilerOptions.esModuleInterop : false;}ast.body.forEach(function (n) {if (n.type === 'ExportDefaultDeclaration') {var exportMeta = captureDoc(source, docStyleParsers, n);if (n.declaration.type === 'Identifier') {addNamespace(exportMeta, n.declaration);}m.namespace.set('default', exportMeta);return;}if (n.type === 'ExportAllDeclaration') {var getter = captureDependency(n, n.exportKind === 'type');if (getter) {m.dependencies.add(getter);}if (n.exported) {processSpecifier(n, n.exported, m);}return;} // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {captureDependencyWithSpecifiers(n);var ns = n.specifiers.find(function (s) {return s.type === 'ImportNamespaceSpecifier';});if (ns) {namespaces.set(ns.local.name, n.source.value);}return;}if (n.type === 'ExportNamedDeclaration') {captureDependencyWithSpecifiers(n); // capture declaration
      if (n.declaration != null) {switch (n.declaration.type) {case 'FunctionDeclaration':case 'ClassDeclaration':case 'TypeAlias': // flowtype with babel-eslint parser
          case 'InterfaceDeclaration':case 'DeclareFunction':case 'TSDeclareFunction':case 'TSEnumDeclaration':case 'TSTypeAliasDeclaration':case 'TSInterfaceDeclaration':case 'TSAbstractClassDeclaration':case 'TSModuleDeclaration':m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n));break;case 'VariableDeclaration':n.declaration.declarations.forEach(function (d) {recursivePatternCapture(d.id, function (id) {return m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n));});});break;default:}}n.specifiers.forEach(function (s) {return processSpecifier(s, n, m);});}var exports = ['TSExportAssignment'];if (isEsModuleInteropTrue) {exports.push('TSNamespaceExportDeclaration');} // This doesn't declare anything, but changes what's being exported.
    if (includes(exports, n.type)) {var exportedName = n.type === 'TSNamespaceExportDeclaration' ? (n.id || n.name).name : n.expression && n.expression.name || n.expression.id && n.expression.id.name || null;var declTypes = ['VariableDeclaration', 'ClassDeclaration', 'TSDeclareFunction', 'TSEnumDeclaration', 'TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSAbstractClassDeclaration', 'TSModuleDeclaration'];var exportedDecls = ast.body.filter(function (_ref2) {var type = _ref2.type,id = _ref2.id,declarations = _ref2.declarations;return includes(declTypes, type) && (id && id.name === exportedName || declarations && declarations.find(function (d) {return d.id.name === exportedName;}));});if (exportedDecls.length === 0) {// Export is not referencing any local declaration, must be re-exporting
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));return;}if (isEsModuleInteropTrue // esModuleInterop is on in tsconfig
      && !m.namespace.has('default') // and default isn't added already
      ) {m.namespace.set('default', {}); // add default export
        }exportedDecls.forEach(function (decl) {if (decl.type === 'TSModuleDeclaration') {if (decl.body && decl.body.type === 'TSModuleDeclaration') {m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));} else if (decl.body && decl.body.body) {decl.body.body.forEach(function (moduleBlockNode) {// Export-assignment exports all members in the namespace,
              // explicitly exported or not.
              var namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration' ? moduleBlockNode.declaration : moduleBlockNode;if (!namespaceDecl) {// TypeScript can check this for us; we needn't
              } else if (namespaceDecl.type === 'VariableDeclaration') {namespaceDecl.declarations.forEach(function (d) {return recursivePatternCapture(d.id, function (id) {return m.namespace.set(id.name, captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode));});});} else {m.namespace.set(namespaceDecl.id.name, captureDoc(source, docStyleParsers, moduleBlockNode));}});}} else {// Export as default
          m.namespace.set('default', captureDoc(source, docStyleParsers, decl));}});}});if (isEsModuleInteropTrue // esModuleInterop is on in tsconfig
  && m.namespace.size > 0 // anything is exported
  && !m.namespace.has('default') // and default isn't added already
  ) {m.namespace.set('default', {}); // add default export
    }if (unambiguouslyESM) {m.parseGoal = 'Module';}return m;}; /**
                                                                 * The creation of this closure is isolated from other scopes
                                                                 * to avoid over-retention of unrelated variables, which has
                                                                 * caused memory leaks. See #1266.
                                                                 */function thunkFor(p, context) {return function () {return ExportMap['for'](childContext(p, context));};} /**
                                                                                                                                                                             * Traverse a pattern/identifier node, calling 'callback'
                                                                                                                                                                             * for each leaf identifier.
                                                                                                                                                                             * @param  {node}   pattern
                                                                                                                                                                             * @param  {Function} callback
                                                                                                                                                                             * @return {void}
                                                                                                                                                                             */function recursivePatternCapture(pattern, callback) {switch (pattern.type) {case 'Identifier': // base case
      callback(pattern);break;case 'ObjectPattern':pattern.properties.forEach(function (p) {if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {callback(p.argument);return;}recursivePatternCapture(p.value, callback);});break;case 'ArrayPattern':pattern.elements.forEach(function (element) {if (element == null) {return;}if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {callback(element.argument);return;}recursivePatternCapture(element, callback);});break;case 'AssignmentPattern':callback(pattern.left);break;default:}}var parserOptionsHash = '';var prevParserOptions = '';var settingsHash = '';var prevSettings = ''; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   * don't hold full context object in memory, just grab what we need.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   * also calculate a cacheKey, where parts of the cacheKey hash are memoized
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   */function childContext(path, context) {var settings = context.settings,parserOptions = context.parserOptions,parserPath = context.parserPath;if (JSON.stringify(settings) !== prevSettings) {settingsHash = (0, _hash.hashObject)({ settings: settings }).digest('hex');prevSettings = JSON.stringify(settings);}if (JSON.stringify(parserOptions) !== prevParserOptions) {parserOptionsHash = (0, _hash.hashObject)({ parserOptions: parserOptions }).digest('hex');prevParserOptions = JSON.stringify(parserOptions);}return { cacheKey: String(parserPath) + parserOptionsHash + settingsHash + String(path), settings: settings, parserOptions: parserOptions, parserPath: parserPath, path: path, filename: typeof context.getPhysicalFilename === 'function' ? context.getPhysicalFilename() : context.physicalFilename != null ? context.physicalFilename : typeof context.getFilename === 'function' ? context.getFilename() : context.filename };} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 * sometimes legacy support isn't _that_ hard... right?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 */function makeSourceCode(text, ast) {if (_eslint.SourceCode.length > 1) {// ESLint 3
    return new _eslint.SourceCode(text, ast);} else {// ESLint 4, 5
    return new _eslint.SourceCode({ text: text, ast: ast });}}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9FeHBvcnRNYXAuanMiXSwibmFtZXMiOlsicmVjdXJzaXZlUGF0dGVybkNhcHR1cmUiLCJ1bmFtYmlndW91cyIsImluY2x1ZGVzIiwiRnVuY3Rpb24iLCJiaW5kIiwicHJvdG90eXBlIiwiY2FsbCIsIkFycmF5IiwibG9nIiwiZXhwb3J0Q2FjaGUiLCJNYXAiLCJ0c2NvbmZpZ0NhY2hlIiwiRXhwb3J0TWFwIiwicGF0aCIsIm5hbWVzcGFjZSIsInJlZXhwb3J0cyIsImRlcGVuZGVuY2llcyIsIlNldCIsImltcG9ydHMiLCJlcnJvcnMiLCJwYXJzZUdvYWwiLCJuYW1lIiwiaGFzIiwiZGVwIiwiaW5uZXJNYXAiLCJmb3VuZCIsImdldCIsImltcG9ydGVkIiwiZ2V0SW1wb3J0IiwibG9jYWwiLCJkZWVwIiwiaGFzRGVlcCIsInVuc2hpZnQiLCJpbm5lclZhbHVlIiwidW5kZWZpbmVkIiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwiZm9yRWFjaCIsInYiLCJuIiwicmVleHBvcnRlZCIsImQiLCJjb250ZXh0IiwiZGVjbGFyYXRpb24iLCJtc2ciLCJtYXAiLCJlIiwibWVzc2FnZSIsImxpbmVOdW1iZXIiLCJjb2x1bW4iLCJqb2luIiwicmVwb3J0Iiwibm9kZSIsInNvdXJjZSIsInZhbHVlIiwic2l6ZSIsImNhcHR1cmVEb2MiLCJkb2NTdHlsZVBhcnNlcnMiLCJtZXRhZGF0YSIsIm5vZGVzIiwic29tZSIsImxlYWRpbmdDb21tZW50cyIsInJhbmdlIiwiZ2V0Q29tbWVudHNCZWZvcmUiLCJsZW5ndGgiLCJkb2MiLCJlcnIiLCJhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnMiLCJqc2RvYyIsImNhcHR1cmVKc0RvYyIsInRvbWRvYyIsImNhcHR1cmVUb21Eb2MiLCJjb21tZW50cyIsImNvbW1lbnQiLCJ0eXBlIiwiZG9jdHJpbmUiLCJwYXJzZSIsInVud3JhcCIsImxpbmVzIiwiaSIsIm1hdGNoIiwicHVzaCIsInRyaW0iLCJzdGF0dXNNYXRjaCIsImRlc2NyaXB0aW9uIiwidGFncyIsInRpdGxlIiwidG9Mb3dlckNhc2UiLCJzdXBwb3J0ZWRJbXBvcnRUeXBlcyIsImNoaWxkQ29udGV4dCIsImNhY2hlS2V5IiwiZGlnZXN0IiwiZXhwb3J0TWFwIiwic3RhdHMiLCJmcyIsInN0YXRTeW5jIiwibXRpbWUiLCJzZXQiLCJjb250ZW50IiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJ0ZXN0IiwibSIsImlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSIsImlzRXNNb2R1bGVJbnRlcm9wIiwiYXN0IiwidmlzaXRvcktleXMiLCJyZXN1bHQiLCJoYXNEeW5hbWljSW1wb3J0cyIsInByb2Nlc3NEeW5hbWljSW1wb3J0IiwicCIsInJlbW90ZVBhdGgiLCJpbXBvcnRlZFNwZWNpZmllcnMiLCJhZGQiLCJnZXR0ZXIiLCJ0aHVua0ZvciIsImRlY2xhcmF0aW9ucyIsImxvYyIsImR5bmFtaWMiLCJJbXBvcnRFeHByZXNzaW9uIiwiQ2FsbEV4cHJlc3Npb24iLCJjYWxsZWUiLCJhcmd1bWVudHMiLCJ1bmFtYmlndW91c2x5RVNNIiwiaXNNb2R1bGUiLCJkb2NzdHlsZSIsInNldHRpbmdzIiwic3R5bGUiLCJjIiwidCIsIm5hbWVzcGFjZXMiLCJyZXNvbHZlIiwicmVsYXRpdmUiLCJyZXNvbHZlSW1wb3J0IiwicnAiLCJnZXROYW1lc3BhY2UiLCJpZGVudGlmaWVyIiwiYWRkTmFtZXNwYWNlIiwib2JqZWN0IiwibnNmbiIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwicHJvY2Vzc1NwZWNpZmllciIsInMiLCJuc291cmNlIiwiZXhwb3J0TWV0YSIsImV4cG9ydGVkIiwiY2FwdHVyZURlcGVuZGVuY3lXaXRoU3BlY2lmaWVycyIsImRlY2xhcmF0aW9uSXNUeXBlIiwiaW1wb3J0S2luZCIsInNwZWNpZmllcnNPbmx5SW1wb3J0aW5nVHlwZXMiLCJzcGVjaWZpZXJzIiwic3BlY2lmaWVyIiwiY2FwdHVyZURlcGVuZGVuY3kiLCJpc09ubHlJbXBvcnRpbmdUeXBlcyIsImRlY2xhcmF0aW9uTWV0YWRhdGEiLCJleGlzdGluZyIsIm1ha2VTb3VyY2VDb2RlIiwicGFyc2VyT3B0aW9ucyIsInRzY29uZmlnUm9vdERpciIsInByb2plY3QiLCJ0c0NvbmZpZyIsInByb2Nlc3MiLCJjd2QiLCJ0c2NvbmZpZ1Jlc3VsdCIsInByb2plY3RzIiwiaXNBcnJheSIsImZpbGVuYW1lIiwiY29uZmlnIiwiY29tcGlsZXJPcHRpb25zIiwiZXNNb2R1bGVJbnRlcm9wIiwiYm9keSIsImV4cG9ydEtpbmQiLCJucyIsImZpbmQiLCJpZCIsImV4cG9ydHMiLCJleHBvcnRlZE5hbWUiLCJleHByZXNzaW9uIiwiZGVjbFR5cGVzIiwiZXhwb3J0ZWREZWNscyIsImZpbHRlciIsImRlY2wiLCJtb2R1bGVCbG9ja05vZGUiLCJuYW1lc3BhY2VEZWNsIiwicGF0dGVybiIsInByb3BlcnRpZXMiLCJhcmd1bWVudCIsImVsZW1lbnRzIiwiZWxlbWVudCIsImxlZnQiLCJwYXJzZXJPcHRpb25zSGFzaCIsInByZXZQYXJzZXJPcHRpb25zIiwic2V0dGluZ3NIYXNoIiwicHJldlNldHRpbmdzIiwicGFyc2VyUGF0aCIsIkpTT04iLCJzdHJpbmdpZnkiLCJTdHJpbmciLCJnZXRQaHlzaWNhbEZpbGVuYW1lIiwicGh5c2ljYWxGaWxlbmFtZSIsImdldEZpbGVuYW1lIiwidGV4dCIsIlNvdXJjZUNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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QUE4QmpHLEdBQTlCLEVBQW1DLENBQ2pDLElBQUlrRyxtQkFBVzNJLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkIsQ0FDekI7QUFDQSxXQUFPLElBQUkySSxrQkFBSixDQUFlRCxJQUFmLEVBQXFCakcsR0FBckIsQ0FBUCxDQUNELENBSEQsTUFHTyxDQUNMO0FBQ0EsV0FBTyxJQUFJa0csa0JBQUosQ0FBZSxFQUFFRCxVQUFGLEVBQVFqRyxRQUFSLEVBQWYsQ0FBUCxDQUNELENBQ0YiLCJmaWxlIjoiRXhwb3J0TWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IHJlc29sdmUgYXMgcGF0aFJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IGRvY3RyaW5lIGZyb20gJ2RvY3RyaW5lJztcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcblxuaW1wb3J0IHsgU291cmNlQ29kZSB9IGZyb20gJ2VzbGludCc7XG5cbmltcG9ydCBwYXJzZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3BhcnNlJztcbmltcG9ydCB2aXNpdCBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Zpc2l0JztcbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgaXNJZ25vcmVkLCB7IGhhc1ZhbGlkRXh0ZW5zaW9uIH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9pZ25vcmUnO1xuXG5pbXBvcnQgeyBoYXNoT2JqZWN0IH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9oYXNoJztcbmltcG9ydCAqIGFzIHVuYW1iaWd1b3VzIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvdW5hbWJpZ3VvdXMnO1xuXG5pbXBvcnQgeyBnZXRUc2NvbmZpZyB9IGZyb20gJ2dldC10c2NvbmZpZyc7XG5cbmNvbnN0IGluY2x1ZGVzID0gRnVuY3Rpb24uYmluZC5iaW5kKEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsKShBcnJheS5wcm90b3R5cGUuaW5jbHVkZXMpO1xuXG5jb25zdCBsb2cgPSBkZWJ1ZygnZXNsaW50LXBsdWdpbi1pbXBvcnQ6RXhwb3J0TWFwJyk7XG5cbmNvbnN0IGV4cG9ydENhY2hlID0gbmV3IE1hcCgpO1xuY29uc3QgdHNjb25maWdDYWNoZSA9IG5ldyBNYXAoKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXhwb3J0TWFwIHtcbiAgY29uc3RydWN0b3IocGF0aCkge1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5uYW1lc3BhY2UgPSBuZXcgTWFwKCk7XG4gICAgLy8gdG9kbzogcmVzdHJ1Y3R1cmUgdG8ga2V5IG9uIHBhdGgsIHZhbHVlIGlzIHJlc29sdmVyICsgbWFwIG9mIG5hbWVzXG4gICAgdGhpcy5yZWV4cG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgLyoqXG4gICAgICogc3Rhci1leHBvcnRzXG4gICAgICogQHR5cGUge1NldH0gb2YgKCkgPT4gRXhwb3J0TWFwXG4gICAgICovXG4gICAgdGhpcy5kZXBlbmRlbmNpZXMgPSBuZXcgU2V0KCk7XG4gICAgLyoqXG4gICAgICogZGVwZW5kZW5jaWVzIG9mIHRoaXMgbW9kdWxlIHRoYXQgYXJlIG5vdCBleHBsaWNpdGx5IHJlLWV4cG9ydGVkXG4gICAgICogQHR5cGUge01hcH0gZnJvbSBwYXRoID0gKCkgPT4gRXhwb3J0TWFwXG4gICAgICovXG4gICAgdGhpcy5pbXBvcnRzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgLyoqXG4gICAgICogdHlwZSB7J2FtYmlndW91cycgfCAnTW9kdWxlJyB8ICdTY3JpcHQnfVxuICAgICAqL1xuICAgIHRoaXMucGFyc2VHb2FsID0gJ2FtYmlndW91cyc7XG4gIH1cblxuICBnZXQgaGFzRGVmYXVsdCgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdkZWZhdWx0JykgIT0gbnVsbDsgfSAvLyBzdHJvbmdlciB0aGFuIHRoaXMuaGFzXG5cbiAgZ2V0IHNpemUoKSB7XG4gICAgbGV0IHNpemUgPSB0aGlzLm5hbWVzcGFjZS5zaXplICsgdGhpcy5yZWV4cG9ydHMuc2l6ZTtcbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXApID0+IHtcbiAgICAgIGNvbnN0IGQgPSBkZXAoKTtcbiAgICAgIC8vIENKUyAvIGlnbm9yZWQgZGVwZW5kZW5jaWVzIHdvbid0IGV4aXN0ICgjNzE3KVxuICAgICAgaWYgKGQgPT0gbnVsbCkgeyByZXR1cm47IH1cbiAgICAgIHNpemUgKz0gZC5zaXplO1xuICAgIH0pO1xuICAgIHJldHVybiBzaXplO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGNoZWNrIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgbmFtZXMgZm9yIGV4aXN0ZW5jZVxuICAgKiBpbiB0aGUgYmFzZSBuYW1lc3BhY2UsIGJ1dCBpdCB3aWxsIGV4cGFuZCBhbGwgYGV4cG9ydCAqIGZyb20gJy4uLidgIGV4cG9ydHNcbiAgICogaWYgbm90IGZvdW5kIGluIHRoZSBleHBsaWNpdCBuYW1lc3BhY2UuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIG5hbWVcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgbmFtZWAgaXMgZXhwb3J0ZWQgYnkgdGhpcyBtb2R1bGUuXG4gICAqL1xuICBoYXMobmFtZSkge1xuICAgIGlmICh0aGlzLm5hbWVzcGFjZS5oYXMobmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cbiAgICBpZiAodGhpcy5yZWV4cG9ydHMuaGFzKG5hbWUpKSB7IHJldHVybiB0cnVlOyB9XG5cbiAgICAvLyBkZWZhdWx0IGV4cG9ydHMgbXVzdCBiZSBleHBsaWNpdGx5IHJlLWV4cG9ydGVkICgjMzI4KVxuICAgIGlmIChuYW1lICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIHRoaXMuZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIGNvbnN0IGlubmVyTWFwID0gZGVwKCk7XG5cbiAgICAgICAgLy8gdG9kbzogcmVwb3J0IGFzIHVucmVzb2x2ZWQ/XG4gICAgICAgIGlmICghaW5uZXJNYXApIHsgY29udGludWU7IH1cblxuICAgICAgICBpZiAoaW5uZXJNYXAuaGFzKG5hbWUpKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIGVuc3VyZSB0aGF0IGltcG9ydGVkIG5hbWUgZnVsbHkgcmVzb2x2ZXMuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gbmFtZVxuICAgKiBAcmV0dXJuIHt7IGZvdW5kOiBib29sZWFuLCBwYXRoOiBFeHBvcnRNYXBbXSB9fVxuICAgKi9cbiAgaGFzRGVlcChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgeyByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogW3RoaXNdIH07IH1cblxuICAgIGlmICh0aGlzLnJlZXhwb3J0cy5oYXMobmFtZSkpIHtcbiAgICAgIGNvbnN0IHJlZXhwb3J0cyA9IHRoaXMucmVleHBvcnRzLmdldChuYW1lKTtcbiAgICAgIGNvbnN0IGltcG9ydGVkID0gcmVleHBvcnRzLmdldEltcG9ydCgpO1xuXG4gICAgICAvLyBpZiBpbXBvcnQgaXMgaWdub3JlZCwgcmV0dXJuIGV4cGxpY2l0ICdudWxsJ1xuICAgICAgaWYgKGltcG9ydGVkID09IG51bGwpIHsgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9OyB9XG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlZXAgPSBpbXBvcnRlZC5oYXNEZWVwKHJlZXhwb3J0cy5sb2NhbCk7XG4gICAgICBkZWVwLnBhdGgudW5zaGlmdCh0aGlzKTtcblxuICAgICAgcmV0dXJuIGRlZXA7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBleHBvcnRzIG11c3QgYmUgZXhwbGljaXRseSByZS1leHBvcnRlZCAoIzMyOClcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiB0aGlzLmRlcGVuZGVuY2llcykge1xuICAgICAgICBjb25zdCBpbm5lck1hcCA9IGRlcCgpO1xuICAgICAgICBpZiAoaW5uZXJNYXAgPT0gbnVsbCkgeyByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogW3RoaXNdIH07IH1cbiAgICAgICAgLy8gdG9kbzogcmVwb3J0IGFzIHVucmVzb2x2ZWQ/XG4gICAgICAgIGlmICghaW5uZXJNYXApIHsgY29udGludWU7IH1cblxuICAgICAgICAvLyBzYWZlZ3VhcmQgYWdhaW5zdCBjeWNsZXNcbiAgICAgICAgaWYgKGlubmVyTWFwLnBhdGggPT09IHRoaXMucGF0aCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIGNvbnN0IGlubmVyVmFsdWUgPSBpbm5lck1hcC5oYXNEZWVwKG5hbWUpO1xuICAgICAgICBpZiAoaW5uZXJWYWx1ZS5mb3VuZCkge1xuICAgICAgICAgIGlubmVyVmFsdWUucGF0aC51bnNoaWZ0KHRoaXMpO1xuICAgICAgICAgIHJldHVybiBpbm5lclZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZm91bmQ6IGZhbHNlLCBwYXRoOiBbdGhpc10gfTtcbiAgfVxuXG4gIGdldChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgeyByZXR1cm4gdGhpcy5uYW1lc3BhY2UuZ2V0KG5hbWUpOyB9XG5cbiAgICBpZiAodGhpcy5yZWV4cG9ydHMuaGFzKG5hbWUpKSB7XG4gICAgICBjb25zdCByZWV4cG9ydHMgPSB0aGlzLnJlZXhwb3J0cy5nZXQobmFtZSk7XG4gICAgICBjb25zdCBpbXBvcnRlZCA9IHJlZXhwb3J0cy5nZXRJbXBvcnQoKTtcblxuICAgICAgLy8gaWYgaW1wb3J0IGlzIGlnbm9yZWQsIHJldHVybiBleHBsaWNpdCAnbnVsbCdcbiAgICAgIGlmIChpbXBvcnRlZCA9PSBudWxsKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cblxuICAgICAgcmV0dXJuIGltcG9ydGVkLmdldChyZWV4cG9ydHMubG9jYWwpO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgdGhpcy5kZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uc3QgaW5uZXJNYXAgPSBkZXAoKTtcbiAgICAgICAgLy8gdG9kbzogcmVwb3J0IGFzIHVucmVzb2x2ZWQ/XG4gICAgICAgIGlmICghaW5uZXJNYXApIHsgY29udGludWU7IH1cblxuICAgICAgICAvLyBzYWZlZ3VhcmQgYWdhaW5zdCBjeWNsZXNcbiAgICAgICAgaWYgKGlubmVyTWFwLnBhdGggPT09IHRoaXMucGF0aCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIGNvbnN0IGlubmVyVmFsdWUgPSBpbm5lck1hcC5nZXQobmFtZSk7XG4gICAgICAgIGlmIChpbm5lclZhbHVlICE9PSB1bmRlZmluZWQpIHsgcmV0dXJuIGlubmVyVmFsdWU7IH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHRoaXMubmFtZXNwYWNlLmZvckVhY2goKHYsIG4pID0+IHsgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2LCBuLCB0aGlzKTsgfSk7XG5cbiAgICB0aGlzLnJlZXhwb3J0cy5mb3JFYWNoKChyZWV4cG9ydHMsIG5hbWUpID0+IHtcbiAgICAgIGNvbnN0IHJlZXhwb3J0ZWQgPSByZWV4cG9ydHMuZ2V0SW1wb3J0KCk7XG4gICAgICAvLyBjYW4ndCBsb29rIHVwIG1ldGEgZm9yIGlnbm9yZWQgcmUtZXhwb3J0cyAoIzM0OClcbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgcmVleHBvcnRlZCAmJiByZWV4cG9ydGVkLmdldChyZWV4cG9ydHMubG9jYWwpLCBuYW1lLCB0aGlzKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcCkgPT4ge1xuICAgICAgY29uc3QgZCA9IGRlcCgpO1xuICAgICAgLy8gQ0pTIC8gaWdub3JlZCBkZXBlbmRlbmNpZXMgd29uJ3QgZXhpc3QgKCM3MTcpXG4gICAgICBpZiAoZCA9PSBudWxsKSB7IHJldHVybjsgfVxuXG4gICAgICBkLmZvckVhY2goKHYsIG4pID0+IHtcbiAgICAgICAgaWYgKG4gIT09ICdkZWZhdWx0Jykge1xuICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdiwgbiwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdG9kbzoga2V5cywgdmFsdWVzLCBlbnRyaWVzP1xuXG4gIHJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbikge1xuICAgIGNvbnN0IG1zZyA9IHRoaXMuZXJyb3JzXG4gICAgICAubWFwKChlKSA9PiBgJHtlLm1lc3NhZ2V9ICgke2UubGluZU51bWJlcn06JHtlLmNvbHVtbn0pYClcbiAgICAgIC5qb2luKCcsICcpO1xuICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgIG5vZGU6IGRlY2xhcmF0aW9uLnNvdXJjZSxcbiAgICAgIG1lc3NhZ2U6IGBQYXJzZSBlcnJvcnMgaW4gaW1wb3J0ZWQgbW9kdWxlICcke2RlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZX0nOiAke21zZ31gLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogcGFyc2UgZG9jcyBmcm9tIHRoZSBmaXJzdCBub2RlIHRoYXQgaGFzIGxlYWRpbmcgY29tbWVudHNcbiAqL1xuZnVuY3Rpb24gY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgLi4ubm9kZXMpIHtcbiAgY29uc3QgbWV0YWRhdGEgPSB7fTtcblxuICAvLyAnc29tZScgc2hvcnQtY2lyY3VpdHMgb24gZmlyc3QgJ3RydWUnXG4gIG5vZGVzLnNvbWUoKG4pID0+IHtcbiAgICB0cnkge1xuXG4gICAgICBsZXQgbGVhZGluZ0NvbW1lbnRzO1xuXG4gICAgICAvLyBuLmxlYWRpbmdDb21tZW50cyBpcyBsZWdhY3kgYGF0dGFjaENvbW1lbnRzYCBiZWhhdmlvclxuICAgICAgaWYgKCdsZWFkaW5nQ29tbWVudHMnIGluIG4pIHtcbiAgICAgICAgbGVhZGluZ0NvbW1lbnRzID0gbi5sZWFkaW5nQ29tbWVudHM7XG4gICAgICB9IGVsc2UgaWYgKG4ucmFuZ2UpIHtcbiAgICAgICAgbGVhZGluZ0NvbW1lbnRzID0gc291cmNlLmdldENvbW1lbnRzQmVmb3JlKG4pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWxlYWRpbmdDb21tZW50cyB8fCBsZWFkaW5nQ29tbWVudHMubGVuZ3RoID09PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gZG9jU3R5bGVQYXJzZXJzKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IGRvY1N0eWxlUGFyc2Vyc1tuYW1lXShsZWFkaW5nQ29tbWVudHMpO1xuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgbWV0YWRhdGEuZG9jID0gZG9jO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG1ldGFkYXRhO1xufVxuXG5jb25zdCBhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnMgPSB7XG4gIGpzZG9jOiBjYXB0dXJlSnNEb2MsXG4gIHRvbWRvYzogY2FwdHVyZVRvbURvYyxcbn07XG5cbi8qKlxuICogcGFyc2UgSlNEb2MgZnJvbSBsZWFkaW5nIGNvbW1lbnRzXG4gKiBAcGFyYW0ge29iamVjdFtdfSBjb21tZW50c1xuICogQHJldHVybiB7eyBkb2M6IG9iamVjdCB9fVxuICovXG5mdW5jdGlvbiBjYXB0dXJlSnNEb2MoY29tbWVudHMpIHtcbiAgbGV0IGRvYztcblxuICAvLyBjYXB0dXJlIFhTRG9jXG4gIGNvbW1lbnRzLmZvckVhY2goKGNvbW1lbnQpID0+IHtcbiAgICAvLyBza2lwIG5vbi1ibG9jayBjb21tZW50c1xuICAgIGlmIChjb21tZW50LnR5cGUgIT09ICdCbG9jaycpIHsgcmV0dXJuOyB9XG4gICAgdHJ5IHtcbiAgICAgIGRvYyA9IGRvY3RyaW5lLnBhcnNlKGNvbW1lbnQudmFsdWUsIHsgdW53cmFwOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLyogZG9uJ3QgY2FyZSwgZm9yIG5vdz8gbWF5YmUgYWRkIHRvIGBlcnJvcnM/YCAqL1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRvYztcbn1cblxuLyoqXG4gICogcGFyc2UgVG9tRG9jIHNlY3Rpb24gZnJvbSBjb21tZW50c1xuICAqL1xuZnVuY3Rpb24gY2FwdHVyZVRvbURvYyhjb21tZW50cykge1xuICAvLyBjb2xsZWN0IGxpbmVzIHVwIHRvIGZpcnN0IHBhcmFncmFwaCBicmVha1xuICBjb25zdCBsaW5lcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY29tbWVudCA9IGNvbW1lbnRzW2ldO1xuICAgIGlmIChjb21tZW50LnZhbHVlLm1hdGNoKC9eXFxzKiQvKSkgeyBicmVhazsgfVxuICAgIGxpbmVzLnB1c2goY29tbWVudC52YWx1ZS50cmltKCkpO1xuICB9XG5cbiAgLy8gcmV0dXJuIGRvY3RyaW5lLWxpa2Ugb2JqZWN0XG4gIGNvbnN0IHN0YXR1c01hdGNoID0gbGluZXMuam9pbignICcpLm1hdGNoKC9eKFB1YmxpY3xJbnRlcm5hbHxEZXByZWNhdGVkKTpcXHMqKC4rKS8pO1xuICBpZiAoc3RhdHVzTWF0Y2gpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGVzY3JpcHRpb246IHN0YXR1c01hdGNoWzJdLFxuICAgICAgdGFnczogW3tcbiAgICAgICAgdGl0bGU6IHN0YXR1c01hdGNoWzFdLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdGF0dXNNYXRjaFsyXSxcbiAgICAgIH1dLFxuICAgIH07XG4gIH1cbn1cblxuY29uc3Qgc3VwcG9ydGVkSW1wb3J0VHlwZXMgPSBuZXcgU2V0KFsnSW1wb3J0RGVmYXVsdFNwZWNpZmllcicsICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInXSk7XG5cbkV4cG9ydE1hcC5nZXQgPSBmdW5jdGlvbiAoc291cmNlLCBjb250ZXh0KSB7XG4gIGNvbnN0IHBhdGggPSByZXNvbHZlKHNvdXJjZSwgY29udGV4dCk7XG4gIGlmIChwYXRoID09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cblxuICByZXR1cm4gRXhwb3J0TWFwLmZvcihjaGlsZENvbnRleHQocGF0aCwgY29udGV4dCkpO1xufTtcblxuRXhwb3J0TWFwLmZvciA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGNvbnN0IHsgcGF0aCB9ID0gY29udGV4dDtcblxuICBjb25zdCBjYWNoZUtleSA9IGNvbnRleHQuY2FjaGVLZXkgfHwgaGFzaE9iamVjdChjb250ZXh0KS5kaWdlc3QoJ2hleCcpO1xuICBsZXQgZXhwb3J0TWFwID0gZXhwb3J0Q2FjaGUuZ2V0KGNhY2hlS2V5KTtcblxuICAvLyByZXR1cm4gY2FjaGVkIGlnbm9yZVxuICBpZiAoZXhwb3J0TWFwID09PSBudWxsKSB7IHJldHVybiBudWxsOyB9XG5cbiAgY29uc3Qgc3RhdHMgPSBmcy5zdGF0U3luYyhwYXRoKTtcbiAgaWYgKGV4cG9ydE1hcCAhPSBudWxsKSB7XG4gICAgLy8gZGF0ZSBlcXVhbGl0eSBjaGVja1xuICAgIGlmIChleHBvcnRNYXAubXRpbWUgLSBzdGF0cy5tdGltZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGV4cG9ydE1hcDtcbiAgICB9XG4gICAgLy8gZnV0dXJlOiBjaGVjayBjb250ZW50IGVxdWFsaXR5P1xuICB9XG5cbiAgLy8gY2hlY2sgdmFsaWQgZXh0ZW5zaW9ucyBmaXJzdFxuICBpZiAoIWhhc1ZhbGlkRXh0ZW5zaW9uKHBhdGgsIGNvbnRleHQpKSB7XG4gICAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIGNoZWNrIGZvciBhbmQgY2FjaGUgaWdub3JlXG4gIGlmIChpc0lnbm9yZWQocGF0aCwgY29udGV4dCkpIHtcbiAgICBsb2coJ2lnbm9yZWQgcGF0aCBkdWUgdG8gaWdub3JlIHNldHRpbmdzOicsIHBhdGgpO1xuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxuICAvLyBjaGVjayBmb3IgYW5kIGNhY2hlIHVuYW1iaWd1b3VzIG1vZHVsZXNcbiAgaWYgKCF1bmFtYmlndW91cy50ZXN0KGNvbnRlbnQpKSB7XG4gICAgbG9nKCdpZ25vcmVkIHBhdGggZHVlIHRvIHVuYW1iaWd1b3VzIHJlZ2V4OicsIHBhdGgpO1xuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBsb2coJ2NhY2hlIG1pc3MnLCBjYWNoZUtleSwgJ2ZvciBwYXRoJywgcGF0aCk7XG4gIGV4cG9ydE1hcCA9IEV4cG9ydE1hcC5wYXJzZShwYXRoLCBjb250ZW50LCBjb250ZXh0KTtcblxuICAvLyBhbWJpZ3VvdXMgbW9kdWxlcyByZXR1cm4gbnVsbFxuICBpZiAoZXhwb3J0TWFwID09IG51bGwpIHtcbiAgICBsb2coJ2lnbm9yZWQgcGF0aCBkdWUgdG8gYW1iaWd1b3VzIHBhcnNlOicsIHBhdGgpO1xuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBleHBvcnRNYXAubXRpbWUgPSBzdGF0cy5tdGltZTtcblxuICBleHBvcnRDYWNoZS5zZXQoY2FjaGVLZXksIGV4cG9ydE1hcCk7XG4gIHJldHVybiBleHBvcnRNYXA7XG59O1xuXG5FeHBvcnRNYXAucGFyc2UgPSBmdW5jdGlvbiAocGF0aCwgY29udGVudCwgY29udGV4dCkge1xuICBjb25zdCBtID0gbmV3IEV4cG9ydE1hcChwYXRoKTtcbiAgY29uc3QgaXNFc01vZHVsZUludGVyb3BUcnVlID0gaXNFc01vZHVsZUludGVyb3AoKTtcblxuICBsZXQgYXN0O1xuICBsZXQgdmlzaXRvcktleXM7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gcGFyc2UocGF0aCwgY29udGVudCwgY29udGV4dCk7XG4gICAgYXN0ID0gcmVzdWx0LmFzdDtcbiAgICB2aXNpdG9yS2V5cyA9IHJlc3VsdC52aXNpdG9yS2V5cztcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbS5lcnJvcnMucHVzaChlcnIpO1xuICAgIHJldHVybiBtOyAvLyBjYW4ndCBjb250aW51ZVxuICB9XG5cbiAgbS52aXNpdG9yS2V5cyA9IHZpc2l0b3JLZXlzO1xuXG4gIGxldCBoYXNEeW5hbWljSW1wb3J0cyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHByb2Nlc3NEeW5hbWljSW1wb3J0KHNvdXJjZSkge1xuICAgIGhhc0R5bmFtaWNJbXBvcnRzID0gdHJ1ZTtcbiAgICBpZiAoc291cmNlLnR5cGUgIT09ICdMaXRlcmFsJykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHAgPSByZW1vdGVQYXRoKHNvdXJjZS52YWx1ZSk7XG4gICAgaWYgKHAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGltcG9ydGVkU3BlY2lmaWVycyA9IG5ldyBTZXQoKTtcbiAgICBpbXBvcnRlZFNwZWNpZmllcnMuYWRkKCdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInKTtcbiAgICBjb25zdCBnZXR0ZXIgPSB0aHVua0ZvcihwLCBjb250ZXh0KTtcbiAgICBtLmltcG9ydHMuc2V0KHAsIHtcbiAgICAgIGdldHRlcixcbiAgICAgIGRlY2xhcmF0aW9uczogbmV3IFNldChbe1xuICAgICAgICBzb3VyY2U6IHtcbiAgICAgICAgLy8gY2FwdHVyaW5nIGFjdHVhbCBub2RlIHJlZmVyZW5jZSBob2xkcyBmdWxsIEFTVCBpbiBtZW1vcnkhXG4gICAgICAgICAgdmFsdWU6IHNvdXJjZS52YWx1ZSxcbiAgICAgICAgICBsb2M6IHNvdXJjZS5sb2MsXG4gICAgICAgIH0sXG4gICAgICAgIGltcG9ydGVkU3BlY2lmaWVycyxcbiAgICAgICAgZHluYW1pYzogdHJ1ZSxcbiAgICAgIH1dKSxcbiAgICB9KTtcbiAgfVxuXG4gIHZpc2l0KGFzdCwgdmlzaXRvcktleXMsIHtcbiAgICBJbXBvcnRFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgIHByb2Nlc3NEeW5hbWljSW1wb3J0KG5vZGUuc291cmNlKTtcbiAgICB9LFxuICAgIENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICAgIGlmIChub2RlLmNhbGxlZS50eXBlID09PSAnSW1wb3J0Jykge1xuICAgICAgICBwcm9jZXNzRHluYW1pY0ltcG9ydChub2RlLmFyZ3VtZW50c1swXSk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3QgdW5hbWJpZ3VvdXNseUVTTSA9IHVuYW1iaWd1b3VzLmlzTW9kdWxlKGFzdCk7XG4gIGlmICghdW5hbWJpZ3VvdXNseUVTTSAmJiAhaGFzRHluYW1pY0ltcG9ydHMpIHsgcmV0dXJuIG51bGw7IH1cblxuICBjb25zdCBkb2NzdHlsZSA9IGNvbnRleHQuc2V0dGluZ3MgJiYgY29udGV4dC5zZXR0aW5nc1snaW1wb3J0L2RvY3N0eWxlJ10gfHwgWydqc2RvYyddO1xuICBjb25zdCBkb2NTdHlsZVBhcnNlcnMgPSB7fTtcbiAgZG9jc3R5bGUuZm9yRWFjaCgoc3R5bGUpID0+IHtcbiAgICBkb2NTdHlsZVBhcnNlcnNbc3R5bGVdID0gYXZhaWxhYmxlRG9jU3R5bGVQYXJzZXJzW3N0eWxlXTtcbiAgfSk7XG5cbiAgLy8gYXR0ZW1wdCB0byBjb2xsZWN0IG1vZHVsZSBkb2NcbiAgaWYgKGFzdC5jb21tZW50cykge1xuICAgIGFzdC5jb21tZW50cy5zb21lKChjKSA9PiB7XG4gICAgICBpZiAoYy50eXBlICE9PSAnQmxvY2snKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZG9jID0gZG9jdHJpbmUucGFyc2UoYy52YWx1ZSwgeyB1bndyYXA6IHRydWUgfSk7XG4gICAgICAgIGlmIChkb2MudGFncy5zb21lKCh0KSA9PiB0LnRpdGxlID09PSAnbW9kdWxlJykpIHtcbiAgICAgICAgICBtLmRvYyA9IGRvYztcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7IC8qIGlnbm9yZSAqLyB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBuYW1lc3BhY2VzID0gbmV3IE1hcCgpO1xuXG4gIGZ1bmN0aW9uIHJlbW90ZVBhdGgodmFsdWUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZS5yZWxhdGl2ZSh2YWx1ZSwgcGF0aCwgY29udGV4dC5zZXR0aW5ncyk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlSW1wb3J0KHZhbHVlKSB7XG4gICAgY29uc3QgcnAgPSByZW1vdGVQYXRoKHZhbHVlKTtcbiAgICBpZiAocnAgPT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuICAgIHJldHVybiBFeHBvcnRNYXAuZm9yKGNoaWxkQ29udGV4dChycCwgY29udGV4dCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKGlkZW50aWZpZXIpIHtcbiAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGlkZW50aWZpZXIubmFtZSkpIHsgcmV0dXJuOyB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHJlc29sdmVJbXBvcnQobmFtZXNwYWNlcy5nZXQoaWRlbnRpZmllci5uYW1lKSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZE5hbWVzcGFjZShvYmplY3QsIGlkZW50aWZpZXIpIHtcbiAgICBjb25zdCBuc2ZuID0gZ2V0TmFtZXNwYWNlKGlkZW50aWZpZXIpO1xuICAgIGlmIChuc2ZuKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnbmFtZXNwYWNlJywgeyBnZXQ6IG5zZm4gfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb2Nlc3NTcGVjaWZpZXIocywgbiwgbSkge1xuICAgIGNvbnN0IG5zb3VyY2UgPSBuLnNvdXJjZSAmJiBuLnNvdXJjZS52YWx1ZTtcbiAgICBjb25zdCBleHBvcnRNZXRhID0ge307XG4gICAgbGV0IGxvY2FsO1xuXG4gICAgc3dpdGNoIChzLnR5cGUpIHtcbiAgICAgIGNhc2UgJ0V4cG9ydERlZmF1bHRTcGVjaWZpZXInOlxuICAgICAgICBpZiAoIW5zb3VyY2UpIHsgcmV0dXJuOyB9XG4gICAgICAgIGxvY2FsID0gJ2RlZmF1bHQnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0V4cG9ydE5hbWVzcGFjZVNwZWNpZmllcic6XG4gICAgICAgIG0ubmFtZXNwYWNlLnNldChzLmV4cG9ydGVkLm5hbWUsIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRNZXRhLCAnbmFtZXNwYWNlJywge1xuICAgICAgICAgIGdldCgpIHsgcmV0dXJuIHJlc29sdmVJbXBvcnQobnNvdXJjZSk7IH0sXG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY2FzZSAnRXhwb3J0QWxsRGVjbGFyYXRpb24nOlxuICAgICAgICBtLm5hbWVzcGFjZS5zZXQocy5leHBvcnRlZC5uYW1lIHx8IHMuZXhwb3J0ZWQudmFsdWUsIGFkZE5hbWVzcGFjZShleHBvcnRNZXRhLCBzLnNvdXJjZS52YWx1ZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlICdFeHBvcnRTcGVjaWZpZXInOlxuICAgICAgICBpZiAoIW4uc291cmNlKSB7XG4gICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KHMuZXhwb3J0ZWQubmFtZSB8fCBzLmV4cG9ydGVkLnZhbHVlLCBhZGROYW1lc3BhY2UoZXhwb3J0TWV0YSwgcy5sb2NhbCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgLy8gZWxzZSBmYWxscyB0aHJvdWdoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsb2NhbCA9IHMubG9jYWwubmFtZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gdG9kbzogSlNEb2NcbiAgICBtLnJlZXhwb3J0cy5zZXQocy5leHBvcnRlZC5uYW1lLCB7IGxvY2FsLCBnZXRJbXBvcnQ6ICgpID0+IHJlc29sdmVJbXBvcnQobnNvdXJjZSkgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjYXB0dXJlRGVwZW5kZW5jeVdpdGhTcGVjaWZpZXJzKG4pIHtcbiAgICAvLyBpbXBvcnQgdHlwZSB7IEZvbyB9IChUUyBhbmQgRmxvdyk7IGltcG9ydCB0eXBlb2YgeyBGb28gfSAoRmxvdylcbiAgICBjb25zdCBkZWNsYXJhdGlvbklzVHlwZSA9IG4uaW1wb3J0S2luZCA9PT0gJ3R5cGUnIHx8IG4uaW1wb3J0S2luZCA9PT0gJ3R5cGVvZic7XG4gICAgLy8gaW1wb3J0ICcuL2Zvbycgb3IgaW1wb3J0IHt9IGZyb20gJy4vZm9vJyAoYm90aCAwIHNwZWNpZmllcnMpIGlzIGEgc2lkZSBlZmZlY3QgYW5kXG4gICAgLy8gc2hvdWxkbid0IGJlIGNvbnNpZGVyZWQgdG8gYmUganVzdCBpbXBvcnRpbmcgdHlwZXNcbiAgICBsZXQgc3BlY2lmaWVyc09ubHlJbXBvcnRpbmdUeXBlcyA9IG4uc3BlY2lmaWVycy5sZW5ndGggPiAwO1xuICAgIGNvbnN0IGltcG9ydGVkU3BlY2lmaWVycyA9IG5ldyBTZXQoKTtcbiAgICBuLnNwZWNpZmllcnMuZm9yRWFjaCgoc3BlY2lmaWVyKSA9PiB7XG4gICAgICBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnRTcGVjaWZpZXInKSB7XG4gICAgICAgIGltcG9ydGVkU3BlY2lmaWVycy5hZGQoc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUgfHwgc3BlY2lmaWVyLmltcG9ydGVkLnZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydGVkSW1wb3J0VHlwZXMuaGFzKHNwZWNpZmllci50eXBlKSkge1xuICAgICAgICBpbXBvcnRlZFNwZWNpZmllcnMuYWRkKHNwZWNpZmllci50eXBlKTtcbiAgICAgIH1cblxuICAgICAgLy8gaW1wb3J0IHsgdHlwZSBGb28gfSAoRmxvdyk7IGltcG9ydCB7IHR5cGVvZiBGb28gfSAoRmxvdylcbiAgICAgIHNwZWNpZmllcnNPbmx5SW1wb3J0aW5nVHlwZXMgPSBzcGVjaWZpZXJzT25seUltcG9ydGluZ1R5cGVzXG4gICAgICAgICYmIChzcGVjaWZpZXIuaW1wb3J0S2luZCA9PT0gJ3R5cGUnIHx8IHNwZWNpZmllci5pbXBvcnRLaW5kID09PSAndHlwZW9mJyk7XG4gICAgfSk7XG4gICAgY2FwdHVyZURlcGVuZGVuY3kobiwgZGVjbGFyYXRpb25Jc1R5cGUgfHwgc3BlY2lmaWVyc09ubHlJbXBvcnRpbmdUeXBlcywgaW1wb3J0ZWRTcGVjaWZpZXJzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhcHR1cmVEZXBlbmRlbmN5KHsgc291cmNlIH0sIGlzT25seUltcG9ydGluZ1R5cGVzLCBpbXBvcnRlZFNwZWNpZmllcnMgPSBuZXcgU2V0KCkpIHtcbiAgICBpZiAoc291cmNlID09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgIGNvbnN0IHAgPSByZW1vdGVQYXRoKHNvdXJjZS52YWx1ZSk7XG4gICAgaWYgKHAgPT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgY29uc3QgZGVjbGFyYXRpb25NZXRhZGF0YSA9IHtcbiAgICAgIC8vIGNhcHR1cmluZyBhY3R1YWwgbm9kZSByZWZlcmVuY2UgaG9sZHMgZnVsbCBBU1QgaW4gbWVtb3J5IVxuICAgICAgc291cmNlOiB7IHZhbHVlOiBzb3VyY2UudmFsdWUsIGxvYzogc291cmNlLmxvYyB9LFxuICAgICAgaXNPbmx5SW1wb3J0aW5nVHlwZXMsXG4gICAgICBpbXBvcnRlZFNwZWNpZmllcnMsXG4gICAgfTtcblxuICAgIGNvbnN0IGV4aXN0aW5nID0gbS5pbXBvcnRzLmdldChwKTtcbiAgICBpZiAoZXhpc3RpbmcgIT0gbnVsbCkge1xuICAgICAgZXhpc3RpbmcuZGVjbGFyYXRpb25zLmFkZChkZWNsYXJhdGlvbk1ldGFkYXRhKTtcbiAgICAgIHJldHVybiBleGlzdGluZy5nZXR0ZXI7XG4gICAgfVxuXG4gICAgY29uc3QgZ2V0dGVyID0gdGh1bmtGb3IocCwgY29udGV4dCk7XG4gICAgbS5pbXBvcnRzLnNldChwLCB7IGdldHRlciwgZGVjbGFyYXRpb25zOiBuZXcgU2V0KFtkZWNsYXJhdGlvbk1ldGFkYXRhXSkgfSk7XG4gICAgcmV0dXJuIGdldHRlcjtcbiAgfVxuXG4gIGNvbnN0IHNvdXJjZSA9IG1ha2VTb3VyY2VDb2RlKGNvbnRlbnQsIGFzdCk7XG5cbiAgZnVuY3Rpb24gaXNFc01vZHVsZUludGVyb3AoKSB7XG4gICAgY29uc3QgcGFyc2VyT3B0aW9ucyA9IGNvbnRleHQucGFyc2VyT3B0aW9ucyB8fCB7fTtcbiAgICBsZXQgdHNjb25maWdSb290RGlyID0gcGFyc2VyT3B0aW9ucy50c2NvbmZpZ1Jvb3REaXI7XG4gICAgY29uc3QgcHJvamVjdCA9IHBhcnNlck9wdGlvbnMucHJvamVjdDtcbiAgICBjb25zdCBjYWNoZUtleSA9IGhhc2hPYmplY3Qoe1xuICAgICAgdHNjb25maWdSb290RGlyLFxuICAgICAgcHJvamVjdCxcbiAgICB9KS5kaWdlc3QoJ2hleCcpO1xuICAgIGxldCB0c0NvbmZpZyA9IHRzY29uZmlnQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICBpZiAodHlwZW9mIHRzQ29uZmlnID09PSAndW5kZWZpbmVkJykge1xuICAgICAgdHNjb25maWdSb290RGlyID0gdHNjb25maWdSb290RGlyIHx8IHByb2Nlc3MuY3dkKCk7XG4gICAgICBsZXQgdHNjb25maWdSZXN1bHQ7XG4gICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IEFycmF5LmlzQXJyYXkocHJvamVjdCkgPyBwcm9qZWN0IDogW3Byb2plY3RdO1xuICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcHJvamVjdHMpIHtcbiAgICAgICAgICB0c2NvbmZpZ1Jlc3VsdCA9IGdldFRzY29uZmlnKHByb2plY3QgPT09IHRydWUgPyBjb250ZXh0LmZpbGVuYW1lIDogcGF0aFJlc29sdmUodHNjb25maWdSb290RGlyLCBwcm9qZWN0KSk7XG4gICAgICAgICAgaWYgKHRzY29uZmlnUmVzdWx0KSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRzY29uZmlnUmVzdWx0ID0gZ2V0VHNjb25maWcodHNjb25maWdSb290RGlyKTtcbiAgICAgIH1cbiAgICAgIHRzQ29uZmlnID0gdHNjb25maWdSZXN1bHQgJiYgdHNjb25maWdSZXN1bHQuY29uZmlnIHx8IG51bGw7XG4gICAgICB0c2NvbmZpZ0NhY2hlLnNldChjYWNoZUtleSwgdHNDb25maWcpO1xuICAgIH1cblxuICAgIHJldHVybiB0c0NvbmZpZyAmJiB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMgPyB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMuZXNNb2R1bGVJbnRlcm9wIDogZmFsc2U7XG4gIH1cblxuICBhc3QuYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgaWYgKG4udHlwZSA9PT0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbicpIHtcbiAgICAgIGNvbnN0IGV4cG9ydE1ldGEgPSBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBuKTtcbiAgICAgIGlmIChuLmRlY2xhcmF0aW9uLnR5cGUgPT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICBhZGROYW1lc3BhY2UoZXhwb3J0TWV0YSwgbi5kZWNsYXJhdGlvbik7XG4gICAgICB9XG4gICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCBleHBvcnRNZXRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobi50eXBlID09PSAnRXhwb3J0QWxsRGVjbGFyYXRpb24nKSB7XG4gICAgICBjb25zdCBnZXR0ZXIgPSBjYXB0dXJlRGVwZW5kZW5jeShuLCBuLmV4cG9ydEtpbmQgPT09ICd0eXBlJyk7XG4gICAgICBpZiAoZ2V0dGVyKSB7IG0uZGVwZW5kZW5jaWVzLmFkZChnZXR0ZXIpOyB9XG4gICAgICBpZiAobi5leHBvcnRlZCkge1xuICAgICAgICBwcm9jZXNzU3BlY2lmaWVyKG4sIG4uZXhwb3J0ZWQsIG0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNhcHR1cmUgbmFtZXNwYWNlcyBpbiBjYXNlIG9mIGxhdGVyIGV4cG9ydFxuICAgIGlmIChuLnR5cGUgPT09ICdJbXBvcnREZWNsYXJhdGlvbicpIHtcbiAgICAgIGNhcHR1cmVEZXBlbmRlbmN5V2l0aFNwZWNpZmllcnMobik7XG5cbiAgICAgIGNvbnN0IG5zID0gbi5zcGVjaWZpZXJzLmZpbmQoKHMpID0+IHMudHlwZSA9PT0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcicpO1xuICAgICAgaWYgKG5zKSB7XG4gICAgICAgIG5hbWVzcGFjZXMuc2V0KG5zLmxvY2FsLm5hbWUsIG4uc291cmNlLnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobi50eXBlID09PSAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbicpIHtcbiAgICAgIGNhcHR1cmVEZXBlbmRlbmN5V2l0aFNwZWNpZmllcnMobik7XG5cbiAgICAgIC8vIGNhcHR1cmUgZGVjbGFyYXRpb25cbiAgICAgIGlmIChuLmRlY2xhcmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgc3dpdGNoIChuLmRlY2xhcmF0aW9uLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdGdW5jdGlvbkRlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdUeXBlQWxpYXMnOiAvLyBmbG93dHlwZSB3aXRoIGJhYmVsLWVzbGludCBwYXJzZXJcbiAgICAgICAgICBjYXNlICdJbnRlcmZhY2VEZWNsYXJhdGlvbic6XG4gICAgICAgICAgY2FzZSAnRGVjbGFyZUZ1bmN0aW9uJzpcbiAgICAgICAgICBjYXNlICdUU0RlY2xhcmVGdW5jdGlvbic6XG4gICAgICAgICAgY2FzZSAnVFNFbnVtRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTVHlwZUFsaWFzRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTQWJzdHJhY3RDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdUU01vZHVsZURlY2xhcmF0aW9uJzpcbiAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChuLmRlY2xhcmF0aW9uLmlkLm5hbWUsIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIG4pKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ1ZhcmlhYmxlRGVjbGFyYXRpb24nOlxuICAgICAgICAgICAgbi5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZCkgPT4ge1xuICAgICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShcbiAgICAgICAgICAgICAgICBkLmlkLFxuICAgICAgICAgICAgICAgIChpZCkgPT4gbS5uYW1lc3BhY2Uuc2V0KGlkLm5hbWUsIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIGQsIG4pKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBuLnNwZWNpZmllcnMuZm9yRWFjaCgocykgPT4gcHJvY2Vzc1NwZWNpZmllcihzLCBuLCBtKSk7XG4gICAgfVxuXG4gICAgY29uc3QgZXhwb3J0cyA9IFsnVFNFeHBvcnRBc3NpZ25tZW50J107XG4gICAgaWYgKGlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSkge1xuICAgICAgZXhwb3J0cy5wdXNoKCdUU05hbWVzcGFjZUV4cG9ydERlY2xhcmF0aW9uJyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBkb2Vzbid0IGRlY2xhcmUgYW55dGhpbmcsIGJ1dCBjaGFuZ2VzIHdoYXQncyBiZWluZyBleHBvcnRlZC5cbiAgICBpZiAoaW5jbHVkZXMoZXhwb3J0cywgbi50eXBlKSkge1xuICAgICAgY29uc3QgZXhwb3J0ZWROYW1lID0gbi50eXBlID09PSAnVFNOYW1lc3BhY2VFeHBvcnREZWNsYXJhdGlvbidcbiAgICAgICAgPyAobi5pZCB8fCBuLm5hbWUpLm5hbWVcbiAgICAgICAgOiBuLmV4cHJlc3Npb24gJiYgbi5leHByZXNzaW9uLm5hbWUgfHwgbi5leHByZXNzaW9uLmlkICYmIG4uZXhwcmVzc2lvbi5pZC5uYW1lIHx8IG51bGw7XG4gICAgICBjb25zdCBkZWNsVHlwZXMgPSBbXG4gICAgICAgICdWYXJpYWJsZURlY2xhcmF0aW9uJyxcbiAgICAgICAgJ0NsYXNzRGVjbGFyYXRpb24nLFxuICAgICAgICAnVFNEZWNsYXJlRnVuY3Rpb24nLFxuICAgICAgICAnVFNFbnVtRGVjbGFyYXRpb24nLFxuICAgICAgICAnVFNUeXBlQWxpYXNEZWNsYXJhdGlvbicsXG4gICAgICAgICdUU0ludGVyZmFjZURlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTQWJzdHJhY3RDbGFzc0RlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTTW9kdWxlRGVjbGFyYXRpb24nLFxuICAgICAgXTtcbiAgICAgIGNvbnN0IGV4cG9ydGVkRGVjbHMgPSBhc3QuYm9keS5maWx0ZXIoKHsgdHlwZSwgaWQsIGRlY2xhcmF0aW9ucyB9KSA9PiBpbmNsdWRlcyhkZWNsVHlwZXMsIHR5cGUpICYmIChcbiAgICAgICAgaWQgJiYgaWQubmFtZSA9PT0gZXhwb3J0ZWROYW1lIHx8IGRlY2xhcmF0aW9ucyAmJiBkZWNsYXJhdGlvbnMuZmluZCgoZCkgPT4gZC5pZC5uYW1lID09PSBleHBvcnRlZE5hbWUpXG4gICAgICApKTtcbiAgICAgIGlmIChleHBvcnRlZERlY2xzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBFeHBvcnQgaXMgbm90IHJlZmVyZW5jaW5nIGFueSBsb2NhbCBkZWNsYXJhdGlvbiwgbXVzdCBiZSByZS1leHBvcnRpbmdcbiAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JywgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgbikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIGlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSAvLyBlc01vZHVsZUludGVyb3AgaXMgb24gaW4gdHNjb25maWdcbiAgICAgICAgJiYgIW0ubmFtZXNwYWNlLmhhcygnZGVmYXVsdCcpIC8vIGFuZCBkZWZhdWx0IGlzbid0IGFkZGVkIGFscmVhZHlcbiAgICAgICkge1xuICAgICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCB7fSk7IC8vIGFkZCBkZWZhdWx0IGV4cG9ydFxuICAgICAgfVxuICAgICAgZXhwb3J0ZWREZWNscy5mb3JFYWNoKChkZWNsKSA9PiB7XG4gICAgICAgIGlmIChkZWNsLnR5cGUgPT09ICdUU01vZHVsZURlY2xhcmF0aW9uJykge1xuICAgICAgICAgIGlmIChkZWNsLmJvZHkgJiYgZGVjbC5ib2R5LnR5cGUgPT09ICdUU01vZHVsZURlY2xhcmF0aW9uJykge1xuICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KGRlY2wuYm9keS5pZC5uYW1lLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBkZWNsLmJvZHkpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlY2wuYm9keSAmJiBkZWNsLmJvZHkuYm9keSkge1xuICAgICAgICAgICAgZGVjbC5ib2R5LmJvZHkuZm9yRWFjaCgobW9kdWxlQmxvY2tOb2RlKSA9PiB7XG4gICAgICAgICAgICAgIC8vIEV4cG9ydC1hc3NpZ25tZW50IGV4cG9ydHMgYWxsIG1lbWJlcnMgaW4gdGhlIG5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgLy8gZXhwbGljaXRseSBleHBvcnRlZCBvciBub3QuXG4gICAgICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZURlY2wgPSBtb2R1bGVCbG9ja05vZGUudHlwZSA9PT0gJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nXG4gICAgICAgICAgICAgICAgPyBtb2R1bGVCbG9ja05vZGUuZGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICA6IG1vZHVsZUJsb2NrTm9kZTtcblxuICAgICAgICAgICAgICBpZiAoIW5hbWVzcGFjZURlY2wpIHtcbiAgICAgICAgICAgICAgICAvLyBUeXBlU2NyaXB0IGNhbiBjaGVjayB0aGlzIGZvciB1czsgd2UgbmVlZG4ndFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWVzcGFjZURlY2wudHlwZSA9PT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlRGVjbC5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZCkgPT4gcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZC5pZCwgKGlkKSA9PiBtLm5hbWVzcGFjZS5zZXQoXG4gICAgICAgICAgICAgICAgICBpZC5uYW1lLFxuICAgICAgICAgICAgICAgICAgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZGVjbCwgbmFtZXNwYWNlRGVjbCwgbW9kdWxlQmxvY2tOb2RlKSxcbiAgICAgICAgICAgICAgICApKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZURlY2wuaWQubmFtZSxcbiAgICAgICAgICAgICAgICAgIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIG1vZHVsZUJsb2NrTm9kZSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gRXhwb3J0IGFzIGRlZmF1bHRcbiAgICAgICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBkZWNsKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKFxuICAgIGlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSAvLyBlc01vZHVsZUludGVyb3AgaXMgb24gaW4gdHNjb25maWdcbiAgICAmJiBtLm5hbWVzcGFjZS5zaXplID4gMCAvLyBhbnl0aGluZyBpcyBleHBvcnRlZFxuICAgICYmICFtLm5hbWVzcGFjZS5oYXMoJ2RlZmF1bHQnKSAvLyBhbmQgZGVmYXVsdCBpc24ndCBhZGRlZCBhbHJlYWR5XG4gICkge1xuICAgIG0ubmFtZXNwYWNlLnNldCgnZGVmYXVsdCcsIHt9KTsgLy8gYWRkIGRlZmF1bHQgZXhwb3J0XG4gIH1cblxuICBpZiAodW5hbWJpZ3VvdXNseUVTTSkge1xuICAgIG0ucGFyc2VHb2FsID0gJ01vZHVsZSc7XG4gIH1cbiAgcmV0dXJuIG07XG59O1xuXG4vKipcbiAqIFRoZSBjcmVhdGlvbiBvZiB0aGlzIGNsb3N1cmUgaXMgaXNvbGF0ZWQgZnJvbSBvdGhlciBzY29wZXNcbiAqIHRvIGF2b2lkIG92ZXItcmV0ZW50aW9uIG9mIHVucmVsYXRlZCB2YXJpYWJsZXMsIHdoaWNoIGhhc1xuICogY2F1c2VkIG1lbW9yeSBsZWFrcy4gU2VlICMxMjY2LlxuICovXG5mdW5jdGlvbiB0aHVua0ZvcihwLCBjb250ZXh0KSB7XG4gIHJldHVybiAoKSA9PiBFeHBvcnRNYXAuZm9yKGNoaWxkQ29udGV4dChwLCBjb250ZXh0KSk7XG59XG5cbi8qKlxuICogVHJhdmVyc2UgYSBwYXR0ZXJuL2lkZW50aWZpZXIgbm9kZSwgY2FsbGluZyAnY2FsbGJhY2snXG4gKiBmb3IgZWFjaCBsZWFmIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0gIHtub2RlfSAgIHBhdHRlcm5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKHBhdHRlcm4sIGNhbGxiYWNrKSB7XG4gIHN3aXRjaCAocGF0dGVybi50eXBlKSB7XG4gICAgY2FzZSAnSWRlbnRpZmllcic6IC8vIGJhc2UgY2FzZVxuICAgICAgY2FsbGJhY2socGF0dGVybik7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ09iamVjdFBhdHRlcm4nOlxuICAgICAgcGF0dGVybi5wcm9wZXJ0aWVzLmZvckVhY2goKHApID0+IHtcbiAgICAgICAgaWYgKHAudHlwZSA9PT0gJ0V4cGVyaW1lbnRhbFJlc3RQcm9wZXJ0eScgfHwgcC50eXBlID09PSAnUmVzdEVsZW1lbnQnKSB7XG4gICAgICAgICAgY2FsbGJhY2socC5hcmd1bWVudCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKHAudmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdBcnJheVBhdHRlcm4nOlxuICAgICAgcGF0dGVybi5lbGVtZW50cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50ID09IG51bGwpIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmIChlbGVtZW50LnR5cGUgPT09ICdFeHBlcmltZW50YWxSZXN0UHJvcGVydHknIHx8IGVsZW1lbnQudHlwZSA9PT0gJ1Jlc3RFbGVtZW50Jykge1xuICAgICAgICAgIGNhbGxiYWNrKGVsZW1lbnQuYXJndW1lbnQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShlbGVtZW50LCBjYWxsYmFjayk7XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnQXNzaWdubWVudFBhdHRlcm4nOlxuICAgICAgY2FsbGJhY2socGF0dGVybi5sZWZ0KTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gIH1cbn1cblxubGV0IHBhcnNlck9wdGlvbnNIYXNoID0gJyc7XG5sZXQgcHJldlBhcnNlck9wdGlvbnMgPSAnJztcbmxldCBzZXR0aW5nc0hhc2ggPSAnJztcbmxldCBwcmV2U2V0dGluZ3MgPSAnJztcbi8qKlxuICogZG9uJ3QgaG9sZCBmdWxsIGNvbnRleHQgb2JqZWN0IGluIG1lbW9yeSwganVzdCBncmFiIHdoYXQgd2UgbmVlZC5cbiAqIGFsc28gY2FsY3VsYXRlIGEgY2FjaGVLZXksIHdoZXJlIHBhcnRzIG9mIHRoZSBjYWNoZUtleSBoYXNoIGFyZSBtZW1vaXplZFxuICovXG5mdW5jdGlvbiBjaGlsZENvbnRleHQocGF0aCwgY29udGV4dCkge1xuICBjb25zdCB7IHNldHRpbmdzLCBwYXJzZXJPcHRpb25zLCBwYXJzZXJQYXRoIH0gPSBjb250ZXh0O1xuXG4gIGlmIChKU09OLnN0cmluZ2lmeShzZXR0aW5ncykgIT09IHByZXZTZXR0aW5ncykge1xuICAgIHNldHRpbmdzSGFzaCA9IGhhc2hPYmplY3QoeyBzZXR0aW5ncyB9KS5kaWdlc3QoJ2hleCcpO1xuICAgIHByZXZTZXR0aW5ncyA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgfVxuXG4gIGlmIChKU09OLnN0cmluZ2lmeShwYXJzZXJPcHRpb25zKSAhPT0gcHJldlBhcnNlck9wdGlvbnMpIHtcbiAgICBwYXJzZXJPcHRpb25zSGFzaCA9IGhhc2hPYmplY3QoeyBwYXJzZXJPcHRpb25zIH0pLmRpZ2VzdCgnaGV4Jyk7XG4gICAgcHJldlBhcnNlck9wdGlvbnMgPSBKU09OLnN0cmluZ2lmeShwYXJzZXJPcHRpb25zKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2FjaGVLZXk6IFN0cmluZyhwYXJzZXJQYXRoKSArIHBhcnNlck9wdGlvbnNIYXNoICsgc2V0dGluZ3NIYXNoICsgU3RyaW5nKHBhdGgpLFxuICAgIHNldHRpbmdzLFxuICAgIHBhcnNlck9wdGlvbnMsXG4gICAgcGFyc2VyUGF0aCxcbiAgICBwYXRoLFxuICAgIGZpbGVuYW1lOiB0eXBlb2YgY29udGV4dC5nZXRQaHlzaWNhbEZpbGVuYW1lID09PSAnZnVuY3Rpb24nXG4gICAgICA/IGNvbnRleHQuZ2V0UGh5c2ljYWxGaWxlbmFtZSgpXG4gICAgICA6IGNvbnRleHQucGh5c2ljYWxGaWxlbmFtZSAhPSBudWxsXG4gICAgICAgID8gY29udGV4dC5waHlzaWNhbEZpbGVuYW1lXG4gICAgICAgIDogdHlwZW9mIGNvbnRleHQuZ2V0RmlsZW5hbWUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGNvbnRleHQuZ2V0RmlsZW5hbWUoKVxuICAgICAgICAgIDogY29udGV4dC5maWxlbmFtZSxcbiAgfTtcbn1cblxuLyoqXG4gKiBzb21ldGltZXMgbGVnYWN5IHN1cHBvcnQgaXNuJ3QgX3RoYXRfIGhhcmQuLi4gcmlnaHQ/XG4gKi9cbmZ1bmN0aW9uIG1ha2VTb3VyY2VDb2RlKHRleHQsIGFzdCkge1xuICBpZiAoU291cmNlQ29kZS5sZW5ndGggPiAxKSB7XG4gICAgLy8gRVNMaW50IDNcbiAgICByZXR1cm4gbmV3IFNvdXJjZUNvZGUodGV4dCwgYXN0KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBFU0xpbnQgNCwgNVxuICAgIHJldHVybiBuZXcgU291cmNlQ29kZSh7IHRleHQsIGFzdCB9KTtcbiAgfVxufVxuIl19