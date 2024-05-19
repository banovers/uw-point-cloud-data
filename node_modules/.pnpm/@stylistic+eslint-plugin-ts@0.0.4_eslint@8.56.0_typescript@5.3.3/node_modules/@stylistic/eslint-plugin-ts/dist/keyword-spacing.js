'use strict';

var utils = require('@typescript-eslint/utils');
var blockSpacing = require('./block-spacing.js');

const baseRule = blockSpacing.getESLintCoreRule("keyword-spacing");
const baseSchema = Array.isArray(baseRule.meta.schema) ? baseRule.meta.schema[0] : baseRule.meta.schema;
const schema = blockSpacing.deepMerge(
  baseSchema,
  {
    properties: {
      overrides: {
        properties: {
          type: baseSchema.properties.overrides.properties.import
        }
      }
    }
  }
);
var keywordSpacing = blockSpacing.createRule({
  name: "keyword-spacing",
  meta: {
    type: "layout",
    docs: {
      description: "Enforce consistent spacing before and after keywords",
      extendsBaseRule: true
    },
    fixable: "whitespace",
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: [schema],
    messages: baseRule.meta.messages
  },
  defaultOptions: [{}],
  create(context, [{ after, overrides }]) {
    const sourceCode = context.getSourceCode();
    const baseRules = baseRule.create(context);
    return {
      ...baseRules,
      TSAsExpression(node) {
        const asToken = blockSpacing.nullThrows(
          sourceCode.getTokenAfter(
            node.expression,
            (token) => token.value === "as"
          ),
          blockSpacing.NullThrowsReasons.MissingToken("as", node.type)
        );
        const oldTokenType = asToken.type;
        asToken.type = utils.AST_TOKEN_TYPES.Keyword;
        baseRules.DebuggerStatement(asToken);
        asToken.type = oldTokenType;
      },
      "ImportDeclaration[importKind=type]": function(node) {
        const { type: typeOptionOverride = {} } = overrides ?? {};
        const typeToken = sourceCode.getFirstToken(node, { skip: 1 });
        const punctuatorToken = sourceCode.getTokenAfter(typeToken);
        if (node.specifiers?.[0]?.type === utils.AST_NODE_TYPES.ImportDefaultSpecifier)
          return;
        const spacesBetweenTypeAndPunctuator = punctuatorToken.range[0] - typeToken.range[1];
        if ((typeOptionOverride.after ?? after) === true && spacesBetweenTypeAndPunctuator === 0) {
          context.report({
            loc: typeToken.loc,
            messageId: "expectedAfter",
            data: { value: "type" },
            fix(fixer) {
              return fixer.insertTextAfter(typeToken, " ");
            }
          });
        }
        if ((typeOptionOverride.after ?? after) === false && spacesBetweenTypeAndPunctuator > 0) {
          context.report({
            loc: typeToken.loc,
            messageId: "unexpectedAfter",
            data: { value: "type" },
            fix(fixer) {
              return fixer.removeRange([
                typeToken.range[1],
                typeToken.range[1] + spacesBetweenTypeAndPunctuator
              ]);
            }
          });
        }
      }
    };
  }
});

exports.keywordSpacing = keywordSpacing;
