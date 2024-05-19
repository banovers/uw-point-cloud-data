'use strict';

var ts = require('typescript');
var astUtils = require('@typescript-eslint/utils/ast-utils');
var utils = require('@typescript-eslint/utils');
var Graphemer = require('graphemer');
require('@typescript-eslint/type-utils');
require('@typescript-eslint/scope-manager');
var jsRules = require('@stylistic/eslint-plugin-js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var ts__namespace = /*#__PURE__*/_interopNamespaceDefault(ts);

/* @__PURE__ */ new Set([
  utils.AST_NODE_TYPES.TSInterfaceDeclaration,
  utils.AST_NODE_TYPES.TSTypeAliasDeclaration,
  utils.AST_NODE_TYPES.TSModuleDeclaration,
  utils.AST_NODE_TYPES.ClassDeclaration,
  utils.AST_NODE_TYPES.FunctionDeclaration
]);

const createRule = utils.ESLintUtils.RuleCreator(
  (name) => `https://typescript-eslint.io/rules/${name}`
);

let splitter;
function isASCII(value) {
  return /^[\u0020-\u007F]*$/u.test(value);
}
function getStringLength(value) {
  if (isASCII(value))
    return value.length;
  splitter ??= new Graphemer();
  return splitter.countGraphemes(value);
}

[
  ts__namespace.Extension.Dts,
  ts__namespace.Extension.Dcts,
  ts__namespace.Extension.Dmts
];

const {
  applyDefault,
  deepMerge,
  isObjectNotArray,
  getParserServices,
  nullThrows,
  NullThrowsReasons
} = utils.ESLintUtils;

const getESLintCoreRule = (ruleId) => {
  if (ruleId in jsRules.rules)
    return jsRules.rules[ruleId];
  throw new Error(`Failed to find core rule ${ruleId}, this is an internal bug of @stylistic/eslint-plugin-ts`);
};

const baseRule = getESLintCoreRule("block-spacing");
var blockSpacing = createRule({
  name: "block-spacing",
  meta: {
    type: "layout",
    docs: {
      description: "Disallow or enforce spaces inside of blocks after opening block and before closing block",
      extendsBaseRule: true
    },
    fixable: "whitespace",
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: baseRule.meta.schema,
    messages: baseRule.meta.messages
  },
  defaultOptions: ["always"],
  create(context, [whenToApplyOption]) {
    const sourceCode = context.getSourceCode();
    const baseRules = baseRule.create(context);
    const always = whenToApplyOption !== "never";
    const messageId = always ? "missing" : "extra";
    function getOpenBrace(node) {
      return sourceCode.getFirstToken(node, {
        filter: (token) => token.type === utils.AST_TOKEN_TYPES.Punctuator && token.value === "{"
      });
    }
    function isValid(left, right) {
      return !astUtils.isTokenOnSameLine(left, right) || sourceCode.isSpaceBetween(left, right) === always;
    }
    function checkSpacingInsideBraces(node) {
      const openBrace = getOpenBrace(node);
      const closeBrace = sourceCode.getLastToken(node);
      const firstToken = sourceCode.getTokenAfter(openBrace, {
        includeComments: true
      });
      const lastToken = sourceCode.getTokenBefore(closeBrace, {
        includeComments: true
      });
      if (openBrace.type !== utils.AST_TOKEN_TYPES.Punctuator || openBrace.value !== "{" || closeBrace.type !== utils.AST_TOKEN_TYPES.Punctuator || closeBrace.value !== "}" || firstToken === closeBrace)
        return;
      if (!always && firstToken.type === utils.AST_TOKEN_TYPES.Line)
        return;
      if (!isValid(openBrace, firstToken)) {
        let loc = openBrace.loc;
        if (messageId === "extra") {
          loc = {
            start: openBrace.loc.end,
            end: firstToken.loc.start
          };
        }
        context.report({
          node,
          loc,
          messageId,
          data: {
            location: "after",
            token: openBrace.value
          },
          fix(fixer) {
            if (always)
              return fixer.insertTextBefore(firstToken, " ");
            return fixer.removeRange([openBrace.range[1], firstToken.range[0]]);
          }
        });
      }
      if (!isValid(lastToken, closeBrace)) {
        let loc = closeBrace.loc;
        if (messageId === "extra") {
          loc = {
            start: lastToken.loc.end,
            end: closeBrace.loc.start
          };
        }
        context.report({
          node,
          loc,
          messageId,
          data: {
            location: "before",
            token: closeBrace.value
          },
          fix(fixer) {
            if (always)
              return fixer.insertTextAfter(lastToken, " ");
            return fixer.removeRange([lastToken.range[1], closeBrace.range[0]]);
          }
        });
      }
    }
    return {
      ...baseRules,
      // This code worked "out of the box" for interface and type literal
      // Enums were very close to match as well, the only reason they are not is that was that enums don't have a body node in the parser
      // So the opening brace punctuator starts in the middle of the node - `getFirstToken` in
      // the base rule did not filter for the first opening brace punctuator
      TSInterfaceBody: baseRules.BlockStatement,
      TSTypeLiteral: baseRules.BlockStatement,
      TSEnumDeclaration: checkSpacingInsideBraces
    };
  }
});

exports.NullThrowsReasons = NullThrowsReasons;
exports.blockSpacing = blockSpacing;
exports.createRule = createRule;
exports.deepMerge = deepMerge;
exports.getESLintCoreRule = getESLintCoreRule;
exports.getStringLength = getStringLength;
exports.nullThrows = nullThrows;
