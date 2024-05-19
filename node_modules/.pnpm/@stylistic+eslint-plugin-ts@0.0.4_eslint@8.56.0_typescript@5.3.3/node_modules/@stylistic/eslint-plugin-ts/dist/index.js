'use strict';

var blockSpacing = require('./block-spacing.js');
var braceStyle = require('./brace-style.js');
var commaSpacing = require('./comma-spacing.js');
var funcCallSpacing = require('./func-call-spacing.js');
var indent = require('./indent.js');
var keySpacing = require('./key-spacing.js');
var keywordSpacing = require('./keyword-spacing.js');
var linesAroundComment = require('./lines-around-comment.js');
var linesBetweenClassMembers = require('./lines-between-class-members.js');
var memberDelimiterStyle = require('./member-delimiter-style.js');
var objectCurlySpacing = require('./object-curly-spacing.js');
var paddingLineBetweenStatements = require('./padding-line-between-statements.js');
var spaceBeforeBlocks = require('./space-before-blocks.js');
var spaceBeforeFunctionParen = require('./space-before-function-paren.js');
var spaceInfixOps = require('./space-infix-ops.js');
var typeAnnotationSpacing = require('./type-annotation-spacing.js');
require('typescript');
require('@typescript-eslint/utils/ast-utils');
require('@typescript-eslint/utils');
require('graphemer');
require('@typescript-eslint/type-utils');
require('@typescript-eslint/scope-manager');
require('@stylistic/eslint-plugin-js');

var rules = {
  "block-spacing": blockSpacing.blockSpacing,
  "brace-style": braceStyle.braceStyle,
  "comma-spacing": commaSpacing.commaSpacing,
  "func-call-spacing": funcCallSpacing.funcCallSpacing,
  "indent": indent.indent,
  "key-spacing": keySpacing.keySpacing,
  "keyword-spacing": keywordSpacing.keywordSpacing,
  "lines-around-comment": linesAroundComment.linesAroundComment,
  "lines-between-class-members": linesBetweenClassMembers.linesBetweenClassMembers,
  "member-delimiter-style": memberDelimiterStyle.memberDelimiterStyle,
  "object-curly-spacing": objectCurlySpacing.objectCurlySpacing,
  "padding-line-between-statements": paddingLineBetweenStatements.paddingLineBetweenStatements,
  "space-before-blocks": spaceBeforeBlocks.spaceBeforeBlocks,
  "space-before-function-paren": spaceBeforeFunctionParen.spaceBeforeFunctionParen,
  "space-infix-ops": spaceInfixOps.spaceInfixOps,
  "type-annotation-spacing": typeAnnotationSpacing.typeAnnotationSpacing
};

var index = {
  rules
};

module.exports = index;
