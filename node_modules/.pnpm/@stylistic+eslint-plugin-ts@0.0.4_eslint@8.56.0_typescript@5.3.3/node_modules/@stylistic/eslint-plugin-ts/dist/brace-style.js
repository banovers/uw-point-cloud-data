'use strict';

require('@typescript-eslint/utils');
require('typescript');
var astUtils = require('@typescript-eslint/utils/ast-utils');
var blockSpacing = require('./block-spacing.js');
require('graphemer');
require('@typescript-eslint/type-utils');

const baseRule = blockSpacing.getESLintCoreRule("brace-style");
var braceStyle = blockSpacing.createRule({
  name: "brace-style",
  meta: {
    type: "layout",
    docs: {
      description: "Enforce consistent brace style for blocks",
      extendsBaseRule: true
    },
    messages: baseRule.meta.messages,
    fixable: baseRule.meta.fixable,
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: baseRule.meta.schema
  },
  defaultOptions: ["1tbs"],
  create(context) {
    const [style, { allowSingleLine } = { allowSingleLine: false }] = context.options;
    const isAllmanStyle = style === "allman";
    const sourceCode = context.getSourceCode();
    const rules = baseRule.create(context);
    function validateCurlyPair(openingCurlyToken, closingCurlyToken) {
      if (allowSingleLine && astUtils.isTokenOnSameLine(openingCurlyToken, closingCurlyToken))
        return;
      const tokenBeforeOpeningCurly = sourceCode.getTokenBefore(openingCurlyToken);
      const tokenBeforeClosingCurly = sourceCode.getTokenBefore(closingCurlyToken);
      const tokenAfterOpeningCurly = sourceCode.getTokenAfter(openingCurlyToken);
      if (!isAllmanStyle && !astUtils.isTokenOnSameLine(tokenBeforeOpeningCurly, openingCurlyToken)) {
        context.report({
          node: openingCurlyToken,
          messageId: "nextLineOpen",
          fix: (fixer) => {
            const textRange = [
              tokenBeforeOpeningCurly.range[1],
              openingCurlyToken.range[0]
            ];
            const textBetween = sourceCode.text.slice(
              textRange[0],
              textRange[1]
            );
            if (textBetween.trim())
              return null;
            return fixer.replaceTextRange(textRange, " ");
          }
        });
      }
      if (isAllmanStyle && astUtils.isTokenOnSameLine(tokenBeforeOpeningCurly, openingCurlyToken)) {
        context.report({
          node: openingCurlyToken,
          messageId: "sameLineOpen",
          fix: (fixer) => fixer.insertTextBefore(openingCurlyToken, "\n")
        });
      }
      if (astUtils.isTokenOnSameLine(openingCurlyToken, tokenAfterOpeningCurly) && tokenAfterOpeningCurly !== closingCurlyToken) {
        context.report({
          node: openingCurlyToken,
          messageId: "blockSameLine",
          fix: (fixer) => fixer.insertTextAfter(openingCurlyToken, "\n")
        });
      }
      if (astUtils.isTokenOnSameLine(tokenBeforeClosingCurly, closingCurlyToken) && tokenBeforeClosingCurly !== openingCurlyToken) {
        context.report({
          node: closingCurlyToken,
          messageId: "singleLineClose",
          fix: (fixer) => fixer.insertTextBefore(closingCurlyToken, "\n")
        });
      }
    }
    return {
      ...rules,
      "TSInterfaceBody, TSModuleBlock": function(node) {
        const openingCurly = sourceCode.getFirstToken(node);
        const closingCurly = sourceCode.getLastToken(node);
        validateCurlyPair(openingCurly, closingCurly);
      },
      TSEnumDeclaration(node) {
        const closingCurly = sourceCode.getLastToken(node);
        const openingCurly = sourceCode.getTokenBefore(
          node.members.length ? node.members[0] : closingCurly
        );
        validateCurlyPair(openingCurly, closingCurly);
      }
    };
  }
});

exports.braceStyle = braceStyle;
