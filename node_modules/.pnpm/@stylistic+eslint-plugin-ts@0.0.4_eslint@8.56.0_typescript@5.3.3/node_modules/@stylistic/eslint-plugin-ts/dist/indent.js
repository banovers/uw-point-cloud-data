'use strict';

var utils = require('@typescript-eslint/utils');
require('typescript');
require('@typescript-eslint/utils/ast-utils');
var blockSpacing = require('./block-spacing.js');
require('graphemer');
require('@typescript-eslint/type-utils');

const baseRule = blockSpacing.getESLintCoreRule("indent");
const KNOWN_NODES = /* @__PURE__ */ new Set([
  // Class properties aren't yet supported by eslint...
  utils.AST_NODE_TYPES.PropertyDefinition,
  // ts keywords
  utils.AST_NODE_TYPES.TSAbstractKeyword,
  utils.AST_NODE_TYPES.TSAnyKeyword,
  utils.AST_NODE_TYPES.TSBooleanKeyword,
  utils.AST_NODE_TYPES.TSNeverKeyword,
  utils.AST_NODE_TYPES.TSNumberKeyword,
  utils.AST_NODE_TYPES.TSStringKeyword,
  utils.AST_NODE_TYPES.TSSymbolKeyword,
  utils.AST_NODE_TYPES.TSUndefinedKeyword,
  utils.AST_NODE_TYPES.TSUnknownKeyword,
  utils.AST_NODE_TYPES.TSVoidKeyword,
  utils.AST_NODE_TYPES.TSNullKeyword,
  // ts specific nodes we want to support
  utils.AST_NODE_TYPES.TSAbstractPropertyDefinition,
  utils.AST_NODE_TYPES.TSAbstractMethodDefinition,
  utils.AST_NODE_TYPES.TSArrayType,
  utils.AST_NODE_TYPES.TSAsExpression,
  utils.AST_NODE_TYPES.TSCallSignatureDeclaration,
  utils.AST_NODE_TYPES.TSConditionalType,
  utils.AST_NODE_TYPES.TSConstructorType,
  utils.AST_NODE_TYPES.TSConstructSignatureDeclaration,
  utils.AST_NODE_TYPES.TSDeclareFunction,
  utils.AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
  utils.AST_NODE_TYPES.TSEnumDeclaration,
  utils.AST_NODE_TYPES.TSEnumMember,
  utils.AST_NODE_TYPES.TSExportAssignment,
  utils.AST_NODE_TYPES.TSExternalModuleReference,
  utils.AST_NODE_TYPES.TSFunctionType,
  utils.AST_NODE_TYPES.TSImportType,
  utils.AST_NODE_TYPES.TSIndexedAccessType,
  utils.AST_NODE_TYPES.TSIndexSignature,
  utils.AST_NODE_TYPES.TSInferType,
  utils.AST_NODE_TYPES.TSInterfaceBody,
  utils.AST_NODE_TYPES.TSInterfaceDeclaration,
  utils.AST_NODE_TYPES.TSInterfaceHeritage,
  utils.AST_NODE_TYPES.TSIntersectionType,
  utils.AST_NODE_TYPES.TSImportEqualsDeclaration,
  utils.AST_NODE_TYPES.TSLiteralType,
  utils.AST_NODE_TYPES.TSMappedType,
  utils.AST_NODE_TYPES.TSMethodSignature,
  "TSMinusToken",
  utils.AST_NODE_TYPES.TSModuleBlock,
  utils.AST_NODE_TYPES.TSModuleDeclaration,
  utils.AST_NODE_TYPES.TSNonNullExpression,
  utils.AST_NODE_TYPES.TSParameterProperty,
  "TSPlusToken",
  utils.AST_NODE_TYPES.TSPropertySignature,
  utils.AST_NODE_TYPES.TSQualifiedName,
  "TSQuestionToken",
  utils.AST_NODE_TYPES.TSRestType,
  utils.AST_NODE_TYPES.TSThisType,
  utils.AST_NODE_TYPES.TSTupleType,
  utils.AST_NODE_TYPES.TSTypeAnnotation,
  utils.AST_NODE_TYPES.TSTypeLiteral,
  utils.AST_NODE_TYPES.TSTypeOperator,
  utils.AST_NODE_TYPES.TSTypeParameter,
  utils.AST_NODE_TYPES.TSTypeParameterDeclaration,
  utils.AST_NODE_TYPES.TSTypeParameterInstantiation,
  utils.AST_NODE_TYPES.TSTypeReference,
  utils.AST_NODE_TYPES.TSUnionType,
  utils.AST_NODE_TYPES.Decorator
]);
var indent = blockSpacing.createRule({
  name: "indent",
  meta: {
    type: "layout",
    docs: {
      description: "Enforce consistent indentation",
      // too opinionated to be recommended
      extendsBaseRule: true
    },
    fixable: "whitespace",
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: baseRule.meta.schema,
    messages: baseRule.meta.messages
  },
  defaultOptions: [
    // typescript docs and playground use 4 space indent
    4,
    {
      // typescript docs indent the case from the switch
      // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-8.html#example-4
      SwitchCase: 1,
      flatTernaryExpressions: false,
      ignoredNodes: []
    }
  ],
  create(context, optionsWithDefaults) {
    const contextWithDefaults = Object.create(context, {
      options: {
        writable: false,
        configurable: false,
        value: optionsWithDefaults
      }
    });
    const rules = baseRule.create(contextWithDefaults);
    function TSPropertySignatureToProperty(node, type = utils.AST_NODE_TYPES.Property) {
      const base = {
        // indent doesn't actually use these
        key: null,
        value: null,
        // Property flags
        computed: false,
        method: false,
        kind: "init",
        // this will stop eslint from interrogating the type literal
        shorthand: true,
        // location data
        parent: node.parent,
        range: node.range,
        loc: node.loc
      };
      if (type === utils.AST_NODE_TYPES.Property) {
        return {
          type,
          ...base
        };
      }
      return {
        type,
        accessibility: void 0,
        declare: false,
        decorators: [],
        definite: false,
        optional: false,
        override: false,
        readonly: false,
        static: false,
        typeAnnotation: void 0,
        ...base
      };
    }
    return Object.assign({}, rules, {
      // overwrite the base rule here so we can use our KNOWN_NODES list instead
      "*:exit": function(node) {
        if (!KNOWN_NODES.has(node.type))
          rules["*:exit"](node);
      },
      VariableDeclaration(node) {
        if (node.declarations.length === 0)
          return;
        return rules.VariableDeclaration(node);
      },
      TSAsExpression(node) {
        return rules["BinaryExpression, LogicalExpression"]({
          type: utils.AST_NODE_TYPES.BinaryExpression,
          operator: "as",
          left: node.expression,
          // the first typeAnnotation includes the as token
          right: node.typeAnnotation,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSConditionalType(node) {
        return rules.ConditionalExpression({
          type: utils.AST_NODE_TYPES.ConditionalExpression,
          test: {
            parent: node,
            type: utils.AST_NODE_TYPES.BinaryExpression,
            operator: "extends",
            left: node.checkType,
            right: node.extendsType,
            // location data
            range: [node.checkType.range[0], node.extendsType.range[1]],
            loc: {
              start: node.checkType.loc.start,
              end: node.extendsType.loc.end
            }
          },
          consequent: node.trueType,
          alternate: node.falseType,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      "TSEnumDeclaration, TSTypeLiteral": function(node) {
        return rules["ObjectExpression, ObjectPattern"]({
          type: utils.AST_NODE_TYPES.ObjectExpression,
          properties: node.members.map(
            (member) => TSPropertySignatureToProperty(member)
          ),
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSImportEqualsDeclaration(node) {
        const { id, moduleReference } = node;
        return rules.VariableDeclaration({
          type: utils.AST_NODE_TYPES.VariableDeclaration,
          kind: "const",
          declarations: [
            {
              type: utils.AST_NODE_TYPES.VariableDeclarator,
              range: [id.range[0], moduleReference.range[1]],
              loc: {
                start: id.loc.start,
                end: moduleReference.loc.end
              },
              id,
              init: {
                type: utils.AST_NODE_TYPES.CallExpression,
                callee: {
                  type: utils.AST_NODE_TYPES.Identifier,
                  name: "require",
                  range: [
                    moduleReference.range[0],
                    moduleReference.range[0] + "require".length
                  ],
                  loc: {
                    start: moduleReference.loc.start,
                    end: {
                      line: moduleReference.loc.end.line,
                      column: moduleReference.loc.start.line + "require".length
                    }
                  }
                },
                arguments: "expression" in moduleReference ? [moduleReference.expression] : [],
                // location data
                range: moduleReference.range,
                loc: moduleReference.loc
              }
            }
          ],
          declare: false,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSIndexedAccessType(node) {
        return rules["MemberExpression, JSXMemberExpression, MetaProperty"]({
          type: utils.AST_NODE_TYPES.MemberExpression,
          object: node.objectType,
          property: node.indexType,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc,
          optional: false,
          computed: true
        });
      },
      TSInterfaceBody(node) {
        return rules["BlockStatement, ClassBody"]({
          type: utils.AST_NODE_TYPES.ClassBody,
          body: node.body.map(
            (p) => TSPropertySignatureToProperty(
              p,
              utils.AST_NODE_TYPES.PropertyDefinition
            )
          ),
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      "TSInterfaceDeclaration[extends.length > 0]": function(node) {
        return rules["ClassDeclaration[superClass], ClassExpression[superClass]"]({
          type: utils.AST_NODE_TYPES.ClassDeclaration,
          body: node.body,
          id: null,
          // TODO: This is invalid, there can be more than one extends in interface
          superClass: node.extends[0].expression,
          abstract: false,
          declare: false,
          decorators: [],
          implements: [],
          superTypeArguments: void 0,
          superTypeParameters: void 0,
          typeParameters: void 0,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSMappedType(node) {
        const sourceCode = context.getSourceCode();
        const squareBracketStart = sourceCode.getTokenBefore(
          node.typeParameter
        );
        return rules["ObjectExpression, ObjectPattern"]({
          type: utils.AST_NODE_TYPES.ObjectExpression,
          properties: [
            {
              parent: node,
              type: utils.AST_NODE_TYPES.Property,
              key: node.typeParameter,
              value: node.typeAnnotation,
              // location data
              range: [
                squareBracketStart.range[0],
                node.typeAnnotation ? node.typeAnnotation.range[1] : squareBracketStart.range[0]
              ],
              loc: {
                start: squareBracketStart.loc.start,
                end: node.typeAnnotation ? node.typeAnnotation.loc.end : squareBracketStart.loc.end
              },
              kind: "init",
              computed: false,
              method: false,
              optional: false,
              shorthand: false
            }
          ],
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSModuleBlock(node) {
        return rules["BlockStatement, ClassBody"]({
          type: utils.AST_NODE_TYPES.BlockStatement,
          body: node.body,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSQualifiedName(node) {
        return rules["MemberExpression, JSXMemberExpression, MetaProperty"]({
          type: utils.AST_NODE_TYPES.MemberExpression,
          object: node.left,
          property: node.right,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc,
          optional: false,
          computed: false
        });
      },
      TSTupleType(node) {
        return rules["ArrayExpression, ArrayPattern"]({
          type: utils.AST_NODE_TYPES.ArrayExpression,
          elements: node.elementTypes,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      },
      TSTypeParameterDeclaration(node) {
        if (!node.params.length)
          return;
        const [name, ...attributes] = node.params;
        return rules.JSXOpeningElement({
          type: utils.AST_NODE_TYPES.JSXOpeningElement,
          selfClosing: false,
          name,
          attributes,
          typeArguments: void 0,
          typeParameters: void 0,
          // location data
          parent: node.parent,
          range: node.range,
          loc: node.loc
        });
      }
    });
  }
});

exports.indent = indent;
