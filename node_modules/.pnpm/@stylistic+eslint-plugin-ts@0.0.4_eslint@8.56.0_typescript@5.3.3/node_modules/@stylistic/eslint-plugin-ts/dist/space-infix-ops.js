'use strict';

var utils = require('@typescript-eslint/utils');
require('typescript');
var astUtils = require('@typescript-eslint/utils/ast-utils');
var blockSpacing = require('./block-spacing.js');
require('graphemer');
require('@typescript-eslint/type-utils');

const baseRule = blockSpacing.getESLintCoreRule("space-infix-ops");
const UNIONS = ["|", "&"];
var spaceInfixOps = blockSpacing.createRule({
  name: "space-infix-ops",
  meta: {
    type: "layout",
    docs: {
      description: "Require spacing around infix operators",
      extendsBaseRule: true
    },
    fixable: baseRule.meta.fixable,
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: baseRule.meta.schema,
    messages: {
      // @ts-expect-error -- we report on this messageId so we need to ensure it's there in case ESLint changes in future
      missingSpace: "Operator '{{operator}}' must be spaced.",
      ...baseRule.meta.messages
    }
  },
  defaultOptions: [
    {
      int32Hint: false
    }
  ],
  create(context) {
    const rules = baseRule.create(context);
    const sourceCode = context.getSourceCode();
    function report(operator) {
      context.report({
        node: operator,
        messageId: "missingSpace",
        data: {
          operator: operator.value
        },
        fix(fixer) {
          const previousToken = sourceCode.getTokenBefore(operator);
          const afterToken = sourceCode.getTokenAfter(operator);
          let fixString = "";
          if (operator.range[0] - previousToken.range[1] === 0)
            fixString = " ";
          fixString += operator.value;
          if (afterToken.range[0] - operator.range[1] === 0)
            fixString += " ";
          return fixer.replaceText(operator, fixString);
        }
      });
    }
    function isSpaceChar(token) {
      return token.type === utils.AST_TOKEN_TYPES.Punctuator && /^[=?:]$/.test(token.value);
    }
    function checkAndReportAssignmentSpace(leftNode, rightNode) {
      if (!rightNode || !leftNode)
        return;
      const operator = sourceCode.getFirstTokenBetween(
        leftNode,
        rightNode,
        isSpaceChar
      );
      const prev = sourceCode.getTokenBefore(operator);
      const next = sourceCode.getTokenAfter(operator);
      if (!sourceCode.isSpaceBetween(prev, operator) || !sourceCode.isSpaceBetween(operator, next))
        report(operator);
    }
    function checkForEnumAssignmentSpace(node) {
      checkAndReportAssignmentSpace(node.id, node.initializer);
    }
    function checkForPropertyDefinitionAssignmentSpace(node) {
      const leftNode = node.optional && !node.typeAnnotation ? sourceCode.getTokenAfter(node.key) : node.typeAnnotation ?? node.key;
      checkAndReportAssignmentSpace(leftNode, node.value);
    }
    function checkForTypeAnnotationSpace(typeAnnotation) {
      const types = typeAnnotation.types;
      types.forEach((type) => {
        const skipFunctionParenthesis = type.type === utils.TSESTree.AST_NODE_TYPES.TSFunctionType ? astUtils.isNotOpeningParenToken : 0;
        const operator = sourceCode.getTokenBefore(
          type,
          skipFunctionParenthesis
        );
        if (operator != null && UNIONS.includes(operator.value)) {
          const prev = sourceCode.getTokenBefore(operator);
          const next = sourceCode.getTokenAfter(operator);
          if (!sourceCode.isSpaceBetween(prev, operator) || !sourceCode.isSpaceBetween(operator, next))
            report(operator);
        }
      });
    }
    function checkForTypeAliasAssignment(node) {
      checkAndReportAssignmentSpace(
        node.typeParameters ?? node.id,
        node.typeAnnotation
      );
    }
    function checkForTypeConditional(node) {
      checkAndReportAssignmentSpace(node.extendsType, node.trueType);
      checkAndReportAssignmentSpace(node.trueType, node.falseType);
    }
    return {
      ...rules,
      TSEnumMember: checkForEnumAssignmentSpace,
      PropertyDefinition: checkForPropertyDefinitionAssignmentSpace,
      TSTypeAliasDeclaration: checkForTypeAliasAssignment,
      TSUnionType: checkForTypeAnnotationSpace,
      TSIntersectionType: checkForTypeAnnotationSpace,
      TSConditionalType: checkForTypeConditional
    };
  }
});

exports.spaceInfixOps = spaceInfixOps;
