'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};





var _ignore = require('eslint-module-utils/ignore');
var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _visit = require('eslint-module-utils/visit');var _visit2 = _interopRequireDefault(_visit);
var _path = require('path');
var _readPkgUp2 = require('eslint-module-utils/readPkgUp');var _readPkgUp3 = _interopRequireDefault(_readPkgUp2);





var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}} /**
                                                                                                                                                                                                                                                                                                                                                                                 * @fileOverview Ensures that modules contain exports and/or all
                                                                                                                                                                                                                                                                                                                                                                                 * modules are consumed within other modules.
                                                                                                                                                                                                                                                                                                                                                                                 * @author René Fermann
                                                                                                                                                                                                                                                                                                                                                                                 */var values = Object.values;var includes = Function.bind.bind(Function.prototype.call)(Array.prototype.includes);var flatMap = Function.bind.bind(Function.prototype.call)(Array.prototype.flatMap);var FileEnumerator = void 0;var listFilesToProcess = void 0;
try {var _require =
  require('eslint/use-at-your-own-risk');FileEnumerator = _require.FileEnumerator;
} catch (e) {
  try {var _require2 =

    require('eslint/lib/cli-engine/file-enumerator'); // has been moved to eslint/lib/cli-engine/file-enumerator in version 6
    FileEnumerator = _require2.FileEnumerator;} catch (e) {
    try {
      // eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
      var _require3 = require('eslint/lib/util/glob-utils'),originalListFilesToProcess = _require3.listFilesToProcess;

      // Prevent passing invalid options (extensions array) to old versions of the function.
      // https://github.com/eslint/eslint/blob/v5.16.0/lib/util/glob-utils.js#L178-L280
      // https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob-util.js#L174-L269
      listFilesToProcess = function listFilesToProcess(src, extensions) {
        return originalListFilesToProcess(src, {
          extensions: extensions });

      };
    } catch (e) {var _require4 =
      require('eslint/lib/util/glob-util'),_originalListFilesToProcess = _require4.listFilesToProcess;

      listFilesToProcess = function listFilesToProcess(src, extensions) {
        var patterns = src.concat(flatMap(src, function (pattern) {return extensions.map(function (extension) {return (/\*\*|\*\./.test(pattern) ? pattern : String(pattern) + '/**/*' + String(extension));});}));

        return _originalListFilesToProcess(patterns);
      };
    }
  }
}

if (FileEnumerator) {
  listFilesToProcess = function listFilesToProcess(src, extensions) {
    var e = new FileEnumerator({
      extensions: extensions });


    return Array.from(e.iterateFiles(src), function (_ref) {var filePath = _ref.filePath,ignored = _ref.ignored;return {
        ignored: ignored,
        filename: filePath };});

  };
}

var EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration';
var EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration';
var EXPORT_ALL_DECLARATION = 'ExportAllDeclaration';
var IMPORT_DECLARATION = 'ImportDeclaration';
var IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier';
var IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier';
var VARIABLE_DECLARATION = 'VariableDeclaration';
var FUNCTION_DECLARATION = 'FunctionDeclaration';
var CLASS_DECLARATION = 'ClassDeclaration';
var IDENTIFIER = 'Identifier';
var OBJECT_PATTERN = 'ObjectPattern';
var TS_INTERFACE_DECLARATION = 'TSInterfaceDeclaration';
var TS_TYPE_ALIAS_DECLARATION = 'TSTypeAliasDeclaration';
var TS_ENUM_DECLARATION = 'TSEnumDeclaration';
var DEFAULT = 'default';

function forEachDeclarationIdentifier(declaration, cb) {
  if (declaration) {
    if (
    declaration.type === FUNCTION_DECLARATION ||
    declaration.type === CLASS_DECLARATION ||
    declaration.type === TS_INTERFACE_DECLARATION ||
    declaration.type === TS_TYPE_ALIAS_DECLARATION ||
    declaration.type === TS_ENUM_DECLARATION)
    {
      cb(declaration.id.name);
    } else if (declaration.type === VARIABLE_DECLARATION) {
      declaration.declarations.forEach(function (_ref2) {var id = _ref2.id;
        if (id.type === OBJECT_PATTERN) {
          (0, _ExportMap.recursivePatternCapture)(id, function (pattern) {
            if (pattern.type === IDENTIFIER) {
              cb(pattern.name);
            }
          });
        } else {
          cb(id.name);
        }
      });
    }
  }
}

/**
   * List of imports per file.
   *
   * Represented by a two-level Map to a Set of identifiers. The upper-level Map
   * keys are the paths to the modules containing the imports, while the
   * lower-level Map keys are the paths to the files which are being imported
   * from. Lastly, the Set of identifiers contains either names being imported
   * or a special AST node name listed above (e.g ImportDefaultSpecifier).
   *
   * For example, if we have a file named foo.js containing:
   *
   *   import { o2 } from './bar.js';
   *
   * Then we will have a structure that looks like:
   *
   *   Map { 'foo.js' => Map { 'bar.js' => Set { 'o2' } } }
   *
   * @type {Map<string, Map<string, Set<string>>>}
   */
var importList = new Map();

/**
                             * List of exports per file.
                             *
                             * Represented by a two-level Map to an object of metadata. The upper-level Map
                             * keys are the paths to the modules containing the exports, while the
                             * lower-level Map keys are the specific identifiers or special AST node names
                             * being exported. The leaf-level metadata object at the moment only contains a
                             * `whereUsed` property, which contains a Set of paths to modules that import
                             * the name.
                             *
                             * For example, if we have a file named bar.js containing the following exports:
                             *
                             *   const o2 = 'bar';
                             *   export { o2 };
                             *
                             * And a file named foo.js containing the following import:
                             *
                             *   import { o2 } from './bar.js';
                             *
                             * Then we will have a structure that looks like:
                             *
                             *   Map { 'bar.js' => Map { 'o2' => { whereUsed: Set { 'foo.js' } } } }
                             *
                             * @type {Map<string, Map<string, object>>}
                             */
var exportList = new Map();

var visitorKeyMap = new Map();

var ignoredFiles = new Set();
var filesOutsideSrc = new Set();

var isNodeModule = function isNodeModule(path) {return (/\/(node_modules)\//.test(path));};

/**
                                                                                             * read all files matching the patterns in src and ignoreExports
                                                                                             *
                                                                                             * return all files matching src pattern, which are not matching the ignoreExports pattern
                                                                                             */
var resolveFiles = function resolveFiles(src, ignoreExports, context) {
  var extensions = Array.from((0, _ignore.getFileExtensions)(context.settings));

  var srcFileList = listFilesToProcess(src, extensions);

  // prepare list of ignored files
  var ignoredFilesList = listFilesToProcess(ignoreExports, extensions);
  ignoredFilesList.forEach(function (_ref3) {var filename = _ref3.filename;return ignoredFiles.add(filename);});

  // prepare list of source files, don't consider files from node_modules

  return new Set(
  flatMap(srcFileList, function (_ref4) {var filename = _ref4.filename;return isNodeModule(filename) ? [] : filename;}));

};

/**
    * parse all source files and build up 2 maps containing the existing imports and exports
    */
var prepareImportsAndExports = function prepareImportsAndExports(srcFiles, context) {
  var exportAll = new Map();
  srcFiles.forEach(function (file) {
    var exports = new Map();
    var imports = new Map();
    var currentExports = _ExportMap2['default'].get(file, context);
    if (currentExports) {var

      dependencies =




      currentExports.dependencies,reexports = currentExports.reexports,localImportList = currentExports.imports,namespace = currentExports.namespace,visitorKeys = currentExports.visitorKeys;

      visitorKeyMap.set(file, visitorKeys);
      // dependencies === export * from
      var currentExportAll = new Set();
      dependencies.forEach(function (getDependency) {
        var dependency = getDependency();
        if (dependency === null) {
          return;
        }

        currentExportAll.add(dependency.path);
      });
      exportAll.set(file, currentExportAll);

      reexports.forEach(function (value, key) {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
        var reexport = value.getImport();
        if (!reexport) {
          return;
        }
        var localImport = imports.get(reexport.path);
        var currentValue = void 0;
        if (value.local === DEFAULT) {
          currentValue = IMPORT_DEFAULT_SPECIFIER;
        } else {
          currentValue = value.local;
        }
        if (typeof localImport !== 'undefined') {
          localImport = new Set([].concat(_toConsumableArray(localImport), [currentValue]));
        } else {
          localImport = new Set([currentValue]);
        }
        imports.set(reexport.path, localImport);
      });

      localImportList.forEach(function (value, key) {
        if (isNodeModule(key)) {
          return;
        }
        var localImport = imports.get(key) || new Set();
        value.declarations.forEach(function (_ref5) {var importedSpecifiers = _ref5.importedSpecifiers;
          importedSpecifiers.forEach(function (specifier) {
            localImport.add(specifier);
          });
        });
        imports.set(key, localImport);
      });
      importList.set(file, imports);

      // build up export list only, if file is not ignored
      if (ignoredFiles.has(file)) {
        return;
      }
      namespace.forEach(function (value, key) {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
      });
    }
    exports.set(EXPORT_ALL_DECLARATION, { whereUsed: new Set() });
    exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: new Set() });
    exportList.set(file, exports);
  });
  exportAll.forEach(function (value, key) {
    value.forEach(function (val) {
      var currentExports = exportList.get(val);
      if (currentExports) {
        var currentExport = currentExports.get(EXPORT_ALL_DECLARATION);
        currentExport.whereUsed.add(key);
      }
    });
  });
};

/**
    * traverse through all imports and add the respective path to the whereUsed-list
    * of the corresponding export
    */
var determineUsage = function determineUsage() {
  importList.forEach(function (listValue, listKey) {
    listValue.forEach(function (value, key) {
      var exports = exportList.get(key);
      if (typeof exports !== 'undefined') {
        value.forEach(function (currentImport) {
          var specifier = void 0;
          if (currentImport === IMPORT_NAMESPACE_SPECIFIER) {
            specifier = IMPORT_NAMESPACE_SPECIFIER;
          } else if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = IMPORT_DEFAULT_SPECIFIER;
          } else {
            specifier = currentImport;
          }
          if (typeof specifier !== 'undefined') {
            var exportStatement = exports.get(specifier);
            if (typeof exportStatement !== 'undefined') {var
              whereUsed = exportStatement.whereUsed;
              whereUsed.add(listKey);
              exports.set(specifier, { whereUsed: whereUsed });
            }
          }
        });
      }
    });
  });
};

var getSrc = function getSrc(src) {
  if (src) {
    return src;
  }
  return [process.cwd()];
};

/**
    * prepare the lists of existing imports and exports - should only be executed once at
    * the start of a new eslint run
    */
var srcFiles = void 0;
var lastPrepareKey = void 0;
var doPreparation = function doPreparation(src, ignoreExports, context) {
  var prepareKey = JSON.stringify({
    src: (src || []).sort(),
    ignoreExports: (ignoreExports || []).sort(),
    extensions: Array.from((0, _ignore.getFileExtensions)(context.settings)).sort() });

  if (prepareKey === lastPrepareKey) {
    return;
  }

  importList.clear();
  exportList.clear();
  ignoredFiles.clear();
  filesOutsideSrc.clear();

  srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
  prepareImportsAndExports(srcFiles, context);
  determineUsage();
  lastPrepareKey = prepareKey;
};

var newNamespaceImportExists = function newNamespaceImportExists(specifiers) {return specifiers.some(function (_ref6) {var type = _ref6.type;return type === IMPORT_NAMESPACE_SPECIFIER;});};

var newDefaultImportExists = function newDefaultImportExists(specifiers) {return specifiers.some(function (_ref7) {var type = _ref7.type;return type === IMPORT_DEFAULT_SPECIFIER;});};

var fileIsInPkg = function fileIsInPkg(file) {var _readPkgUp =
  (0, _readPkgUp3['default'])({ cwd: file }),path = _readPkgUp.path,pkg = _readPkgUp.pkg;
  var basePath = (0, _path.dirname)(path);

  var checkPkgFieldString = function checkPkgFieldString(pkgField) {
    if ((0, _path.join)(basePath, pkgField) === file) {
      return true;
    }
  };

  var checkPkgFieldObject = function checkPkgFieldObject(pkgField) {
    var pkgFieldFiles = flatMap(values(pkgField), function (value) {return typeof value === 'boolean' ? [] : (0, _path.join)(basePath, value);});

    if (includes(pkgFieldFiles, file)) {
      return true;
    }
  };

  var checkPkgField = function checkPkgField(pkgField) {
    if (typeof pkgField === 'string') {
      return checkPkgFieldString(pkgField);
    }

    if ((typeof pkgField === 'undefined' ? 'undefined' : _typeof(pkgField)) === 'object') {
      return checkPkgFieldObject(pkgField);
    }
  };

  if (pkg['private'] === true) {
    return false;
  }

  if (pkg.bin) {
    if (checkPkgField(pkg.bin)) {
      return true;
    }
  }

  if (pkg.browser) {
    if (checkPkgField(pkg.browser)) {
      return true;
    }
  }

  if (pkg.main) {
    if (checkPkgFieldString(pkg.main)) {
      return true;
    }
  }

  return false;
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid modules without exports, or exports without matching import in another module.',
      url: (0, _docsUrl2['default'])('no-unused-modules') },

    schema: [{
      properties: {
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            minLength: 1 } },


        ignoreExports: {
          description: 'files/paths for which unused exports will not be reported (e.g module entry points)',
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            minLength: 1 } },


        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean' },

        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean' } },


      anyOf: [
      {
        properties: {
          unusedExports: { 'enum': [true] },
          src: {
            minItems: 1 } },


        required: ['unusedExports'] },

      {
        properties: {
          missingExports: { 'enum': [true] } },

        required: ['missingExports'] }] }] },





  create: function () {function create(context) {var _ref8 =





      context.options[0] || {},src = _ref8.src,_ref8$ignoreExports = _ref8.ignoreExports,ignoreExports = _ref8$ignoreExports === undefined ? [] : _ref8$ignoreExports,missingExports = _ref8.missingExports,unusedExports = _ref8.unusedExports;

      if (unusedExports) {
        doPreparation(src, ignoreExports, context);
      }

      var file = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();

      var checkExportPresence = function () {function checkExportPresence(node) {
          if (!missingExports) {
            return;
          }

          if (ignoredFiles.has(file)) {
            return;
          }

          var exportCount = exportList.get(file);
          var exportAll = exportCount.get(EXPORT_ALL_DECLARATION);
          var namespaceImports = exportCount.get(IMPORT_NAMESPACE_SPECIFIER);

          exportCount['delete'](EXPORT_ALL_DECLARATION);
          exportCount['delete'](IMPORT_NAMESPACE_SPECIFIER);
          if (exportCount.size < 1) {
            // node.body[0] === 'undefined' only happens, if everything is commented out in the file
            // being linted
            context.report(node.body[0] ? node.body[0] : node, 'No exports found');
          }
          exportCount.set(EXPORT_ALL_DECLARATION, exportAll);
          exportCount.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
        }return checkExportPresence;}();

      var checkUsage = function () {function checkUsage(node, exportedValue) {
          if (!unusedExports) {
            return;
          }

          if (ignoredFiles.has(file)) {
            return;
          }

          if (fileIsInPkg(file)) {
            return;
          }

          if (filesOutsideSrc.has(file)) {
            return;
          }

          // make sure file to be linted is included in source files
          if (!srcFiles.has(file)) {
            srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
            if (!srcFiles.has(file)) {
              filesOutsideSrc.add(file);
              return;
            }
          }

          exports = exportList.get(file);

          // special case: export * from
          var exportAll = exports.get(EXPORT_ALL_DECLARATION);
          if (typeof exportAll !== 'undefined' && exportedValue !== IMPORT_DEFAULT_SPECIFIER) {
            if (exportAll.whereUsed.size > 0) {
              return;
            }
          }

          // special case: namespace import
          var namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);
          if (typeof namespaceImports !== 'undefined') {
            if (namespaceImports.whereUsed.size > 0) {
              return;
            }
          }

          // exportsList will always map any imported value of 'default' to 'ImportDefaultSpecifier'
          var exportsKey = exportedValue === DEFAULT ? IMPORT_DEFAULT_SPECIFIER : exportedValue;

          var exportStatement = exports.get(exportsKey);

          var value = exportsKey === IMPORT_DEFAULT_SPECIFIER ? DEFAULT : exportsKey;

          if (typeof exportStatement !== 'undefined') {
            if (exportStatement.whereUsed.size < 1) {
              context.report(
              node, 'exported declaration \'' +
              value + '\' not used within other modules');

            }
          } else {
            context.report(
            node, 'exported declaration \'' +
            value + '\' not used within other modules');

          }
        }return checkUsage;}();

      /**
                                 * only useful for tools like vscode-eslint
                                 *
                                 * update lists of existing exports during runtime
                                 */
      var updateExportUsage = function () {function updateExportUsage(node) {
          if (ignoredFiles.has(file)) {
            return;
          }

          var exports = exportList.get(file);

          // new module has been created during runtime
          // include it in further processing
          if (typeof exports === 'undefined') {
            exports = new Map();
          }

          var newExports = new Map();
          var newExportIdentifiers = new Set();

          node.body.forEach(function (_ref9) {var type = _ref9.type,declaration = _ref9.declaration,specifiers = _ref9.specifiers;
            if (type === EXPORT_DEFAULT_DECLARATION) {
              newExportIdentifiers.add(IMPORT_DEFAULT_SPECIFIER);
            }
            if (type === EXPORT_NAMED_DECLARATION) {
              if (specifiers.length > 0) {
                specifiers.forEach(function (specifier) {
                  if (specifier.exported) {
                    newExportIdentifiers.add(specifier.exported.name || specifier.exported.value);
                  }
                });
              }
              forEachDeclarationIdentifier(declaration, function (name) {
                newExportIdentifiers.add(name);
              });
            }
          });

          // old exports exist within list of new exports identifiers: add to map of new exports
          exports.forEach(function (value, key) {
            if (newExportIdentifiers.has(key)) {
              newExports.set(key, value);
            }
          });

          // new export identifiers added: add to map of new exports
          newExportIdentifiers.forEach(function (key) {
            if (!exports.has(key)) {
              newExports.set(key, { whereUsed: new Set() });
            }
          });

          // preserve information about namespace imports
          var exportAll = exports.get(EXPORT_ALL_DECLARATION);
          var namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);

          if (typeof namespaceImports === 'undefined') {
            namespaceImports = { whereUsed: new Set() };
          }

          newExports.set(EXPORT_ALL_DECLARATION, exportAll);
          newExports.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
          exportList.set(file, newExports);
        }return updateExportUsage;}();

      /**
                                        * only useful for tools like vscode-eslint
                                        *
                                        * update lists of existing imports during runtime
                                        */
      var updateImportUsage = function () {function updateImportUsage(node) {
          if (!unusedExports) {
            return;
          }

          var oldImportPaths = importList.get(file);
          if (typeof oldImportPaths === 'undefined') {
            oldImportPaths = new Map();
          }

          var oldNamespaceImports = new Set();
          var newNamespaceImports = new Set();

          var oldExportAll = new Set();
          var newExportAll = new Set();

          var oldDefaultImports = new Set();
          var newDefaultImports = new Set();

          var oldImports = new Map();
          var newImports = new Map();
          oldImportPaths.forEach(function (value, key) {
            if (value.has(EXPORT_ALL_DECLARATION)) {
              oldExportAll.add(key);
            }
            if (value.has(IMPORT_NAMESPACE_SPECIFIER)) {
              oldNamespaceImports.add(key);
            }
            if (value.has(IMPORT_DEFAULT_SPECIFIER)) {
              oldDefaultImports.add(key);
            }
            value.forEach(function (val) {
              if (
              val !== IMPORT_NAMESPACE_SPECIFIER &&
              val !== IMPORT_DEFAULT_SPECIFIER)
              {
                oldImports.set(val, key);
              }
            });
          });

          function processDynamicImport(source) {
            if (source.type !== 'Literal') {
              return null;
            }
            var p = (0, _resolve2['default'])(source.value, context);
            if (p == null) {
              return null;
            }
            newNamespaceImports.add(p);
          }

          (0, _visit2['default'])(node, visitorKeyMap.get(file), {
            ImportExpression: function () {function ImportExpression(child) {
                processDynamicImport(child.source);
              }return ImportExpression;}(),
            CallExpression: function () {function CallExpression(child) {
                if (child.callee.type === 'Import') {
                  processDynamicImport(child.arguments[0]);
                }
              }return CallExpression;}() });


          node.body.forEach(function (astNode) {
            var resolvedPath = void 0;

            // support for export { value } from 'module'
            if (astNode.type === EXPORT_NAMED_DECLARATION) {
              if (astNode.source) {
                resolvedPath = (0, _resolve2['default'])(astNode.source.raw.replace(/('|")/g, ''), context);
                astNode.specifiers.forEach(function (specifier) {
                  var name = specifier.local.name || specifier.local.value;
                  if (name === DEFAULT) {
                    newDefaultImports.add(resolvedPath);
                  } else {
                    newImports.set(name, resolvedPath);
                  }
                });
              }
            }

            if (astNode.type === EXPORT_ALL_DECLARATION) {
              resolvedPath = (0, _resolve2['default'])(astNode.source.raw.replace(/('|")/g, ''), context);
              newExportAll.add(resolvedPath);
            }

            if (astNode.type === IMPORT_DECLARATION) {
              resolvedPath = (0, _resolve2['default'])(astNode.source.raw.replace(/('|")/g, ''), context);
              if (!resolvedPath) {
                return;
              }

              if (isNodeModule(resolvedPath)) {
                return;
              }

              if (newNamespaceImportExists(astNode.specifiers)) {
                newNamespaceImports.add(resolvedPath);
              }

              if (newDefaultImportExists(astNode.specifiers)) {
                newDefaultImports.add(resolvedPath);
              }

              astNode.specifiers.
              filter(function (specifier) {return specifier.type !== IMPORT_DEFAULT_SPECIFIER && specifier.type !== IMPORT_NAMESPACE_SPECIFIER;}).
              forEach(function (specifier) {
                newImports.set(specifier.imported.name || specifier.imported.value, resolvedPath);
              });
            }
          });

          newExportAll.forEach(function (value) {
            if (!oldExportAll.has(value)) {
              var imports = oldImportPaths.get(value);
              if (typeof imports === 'undefined') {
                imports = new Set();
              }
              imports.add(EXPORT_ALL_DECLARATION);
              oldImportPaths.set(value, imports);

              var _exports = exportList.get(value);
              var currentExport = void 0;
              if (typeof _exports !== 'undefined') {
                currentExport = _exports.get(EXPORT_ALL_DECLARATION);
              } else {
                _exports = new Map();
                exportList.set(value, _exports);
              }

              if (typeof currentExport !== 'undefined') {
                currentExport.whereUsed.add(file);
              } else {
                var whereUsed = new Set();
                whereUsed.add(file);
                _exports.set(EXPORT_ALL_DECLARATION, { whereUsed: whereUsed });
              }
            }
          });

          oldExportAll.forEach(function (value) {
            if (!newExportAll.has(value)) {
              var imports = oldImportPaths.get(value);
              imports['delete'](EXPORT_ALL_DECLARATION);

              var _exports2 = exportList.get(value);
              if (typeof _exports2 !== 'undefined') {
                var currentExport = _exports2.get(EXPORT_ALL_DECLARATION);
                if (typeof currentExport !== 'undefined') {
                  currentExport.whereUsed['delete'](file);
                }
              }
            }
          });

          newDefaultImports.forEach(function (value) {
            if (!oldDefaultImports.has(value)) {
              var imports = oldImportPaths.get(value);
              if (typeof imports === 'undefined') {
                imports = new Set();
              }
              imports.add(IMPORT_DEFAULT_SPECIFIER);
              oldImportPaths.set(value, imports);

              var _exports3 = exportList.get(value);
              var currentExport = void 0;
              if (typeof _exports3 !== 'undefined') {
                currentExport = _exports3.get(IMPORT_DEFAULT_SPECIFIER);
              } else {
                _exports3 = new Map();
                exportList.set(value, _exports3);
              }

              if (typeof currentExport !== 'undefined') {
                currentExport.whereUsed.add(file);
              } else {
                var whereUsed = new Set();
                whereUsed.add(file);
                _exports3.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: whereUsed });
              }
            }
          });

          oldDefaultImports.forEach(function (value) {
            if (!newDefaultImports.has(value)) {
              var imports = oldImportPaths.get(value);
              imports['delete'](IMPORT_DEFAULT_SPECIFIER);

              var _exports4 = exportList.get(value);
              if (typeof _exports4 !== 'undefined') {
                var currentExport = _exports4.get(IMPORT_DEFAULT_SPECIFIER);
                if (typeof currentExport !== 'undefined') {
                  currentExport.whereUsed['delete'](file);
                }
              }
            }
          });

          newNamespaceImports.forEach(function (value) {
            if (!oldNamespaceImports.has(value)) {
              var imports = oldImportPaths.get(value);
              if (typeof imports === 'undefined') {
                imports = new Set();
              }
              imports.add(IMPORT_NAMESPACE_SPECIFIER);
              oldImportPaths.set(value, imports);

              var _exports5 = exportList.get(value);
              var currentExport = void 0;
              if (typeof _exports5 !== 'undefined') {
                currentExport = _exports5.get(IMPORT_NAMESPACE_SPECIFIER);
              } else {
                _exports5 = new Map();
                exportList.set(value, _exports5);
              }

              if (typeof currentExport !== 'undefined') {
                currentExport.whereUsed.add(file);
              } else {
                var whereUsed = new Set();
                whereUsed.add(file);
                _exports5.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: whereUsed });
              }
            }
          });

          oldNamespaceImports.forEach(function (value) {
            if (!newNamespaceImports.has(value)) {
              var imports = oldImportPaths.get(value);
              imports['delete'](IMPORT_NAMESPACE_SPECIFIER);

              var _exports6 = exportList.get(value);
              if (typeof _exports6 !== 'undefined') {
                var currentExport = _exports6.get(IMPORT_NAMESPACE_SPECIFIER);
                if (typeof currentExport !== 'undefined') {
                  currentExport.whereUsed['delete'](file);
                }
              }
            }
          });

          newImports.forEach(function (value, key) {
            if (!oldImports.has(key)) {
              var imports = oldImportPaths.get(value);
              if (typeof imports === 'undefined') {
                imports = new Set();
              }
              imports.add(key);
              oldImportPaths.set(value, imports);

              var _exports7 = exportList.get(value);
              var currentExport = void 0;
              if (typeof _exports7 !== 'undefined') {
                currentExport = _exports7.get(key);
              } else {
                _exports7 = new Map();
                exportList.set(value, _exports7);
              }

              if (typeof currentExport !== 'undefined') {
                currentExport.whereUsed.add(file);
              } else {
                var whereUsed = new Set();
                whereUsed.add(file);
                _exports7.set(key, { whereUsed: whereUsed });
              }
            }
          });

          oldImports.forEach(function (value, key) {
            if (!newImports.has(key)) {
              var imports = oldImportPaths.get(value);
              imports['delete'](key);

              var _exports8 = exportList.get(value);
              if (typeof _exports8 !== 'undefined') {
                var currentExport = _exports8.get(key);
                if (typeof currentExport !== 'undefined') {
                  currentExport.whereUsed['delete'](file);
                }
              }
            }
          });
        }return updateImportUsage;}();

      return {
        'Program:exit': function () {function ProgramExit(node) {
            updateExportUsage(node);
            updateImportUsage(node);
            checkExportPresence(node);
          }return ProgramExit;}(),
        ExportDefaultDeclaration: function () {function ExportDefaultDeclaration(node) {
            checkUsage(node, IMPORT_DEFAULT_SPECIFIER);
          }return ExportDefaultDeclaration;}(),
        ExportNamedDeclaration: function () {function ExportNamedDeclaration(node) {
            node.specifiers.forEach(function (specifier) {
              checkUsage(specifier, specifier.exported.name || specifier.exported.value);
            });
            forEachDeclarationIdentifier(node.declaration, function (name) {
              checkUsage(node, name);
            });
          }return ExportNamedDeclaration;}() };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bnVzZWQtbW9kdWxlcy5qcyJdLCJuYW1lcyI6WyJ2YWx1ZXMiLCJPYmplY3QiLCJpbmNsdWRlcyIsIkZ1bmN0aW9uIiwiYmluZCIsInByb3RvdHlwZSIsImNhbGwiLCJBcnJheSIsImZsYXRNYXAiLCJGaWxlRW51bWVyYXRvciIsImxpc3RGaWxlc1RvUHJvY2VzcyIsInJlcXVpcmUiLCJlIiwib3JpZ2luYWxMaXN0RmlsZXNUb1Byb2Nlc3MiLCJzcmMiLCJleHRlbnNpb25zIiwicGF0dGVybnMiLCJjb25jYXQiLCJwYXR0ZXJuIiwibWFwIiwiZXh0ZW5zaW9uIiwidGVzdCIsImZyb20iLCJpdGVyYXRlRmlsZXMiLCJmaWxlUGF0aCIsImlnbm9yZWQiLCJmaWxlbmFtZSIsIkVYUE9SVF9ERUZBVUxUX0RFQ0xBUkFUSU9OIiwiRVhQT1JUX05BTUVEX0RFQ0xBUkFUSU9OIiwiRVhQT1JUX0FMTF9ERUNMQVJBVElPTiIsIklNUE9SVF9ERUNMQVJBVElPTiIsIklNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSIiwiSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSIiwiVkFSSUFCTEVfREVDTEFSQVRJT04iLCJGVU5DVElPTl9ERUNMQVJBVElPTiIsIkNMQVNTX0RFQ0xBUkFUSU9OIiwiSURFTlRJRklFUiIsIk9CSkVDVF9QQVRURVJOIiwiVFNfSU5URVJGQUNFX0RFQ0xBUkFUSU9OIiwiVFNfVFlQRV9BTElBU19ERUNMQVJBVElPTiIsIlRTX0VOVU1fREVDTEFSQVRJT04iLCJERUZBVUxUIiwiZm9yRWFjaERlY2xhcmF0aW9uSWRlbnRpZmllciIsImRlY2xhcmF0aW9uIiwiY2IiLCJ0eXBlIiwiaWQiLCJuYW1lIiwiZGVjbGFyYXRpb25zIiwiZm9yRWFjaCIsImltcG9ydExpc3QiLCJNYXAiLCJleHBvcnRMaXN0IiwidmlzaXRvcktleU1hcCIsImlnbm9yZWRGaWxlcyIsIlNldCIsImZpbGVzT3V0c2lkZVNyYyIsImlzTm9kZU1vZHVsZSIsInBhdGgiLCJyZXNvbHZlRmlsZXMiLCJpZ25vcmVFeHBvcnRzIiwiY29udGV4dCIsInNldHRpbmdzIiwic3JjRmlsZUxpc3QiLCJpZ25vcmVkRmlsZXNMaXN0IiwiYWRkIiwicHJlcGFyZUltcG9ydHNBbmRFeHBvcnRzIiwic3JjRmlsZXMiLCJleHBvcnRBbGwiLCJmaWxlIiwiZXhwb3J0cyIsImltcG9ydHMiLCJjdXJyZW50RXhwb3J0cyIsIkV4cG9ydHMiLCJnZXQiLCJkZXBlbmRlbmNpZXMiLCJyZWV4cG9ydHMiLCJsb2NhbEltcG9ydExpc3QiLCJuYW1lc3BhY2UiLCJ2aXNpdG9yS2V5cyIsInNldCIsImN1cnJlbnRFeHBvcnRBbGwiLCJnZXREZXBlbmRlbmN5IiwiZGVwZW5kZW5jeSIsInZhbHVlIiwia2V5Iiwid2hlcmVVc2VkIiwicmVleHBvcnQiLCJnZXRJbXBvcnQiLCJsb2NhbEltcG9ydCIsImN1cnJlbnRWYWx1ZSIsImxvY2FsIiwiaW1wb3J0ZWRTcGVjaWZpZXJzIiwic3BlY2lmaWVyIiwiaGFzIiwidmFsIiwiY3VycmVudEV4cG9ydCIsImRldGVybWluZVVzYWdlIiwibGlzdFZhbHVlIiwibGlzdEtleSIsImN1cnJlbnRJbXBvcnQiLCJleHBvcnRTdGF0ZW1lbnQiLCJnZXRTcmMiLCJwcm9jZXNzIiwiY3dkIiwibGFzdFByZXBhcmVLZXkiLCJkb1ByZXBhcmF0aW9uIiwicHJlcGFyZUtleSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzb3J0IiwiY2xlYXIiLCJuZXdOYW1lc3BhY2VJbXBvcnRFeGlzdHMiLCJzcGVjaWZpZXJzIiwic29tZSIsIm5ld0RlZmF1bHRJbXBvcnRFeGlzdHMiLCJmaWxlSXNJblBrZyIsInBrZyIsImJhc2VQYXRoIiwiY2hlY2tQa2dGaWVsZFN0cmluZyIsInBrZ0ZpZWxkIiwiY2hlY2tQa2dGaWVsZE9iamVjdCIsInBrZ0ZpZWxkRmlsZXMiLCJjaGVja1BrZ0ZpZWxkIiwiYmluIiwiYnJvd3NlciIsIm1haW4iLCJtb2R1bGUiLCJtZXRhIiwiZG9jcyIsImNhdGVnb3J5IiwiZGVzY3JpcHRpb24iLCJ1cmwiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwidW5pcXVlSXRlbXMiLCJpdGVtcyIsIm1pbkxlbmd0aCIsIm1pc3NpbmdFeHBvcnRzIiwidW51c2VkRXhwb3J0cyIsImFueU9mIiwibWluSXRlbXMiLCJyZXF1aXJlZCIsImNyZWF0ZSIsIm9wdGlvbnMiLCJnZXRQaHlzaWNhbEZpbGVuYW1lIiwiZ2V0RmlsZW5hbWUiLCJjaGVja0V4cG9ydFByZXNlbmNlIiwibm9kZSIsImV4cG9ydENvdW50IiwibmFtZXNwYWNlSW1wb3J0cyIsInNpemUiLCJyZXBvcnQiLCJib2R5IiwiY2hlY2tVc2FnZSIsImV4cG9ydGVkVmFsdWUiLCJleHBvcnRzS2V5IiwidXBkYXRlRXhwb3J0VXNhZ2UiLCJuZXdFeHBvcnRzIiwibmV3RXhwb3J0SWRlbnRpZmllcnMiLCJsZW5ndGgiLCJleHBvcnRlZCIsInVwZGF0ZUltcG9ydFVzYWdlIiwib2xkSW1wb3J0UGF0aHMiLCJvbGROYW1lc3BhY2VJbXBvcnRzIiwibmV3TmFtZXNwYWNlSW1wb3J0cyIsIm9sZEV4cG9ydEFsbCIsIm5ld0V4cG9ydEFsbCIsIm9sZERlZmF1bHRJbXBvcnRzIiwibmV3RGVmYXVsdEltcG9ydHMiLCJvbGRJbXBvcnRzIiwibmV3SW1wb3J0cyIsInByb2Nlc3NEeW5hbWljSW1wb3J0Iiwic291cmNlIiwicCIsIkltcG9ydEV4cHJlc3Npb24iLCJjaGlsZCIsIkNhbGxFeHByZXNzaW9uIiwiY2FsbGVlIiwiYXJndW1lbnRzIiwiYXN0Tm9kZSIsInJlc29sdmVkUGF0aCIsInJhdyIsInJlcGxhY2UiLCJmaWx0ZXIiLCJpbXBvcnRlZCIsIkV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiIsIkV4cG9ydE5hbWVkRGVjbGFyYXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQU1BO0FBQ0Esc0Q7QUFDQSxrRDtBQUNBO0FBQ0EsMkQ7Ozs7OztBQU1BLHlDO0FBQ0EscUMsMlVBakJBOzs7O3VYQVlRQSxNLEdBQVdDLE0sQ0FB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QjtBQUM3Qk0sdUJBQVdOLElBQVgsRUFBaUJwSCx3QkFBakI7QUFDRCxXQVJJO0FBU0wySiw4QkFUSywrQ0FTa0J2QyxJQVRsQixFQVN3QjtBQUMzQkEsaUJBQUtuQyxVQUFMLENBQWdCaEUsT0FBaEIsQ0FBd0IsVUFBQzRDLFNBQUQsRUFBZTtBQUNyQzZELHlCQUFXN0QsU0FBWCxFQUFzQkEsVUFBVW9FLFFBQVYsQ0FBbUJsSCxJQUFuQixJQUEyQjhDLFVBQVVvRSxRQUFWLENBQW1CN0UsS0FBcEU7QUFDRCxhQUZEO0FBR0ExQyx5Q0FBNkIwRyxLQUFLekcsV0FBbEMsRUFBK0MsVUFBQ0ksSUFBRCxFQUFVO0FBQ3ZEMkcseUJBQVdOLElBQVgsRUFBaUJyRyxJQUFqQjtBQUNELGFBRkQ7QUFHRCxXQWhCSSxtQ0FBUDs7QUFrQkQsS0F2aEJjLG1CQUFqQiIsImZpbGUiOiJuby11bnVzZWQtbW9kdWxlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVPdmVydmlldyBFbnN1cmVzIHRoYXQgbW9kdWxlcyBjb250YWluIGV4cG9ydHMgYW5kL29yIGFsbFxuICogbW9kdWxlcyBhcmUgY29uc3VtZWQgd2l0aGluIG90aGVyIG1vZHVsZXMuXG4gKiBAYXV0aG9yIFJlbsOpIEZlcm1hbm5cbiAqL1xuXG5pbXBvcnQgeyBnZXRGaWxlRXh0ZW5zaW9ucyB9IGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvaWdub3JlJztcbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgdmlzaXQgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy92aXNpdCc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgcmVhZFBrZ1VwIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVhZFBrZ1VwJztcblxuY29uc3QgeyB2YWx1ZXMgfSA9IE9iamVjdDtcbmNvbnN0IGluY2x1ZGVzID0gRnVuY3Rpb24uYmluZC5iaW5kKEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsKShBcnJheS5wcm90b3R5cGUuaW5jbHVkZXMpO1xuY29uc3QgZmxhdE1hcCA9IEZ1bmN0aW9uLmJpbmQuYmluZChGdW5jdGlvbi5wcm90b3R5cGUuY2FsbCkoQXJyYXkucHJvdG90eXBlLmZsYXRNYXApO1xuXG5pbXBvcnQgRXhwb3J0cywgeyByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZSB9IGZyb20gJy4uL0V4cG9ydE1hcCc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxubGV0IEZpbGVFbnVtZXJhdG9yO1xubGV0IGxpc3RGaWxlc1RvUHJvY2VzcztcblxudHJ5IHtcbiAgKHsgRmlsZUVudW1lcmF0b3IgfSA9IHJlcXVpcmUoJ2VzbGludC91c2UtYXQteW91ci1vd24tcmlzaycpKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdHJ5IHtcbiAgICAvLyBoYXMgYmVlbiBtb3ZlZCB0byBlc2xpbnQvbGliL2NsaS1lbmdpbmUvZmlsZS1lbnVtZXJhdG9yIGluIHZlcnNpb24gNlxuICAgICh7IEZpbGVFbnVtZXJhdG9yIH0gPSByZXF1aXJlKCdlc2xpbnQvbGliL2NsaS1lbmdpbmUvZmlsZS1lbnVtZXJhdG9yJykpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGVzbGludC9saWIvdXRpbC9nbG9iLXV0aWwgaGFzIGJlZW4gbW92ZWQgdG8gZXNsaW50L2xpYi91dGlsL2dsb2ItdXRpbHMgd2l0aCB2ZXJzaW9uIDUuM1xuICAgICAgY29uc3QgeyBsaXN0RmlsZXNUb1Byb2Nlc3M6IG9yaWdpbmFsTGlzdEZpbGVzVG9Qcm9jZXNzIH0gPSByZXF1aXJlKCdlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlscycpO1xuXG4gICAgICAvLyBQcmV2ZW50IHBhc3NpbmcgaW52YWxpZCBvcHRpb25zIChleHRlbnNpb25zIGFycmF5KSB0byBvbGQgdmVyc2lvbnMgb2YgdGhlIGZ1bmN0aW9uLlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2VzbGludC9lc2xpbnQvYmxvYi92NS4xNi4wL2xpYi91dGlsL2dsb2ItdXRpbHMuanMjTDE3OC1MMjgwXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZXNsaW50L2VzbGludC9ibG9iL3Y1LjIuMC9saWIvdXRpbC9nbG9iLXV0aWwuanMjTDE3NC1MMjY5XG4gICAgICBsaXN0RmlsZXNUb1Byb2Nlc3MgPSBmdW5jdGlvbiAoc3JjLCBleHRlbnNpb25zKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcyhzcmMsIHtcbiAgICAgICAgICBleHRlbnNpb25zLFxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgeyBsaXN0RmlsZXNUb1Byb2Nlc3M6IG9yaWdpbmFsTGlzdEZpbGVzVG9Qcm9jZXNzIH0gPSByZXF1aXJlKCdlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlsJyk7XG5cbiAgICAgIGxpc3RGaWxlc1RvUHJvY2VzcyA9IGZ1bmN0aW9uIChzcmMsIGV4dGVuc2lvbnMpIHtcbiAgICAgICAgY29uc3QgcGF0dGVybnMgPSBzcmMuY29uY2F0KGZsYXRNYXAoc3JjLCAocGF0dGVybikgPT4gZXh0ZW5zaW9ucy5tYXAoKGV4dGVuc2lvbikgPT4gKC9cXCpcXCp8XFwqXFwuLykudGVzdChwYXR0ZXJuKSA/IHBhdHRlcm4gOiBgJHtwYXR0ZXJufS8qKi8qJHtleHRlbnNpb259YCkpKTtcblxuICAgICAgICByZXR1cm4gb3JpZ2luYWxMaXN0RmlsZXNUb1Byb2Nlc3MocGF0dGVybnMpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cblxuaWYgKEZpbGVFbnVtZXJhdG9yKSB7XG4gIGxpc3RGaWxlc1RvUHJvY2VzcyA9IGZ1bmN0aW9uIChzcmMsIGV4dGVuc2lvbnMpIHtcbiAgICBjb25zdCBlID0gbmV3IEZpbGVFbnVtZXJhdG9yKHtcbiAgICAgIGV4dGVuc2lvbnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gQXJyYXkuZnJvbShlLml0ZXJhdGVGaWxlcyhzcmMpLCAoeyBmaWxlUGF0aCwgaWdub3JlZCB9KSA9PiAoe1xuICAgICAgaWdub3JlZCxcbiAgICAgIGZpbGVuYW1lOiBmaWxlUGF0aCxcbiAgICB9KSk7XG4gIH07XG59XG5cbmNvbnN0IEVYUE9SVF9ERUZBVUxUX0RFQ0xBUkFUSU9OID0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic7XG5jb25zdCBFWFBPUlRfTkFNRURfREVDTEFSQVRJT04gPSAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic7XG5jb25zdCBFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OID0gJ0V4cG9ydEFsbERlY2xhcmF0aW9uJztcbmNvbnN0IElNUE9SVF9ERUNMQVJBVElPTiA9ICdJbXBvcnREZWNsYXJhdGlvbic7XG5jb25zdCBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiA9ICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInO1xuY29uc3QgSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSID0gJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInO1xuY29uc3QgVkFSSUFCTEVfREVDTEFSQVRJT04gPSAnVmFyaWFibGVEZWNsYXJhdGlvbic7XG5jb25zdCBGVU5DVElPTl9ERUNMQVJBVElPTiA9ICdGdW5jdGlvbkRlY2xhcmF0aW9uJztcbmNvbnN0IENMQVNTX0RFQ0xBUkFUSU9OID0gJ0NsYXNzRGVjbGFyYXRpb24nO1xuY29uc3QgSURFTlRJRklFUiA9ICdJZGVudGlmaWVyJztcbmNvbnN0IE9CSkVDVF9QQVRURVJOID0gJ09iamVjdFBhdHRlcm4nO1xuY29uc3QgVFNfSU5URVJGQUNFX0RFQ0xBUkFUSU9OID0gJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nO1xuY29uc3QgVFNfVFlQRV9BTElBU19ERUNMQVJBVElPTiA9ICdUU1R5cGVBbGlhc0RlY2xhcmF0aW9uJztcbmNvbnN0IFRTX0VOVU1fREVDTEFSQVRJT04gPSAnVFNFbnVtRGVjbGFyYXRpb24nO1xuY29uc3QgREVGQVVMVCA9ICdkZWZhdWx0JztcblxuZnVuY3Rpb24gZm9yRWFjaERlY2xhcmF0aW9uSWRlbnRpZmllcihkZWNsYXJhdGlvbiwgY2IpIHtcbiAgaWYgKGRlY2xhcmF0aW9uKSB7XG4gICAgaWYgKFxuICAgICAgZGVjbGFyYXRpb24udHlwZSA9PT0gRlVOQ1RJT05fREVDTEFSQVRJT05cbiAgICAgIHx8IGRlY2xhcmF0aW9uLnR5cGUgPT09IENMQVNTX0RFQ0xBUkFUSU9OXG4gICAgICB8fCBkZWNsYXJhdGlvbi50eXBlID09PSBUU19JTlRFUkZBQ0VfREVDTEFSQVRJT05cbiAgICAgIHx8IGRlY2xhcmF0aW9uLnR5cGUgPT09IFRTX1RZUEVfQUxJQVNfREVDTEFSQVRJT05cbiAgICAgIHx8IGRlY2xhcmF0aW9uLnR5cGUgPT09IFRTX0VOVU1fREVDTEFSQVRJT05cbiAgICApIHtcbiAgICAgIGNiKGRlY2xhcmF0aW9uLmlkLm5hbWUpO1xuICAgIH0gZWxzZSBpZiAoZGVjbGFyYXRpb24udHlwZSA9PT0gVkFSSUFCTEVfREVDTEFSQVRJT04pIHtcbiAgICAgIGRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKCh7IGlkIH0pID0+IHtcbiAgICAgICAgaWYgKGlkLnR5cGUgPT09IE9CSkVDVF9QQVRURVJOKSB7XG4gICAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoaWQsIChwYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICBpZiAocGF0dGVybi50eXBlID09PSBJREVOVElGSUVSKSB7XG4gICAgICAgICAgICAgIGNiKHBhdHRlcm4ubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2IoaWQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIExpc3Qgb2YgaW1wb3J0cyBwZXIgZmlsZS5cbiAqXG4gKiBSZXByZXNlbnRlZCBieSBhIHR3by1sZXZlbCBNYXAgdG8gYSBTZXQgb2YgaWRlbnRpZmllcnMuIFRoZSB1cHBlci1sZXZlbCBNYXBcbiAqIGtleXMgYXJlIHRoZSBwYXRocyB0byB0aGUgbW9kdWxlcyBjb250YWluaW5nIHRoZSBpbXBvcnRzLCB3aGlsZSB0aGVcbiAqIGxvd2VyLWxldmVsIE1hcCBrZXlzIGFyZSB0aGUgcGF0aHMgdG8gdGhlIGZpbGVzIHdoaWNoIGFyZSBiZWluZyBpbXBvcnRlZFxuICogZnJvbS4gTGFzdGx5LCB0aGUgU2V0IG9mIGlkZW50aWZpZXJzIGNvbnRhaW5zIGVpdGhlciBuYW1lcyBiZWluZyBpbXBvcnRlZFxuICogb3IgYSBzcGVjaWFsIEFTVCBub2RlIG5hbWUgbGlzdGVkIGFib3ZlIChlLmcgSW1wb3J0RGVmYXVsdFNwZWNpZmllcikuXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIHdlIGhhdmUgYSBmaWxlIG5hbWVkIGZvby5qcyBjb250YWluaW5nOlxuICpcbiAqICAgaW1wb3J0IHsgbzIgfSBmcm9tICcuL2Jhci5qcyc7XG4gKlxuICogVGhlbiB3ZSB3aWxsIGhhdmUgYSBzdHJ1Y3R1cmUgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqICAgTWFwIHsgJ2Zvby5qcycgPT4gTWFwIHsgJ2Jhci5qcycgPT4gU2V0IHsgJ28yJyB9IH0gfVxuICpcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+fVxuICovXG5jb25zdCBpbXBvcnRMaXN0ID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIExpc3Qgb2YgZXhwb3J0cyBwZXIgZmlsZS5cbiAqXG4gKiBSZXByZXNlbnRlZCBieSBhIHR3by1sZXZlbCBNYXAgdG8gYW4gb2JqZWN0IG9mIG1ldGFkYXRhLiBUaGUgdXBwZXItbGV2ZWwgTWFwXG4gKiBrZXlzIGFyZSB0aGUgcGF0aHMgdG8gdGhlIG1vZHVsZXMgY29udGFpbmluZyB0aGUgZXhwb3J0cywgd2hpbGUgdGhlXG4gKiBsb3dlci1sZXZlbCBNYXAga2V5cyBhcmUgdGhlIHNwZWNpZmljIGlkZW50aWZpZXJzIG9yIHNwZWNpYWwgQVNUIG5vZGUgbmFtZXNcbiAqIGJlaW5nIGV4cG9ydGVkLiBUaGUgbGVhZi1sZXZlbCBtZXRhZGF0YSBvYmplY3QgYXQgdGhlIG1vbWVudCBvbmx5IGNvbnRhaW5zIGFcbiAqIGB3aGVyZVVzZWRgIHByb3BlcnR5LCB3aGljaCBjb250YWlucyBhIFNldCBvZiBwYXRocyB0byBtb2R1bGVzIHRoYXQgaW1wb3J0XG4gKiB0aGUgbmFtZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgaWYgd2UgaGF2ZSBhIGZpbGUgbmFtZWQgYmFyLmpzIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBleHBvcnRzOlxuICpcbiAqICAgY29uc3QgbzIgPSAnYmFyJztcbiAqICAgZXhwb3J0IHsgbzIgfTtcbiAqXG4gKiBBbmQgYSBmaWxlIG5hbWVkIGZvby5qcyBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcgaW1wb3J0OlxuICpcbiAqICAgaW1wb3J0IHsgbzIgfSBmcm9tICcuL2Jhci5qcyc7XG4gKlxuICogVGhlbiB3ZSB3aWxsIGhhdmUgYSBzdHJ1Y3R1cmUgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqICAgTWFwIHsgJ2Jhci5qcycgPT4gTWFwIHsgJ28yJyA9PiB7IHdoZXJlVXNlZDogU2V0IHsgJ2Zvby5qcycgfSB9IH0gfVxuICpcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBvYmplY3Q+Pn1cbiAqL1xuY29uc3QgZXhwb3J0TGlzdCA9IG5ldyBNYXAoKTtcblxuY29uc3QgdmlzaXRvcktleU1hcCA9IG5ldyBNYXAoKTtcblxuY29uc3QgaWdub3JlZEZpbGVzID0gbmV3IFNldCgpO1xuY29uc3QgZmlsZXNPdXRzaWRlU3JjID0gbmV3IFNldCgpO1xuXG5jb25zdCBpc05vZGVNb2R1bGUgPSAocGF0aCkgPT4gKC9cXC8obm9kZV9tb2R1bGVzKVxcLy8pLnRlc3QocGF0aCk7XG5cbi8qKlxuICogcmVhZCBhbGwgZmlsZXMgbWF0Y2hpbmcgdGhlIHBhdHRlcm5zIGluIHNyYyBhbmQgaWdub3JlRXhwb3J0c1xuICpcbiAqIHJldHVybiBhbGwgZmlsZXMgbWF0Y2hpbmcgc3JjIHBhdHRlcm4sIHdoaWNoIGFyZSBub3QgbWF0Y2hpbmcgdGhlIGlnbm9yZUV4cG9ydHMgcGF0dGVyblxuICovXG5jb25zdCByZXNvbHZlRmlsZXMgPSAoc3JjLCBpZ25vcmVFeHBvcnRzLCBjb250ZXh0KSA9PiB7XG4gIGNvbnN0IGV4dGVuc2lvbnMgPSBBcnJheS5mcm9tKGdldEZpbGVFeHRlbnNpb25zKGNvbnRleHQuc2V0dGluZ3MpKTtcblxuICBjb25zdCBzcmNGaWxlTGlzdCA9IGxpc3RGaWxlc1RvUHJvY2VzcyhzcmMsIGV4dGVuc2lvbnMpO1xuXG4gIC8vIHByZXBhcmUgbGlzdCBvZiBpZ25vcmVkIGZpbGVzXG4gIGNvbnN0IGlnbm9yZWRGaWxlc0xpc3QgPSBsaXN0RmlsZXNUb1Byb2Nlc3MoaWdub3JlRXhwb3J0cywgZXh0ZW5zaW9ucyk7XG4gIGlnbm9yZWRGaWxlc0xpc3QuZm9yRWFjaCgoeyBmaWxlbmFtZSB9KSA9PiBpZ25vcmVkRmlsZXMuYWRkKGZpbGVuYW1lKSk7XG5cbiAgLy8gcHJlcGFyZSBsaXN0IG9mIHNvdXJjZSBmaWxlcywgZG9uJ3QgY29uc2lkZXIgZmlsZXMgZnJvbSBub2RlX21vZHVsZXNcblxuICByZXR1cm4gbmV3IFNldChcbiAgICBmbGF0TWFwKHNyY0ZpbGVMaXN0LCAoeyBmaWxlbmFtZSB9KSA9PiBpc05vZGVNb2R1bGUoZmlsZW5hbWUpID8gW10gOiBmaWxlbmFtZSksXG4gICk7XG59O1xuXG4vKipcbiAqIHBhcnNlIGFsbCBzb3VyY2UgZmlsZXMgYW5kIGJ1aWxkIHVwIDIgbWFwcyBjb250YWluaW5nIHRoZSBleGlzdGluZyBpbXBvcnRzIGFuZCBleHBvcnRzXG4gKi9cbmNvbnN0IHByZXBhcmVJbXBvcnRzQW5kRXhwb3J0cyA9IChzcmNGaWxlcywgY29udGV4dCkgPT4ge1xuICBjb25zdCBleHBvcnRBbGwgPSBuZXcgTWFwKCk7XG4gIHNyY0ZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICBjb25zdCBleHBvcnRzID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgY3VycmVudEV4cG9ydHMgPSBFeHBvcnRzLmdldChmaWxlLCBjb250ZXh0KTtcbiAgICBpZiAoY3VycmVudEV4cG9ydHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZGVwZW5kZW5jaWVzLFxuICAgICAgICByZWV4cG9ydHMsXG4gICAgICAgIGltcG9ydHM6IGxvY2FsSW1wb3J0TGlzdCxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICB2aXNpdG9yS2V5cyxcbiAgICAgIH0gPSBjdXJyZW50RXhwb3J0cztcblxuICAgICAgdmlzaXRvcktleU1hcC5zZXQoZmlsZSwgdmlzaXRvcktleXMpO1xuICAgICAgLy8gZGVwZW5kZW5jaWVzID09PSBleHBvcnQgKiBmcm9tXG4gICAgICBjb25zdCBjdXJyZW50RXhwb3J0QWxsID0gbmV3IFNldCgpO1xuICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGdldERlcGVuZGVuY3kpID0+IHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IGdldERlcGVuZGVuY3koKTtcbiAgICAgICAgaWYgKGRlcGVuZGVuY3kgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50RXhwb3J0QWxsLmFkZChkZXBlbmRlbmN5LnBhdGgpO1xuICAgICAgfSk7XG4gICAgICBleHBvcnRBbGwuc2V0KGZpbGUsIGN1cnJlbnRFeHBvcnRBbGwpO1xuXG4gICAgICByZWV4cG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoa2V5ID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgZXhwb3J0cy5zZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWV4cG9ydCA9ICB2YWx1ZS5nZXRJbXBvcnQoKTtcbiAgICAgICAgaWYgKCFyZWV4cG9ydCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9jYWxJbXBvcnQgPSBpbXBvcnRzLmdldChyZWV4cG9ydC5wYXRoKTtcbiAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlLmxvY2FsID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgY3VycmVudFZhbHVlID0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IHZhbHVlLmxvY2FsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxJbXBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWxJbXBvcnQgPSBuZXcgU2V0KFsuLi5sb2NhbEltcG9ydCwgY3VycmVudFZhbHVlXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxJbXBvcnQgPSBuZXcgU2V0KFtjdXJyZW50VmFsdWVdKTtcbiAgICAgICAgfVxuICAgICAgICBpbXBvcnRzLnNldChyZWV4cG9ydC5wYXRoLCBsb2NhbEltcG9ydCk7XG4gICAgICB9KTtcblxuICAgICAgbG9jYWxJbXBvcnRMaXN0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKGlzTm9kZU1vZHVsZShrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxvY2FsSW1wb3J0ID0gaW1wb3J0cy5nZXQoa2V5KSB8fCBuZXcgU2V0KCk7XG4gICAgICAgIHZhbHVlLmRlY2xhcmF0aW9ucy5mb3JFYWNoKCh7IGltcG9ydGVkU3BlY2lmaWVycyB9KSA9PiB7XG4gICAgICAgICAgaW1wb3J0ZWRTcGVjaWZpZXJzLmZvckVhY2goKHNwZWNpZmllcikgPT4ge1xuICAgICAgICAgICAgbG9jYWxJbXBvcnQuYWRkKHNwZWNpZmllcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbXBvcnRzLnNldChrZXksIGxvY2FsSW1wb3J0KTtcbiAgICAgIH0pO1xuICAgICAgaW1wb3J0TGlzdC5zZXQoZmlsZSwgaW1wb3J0cyk7XG5cbiAgICAgIC8vIGJ1aWxkIHVwIGV4cG9ydCBsaXN0IG9ubHksIGlmIGZpbGUgaXMgbm90IGlnbm9yZWRcbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG5hbWVzcGFjZS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmIChrZXkgPT09IERFRkFVTFQpIHtcbiAgICAgICAgICBleHBvcnRzLnNldChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIsIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhwb3J0cy5zZXQoa2V5LCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgZXhwb3J0cy5zZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTiwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICBleHBvcnRzLnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICBleHBvcnRMaXN0LnNldChmaWxlLCBleHBvcnRzKTtcbiAgfSk7XG4gIGV4cG9ydEFsbC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgdmFsdWUuZm9yRWFjaCgodmFsKSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50RXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbCk7XG4gICAgICBpZiAoY3VycmVudEV4cG9ydHMpIHtcbiAgICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGN1cnJlbnRFeHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcbiAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuYWRkKGtleSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiB0cmF2ZXJzZSB0aHJvdWdoIGFsbCBpbXBvcnRzIGFuZCBhZGQgdGhlIHJlc3BlY3RpdmUgcGF0aCB0byB0aGUgd2hlcmVVc2VkLWxpc3RcbiAqIG9mIHRoZSBjb3JyZXNwb25kaW5nIGV4cG9ydFxuICovXG5jb25zdCBkZXRlcm1pbmVVc2FnZSA9ICgpID0+IHtcbiAgaW1wb3J0TGlzdC5mb3JFYWNoKChsaXN0VmFsdWUsIGxpc3RLZXkpID0+IHtcbiAgICBsaXN0VmFsdWUuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KGtleSk7XG4gICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhbHVlLmZvckVhY2goKGN1cnJlbnRJbXBvcnQpID0+IHtcbiAgICAgICAgICBsZXQgc3BlY2lmaWVyO1xuICAgICAgICAgIGlmIChjdXJyZW50SW1wb3J0ID09PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUikge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVI7XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW1wb3J0ID09PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpIHtcbiAgICAgICAgICAgIHNwZWNpZmllciA9IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gY3VycmVudEltcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBzcGVjaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRTdGF0ZW1lbnQgPSBleHBvcnRzLmdldChzcGVjaWZpZXIpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRTdGF0ZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHsgd2hlcmVVc2VkIH0gPSBleHBvcnRTdGF0ZW1lbnQ7XG4gICAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQobGlzdEtleSk7XG4gICAgICAgICAgICAgIGV4cG9ydHMuc2V0KHNwZWNpZmllciwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59O1xuXG5jb25zdCBnZXRTcmMgPSAoc3JjKSA9PiB7XG4gIGlmIChzcmMpIHtcbiAgICByZXR1cm4gc3JjO1xuICB9XG4gIHJldHVybiBbcHJvY2Vzcy5jd2QoKV07XG59O1xuXG4vKipcbiAqIHByZXBhcmUgdGhlIGxpc3RzIG9mIGV4aXN0aW5nIGltcG9ydHMgYW5kIGV4cG9ydHMgLSBzaG91bGQgb25seSBiZSBleGVjdXRlZCBvbmNlIGF0XG4gKiB0aGUgc3RhcnQgb2YgYSBuZXcgZXNsaW50IHJ1blxuICovXG5sZXQgc3JjRmlsZXM7XG5sZXQgbGFzdFByZXBhcmVLZXk7XG5jb25zdCBkb1ByZXBhcmF0aW9uID0gKHNyYywgaWdub3JlRXhwb3J0cywgY29udGV4dCkgPT4ge1xuICBjb25zdCBwcmVwYXJlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgIHNyYzogKHNyYyB8fCBbXSkuc29ydCgpLFxuICAgIGlnbm9yZUV4cG9ydHM6IChpZ25vcmVFeHBvcnRzIHx8IFtdKS5zb3J0KCksXG4gICAgZXh0ZW5zaW9uczogQXJyYXkuZnJvbShnZXRGaWxlRXh0ZW5zaW9ucyhjb250ZXh0LnNldHRpbmdzKSkuc29ydCgpLFxuICB9KTtcbiAgaWYgKHByZXBhcmVLZXkgPT09IGxhc3RQcmVwYXJlS2V5KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaW1wb3J0TGlzdC5jbGVhcigpO1xuICBleHBvcnRMaXN0LmNsZWFyKCk7XG4gIGlnbm9yZWRGaWxlcy5jbGVhcigpO1xuICBmaWxlc091dHNpZGVTcmMuY2xlYXIoKTtcblxuICBzcmNGaWxlcyA9IHJlc29sdmVGaWxlcyhnZXRTcmMoc3JjKSwgaWdub3JlRXhwb3J0cywgY29udGV4dCk7XG4gIHByZXBhcmVJbXBvcnRzQW5kRXhwb3J0cyhzcmNGaWxlcywgY29udGV4dCk7XG4gIGRldGVybWluZVVzYWdlKCk7XG4gIGxhc3RQcmVwYXJlS2V5ID0gcHJlcGFyZUtleTtcbn07XG5cbmNvbnN0IG5ld05hbWVzcGFjZUltcG9ydEV4aXN0cyA9IChzcGVjaWZpZXJzKSA9PiBzcGVjaWZpZXJzLnNvbWUoKHsgdHlwZSB9KSA9PiB0eXBlID09PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUik7XG5cbmNvbnN0IG5ld0RlZmF1bHRJbXBvcnRFeGlzdHMgPSAoc3BlY2lmaWVycykgPT4gc3BlY2lmaWVycy5zb21lKCh7IHR5cGUgfSkgPT4gdHlwZSA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKTtcblxuY29uc3QgZmlsZUlzSW5Qa2cgPSAoZmlsZSkgPT4ge1xuICBjb25zdCB7IHBhdGgsIHBrZyB9ID0gcmVhZFBrZ1VwKHsgY3dkOiBmaWxlIH0pO1xuICBjb25zdCBiYXNlUGF0aCA9IGRpcm5hbWUocGF0aCk7XG5cbiAgY29uc3QgY2hlY2tQa2dGaWVsZFN0cmluZyA9IChwa2dGaWVsZCkgPT4ge1xuICAgIGlmIChqb2luKGJhc2VQYXRoLCBwa2dGaWVsZCkgPT09IGZpbGUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBjaGVja1BrZ0ZpZWxkT2JqZWN0ID0gKHBrZ0ZpZWxkKSA9PiB7XG4gICAgY29uc3QgcGtnRmllbGRGaWxlcyA9IGZsYXRNYXAodmFsdWVzKHBrZ0ZpZWxkKSwgKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyA/IFtdIDogam9pbihiYXNlUGF0aCwgdmFsdWUpKTtcblxuICAgIGlmIChpbmNsdWRlcyhwa2dGaWVsZEZpbGVzLCBmaWxlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGNoZWNrUGtnRmllbGQgPSAocGtnRmllbGQpID0+IHtcbiAgICBpZiAodHlwZW9mIHBrZ0ZpZWxkID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGNoZWNrUGtnRmllbGRTdHJpbmcocGtnRmllbGQpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcGtnRmllbGQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gY2hlY2tQa2dGaWVsZE9iamVjdChwa2dGaWVsZCk7XG4gICAgfVxuICB9O1xuXG4gIGlmIChwa2cucHJpdmF0ZSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwa2cuYmluKSB7XG4gICAgaWYgKGNoZWNrUGtnRmllbGQocGtnLmJpbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChwa2cuYnJvd3Nlcikge1xuICAgIGlmIChjaGVja1BrZ0ZpZWxkKHBrZy5icm93c2VyKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKHBrZy5tYWluKSB7XG4gICAgaWYgKGNoZWNrUGtnRmllbGRTdHJpbmcocGtnLm1haW4pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICBjYXRlZ29yeTogJ0hlbHBmdWwgd2FybmluZ3MnLFxuICAgICAgZGVzY3JpcHRpb246ICdGb3JiaWQgbW9kdWxlcyB3aXRob3V0IGV4cG9ydHMsIG9yIGV4cG9ydHMgd2l0aG91dCBtYXRjaGluZyBpbXBvcnQgaW4gYW5vdGhlciBtb2R1bGUuJyxcbiAgICAgIHVybDogZG9jc1VybCgnbm8tdW51c2VkLW1vZHVsZXMnKSxcbiAgICB9LFxuICAgIHNjaGVtYTogW3tcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgc3JjOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdmaWxlcy9wYXRocyB0byBiZSBhbmFseXplZCAob25seSBmb3IgdW51c2VkIGV4cG9ydHMpJyxcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIHVuaXF1ZUl0ZW1zOiB0cnVlLFxuICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBpZ25vcmVFeHBvcnRzOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdmaWxlcy9wYXRocyBmb3Igd2hpY2ggdW51c2VkIGV4cG9ydHMgd2lsbCBub3QgYmUgcmVwb3J0ZWQgKGUuZyBtb2R1bGUgZW50cnkgcG9pbnRzKScsXG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICB1bmlxdWVJdGVtczogdHJ1ZSxcbiAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBtaW5MZW5ndGg6IDEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWlzc2luZ0V4cG9ydHM6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ3JlcG9ydCBtb2R1bGVzIHdpdGhvdXQgYW55IGV4cG9ydHMnLFxuICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgICAgdW51c2VkRXhwb3J0czoge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAncmVwb3J0IGV4cG9ydHMgd2l0aG91dCBhbnkgdXNhZ2UnLFxuICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBhbnlPZjogW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgdW51c2VkRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgICAgIHNyYzoge1xuICAgICAgICAgICAgICBtaW5JdGVtczogMSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXF1aXJlZDogWyd1bnVzZWRFeHBvcnRzJ10sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlcXVpcmVkOiBbJ21pc3NpbmdFeHBvcnRzJ10sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH1dLFxuICB9LFxuXG4gIGNyZWF0ZShjb250ZXh0KSB7XG4gICAgY29uc3Qge1xuICAgICAgc3JjLFxuICAgICAgaWdub3JlRXhwb3J0cyA9IFtdLFxuICAgICAgbWlzc2luZ0V4cG9ydHMsXG4gICAgICB1bnVzZWRFeHBvcnRzLFxuICAgIH0gPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge307XG5cbiAgICBpZiAodW51c2VkRXhwb3J0cykge1xuICAgICAgZG9QcmVwYXJhdGlvbihzcmMsIGlnbm9yZUV4cG9ydHMsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSBjb250ZXh0LmdldFBoeXNpY2FsRmlsZW5hbWUgPyBjb250ZXh0LmdldFBoeXNpY2FsRmlsZW5hbWUoKSA6IGNvbnRleHQuZ2V0RmlsZW5hbWUoKTtcblxuICAgIGNvbnN0IGNoZWNrRXhwb3J0UHJlc2VuY2UgPSAobm9kZSkgPT4ge1xuICAgICAgaWYgKCFtaXNzaW5nRXhwb3J0cykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXhwb3J0Q291bnQgPSBleHBvcnRMaXN0LmdldChmaWxlKTtcbiAgICAgIGNvbnN0IGV4cG9ydEFsbCA9IGV4cG9ydENvdW50LmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcbiAgICAgIGNvbnN0IG5hbWVzcGFjZUltcG9ydHMgPSBleHBvcnRDb3VudC5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpO1xuXG4gICAgICBleHBvcnRDb3VudC5kZWxldGUoRVhQT1JUX0FMTF9ERUNMQVJBVElPTik7XG4gICAgICBleHBvcnRDb3VudC5kZWxldGUoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpO1xuICAgICAgaWYgKGV4cG9ydENvdW50LnNpemUgPCAxKSB7XG4gICAgICAgIC8vIG5vZGUuYm9keVswXSA9PT0gJ3VuZGVmaW5lZCcgb25seSBoYXBwZW5zLCBpZiBldmVyeXRoaW5nIGlzIGNvbW1lbnRlZCBvdXQgaW4gdGhlIGZpbGVcbiAgICAgICAgLy8gYmVpbmcgbGludGVkXG4gICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUuYm9keVswXSA/IG5vZGUuYm9keVswXSA6IG5vZGUsICdObyBleHBvcnRzIGZvdW5kJyk7XG4gICAgICB9XG4gICAgICBleHBvcnRDb3VudC5zZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTiwgZXhwb3J0QWxsKTtcbiAgICAgIGV4cG9ydENvdW50LnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgbmFtZXNwYWNlSW1wb3J0cyk7XG4gICAgfTtcblxuICAgIGNvbnN0IGNoZWNrVXNhZ2UgPSAobm9kZSwgZXhwb3J0ZWRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKCF1bnVzZWRFeHBvcnRzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlnbm9yZWRGaWxlcy5oYXMoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmlsZUlzSW5Qa2coZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmlsZXNPdXRzaWRlU3JjLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIG1ha2Ugc3VyZSBmaWxlIHRvIGJlIGxpbnRlZCBpcyBpbmNsdWRlZCBpbiBzb3VyY2UgZmlsZXNcbiAgICAgIGlmICghc3JjRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHNyY0ZpbGVzID0gcmVzb2x2ZUZpbGVzKGdldFNyYyhzcmMpLCBpZ25vcmVFeHBvcnRzLCBjb250ZXh0KTtcbiAgICAgICAgaWYgKCFzcmNGaWxlcy5oYXMoZmlsZSkpIHtcbiAgICAgICAgICBmaWxlc091dHNpZGVTcmMuYWRkKGZpbGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQoZmlsZSk7XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZTogZXhwb3J0ICogZnJvbVxuICAgICAgY29uc3QgZXhwb3J0QWxsID0gZXhwb3J0cy5nZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTik7XG4gICAgICBpZiAodHlwZW9mIGV4cG9ydEFsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZXhwb3J0ZWRWYWx1ZSAhPT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKSB7XG4gICAgICAgIGlmIChleHBvcnRBbGwud2hlcmVVc2VkLnNpemUgPiAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZTogbmFtZXNwYWNlIGltcG9ydFxuICAgICAgY29uc3QgbmFtZXNwYWNlSW1wb3J0cyA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlSW1wb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZUltcG9ydHMud2hlcmVVc2VkLnNpemUgPiAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGV4cG9ydHNMaXN0IHdpbGwgYWx3YXlzIG1hcCBhbnkgaW1wb3J0ZWQgdmFsdWUgb2YgJ2RlZmF1bHQnIHRvICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJ1xuICAgICAgY29uc3QgZXhwb3J0c0tleSA9IGV4cG9ydGVkVmFsdWUgPT09IERFRkFVTFQgPyBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIgOiBleHBvcnRlZFZhbHVlO1xuXG4gICAgICBjb25zdCBleHBvcnRTdGF0ZW1lbnQgPSBleHBvcnRzLmdldChleHBvcnRzS2V5KTtcblxuICAgICAgY29uc3QgdmFsdWUgPSBleHBvcnRzS2V5ID09PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIgPyBERUZBVUxUIDogZXhwb3J0c0tleTtcblxuICAgICAgaWYgKHR5cGVvZiBleHBvcnRTdGF0ZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmIChleHBvcnRTdGF0ZW1lbnQud2hlcmVVc2VkLnNpemUgPCAxKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgYGV4cG9ydGVkIGRlY2xhcmF0aW9uICcke3ZhbHVlfScgbm90IHVzZWQgd2l0aGluIG90aGVyIG1vZHVsZXNgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgYGV4cG9ydGVkIGRlY2xhcmF0aW9uICcke3ZhbHVlfScgbm90IHVzZWQgd2l0aGluIG90aGVyIG1vZHVsZXNgLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBvbmx5IHVzZWZ1bCBmb3IgdG9vbHMgbGlrZSB2c2NvZGUtZXNsaW50XG4gICAgICpcbiAgICAgKiB1cGRhdGUgbGlzdHMgb2YgZXhpc3RpbmcgZXhwb3J0cyBkdXJpbmcgcnVudGltZVxuICAgICAqL1xuICAgIGNvbnN0IHVwZGF0ZUV4cG9ydFVzYWdlID0gKG5vZGUpID0+IHtcbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldChmaWxlKTtcblxuICAgICAgLy8gbmV3IG1vZHVsZSBoYXMgYmVlbiBjcmVhdGVkIGR1cmluZyBydW50aW1lXG4gICAgICAvLyBpbmNsdWRlIGl0IGluIGZ1cnRoZXIgcHJvY2Vzc2luZ1xuICAgICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBleHBvcnRzID0gbmV3IE1hcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdFeHBvcnRzID0gbmV3IE1hcCgpO1xuICAgICAgY29uc3QgbmV3RXhwb3J0SWRlbnRpZmllcnMgPSBuZXcgU2V0KCk7XG5cbiAgICAgIG5vZGUuYm9keS5mb3JFYWNoKCh7IHR5cGUsIGRlY2xhcmF0aW9uLCBzcGVjaWZpZXJzIH0pID0+IHtcbiAgICAgICAgaWYgKHR5cGUgPT09IEVYUE9SVF9ERUZBVUxUX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgbmV3RXhwb3J0SWRlbnRpZmllcnMuYWRkKElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09IEVYUE9SVF9OQU1FRF9ERUNMQVJBVElPTikge1xuICAgICAgICAgIGlmIChzcGVjaWZpZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNwZWNpZmllcnMuZm9yRWFjaCgoc3BlY2lmaWVyKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuZXhwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5hZGQoc3BlY2lmaWVyLmV4cG9ydGVkLm5hbWUgfHwgc3BlY2lmaWVyLmV4cG9ydGVkLnZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvckVhY2hEZWNsYXJhdGlvbklkZW50aWZpZXIoZGVjbGFyYXRpb24sIChuYW1lKSA9PiB7XG4gICAgICAgICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5hZGQobmFtZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBvbGQgZXhwb3J0cyBleGlzdCB3aXRoaW4gbGlzdCBvZiBuZXcgZXhwb3J0cyBpZGVudGlmaWVyczogYWRkIHRvIG1hcCBvZiBuZXcgZXhwb3J0c1xuICAgICAgZXhwb3J0cy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmIChuZXdFeHBvcnRJZGVudGlmaWVycy5oYXMoa2V5KSkge1xuICAgICAgICAgIG5ld0V4cG9ydHMuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gbmV3IGV4cG9ydCBpZGVudGlmaWVycyBhZGRlZDogYWRkIHRvIG1hcCBvZiBuZXcgZXhwb3J0c1xuICAgICAgbmV3RXhwb3J0SWRlbnRpZmllcnMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICghZXhwb3J0cy5oYXMoa2V5KSkge1xuICAgICAgICAgIG5ld0V4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIHByZXNlcnZlIGluZm9ybWF0aW9uIGFib3V0IG5hbWVzcGFjZSBpbXBvcnRzXG4gICAgICBjb25zdCBleHBvcnRBbGwgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcbiAgICAgIGxldCBuYW1lc3BhY2VJbXBvcnRzID0gZXhwb3J0cy5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpO1xuXG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZUltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG5hbWVzcGFjZUltcG9ydHMgPSB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH07XG4gICAgICB9XG5cbiAgICAgIG5ld0V4cG9ydHMuc2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04sIGV4cG9ydEFsbCk7XG4gICAgICBuZXdFeHBvcnRzLnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgbmFtZXNwYWNlSW1wb3J0cyk7XG4gICAgICBleHBvcnRMaXN0LnNldChmaWxlLCBuZXdFeHBvcnRzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogb25seSB1c2VmdWwgZm9yIHRvb2xzIGxpa2UgdnNjb2RlLWVzbGludFxuICAgICAqXG4gICAgICogdXBkYXRlIGxpc3RzIG9mIGV4aXN0aW5nIGltcG9ydHMgZHVyaW5nIHJ1bnRpbWVcbiAgICAgKi9cbiAgICBjb25zdCB1cGRhdGVJbXBvcnRVc2FnZSA9IChub2RlKSA9PiB7XG4gICAgICBpZiAoIXVudXNlZEV4cG9ydHMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgb2xkSW1wb3J0UGF0aHMgPSBpbXBvcnRMaXN0LmdldChmaWxlKTtcbiAgICAgIGlmICh0eXBlb2Ygb2xkSW1wb3J0UGF0aHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG9sZEltcG9ydFBhdGhzID0gbmV3IE1hcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvbGROYW1lc3BhY2VJbXBvcnRzID0gbmV3IFNldCgpO1xuICAgICAgY29uc3QgbmV3TmFtZXNwYWNlSW1wb3J0cyA9IG5ldyBTZXQoKTtcblxuICAgICAgY29uc3Qgb2xkRXhwb3J0QWxsID0gbmV3IFNldCgpO1xuICAgICAgY29uc3QgbmV3RXhwb3J0QWxsID0gbmV3IFNldCgpO1xuXG4gICAgICBjb25zdCBvbGREZWZhdWx0SW1wb3J0cyA9IG5ldyBTZXQoKTtcbiAgICAgIGNvbnN0IG5ld0RlZmF1bHRJbXBvcnRzID0gbmV3IFNldCgpO1xuXG4gICAgICBjb25zdCBvbGRJbXBvcnRzID0gbmV3IE1hcCgpO1xuICAgICAgY29uc3QgbmV3SW1wb3J0cyA9IG5ldyBNYXAoKTtcbiAgICAgIG9sZEltcG9ydFBhdGhzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKHZhbHVlLmhhcyhFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKSkge1xuICAgICAgICAgIG9sZEV4cG9ydEFsbC5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUuaGFzKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKSkge1xuICAgICAgICAgIG9sZE5hbWVzcGFjZUltcG9ydHMuYWRkKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlLmhhcyhJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpKSB7XG4gICAgICAgICAgb2xkRGVmYXVsdEltcG9ydHMuYWRkKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUuZm9yRWFjaCgodmFsKSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdmFsICE9PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUlxuICAgICAgICAgICAgJiYgdmFsICE9PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIG9sZEltcG9ydHMuc2V0KHZhbCwga2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEeW5hbWljSW1wb3J0KHNvdXJjZSkge1xuICAgICAgICBpZiAoc291cmNlLnR5cGUgIT09ICdMaXRlcmFsJykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHAgPSByZXNvbHZlKHNvdXJjZS52YWx1ZSwgY29udGV4dCk7XG4gICAgICAgIGlmIChwID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBuZXdOYW1lc3BhY2VJbXBvcnRzLmFkZChwKTtcbiAgICAgIH1cblxuICAgICAgdmlzaXQobm9kZSwgdmlzaXRvcktleU1hcC5nZXQoZmlsZSksIHtcbiAgICAgICAgSW1wb3J0RXhwcmVzc2lvbihjaGlsZCkge1xuICAgICAgICAgIHByb2Nlc3NEeW5hbWljSW1wb3J0KGNoaWxkLnNvdXJjZSk7XG4gICAgICAgIH0sXG4gICAgICAgIENhbGxFeHByZXNzaW9uKGNoaWxkKSB7XG4gICAgICAgICAgaWYgKGNoaWxkLmNhbGxlZS50eXBlID09PSAnSW1wb3J0Jykge1xuICAgICAgICAgICAgcHJvY2Vzc0R5bmFtaWNJbXBvcnQoY2hpbGQuYXJndW1lbnRzWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgbm9kZS5ib2R5LmZvckVhY2goKGFzdE5vZGUpID0+IHtcbiAgICAgICAgbGV0IHJlc29sdmVkUGF0aDtcblxuICAgICAgICAvLyBzdXBwb3J0IGZvciBleHBvcnQgeyB2YWx1ZSB9IGZyb20gJ21vZHVsZSdcbiAgICAgICAgaWYgKGFzdE5vZGUudHlwZSA9PT0gRVhQT1JUX05BTUVEX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgaWYgKGFzdE5vZGUuc291cmNlKSB7XG4gICAgICAgICAgICByZXNvbHZlZFBhdGggPSByZXNvbHZlKGFzdE5vZGUuc291cmNlLnJhdy5yZXBsYWNlKC8oJ3xcIikvZywgJycpLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGFzdE5vZGUuc3BlY2lmaWVycy5mb3JFYWNoKChzcGVjaWZpZXIpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHNwZWNpZmllci5sb2NhbC5uYW1lIHx8IHNwZWNpZmllci5sb2NhbC52YWx1ZTtcbiAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IERFRkFVTFQpIHtcbiAgICAgICAgICAgICAgICBuZXdEZWZhdWx0SW1wb3J0cy5hZGQocmVzb2x2ZWRQYXRoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdJbXBvcnRzLnNldChuYW1lLCByZXNvbHZlZFBhdGgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXN0Tm9kZS50eXBlID09PSBFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShhc3ROb2RlLnNvdXJjZS5yYXcucmVwbGFjZSgvKCd8XCIpL2csICcnKSwgY29udGV4dCk7XG4gICAgICAgICAgbmV3RXhwb3J0QWxsLmFkZChyZXNvbHZlZFBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzdE5vZGUudHlwZSA9PT0gSU1QT1JUX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZShhc3ROb2RlLnNvdXJjZS5yYXcucmVwbGFjZSgvKCd8XCIpL2csICcnKSwgY29udGV4dCk7XG4gICAgICAgICAgaWYgKCFyZXNvbHZlZFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXNOb2RlTW9kdWxlKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobmV3TmFtZXNwYWNlSW1wb3J0RXhpc3RzKGFzdE5vZGUuc3BlY2lmaWVycykpIHtcbiAgICAgICAgICAgIG5ld05hbWVzcGFjZUltcG9ydHMuYWRkKHJlc29sdmVkUGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG5ld0RlZmF1bHRJbXBvcnRFeGlzdHMoYXN0Tm9kZS5zcGVjaWZpZXJzKSkge1xuICAgICAgICAgICAgbmV3RGVmYXVsdEltcG9ydHMuYWRkKHJlc29sdmVkUGF0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXN0Tm9kZS5zcGVjaWZpZXJzXG4gICAgICAgICAgICAuZmlsdGVyKChzcGVjaWZpZXIpID0+IHNwZWNpZmllci50eXBlICE9PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIgJiYgc3BlY2lmaWVyLnR5cGUgIT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuICAgICAgICAgICAgLmZvckVhY2goKHNwZWNpZmllcikgPT4ge1xuICAgICAgICAgICAgICBuZXdJbXBvcnRzLnNldChzcGVjaWZpZXIuaW1wb3J0ZWQubmFtZSB8fCBzcGVjaWZpZXIuaW1wb3J0ZWQudmFsdWUsIHJlc29sdmVkUGF0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG5ld0V4cG9ydEFsbC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAoIW9sZEV4cG9ydEFsbC5oYXModmFsdWUpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgaW1wb3J0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGltcG9ydHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKEVYUE9SVF9BTExfREVDTEFSQVRJT04pO1xuICAgICAgICAgIG9sZEltcG9ydFBhdGhzLnNldCh2YWx1ZSwgaW1wb3J0cyk7XG5cbiAgICAgICAgICBsZXQgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBsZXQgY3VycmVudEV4cG9ydDtcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBleHBvcnRMaXN0LnNldCh2YWx1ZSwgZXhwb3J0cyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuYWRkKGZpbGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZVVzZWQgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICB3aGVyZVVzZWQuYWRkKGZpbGUpO1xuICAgICAgICAgICAgZXhwb3J0cy5zZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTiwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgb2xkRXhwb3J0QWxsLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghbmV3RXhwb3J0QWxsLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpbXBvcnRzLmRlbGV0ZShFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKTtcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbmV3RGVmYXVsdEltcG9ydHMuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgaWYgKCFvbGREZWZhdWx0SW1wb3J0cy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgaW1wb3J0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGltcG9ydHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUik7XG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKTtcblxuICAgICAgICAgIGxldCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpO1xuICAgICAgICAgIGxldCBjdXJyZW50RXhwb3J0O1xuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZXhwb3J0TGlzdC5zZXQodmFsdWUsIGV4cG9ydHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmFkZChmaWxlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgd2hlcmVVc2VkID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgd2hlcmVVc2VkLmFkZChmaWxlKTtcbiAgICAgICAgICAgIGV4cG9ydHMuc2V0KElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgb2xkRGVmYXVsdEltcG9ydHMuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgaWYgKCFuZXdEZWZhdWx0SW1wb3J0cy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSk7XG4gICAgICAgICAgaW1wb3J0cy5kZWxldGUoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKTtcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUik7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmRlbGV0ZShmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBuZXdOYW1lc3BhY2VJbXBvcnRzLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghb2xkTmFtZXNwYWNlSW1wb3J0cy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmICh0eXBlb2YgaW1wb3J0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGltcG9ydHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgICAgICBvbGRJbXBvcnRQYXRocy5zZXQodmFsdWUsIGltcG9ydHMpO1xuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgbGV0IGN1cnJlbnRFeHBvcnQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlVXNlZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSk7XG4gICAgICAgICAgICBleHBvcnRzLnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgb2xkTmFtZXNwYWNlSW1wb3J0cy5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAoIW5ld05hbWVzcGFjZUltcG9ydHMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpO1xuICAgICAgICAgIGltcG9ydHMuZGVsZXRlKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuZGVsZXRlKGZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG5ld0ltcG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoIW9sZEltcG9ydHMuaGFzKGtleSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBpbXBvcnRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaW1wb3J0cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW1wb3J0cy5hZGQoa2V5KTtcbiAgICAgICAgICBvbGRJbXBvcnRQYXRocy5zZXQodmFsdWUsIGltcG9ydHMpO1xuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgbGV0IGN1cnJlbnRFeHBvcnQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KGtleSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBleHBvcnRMaXN0LnNldCh2YWx1ZSwgZXhwb3J0cyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuYWRkKGZpbGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZVVzZWQgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICB3aGVyZVVzZWQuYWRkKGZpbGUpO1xuICAgICAgICAgICAgZXhwb3J0cy5zZXQoa2V5LCB7IHdoZXJlVXNlZCB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBvbGRJbXBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKCFuZXdJbXBvcnRzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgY29uc3QgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSk7XG4gICAgICAgICAgaW1wb3J0cy5kZWxldGUoa2V5KTtcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KGtleSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmRlbGV0ZShmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ1Byb2dyYW06ZXhpdCcobm9kZSkge1xuICAgICAgICB1cGRhdGVFeHBvcnRVc2FnZShub2RlKTtcbiAgICAgICAgdXBkYXRlSW1wb3J0VXNhZ2Uobm9kZSk7XG4gICAgICAgIGNoZWNrRXhwb3J0UHJlc2VuY2Uobm9kZSk7XG4gICAgICB9LFxuICAgICAgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgICAgY2hlY2tVc2FnZShub2RlLCBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpO1xuICAgICAgfSxcbiAgICAgIEV4cG9ydE5hbWVkRGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgICBub2RlLnNwZWNpZmllcnMuZm9yRWFjaCgoc3BlY2lmaWVyKSA9PiB7XG4gICAgICAgICAgY2hlY2tVc2FnZShzcGVjaWZpZXIsIHNwZWNpZmllci5leHBvcnRlZC5uYW1lIHx8IHNwZWNpZmllci5leHBvcnRlZC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3JFYWNoRGVjbGFyYXRpb25JZGVudGlmaWVyKG5vZGUuZGVjbGFyYXRpb24sIChuYW1lKSA9PiB7XG4gICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuIl19