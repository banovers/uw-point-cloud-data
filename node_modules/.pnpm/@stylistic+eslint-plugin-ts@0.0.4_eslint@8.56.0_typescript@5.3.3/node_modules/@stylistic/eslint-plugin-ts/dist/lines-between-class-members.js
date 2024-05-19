'use strict';

var utils = require('@typescript-eslint/utils');
var blockSpacing = require('./block-spacing.js');

const baseRule = blockSpacing.getESLintCoreRule("lines-between-class-members");
const schema = Object.values(
  blockSpacing.deepMerge(
    { ...baseRule.meta.schema },
    {
      1: {
        properties: {
          exceptAfterOverload: {
            type: "boolean",
            default: true
          }
        }
      }
    }
  )
);
var linesBetweenClassMembers = blockSpacing.createRule({
  name: "lines-between-class-members",
  meta: {
    type: "layout",
    docs: {
      description: "Require or disallow an empty line between class members",
      extendsBaseRule: true
    },
    fixable: "whitespace",
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema,
    messages: baseRule.meta.messages
  },
  defaultOptions: [
    "always",
    {
      exceptAfterOverload: true,
      exceptAfterSingleLine: false
    }
  ],
  create(context, [firstOption, secondOption]) {
    const rules = baseRule.create(context);
    const exceptAfterOverload = secondOption?.exceptAfterOverload && firstOption === "always";
    function isOverload(node) {
      return (node.type === utils.AST_NODE_TYPES.TSAbstractMethodDefinition || node.type === utils.AST_NODE_TYPES.MethodDefinition) && node.value.type === utils.AST_NODE_TYPES.TSEmptyBodyFunctionExpression;
    }
    return {
      ClassBody(node) {
        const body = exceptAfterOverload ? node.body.filter((node2) => !isOverload(node2)) : node.body;
        rules.ClassBody({ ...node, body });
      }
    };
  }
});

exports.linesBetweenClassMembers = linesBetweenClassMembers;
