'use strict';

const utils = require('@typescript-eslint/utils');

const createEslintRule = utils.ESLintUtils.RuleCreator(
  (ruleName) => ruleName
);

const RULE_NAME$9 = "generic-spacing";
const genericSpacing = createEslintRule({
  name: RULE_NAME$9,
  meta: {
    type: "suggestion",
    docs: {
      description: "Spaces around generic type parameters",
      recommended: "stylistic"
    },
    fixable: "code",
    schema: [],
    messages: {
      genericSpacingMismatch: "Generic spaces mismatch"
    }
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.getSourceCode();
    return {
      TSTypeParameterDeclaration: (node) => {
        if (!["TSCallSignatureDeclaration", "ArrowFunctionExpression", "TSFunctionType"].includes(node.parent.type)) {
          const pre = sourceCode.text.slice(0, node.range[0]);
          const preSpace = pre.match(/(\s+)$/)?.[0];
          if (preSpace && preSpace.length) {
            context.report({
              node,
              messageId: "genericSpacingMismatch",
              *fix(fixer) {
                yield fixer.replaceTextRange([node.range[0] - preSpace.length, node.range[0]], "");
              }
            });
          }
        }
        const params = node.params;
        for (let i = 1; i < params.length; i++) {
          const prev = params[i - 1];
          const current = params[i];
          const from = prev.range[1];
          const to = current.range[0];
          const span = sourceCode.text.slice(from, to);
          if (span !== ", " && !span.match(/,\n/)) {
            context.report({
              *fix(fixer) {
                yield fixer.replaceTextRange([from, to], ", ");
              },
              loc: {
                start: prev.loc.end,
                end: current.loc.start
              },
              messageId: "genericSpacingMismatch",
              node
            });
          }
        }
      },
      // add space around = in type Foo<T = true>
      TSTypeParameter: (node) => {
        if (!node.default)
          return;
        const endNode = node.constraint || node.name;
        const from = endNode.range[1];
        const to = node.default.range[0];
        if (sourceCode.text.slice(from, to) !== " = ") {
          context.report({
            *fix(fixer) {
              yield fixer.replaceTextRange([from, to], " = ");
            },
            loc: {
              start: endNode.loc.end,
              end: node.default.loc.start
            },
            messageId: "genericSpacingMismatch",
            node
          });
        }
      }
    };
  }
});

const RULE_NAME$8 = "if-newline";
const ifNewline = createEslintRule({
  name: RULE_NAME$8,
  meta: {
    type: "problem",
    docs: {
      description: "Newline after if",
      recommended: "stylistic"
    },
    fixable: "code",
    schema: [],
    messages: {
      missingIfNewline: "Expect newline after if"
    }
  },
  defaultOptions: [],
  create: (context) => {
    return {
      IfStatement(node) {
        if (!node.consequent)
          return;
        if (node.consequent.type === "BlockStatement")
          return;
        if (node.test.loc.end.line === node.consequent.loc.start.line) {
          context.report({
            node,
            loc: {
              start: node.test.loc.end,
              end: node.consequent.loc.start
            },
            messageId: "missingIfNewline",
            fix(fixer) {
              return fixer.replaceTextRange([node.consequent.range[0], node.consequent.range[0]], "\n");
            }
          });
        }
      }
    };
  }
});

const RULE_NAME$7 = "import-dedupe";
const importDedupe = createEslintRule({
  name: RULE_NAME$7,
  meta: {
    type: "problem",
    docs: {
      description: "Fix duplication in imports",
      recommended: "strict"
    },
    fixable: "code",
    schema: [],
    messages: {
      importDedupe: "Expect no duplication in imports"
    }
  },
  defaultOptions: [],
  create: (context) => {
    return {
      ImportDeclaration(node) {
        if (node.specifiers.length <= 1)
          return;
        const names = /* @__PURE__ */ new Set();
        node.specifiers.forEach((n) => {
          const id = n.local.name;
          if (names.has(id)) {
            context.report({
              node,
              loc: {
                start: n.loc.end,
                end: n.loc.start
              },
              messageId: "importDedupe",
              fix(fixer) {
                const s = n.range[0];
                let e = n.range[1];
                if (context.getSourceCode().text[e] === ",")
                  e += 1;
                return fixer.removeRange([s, e]);
              }
            });
          }
          names.add(id);
        });
      }
    };
  }
});

const RULE_NAME$6 = "prefer-inline-type-import";
const preferInlineTypeImport = createEslintRule({
  name: RULE_NAME$6,
  meta: {
    type: "suggestion",
    docs: {
      description: "Inline type import"
    },
    fixable: "code",
    schema: [],
    messages: {
      preferInlineTypeImport: "Prefer inline type import"
    }
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.getSourceCode();
    return {
      ImportDeclaration: (node) => {
        if (node.specifiers.length === 1 && ["ImportNamespaceSpecifier", "ImportDefaultSpecifier"].includes(node.specifiers[0].type))
          return;
        if (node.importKind === "type" && node.specifiers.length > 0) {
          context.report({
            *fix(fixer) {
              yield* removeTypeSpecifier(fixer, sourceCode, node);
              for (const specifier of node.specifiers)
                yield fixer.insertTextBefore(specifier, "type ");
            },
            loc: node.loc,
            messageId: "preferInlineTypeImport",
            node
          });
        }
      }
    };
  }
});
function* removeTypeSpecifier(fixer, sourceCode, node) {
  const importKeyword = sourceCode.getFirstToken(node);
  const typeIdentifier = sourceCode.getTokenAfter(importKeyword);
  yield fixer.remove(typeIdentifier);
  if (importKeyword.loc.end.column + 1 === typeIdentifier.loc.start.column) {
    yield fixer.removeRange([
      importKeyword.range[1],
      importKeyword.range[1] + 1
    ]);
  }
}

const RULE_NAME$5 = "top-level-function";
const topLevelFunction = createEslintRule({
  name: RULE_NAME$5,
  meta: {
    type: "problem",
    docs: {
      description: "Enforce top-level functions to be declared with function keyword",
      recommended: "stylistic"
    },
    fixable: "code",
    schema: [],
    messages: {
      topLevelFunctionDeclaration: "Top-level functions should be declared with function keyword"
    }
  },
  defaultOptions: [],
  create: (context) => {
    return {
      VariableDeclaration(node) {
        if (node.parent.type !== "Program" && node.parent.type !== "ExportNamedDeclaration")
          return;
        if (node.declarations.length !== 1)
          return;
        if (node.kind !== "const")
          return;
        if (node.declare)
          return;
        const declaration = node.declarations[0];
        if (declaration.init?.type !== "ArrowFunctionExpression")
          return;
        if (declaration.id?.type !== "Identifier")
          return;
        if (declaration.id.typeAnnotation)
          return;
        if (declaration.init.body.type !== "BlockStatement" && declaration.id?.loc.start.line === declaration.init?.body.loc.end.line)
          return;
        const arrowFn = declaration.init;
        const body = declaration.init.body;
        const id = declaration.id;
        context.report({
          node,
          loc: {
            start: id.loc.start,
            end: body.loc.start
          },
          messageId: "topLevelFunctionDeclaration",
          fix(fixer) {
            const code = context.getSourceCode().text;
            const textName = code.slice(id.range[0], id.range[1]);
            const textArgs = arrowFn.params.length ? code.slice(arrowFn.params[0].range[0], arrowFn.params[arrowFn.params.length - 1].range[1]) : "";
            const textBody = body.type === "BlockStatement" ? code.slice(body.range[0], body.range[1]) : `{
  return ${code.slice(body.range[0], body.range[1])}
}`;
            const textGeneric = arrowFn.typeParameters ? code.slice(arrowFn.typeParameters.range[0], arrowFn.typeParameters.range[1]) : "";
            const textTypeReturn = arrowFn.returnType ? code.slice(arrowFn.returnType.range[0], arrowFn.returnType.range[1]) : "";
            const textAsync = arrowFn.async ? "async " : "";
            const final = `${textAsync}function ${textName} ${textGeneric}(${textArgs})${textTypeReturn} ${textBody}`;
            return fixer.replaceTextRange([node.range[0], node.range[1]], final);
          }
        });
      }
    };
  }
});

const RULE_NAME$4 = "no-import-node-modules-by-path";
const noImportNodeModulesByPath = createEslintRule({
  name: RULE_NAME$4,
  meta: {
    type: "problem",
    docs: {
      description: "Prevent importing modules in `node_modules` folder by relative or absolute path",
      recommended: "recommended"
    },
    schema: [],
    messages: {
      noImportNodeModulesByPath: "Do not import modules in `node_modules` folder by path"
    }
  },
  defaultOptions: [],
  create: (context) => {
    return {
      "ImportDeclaration": (node) => {
        if (node.source.value.includes("/node_modules/")) {
          context.report({
            node,
            messageId: "noImportNodeModulesByPath"
          });
        }
      },
      'CallExpression[callee.name="require"]': (node) => {
        const value = node.arguments[0]?.value;
        if (typeof value === "string" && value.includes("/node_modules/")) {
          context.report({
            node,
            messageId: "noImportNodeModulesByPath"
          });
        }
      }
    };
  }
});

const RULE_NAME$3 = "no-ts-export-equal";
const noTsExportEqual = createEslintRule({
  name: RULE_NAME$3,
  meta: {
    type: "problem",
    docs: {
      description: "Do not use `exports =`",
      recommended: "recommended"
    },
    schema: [],
    messages: {
      noTsExportEqual: "Use ESM `export default` instead"
    }
  },
  defaultOptions: [],
  create: (context) => {
    const extension = context.getFilename().split(".").pop();
    if (!["ts", "tsx", "mts", "cts"].includes(extension))
      return {};
    return {
      TSExportAssignment(node) {
        context.report({
          node,
          messageId: "noTsExportEqual"
        });
      }
    };
  }
});

const RULE_NAME$2 = "no-cjs-exports";
const noCjsExports = createEslintRule({
  name: RULE_NAME$2,
  meta: {
    type: "problem",
    docs: {
      description: "Do not use CJS exports"
    },
    schema: [],
    messages: {
      noCjsExports: "Use ESM export instead"
    }
  },
  defaultOptions: [],
  create: (context) => {
    const extension = context.getFilename().split(".").pop();
    if (!["ts", "tsx", "mts", "cts"].includes(extension))
      return {};
    return {
      'MemberExpression[object.name="exports"]': function(node) {
        context.report({
          node,
          messageId: "noCjsExports"
        });
      },
      'MemberExpression[object.name="module"][property.name="exports"]': function(node) {
        context.report({
          node,
          messageId: "noCjsExports"
        });
      }
    };
  }
});

const RULE_NAME$1 = "no-const-enum";
const noConstEnum = createEslintRule({
  name: RULE_NAME$1,
  meta: {
    type: "problem",
    docs: {
      description: "Disallow using `const enum` expression",
      recommended: "recommended"
    },
    schema: [],
    messages: {
      noConstEnum: "Do not use `const enum` expression"
    }
  },
  defaultOptions: [],
  create: (context) => {
    return {
      TSEnumDeclaration: (node) => {
        if (node.const) {
          context.report({
            node,
            messageId: "noConstEnum"
          });
        }
      }
    };
  }
});

const RULE_NAME = "named-tuple-spacing";
const RE = /^([\w_$]+)(\s*)(\?\s*)?:(\s*)(.*)$/;
const namedTupleSpacing = createEslintRule({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: {
      description: "Expect space before type declaration in named tuple",
      recommended: "stylistic"
    },
    fixable: "code",
    schema: [],
    messages: {
      expectedSpaceAfter: "Expected a space after the ':'.",
      unexpectedSpaceBetween: "Unexpected space between '?' and the ':'.",
      unexpectedSpaceBefore: "Unexpected space before the ':'."
    }
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.getSourceCode();
    return {
      TSNamedTupleMember: (node) => {
        const code = sourceCode.text.slice(node.range[0], node.range[1]);
        const match = code.match(RE);
        if (!match)
          return;
        const labelName = node.label.name;
        const spaceBeforeColon = match[2];
        const optionalMark = match[3];
        const spacesAfterColon = match[4];
        const elementType = match[5];
        function getReplaceValue() {
          let ret = labelName;
          if (node.optional)
            ret += "?";
          ret += ": ";
          ret += elementType;
          return ret;
        }
        if (optionalMark?.length > 1) {
          context.report({
            node,
            messageId: "unexpectedSpaceBetween",
            *fix(fixer) {
              yield fixer.replaceTextRange(node.range, code.replace(RE, getReplaceValue()));
            }
          });
        }
        if (spaceBeforeColon?.length) {
          context.report({
            node,
            messageId: "unexpectedSpaceBefore",
            *fix(fixer) {
              yield fixer.replaceTextRange(node.range, code.replace(RE, getReplaceValue()));
            }
          });
        }
        if (spacesAfterColon != null && spacesAfterColon.length !== 1) {
          context.report({
            node,
            messageId: "expectedSpaceAfter",
            *fix(fixer) {
              yield fixer.replaceTextRange(node.range, code.replace(RE, getReplaceValue()));
            }
          });
        }
      }
    };
  }
});

const index = {
  rules: {
    "if-newline": ifNewline,
    "import-dedupe": importDedupe,
    "prefer-inline-type-import": preferInlineTypeImport,
    "generic-spacing": genericSpacing,
    "top-level-function": topLevelFunction,
    "no-import-node-modules-by-path": noImportNodeModulesByPath,
    "no-cjs-exports": noCjsExports,
    "no-ts-export-equal": noTsExportEqual,
    "no-const-enum": noConstEnum,
    "named-tuple-spacing": namedTupleSpacing
  }
};

module.exports = index;
