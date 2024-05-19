'use strict';

var arrayBracketNewline = require('./array-bracket-newline.js');
var arrayBracketSpacing = require('./array-bracket-spacing.js');
var arrayElementNewline = require('./array-element-newline.js');
var arrowSpacing = require('./arrow-spacing.js');
var blockSpacing = require('./block-spacing.js');
var braceStyle = require('./brace-style.js');
var commaSpacing = require('./comma-spacing.js');
var commaStyle = require('./comma-style.js');
var computedPropertySpacing = require('./computed-property-spacing.js');
var dotLocation = require('./dot-location.js');
var funcCallSpacing = require('./func-call-spacing.js');
var functionCallArgumentNewline = require('./function-call-argument-newline.js');
var functionParenNewline = require('./function-paren-newline.js');
var generatorStarSpacing = require('./generator-star-spacing.js');
var implicitArrowLinebreak = require('./implicit-arrow-linebreak.js');
var indent = require('./indent.js');
var keySpacing = require('./key-spacing.js');
var keywordSpacing = require('./keyword-spacing.js');
var linebreakStyle = require('./linebreak-style.js');
var linesAroundComment = require('./lines-around-comment.js');
var linesAroundDirective = require('./lines-around-directive.js');
var linesBetweenClassMembers = require('./lines-between-class-members.js');
var multilineTernary = require('./multiline-ternary.js');
var newlineAfterVar = require('./newline-after-var.js');
var newlineBeforeReturn = require('./newline-before-return.js');
var newlinePerChainedCall = require('./newline-per-chained-call.js');
var noMixedSpacesAndTabs = require('./no-mixed-spaces-and-tabs.js');
var noMultiSpaces = require('./no-multi-spaces.js');
var noMultipleEmptyLines = require('./no-multiple-empty-lines.js');
var noSpacedFunc = require('./no-spaced-func.js');
var noTabs = require('./no-tabs.js');
var noTrailingSpaces = require('./no-trailing-spaces.js');
var noWhitespaceBeforeProperty = require('./no-whitespace-before-property.js');
var nonblockStatementBodyPosition = require('./nonblock-statement-body-position.js');
var objectCurlyNewline = require('./object-curly-newline.js');
var objectCurlySpacing = require('./object-curly-spacing.js');
var objectPropertyNewline = require('./object-property-newline.js');
var oneVarDeclarationPerLine = require('./one-var-declaration-per-line.js');
var operatorLinebreak = require('./operator-linebreak.js');
var paddedBlocks = require('./padded-blocks.js');
var paddingLineBetweenStatements = require('./padding-line-between-statements.js');
var restSpreadSpacing = require('./rest-spread-spacing.js');
var semiSpacing = require('./semi-spacing.js');
var semiStyle = require('./semi-style.js');
var spaceBeforeBlocks = require('./space-before-blocks.js');
var spaceBeforeFunctionParen = require('./space-before-function-paren.js');
var spaceInParens = require('./space-in-parens.js');
var spaceInfixOps = require('./space-infix-ops.js');
var spaceUnaryOps = require('./space-unary-ops.js');
var spacedComment = require('./spaced-comment.js');
var switchColonSpacing = require('./switch-colon-spacing.js');
var templateCurlySpacing = require('./template-curly-spacing.js');
var templateTagSpacing = require('./template-tag-spacing.js');
var yieldStarSpacing = require('./yield-star-spacing.js');
require('eslint-visitor-keys');
require('esutils');
require('espree');
require('escape-string-regexp');
require('graphemer');

var rules = {
  'array-bracket-newline': arrayBracketNewline.arrayBracketNewline,
  'array-bracket-spacing': arrayBracketSpacing.arrayBracketSpacing,
  'array-element-newline': arrayElementNewline.arrayElementNewline,
  'arrow-spacing': arrowSpacing.arrowSpacing,
  'block-spacing': blockSpacing.blockSpacing,
  'brace-style': braceStyle.braceStyle,
  'comma-spacing': commaSpacing.commaSpacing,
  'comma-style': commaStyle.commaStyle,
  'computed-property-spacing': computedPropertySpacing.computedPropertySpacing,
  'dot-location': dotLocation.dotLocation,
  'func-call-spacing': funcCallSpacing.funcCallSpacing,
  'function-call-argument-newline': functionCallArgumentNewline.functionCallArgumentNewline,
  'function-paren-newline': functionParenNewline.functionParenNewline,
  'generator-star-spacing': generatorStarSpacing.generatorStarSpacing,
  'implicit-arrow-linebreak': implicitArrowLinebreak.implicitArrowLinebreak,
  'indent': indent.indent,
  'key-spacing': keySpacing.keySpacing,
  'keyword-spacing': keywordSpacing.keywordSpacing,
  'linebreak-style': linebreakStyle.linebreakStyle,
  'lines-around-comment': linesAroundComment.linesAroundComment,
  'lines-around-directive': linesAroundDirective.linesAroundDirective,
  'lines-between-class-members': linesBetweenClassMembers.linesBetweenClassMembers,
  'multiline-ternary': multilineTernary.multilineTernary,
  'newline-after-var': newlineAfterVar.newlineAfterVar,
  'newline-before-return': newlineBeforeReturn.newlineBeforeReturn,
  'newline-per-chained-call': newlinePerChainedCall.newlinePerChainedCall,
  'no-mixed-spaces-and-tabs': noMixedSpacesAndTabs.noMixedSpacesAndTabs,
  'no-multi-spaces': noMultiSpaces.noMultiSpaces,
  'no-multiple-empty-lines': noMultipleEmptyLines.noMultipleEmptyLines,
  'no-spaced-func': noSpacedFunc.noSpacedFunc,
  'no-tabs': noTabs.noTabs,
  'no-trailing-spaces': noTrailingSpaces.noTrailingSpaces,
  'no-whitespace-before-property': noWhitespaceBeforeProperty.noWhitespaceBeforeProperty,
  'nonblock-statement-body-position': nonblockStatementBodyPosition.nonblockStatementBodyPosition,
  'object-curly-newline': objectCurlyNewline.objectCurlyNewline,
  'object-curly-spacing': objectCurlySpacing.objectCurlySpacing,
  'object-property-newline': objectPropertyNewline.objectPropertyNewline,
  'one-var-declaration-per-line': oneVarDeclarationPerLine.oneVarDeclarationPerLine,
  'operator-linebreak': operatorLinebreak.operatorLinebreak,
  'padded-blocks': paddedBlocks.paddedBlocks,
  'padding-line-between-statements': paddingLineBetweenStatements.paddingLineBetweenStatements,
  'rest-spread-spacing': restSpreadSpacing.restSpreadSpacing,
  'semi-spacing': semiSpacing.semiSpacing,
  'semi-style': semiStyle.semiStyle,
  'space-before-blocks': spaceBeforeBlocks.spaceBeforeBlocks,
  'space-before-function-paren': spaceBeforeFunctionParen.spaceBeforeFunctionParen,
  'space-in-parens': spaceInParens.spaceInParens,
  'space-infix-ops': spaceInfixOps.spaceInfixOps,
  'space-unary-ops': spaceUnaryOps.spaceUnaryOps,
  'spaced-comment': spacedComment.spacedComment,
  'switch-colon-spacing': switchColonSpacing.switchColonSpacing,
  'template-curly-spacing': templateCurlySpacing.templateCurlySpacing,
  'template-tag-spacing': templateTagSpacing.templateTagSpacing,
  'yield-star-spacing': yieldStarSpacing.yieldStarSpacing,
};

var src = {
  rules: rules,
};

var index = /*@__PURE__*/arrayBracketNewline.getDefaultExportFromCjs(src);

module.exports = index;
