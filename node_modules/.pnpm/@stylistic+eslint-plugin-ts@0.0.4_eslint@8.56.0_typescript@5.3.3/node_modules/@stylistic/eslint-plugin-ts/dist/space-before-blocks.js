'use strict';

require('@typescript-eslint/utils');
require('typescript');
var astUtils = require('@typescript-eslint/utils/ast-utils');
var blockSpacing = require('./block-spacing.js');
require('graphemer');
require('@typescript-eslint/type-utils');

const baseRule = blockSpacing.getESLintCoreRule("space-before-blocks");
var spaceBeforeBlocks = blockSpacing.createRule({
  name: "space-before-blocks",
  meta: {
    type: "layout",
    docs: {
      description: "Enforce consistent spacing before blocks",
      extendsBaseRule: true
    },
    fixable: baseRule.meta.fixable,
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: baseRule.meta.schema,
    messages: {
      // @ts-expect-error -- we report on this messageId so we need to ensure it's there in case ESLint changes in future
      unexpectedSpace: "Unexpected space before opening brace.",
      // @ts-expect-error -- we report on this messageId so we need to ensure it's there in case ESLint changes in future
      missingSpace: "Missing space before opening brace.",
      ...baseRule.meta.messages
    }
  },
  defaultOptions: ["always"],
  create(context, [config]) {
    const rules = baseRule.create(context);
    const sourceCode = context.getSourceCode();
    let requireSpace = true;
    if (typeof config === "object")
      requireSpace = config.classes === "always";
    else if (config === "never")
      requireSpace = false;
    function checkPrecedingSpace(node) {
      const precedingToken = sourceCode.getTokenBefore(node);
      if (precedingToken && astUtils.isTokenOnSameLine(precedingToken, node)) {
        const hasSpace = sourceCode.isSpaceBetweenTokens(
          precedingToken,
          node
        );
        if (requireSpace && !hasSpace) {
          context.report({
            node,
            messageId: "missingSpace",
            fix(fixer) {
              return fixer.insertTextBefore(node, " ");
            }
          });
        } else if (!requireSpace && hasSpace) {
          context.report({
            node,
            messageId: "unexpectedSpace",
            fix(fixer) {
              return fixer.removeRange([
                precedingToken.range[1],
                node.range[0]
              ]);
            }
          });
        }
      }
    }
    function checkSpaceAfterEnum(node) {
      const punctuator = sourceCode.getTokenAfter(node.id);
      if (punctuator)
        checkPrecedingSpace(punctuator);
    }
    return {
      ...rules,
      TSEnumDeclaration: checkSpaceAfterEnum,
      TSInterfaceBody: checkPrecedingSpace
    };
  }
});

exports.spaceBeforeBlocks = spaceBeforeBlocks;
