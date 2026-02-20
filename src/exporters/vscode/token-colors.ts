/**
 * VSCode tokenColors — TextMate grammar scope rules.
 *
 * Ported from the RLabs SvelteKit app, translated from the UIColors/SyntaxColors/AnsiColors
 * bag into ThemePalette role names (bg1, fg1, ac1, keyword, functionCall, ansiBrightBlue, …).
 *
 * @internal
 */

/** Minimal token color entry (matches VS Code JSON schema) */
export interface TokenColor {
  name?: string;
  scope: string | string[];
  settings: {
    foreground?: string;
    fontStyle?: string;
  };
}

/** Role accessor helpers passed from the main exporter */
export interface C {
  h: (role: string) => string;
  /** Append a 2-char hex alpha suffix to a role's hex string */
  a: (role: string, alpha: string) => string;
}

export function buildTokenColors({ h }: C): TokenColor[] {
  return [
    // ── Base / General ──────────────────────────────────────────────────────
    { name: 'Basic String Content',  scope: ['string'],    settings: { foreground: h('fg1') } },
    { name: 'Emphasized Text',       scope: ['emphasis'],  settings: { fontStyle: 'italic' } },
    { name: 'Strong Text',           scope: ['strong'],    settings: { fontStyle: 'bold' } },
    { name: 'Invalid Code',          scope: ['invalid'],   settings: { foreground: h('error'),   fontStyle: 'strikethrough' } },
    { name: 'Deprecated Code',       scope: ['invalid.deprecated'], settings: { foreground: h('warning'), fontStyle: 'underline italic' } },
    { name: 'Header Content',        scope: ['header'],    settings: { foreground: h('ac2') } },
    { name: 'Source Code',           scope: ['source'],    settings: { foreground: h('fg1') } },
    { name: 'INI File Content',      scope: ['source.ini'],    settings: { foreground: h('fg2') } },
    { name: 'Ignore File Content',   scope: ['source.ignore'], settings: { foreground: h('fg2') } },

    // ── Base / Markup ────────────────────────────────────────────────────────
    { name: 'Markup Inserted',       scope: ['markup.inserted'],     settings: { foreground: h('success') } },
    { name: 'Markup Deleted',        scope: ['markup.deleted'],      settings: { foreground: h('error') } },
    { name: 'Markup Changed',        scope: ['markup.changed'],      settings: { foreground: h('warning') } },
    { name: 'Markup Error',          scope: ['markup.error'],        settings: { foreground: h('error') } },
    { name: 'Markup Underline',      scope: ['markup.underline'],    settings: { fontStyle: 'underline' } },
    { name: 'Markup Bold',           scope: ['markup.bold'],         settings: { fontStyle: 'bold' } },
    { name: 'Markup Headings',       scope: ['markup.heading'],      settings: { foreground: h('ac1'), fontStyle: 'bold' } },
    { name: 'Markup Italic',         scope: ['markup.italic'],       settings: { fontStyle: 'italic' } },
    { name: 'Markup Quotes',         scope: ['markup.quote'],        settings: { foreground: h('fg2') } },
    { name: 'Markup Raw',            scope: ['markup.inline.raw', 'markup.raw.restructuredtext'], settings: { foreground: h('fg2') } },
    { name: 'Markup Links',          scope: ['markup.underline.link', 'markup.underline.link.image'], settings: { foreground: h('info') } },
    { scope: 'token.info-token',     settings: { foreground: h('info') } },
    { scope: 'token.warn-token',     settings: { foreground: h('warning') } },
    { scope: 'token.error-token',    settings: { foreground: h('error') } },
    { scope: 'token.debug-token',    settings: { foreground: h('warning') } },

    // ── Base / Punctuation ───────────────────────────────────────────────────
    { name: 'Basic Punctuation',     scope: ['punctuation.definition'], settings: { foreground: h('punctuation') } },
    {
      name: 'Attribute/CSS Punctuation',
      scope: [
        'entity.other.attribute-name punctuation',
        'punctuation.definition.keyword.css',
        'punctuation.section.property-list.begin.bracket.curly.css',
        'punctuation.section.property-list.end.bracket.curly.css',
        'punctuation.definition.attribute-selector.end.bracket.square.scss',
        'punctuation.definition.attribute-selector.begin.bracket.square.scss',
      ],
      settings: { foreground: h('punctuation') },
    },
    {
      name: 'Support Type Punctuation',
      scope: ['punctuation.support', 'punctuation.support.type.property-name.begin', 'punctuation.support.type.property-name.end'],
      settings: { foreground: h('support') },
    },
    {
      name: 'Braces, Brackets and Parentheses',
      scope: [
        'meta.brace.round', 'meta.brace.square', 'meta.brace.curly',
        'punctuation.separator', 'meta.function-call punctuation',
        'punctuation.definition.arguments.begin', 'punctuation.definition.arguments.end',
        'punctuation.definition.entity.begin', 'punctuation.definition.entity.end',
        'punctuation.definition.type.begin', 'punctuation.definition.type.end',
        'punctuation.section.scope.begin', 'punctuation.section.scope.end',
        'meta.group.toml', 'meta.group.double.toml',
        'punctuation.definition.block.scalar.folded.yaml',
        'punctuation.definition.block.scalar.literal.yaml',
        'punctuation.definition.block.sequence.item.yaml',
      ],
      settings: { foreground: h('punctuationBrace') },
    },
    {
      name: 'String and Section Punctuation',
      scope: [
        'punctuation.section', 'punctuation.definition.string',
        'punctuation.definition.string.begin', 'punctuation.definition.string.end',
        'punctuation.section.embedded.begin', 'punctuation.section.embedded.end',
        'punctuation.section.embedded.begin.tsx', 'punctuation.section.embedded.end.tsx',
        'punctuation.section.embedded.begin.jsx', 'punctuation.section.embedded.end.jsx',
        'meta.string-contents.quoted.double punctuation.definition.variable',
        'punctuation.definition.variable.makefile',
      ],
      settings: { foreground: h('punctuationQuote') },
    },
    {
      name: 'Separators and Delimiters',
      scope: [
        'punctuation.separator', 'punctuation.separator.comma',
        'punctuation.separator.comma.css', 'punctuation.separator.key-value',
        'punctuation.separator.key-value.css', 'punctuation.separator.list.comma.css',
      ],
      settings: { foreground: h('punctuationComma') },
    },
    {
      name: 'Interpolated Strings',
      scope: [
        'punctuation string.interpolated',
        'punctuation.definition.interpolation.begin', 'punctuation.definition.interpolation.end',
        'punctuation.definition.constant.restructuredtext',
        'punctuation.definition.template-expression.begin', 'punctuation.definition.template-expression.end',
      ],
      settings: { foreground: h('ac1') },
    },

    // ── Syntax / Comments ────────────────────────────────────────────────────
    {
      name: 'Basic Comments',
      scope: ['comment', 'punctuation.definition.comment', 'unused.comment', 'wildcard.comment'],
      settings: { foreground: h('comment') },
    },
    {
      name: 'Documentation Comments',
      scope: [
        'comment.block.documentation', 'comment.block.documentation.js',
        'comment.block.documentation.ts', 'comment.block.documentation.rust',
        'comment.block.documentation.go',
      ],
      settings: { foreground: h('comment') },
    },
    {
      name: 'Shebang Comments',
      scope: ['comment.line.shebang', 'punctuation.definition.comment.shebang', 'meta.shebang'],
      settings: { foreground: h('language') },
    },
    {
      name: 'Todo Comments',
      scope: ['comment.line.todo', 'comment.line.fixme', 'comment.line.note', 'comment.line.hack'],
      settings: { foreground: h('warning'), fontStyle: 'bold' },
    },

    // ── Syntax / Constants ───────────────────────────────────────────────────
    { name: 'Basic Constants',    scope: ['constant', 'constant.numeric'],               settings: { foreground: h('constant') } },
    { name: 'Color Constants',    scope: ['constant.other.color'],                       settings: { foreground: h('other') } },
    { name: 'Character Constants', scope: ['constant.character'],                         settings: { foreground: h('warning') } },
    {
      name: 'Language Constants',
      scope: ['constant.character.escape', 'constant.character.string.escape', 'constant.regexp', 'constant.language'],
      settings: { foreground: h('language') },
    },
    { name: 'Date/Time Constants', scope: ['constant.other.date', 'constant.other.timestamp'], settings: { foreground: h('datetime') } },
    {
      name: 'Numeric Constants',
      scope: ['constant.numeric.decimal', 'constant.numeric.hex', 'constant.numeric.binary', 'constant.numeric.octal'],
      settings: { foreground: h('constant') },
    },
    {
      name: 'Built-in Constants',
      scope: ['constant.language.null', 'constant.language.boolean', 'constant.language.undefined', 'constant.language.infinity'],
      settings: { foreground: h('language') },
    },

    // ── Syntax / Entities ────────────────────────────────────────────────────
    { name: 'Class and Type Names', scope: ['entity.name.class', 'entity.name.type.class', 'entity.other.inherited-class'], settings: { foreground: h('class') } },
    { name: 'Type Names',          scope: ['entity.name.type'],                              settings: { foreground: h('type') } },
    {
      name: 'Type Parameters and Modules',
      scope: ['entity.name.type.module', 'entity.name.type.type-parameter', 'meta.indexer.mappedtype.declaration entity.name.type', 'meta.type.parameters entity.name.type'],
      settings: { foreground: h('typeParameter') },
    },
    { name: 'Function Names',  scope: ['entity.name.function', 'entity.name.function.member'], settings: { foreground: h('function') } },
    { name: 'Tag Names',       scope: ['entity.name.tag', 'entity.name.tag.custom'],           settings: { foreground: h('tag') } },
    { name: 'Section Names',   scope: ['entity.name.section'],                                 settings: { foreground: h('class') } },

    // ── Syntax / Functions ───────────────────────────────────────────────────
    { scope: ['entity.name.function'],                                         settings: { foreground: h('function') } },
    { scope: ['meta.function-call', 'meta.function-call.generic', 'meta.function-call.object'], settings: { foreground: h('functionCall') } },
    { scope: ['variable.function'],                                            settings: { foreground: h('functionCall') } },
    {
      name: 'Decorators',
      scope: ['meta.annotation variable.function', 'meta.annotation variable.annotation.function', 'meta.annotation punctuation.definition.annotation', 'meta.decorator', 'punctuation.decorator'],
      settings: { foreground: h('functionCall') },
    },
    { scope: ['entity.name.function.member'], settings: { foreground: h('method') } },

    // ── Syntax / Keywords ────────────────────────────────────────────────────
    { name: 'Basic Keywords',    scope: ['keyword', 'punctuation.definition.keyword'],      settings: { foreground: h('keyword') } },
    {
      name: 'Operators',
      scope: ['keyword.operator', 'keyword.operator.logical', 'keyword.operator.relational', 'keyword.operator.comparison', 'keyword.operator.assignment', 'keyword.operator.arithmetic', 'keyword.operator.bitwise', 'keyword.operator.logical.js', 'keyword.operator.logical.ts', 'keyword.operator.logical.jsx', 'keyword.operator.logical.tsx'],
      settings: { foreground: h('operator') },
    },
    { name: 'Units',             scope: ['keyword.other.unit'],                            settings: { foreground: h('unit') } },
    { name: 'Control Keywords',  scope: ['keyword.control', 'keyword.other.template', 'keyword.other.substitution'], settings: { foreground: h('control') } },
    { name: 'Language Keywords', scope: ['keyword.other.this', 'keyword.other.super', 'keyword.other.self'],          settings: { foreground: h('language') } },
    { name: 'Import Keywords',   scope: ['keyword.control.import', 'keyword.control.from', 'keyword.control.export'], settings: { foreground: h('controlImport') } },
    { name: 'New Keyword',       scope: ['keyword.control.new', 'keyword.operator.new', 'keyword.other.important.css'], settings: { foreground: h('warning') } },
    {
      name: 'Flow Control Keywords',
      scope: ['keyword.control.flow', 'keyword.control.loop', 'keyword.control.conditional', 'keyword.operator.ternary'],
      settings: { foreground: h('controlFlow') },
    },

    // ── Syntax / Storage ─────────────────────────────────────────────────────
    { name: 'Storage',            scope: ['storage'],                                         settings: { foreground: h('storage') } },
    {
      name: 'Storage Type Keywords',
      scope: ['storage.type', 'storage.type.class', 'storage.type.interface', 'storage.type.enum', 'storage.type.function'],
      settings: { foreground: h('storage') },
    },
    { name: 'Storage Modifiers', scope: ['storage.modifier', 'storage.modifier.access', 'storage.modifier.static', 'storage.modifier.async'], settings: { foreground: h('modifier') } },
    { name: 'Storage Type Primitives', scope: ['storage.type.primitive', 'storage.type.built-in', 'storage.type.number'], settings: { foreground: h('type') } },
    { name: 'Storage Type Namespace', scope: ['storage.type.namespace', 'storage.type.module'], settings: { foreground: h('storage') } },

    // ── Syntax / Strings ─────────────────────────────────────────────────────
    { name: 'Basic Strings',         scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: h('fg1') } },
    { name: 'Regular Expressions',   scope: ['string.regexp'],                               settings: { foreground: h('fg2') } },
    {
      name: 'String Interpolation',
      scope: ['punctuation string.interpolated', 'punctuation.definition.interpolation.begin', 'punctuation.definition.interpolation.end', 'punctuation.definition.template-expression.begin', 'punctuation.definition.template-expression.end'],
      settings: { foreground: h('ac1') },
    },
    { name: 'String Escape',  scope: ['constant.character.escape', 'constant.character.string.escape', 'constant.regexp'], settings: { foreground: h('language') } },

    // ── Syntax / Support ─────────────────────────────────────────────────────
    { name: 'Basic Support',         scope: ['support'],                                     settings: { foreground: h('support') } },
    { name: 'Support Types',         scope: ['support.type'],                                settings: { foreground: h('type') } },
    { name: 'Support Constants',     scope: ['support.constant'],                            settings: { foreground: h('constant') } },
    { name: 'Support Functions',     scope: ['support.function'],                            settings: { foreground: h('supportFunction') } },
    {
      scope: ['support.function.magic', 'storage.modifier.async', 'keyword.control.trycatch', 'keyword.control.trycatch.js', 'keyword.control.trycatch.ts', 'keyword.control.trycatch.tsx', 'keyword.control.trycatch.jsx'],
      settings: { foreground: h('supportFunction') },
    },
    { name: 'Support Classes',       scope: ['support.class'],                               settings: { foreground: h('language') } },
    { name: 'Support Other',         scope: ['support.other'],                               settings: { foreground: h('other') } },
    { name: 'Support Variables',     scope: ['support.variable', 'variable.other.predefined'], settings: { foreground: h('supportVariable') } },
    { name: 'Support Property Names', scope: ['support.type.property-name'],                 settings: { foreground: h('supportProperty') } },
    { name: 'Support Methods',       scope: ['support.method', 'support.function.misc'],     settings: { foreground: h('supportMethod') } },
    { name: 'Support Method Calls',  scope: ['support.method-call'],                         settings: { foreground: h('supportMethod') } },
    {
      scope: ['support.variable.property', 'support.variable.property.js', 'support.variable.property.ts'],
      settings: { foreground: h('supportProperty') },
    },

    // ── Syntax / Types & Classes ─────────────────────────────────────────────
    { scope: ['entity.name.type'],                                             settings: { foreground: h('type') } },
    {
      scope: ['entity.name.type.module', 'entity.name.type.type-parameter', 'meta.indexer.mappedtype.declaration entity.name.type', 'meta.type.parameters entity.name.type'],
      settings: { foreground: h('typeParameter') },
    },
    { scope: ['entity.name.class', 'entity.name.type.class', 'entity.other.inherited-class'], settings: { foreground: h('class') } },

    // ── Syntax / Variables ───────────────────────────────────────────────────
    { scope: ['entity.other.attribute-name', 'meta.object-literal.key.js'],   settings: { foreground: h('attribute') } },
    { scope: ['entity.other.property-name', 'meta.property-name', 'variable.other.property.cli'], settings: { foreground: h('property') } },
    {
      scope: ['variable.parameter', 'variable.parameter.cli', 'variable.other.parameter', 'entity.name.variable.parameter', 'meta.at-rule.function variable', 'meta.at-rule.mixin variable'],
      settings: { foreground: h('parameter') },
    },
    { scope: ['variable.other.constant'],                                      settings: { foreground: h('variableReadonly') } },
    {
      scope: ['meta.import variable.other.readwrite.alias', 'meta.export variable.other.readwrite.alias', 'meta.variable.assignment.destructured.object.coffee variable variable', 'variable.other.readwrite.js'],
      settings: { foreground: h('variable') },
    },
    { scope: ['variable.other.property', 'variable.other.property.ts', 'variable.other.object.instance.property', 'variable.other.constant.property'], settings: { foreground: h('supportProperty') } },
    { scope: ['variable.object.property', 'variable.object.property.ts', 'variable.property.cli', 'variable.property', 'variable.other.object.property', 'variable.other.object.property.ts'], settings: { foreground: h('variableProperty') } },
    { scope: ['variable', 'string.interpolated'],                              settings: { foreground: h('variable') } },
    { scope: ['variable.language', 'variable.parameter.language', 'variable.other.language'], settings: { foreground: h('language') } },

    // ── Language: JavaScript / TypeScript ────────────────────────────────────
    {
      scope: ['meta.export variable.other.readwrite.js', 'meta.export variable.other.readwrite.ts', 'meta.export variable.other.readwrite.tsx', 'meta.export variable.other.readwrite.jsx'],
      settings: { foreground: h('variableDeclaration') },
    },
    { name: 'JS/TS Properties',  scope: ['variable.other.property.js', 'variable.other.property.ts'],  settings: { foreground: h('property') } },
    { name: 'JSDoc',             scope: ['variable.other.jsdoc', 'comment.block.documentation variable.other'], settings: { foreground: h('other'), fontStyle: '' } },
    { name: 'JSDoc Keywords',    scope: 'storage.type.class.jsdoc',                                     settings: { foreground: h('class') } },
    { name: 'Console Object',    scope: ['support.type.object.console.js', 'support.type.object.console.ts'], settings: { foreground: h('supportVariable') } },
    { name: 'Node Constants',    scope: ['support.constant.node', 'support.type.object.module.js', 'support.type.object.module.ts'], settings: { foreground: h('support') } },
    { name: 'implements',        scope: 'storage.modifier.implements',                                  settings: { foreground: h('modifier') } },
    {
      name: 'Builtin Types',
      scope: ['constant.language.null.js', 'constant.language.null.ts', 'constant.language.undefined.js', 'constant.language.undefined.ts', 'support.type.builtin.ts'],
      settings: { foreground: h('language') },
    },
    { name: 'Generic Type Params', scope: 'variable.parameter.generic',                                settings: { foreground: h('parameter') } },
    { name: 'Arrow Functions',     scope: ['keyword.declaration.function.arrow.js', 'storage.type.function.arrow.ts'], settings: { foreground: h('function') } },
    { name: 'Decorator Punctuation', scope: 'punctuation.decorator.ts',                                settings: { foreground: h('ac1') } },
    {
      name: 'Extra JS/TS Keywords',
      scope: ['keyword.operator.expression.in.js', 'keyword.operator.expression.in.ts', 'keyword.operator.expression.infer.ts', 'keyword.operator.expression.instanceof.js', 'keyword.operator.expression.instanceof.ts', 'keyword.operator.expression.is', 'keyword.operator.expression.keyof.ts', 'keyword.operator.expression.of.js', 'keyword.operator.expression.of.ts', 'keyword.operator.expression.typeof.ts'],
      settings: { foreground: h('operator') },
    },

    // ── Language: Rust ───────────────────────────────────────────────────────
    {
      name: 'Rust Attribute',
      scope: ['meta.annotation.rust', 'meta.annotation.rust punctuation', 'meta.attribute.rust', 'meta.attribute.rust string.quoted.single.char.rust', 'meta.attribute.rust string.quoted.double.rust', 'punctuation.definition.attribute.rust'],
      settings: { foreground: h('attribute') },
    },
    { name: 'Rust Builtin Attributes', scope: 'meta.attribute.rust support.attribute',       settings: { foreground: h('language') } },
    {
      name: 'Rust Keywords',
      scope: ['entity.name.function.macro.rules.rust', 'storage.type.module.rust', 'storage.modifier.rust', 'storage.type.struct.rust', 'storage.type.enum.rust', 'storage.type.trait.rust', 'storage.type.union.rust', 'storage.type.impl.rust', 'storage.type.rust', 'storage.type.function.rust', 'storage.type.type.rust'],
      settings: { foreground: h('storage'), fontStyle: '' },
    },
    { name: 'Rust Numeric Types',      scope: 'entity.name.type.numeric.rust',               settings: { foreground: h('type'), fontStyle: '' } },
    { name: 'Rust Generics',           scope: 'meta.generic.rust',                           settings: { foreground: h('typeParameter') } },
    { name: 'Rust impl',               scope: 'entity.name.impl.rust',                       settings: { foreground: h('supportMethod') } },
    { name: 'Rust Module',             scope: 'entity.name.module.rust',                     settings: { foreground: h('supportVariable') } },
    { name: 'Rust Trait',              scope: 'entity.name.trait.rust',                      settings: { foreground: h('type') } },
    { name: 'Rust Struct',             scope: 'storage.type.source.rust',                    settings: { foreground: h('class') } },
    { name: 'Rust Union',              scope: 'entity.name.union.rust',                      settings: { foreground: h('operator') } },
    { name: 'Rust Enum Member',        scope: 'meta.enum.rust storage.type.source.rust',     settings: { foreground: h('supportVariable') } },
    { name: 'Rust Macro',              scope: ['support.macro.rust', 'meta.macro.rust support.function.rust', 'entity.name.function.macro.rust'], settings: { foreground: h('supportFunction') } },
    { name: 'Rust Lifetime',           scope: ['storage.modifier.lifetime.rust', 'entity.name.type.lifetime'], settings: { foreground: h('modifier') } },
    { name: 'Rust String Formatting',  scope: 'string.quoted.double.rust constant.other.placeholder.rust', settings: { foreground: h('fg2') } },
    { name: 'Rust Return Generic',     scope: 'meta.function.return-type.rust meta.generic.rust storage.type.rust', settings: { foreground: h('typeParameter') } },
    { name: 'Rust Function',           scope: 'entity.name.function.macro.rules.rust',       settings: { foreground: h('function'), fontStyle: '' } },
    { name: 'Rust Function Call',      scope: 'meta.function.call.rust',                     settings: { foreground: h('functionCall') } },
    { name: 'Rust Angle Brackets',     scope: 'punctuation.brackets.angle.rust',             settings: { foreground: h('operator') } },
    { name: 'Rust Constants',          scope: 'constant.other.caps.rust',                    settings: { foreground: h('constant') } },
    { name: 'Rust Parameters',         scope: ['meta.function.definition.rust variable.other.rust'], settings: { foreground: h('parameter') } },
    { name: 'Rust Closure Variables',  scope: 'meta.function.call.rust variable.other.rust',  settings: { foreground: h('variableReadonly') } },
    { name: 'Rust Self',               scope: 'variable.language.self.rust',                 settings: { foreground: h('language') } },
    { name: 'Rust Metavariables',      scope: ['variable.other.metavariable.name.rust', 'meta.macro.metavariable.rust keyword.operator.macro.dollar.rust'], settings: { foreground: h('variableDeclaration') } },

    // ── Language: CSS / SCSS / Less ──────────────────────────────────────────
    { name: 'CSS Class Selectors',     scope: ['entity.other.attribute-name.class.css'],     settings: { foreground: h('class') } },
    { name: 'CSS Classes',             scope: ['source.css entity.other.attribute-name.class.css', 'entity.other.attribute-name.parent-selector.css punctuation.definition.entity.css'], settings: { foreground: h('class') } },
    { name: 'CSS Pseudo',              scope: ['entity.other.attribute-name.pseudo-class.css', 'source.css entity.other.attribute-name.pseudo-class'], settings: { foreground: h('type') } },
    { name: 'CSS Operators',           scope: ['punctuation.separator.operator.css', 'keyword.operator.combinator.css'], settings: { foreground: h('operator') } },
    { name: 'CSS Unicode Ranges',      scope: 'source.css constant.other.unicode-range',     settings: { foreground: h('other') } },
    { name: 'CSS URL',                 scope: 'source.css variable.parameter.url',           settings: { foreground: h('info'), fontStyle: '' } },
    { name: 'CSS Property Names',      scope: ['support.type.property-name.css', 'support.type.property-name.media.css'], settings: { foreground: h('property') } },
    {
      name: 'CSS Property Names (support)',
      scope: ['source.css support.type.property-name', 'source.sass support.type.property-name', 'source.scss support.type.property-name', 'source.less support.type.property-name', 'source.stylus support.type.property-name', 'source.postcss support.type.property-name', 'support.type.vendored.property-name'],
      settings: { foreground: h('supportProperty') },
    },
    { name: 'CSS Property Values', scope: ['support.constant.property-value.css', 'meta.property-value.css', 'source.css support.constant.color', 'meta.property-value.scss', 'constant.numeric.css'], settings: { foreground: h('constant') } },
    {
      name: 'CSS Units',
      scope: ['keyword.other.unit.percentage.css', 'keyword.other.unit.px.css', 'keyword.other.unit.rem.css', 'keyword.other.unit.em.css', 'keyword.other.unit.vh.css', 'keyword.other.unit.vw.css'],
      settings: { foreground: h('unit') },
    },
    { name: 'CSS Tags',         scope: ['entity.name.tag.css', 'entity.name.tag.less', 'entity.name.tag.custom.css', 'entity.name.tag.scss', 'entity.other.attribute-name.id.css'], settings: { foreground: h('tag') } },
    { name: 'CSS Wildcards',    scope: ['entity.name.tag.wildcard.css', 'entity.name.tag.wildcard.less', 'entity.name.tag.wildcard.scss', 'entity.name.tag.wildcard.sass'], settings: { foreground: h('tagPunctuation') } },
    { name: 'CSS/SCSS Variables', scope: ['variable.css', 'variable.argument.css', 'variable.scss', 'variable.parameter.url.scss', 'variable.other.less'], settings: { foreground: h('variable') } },
    { name: 'CSS Attribute Selectors', scope: ['source.css meta.attribute-selector', 'meta.attribute-selector.scss'], settings: { foreground: h('selector') } },
    { name: 'CSS Custom Properties (left)', scope: ['source.css meta.property-list variable', 'meta.property-list variable.other.less', 'meta.property-list variable.other.less punctuation.definition.variable.less'], settings: { foreground: h('ac2') } },
    { name: 'CSS Custom Properties (right)', scope: ['source.css meta.property-value variable', 'source.css meta.property-value variable.other.less', 'source.css meta.property-value variable.other.less punctuation.definition.variable.less', 'meta.definition.variable.scss'], settings: { foreground: h('ac2') } },
    { name: 'SCSS Mixins',      scope: ['entity.name.function.scss', 'support.function.misc.scss'], settings: { foreground: h('function') } },
    { name: 'CSS Function Calls', scope: ['support.function.calc.css', 'support.function.var.css', 'support.function.misc.css', 'support.function.url.css', 'support.function.transform.css', 'support.function.timing-function.css', 'support.function.misc.scss', 'support.function.name.sass.library'], settings: { foreground: h('functionCall') } },
    { name: 'CSS Tailwind Apply', scope: ['keyword.control.at-rule.apply.tailwind', 'keyword.control.at-rule.import.css'], settings: { foreground: h('controlImport') } },
    { name: 'CSS Tailwind Layer',  scope: ['keyword.control.at-rule.layer.tailwind', 'keyword.control.at-rule.tailwind.tailwind'], settings: { foreground: h('controlFlow') } },
    { name: 'CSS Selector',       scope: ['meta.selector', 'meta.attribute-selector.css', 'punctuation.definition.attribute-selector.begin.bracket.square.css', 'punctuation.definition.attribute-selector.end.bracket.square.css'], settings: { foreground: h('selector') } },
    { name: 'CSS Property Names (support2)', scope: 'support.type.property-name.css', settings: { foreground: h('supportProperty'), fontStyle: '' } },
    { name: 'CSS At-Rules',       scope: ['keyword.control.at-rule.media.css', 'keyword.control.at-rule.keyframes.css', 'keyword.control.at-rule.mixin.scss', 'keyword.control.at-rule.include.scss'], settings: { foreground: h('control') } },

    // ── Language: HTML / XML ─────────────────────────────────────────────────
    { name: 'HTML String Values', scope: ['string.quoted.double.html', 'string.quoted.single.html', 'string.quoted.double.xml', 'string.quoted.single.xml'], settings: { foreground: h('fg2') } },
    { name: 'HTML Tags',          scope: ['meta.tag.any.html', 'entity.name.tag', 'entity.name.tag.html', 'entity.name.tag.xml', 'entity.name.tag.localname.xml'], settings: { foreground: h('tag') } },
    {
      name: 'HTML Tag Punctuation',
      scope: ['punctuation.definition.tag', 'punctuation.definition.tag.html', 'punctuation.definition.tag.begin.html', 'punctuation.definition.tag.end.html', 'punctuation.separator.key-value.html', 'punctuation.definition.tag.xml', 'punctuation.definition.tag.begin.xml', 'punctuation.definition.tag.end.xml', 'punctuation.separator.key-value.xml'],
      settings: { foreground: h('tagPunctuation') },
    },
    { name: 'HTML DOCTYPE',       scope: ['keyword.other.doctype', 'meta.tag.sgml.doctype punctuation.definition.tag', 'meta.tag.metadata.doctype entity.name.tag', 'meta.tag.metadata.doctype punctuation.definition.tag'], settings: { foreground: h('other') } },
    { name: 'HTML Entities',      scope: ['text.html constant.character.entity', 'text.html constant.character.entity punctuation', 'constant.character.entity.xml', 'constant.character.entity.xml punctuation', 'constant.character.entity.js.jsx', 'constant.character.entity.js.jsx punctuation', 'constant.character.entity.tsx', 'constant.character.entity.tsx punctuation'], settings: { foreground: h('warning') } },
    { name: 'HTML Attributes',    scope: ['entity.other.attribute-name', 'variable.other.key', 'entity.other.attribute-name.html', 'entity.other.attribute-name.xml', 'entity.other.attribute-name.localname.xml'], settings: { foreground: h('attribute') } },
    { name: 'HTML Component Tags', scope: ['support.class.component', 'support.class.component.jsx', 'support.class.component.tsx', 'support.class.component.vue'], settings: { foreground: h('function') } },

    // ── Language: Python ─────────────────────────────────────────────────────
    { name: 'Python Class',                  scope: 'entity.name.type.class.python',                settings: { foreground: h('class') } },
    { name: 'Python Magic Variables',        scope: ['support.variable.magic.python'],               settings: { foreground: h('supportVariable') } },
    { name: 'Python Function Call Arguments',scope: ['meta.function-call.arguments.python'],         settings: { foreground: h('parameter') } },
    { name: 'Python Dunder Functions',       scope: ['support.function.magic.python'],               settings: { foreground: h('supportFunction') } },
    { name: 'Python self',                   scope: ['variable.parameter.function.language.special.self.python', 'variable.language.special.self.python'], settings: { foreground: h('language') } },
    { scope: ['keyword.operator.logical.python'],                                                     settings: { foreground: h('operator') } },
    { name: 'Python Flow Control',           scope: ['keyword.control.flow.python'],                 settings: { foreground: h('controlFlow') } },
    { name: 'Python Storage',               scope: 'storage.type.function.python',                   settings: { foreground: h('function') } },
    { name: 'Python Decorator',             scope: ['support.token.decorator.python', 'meta.function.decorator.identifier.python'], settings: { foreground: h('supportFunction') } },
    { name: 'Python Function Call',         scope: ['meta.function-call.python'],                    settings: { foreground: h('functionCall') } },
    { name: 'Python Type Hints',            scope: ['meta.function.parameters.python', 'meta.function.python meta.function-call.arguments.python'], settings: { foreground: h('variableProperty') } },
    { name: 'Python Decorator Name',        scope: ['entity.name.function.decorator.python', 'punctuation.definition.decorator.python'], settings: { foreground: h('function') } },
    { name: 'Python Placeholder',           scope: 'constant.character.format.placeholder.other.python', settings: { foreground: h('fg2') } },
    { name: 'Python Builtin Functions',     scope: ['support.function.builtin.python'],               settings: { foreground: h('supportFunction') } },
    { name: 'Python Exception Types',       scope: ['support.type.exception.python'],                 settings: { foreground: h('supportMethod') } },
    { name: 'Python Types',                 scope: ['support.type.python'],                           settings: { foreground: h('type') } },
    { name: 'Python Language Constants',    scope: 'constant.language.python',                        settings: { foreground: h('language') } },
    { name: 'Python Item Access',           scope: ['meta.indexed-name.python', 'meta.item-access.python'], settings: { foreground: h('attribute') } },
    { name: 'Python String Types',          scope: 'storage.type.string.python',                      settings: { foreground: h('type') } },

    // ── Language: Go ─────────────────────────────────────────────────────────
    { name: 'Go Comment Keywords',   scope: 'comment meta.annotation.go',                    settings: { foreground: h('keyword') } },
    { name: 'Go Build Tags',         scope: 'comment meta.annotation.parameters.go',         settings: { foreground: h('parameter') } },
    { name: 'Go Struct Field',       scope: 'variable.other.property.go',                    settings: { foreground: h('variableProperty') } },
    { name: 'Go Constants',          scope: 'constant.language.go',                          settings: { foreground: h('language') } },
    { name: 'Go Function Calls',     scope: 'meta.function-call.go',                         settings: { foreground: h('functionCall') } },
    { name: 'Go Types',              scope: 'meta.type.go',                                  settings: { foreground: h('type') } },
    { name: 'Go Interface',          scope: 'entity.name.type.interface.go',                 settings: { foreground: h('type') } },
    { name: 'Go Builtin Functions',  scope: 'support.function.builtin.go',                   settings: { foreground: h('supportFunction') } },
    { name: 'Go Builtin Types',      scope: 'support.type.builtin.go',                       settings: { foreground: h('type') } },

    // ── Language: Markdown ───────────────────────────────────────────────────
    { name: 'Markdown H1', scope: ['heading.1.markdown punctuation.definition.heading.markdown', 'heading.1.markdown', 'heading.1.quarto punctuation.definition.heading.quarto', 'heading.1.quarto', 'markup.heading.atx.1.mdx', 'markup.heading.atx.1.mdx punctuation.definition.heading.mdx', 'markup.heading.setext.1.markdown', 'markup.heading.heading-0.asciidoc'], settings: { foreground: h('ac1'), fontStyle: 'bold' } },
    { name: 'Markdown H2', scope: ['heading.2.markdown punctuation.definition.heading.markdown', 'heading.2.markdown', 'heading.2.quarto punctuation.definition.heading.quarto', 'heading.2.quarto', 'markup.heading.atx.2.mdx', 'markup.heading.atx.2.mdx punctuation.definition.heading.mdx', 'markup.heading.setext.2.markdown', 'markup.heading.heading-1.asciidoc'], settings: { foreground: h('ac2'), fontStyle: 'bold' } },
    { name: 'Markdown H3', scope: ['heading.3.markdown punctuation.definition.heading.markdown', 'heading.3.markdown', 'heading.3.quarto punctuation.definition.heading.quarto', 'heading.3.quarto', 'markup.heading.atx.3.mdx', 'markup.heading.atx.3.mdx punctuation.definition.heading.mdx', 'markup.heading.heading-2.asciidoc'], settings: { foreground: h('ansiBrightYellow'), fontStyle: 'bold' } },
    { name: 'Markdown H4', scope: ['heading.4.markdown punctuation.definition.heading.markdown', 'heading.4.markdown', 'heading.4.quarto punctuation.definition.heading.quarto', 'heading.4.quarto', 'markup.heading.atx.4.mdx', 'markup.heading.atx.4.mdx punctuation.definition.heading.mdx', 'markup.heading.heading-3.asciidoc'], settings: { foreground: h('ansiBrightGreen'), fontStyle: 'bold' } },
    { name: 'Markdown H5', scope: ['heading.5.markdown punctuation.definition.heading.markdown', 'heading.5.markdown', 'heading.5.quarto punctuation.definition.heading.quarto', 'heading.5.quarto', 'markup.heading.atx.5.mdx', 'markup.heading.atx.5.mdx punctuation.definition.heading.mdx', 'markup.heading.heading-4.asciidoc'], settings: { foreground: h('ansiBrightCyan'), fontStyle: 'bold' } },
    { name: 'Markdown H6', scope: ['heading.6.markdown punctuation.definition.heading.markdown', 'heading.6.markdown', 'heading.6.quarto punctuation.definition.heading.quarto', 'heading.6.quarto', 'markup.heading.atx.6.mdx', 'markup.heading.atx.6.mdx punctuation.definition.heading.mdx', 'markup.heading.heading-5.asciidoc'], settings: { foreground: h('ansiBrightBlue'), fontStyle: 'bold' } },
    { name: 'Markdown Bold',         scope: 'markup.bold',                                   settings: { foreground: h('warning'), fontStyle: 'bold' } },
    { name: 'Markdown Italic',       scope: 'markup.italic',                                 settings: { foreground: h('error'), fontStyle: 'italic' } },
    { name: 'Markdown Strikethrough', scope: 'markup.strikethrough',                         settings: { foreground: h('fg2'), fontStyle: 'strikethrough' } },
    { name: 'Markdown Links',        scope: ['punctuation.definition.link', 'markup.underline.link', 'text.html.markdown punctuation.definition.link.title', 'text.html.quarto punctuation.definition.link.title', 'string.other.link.title.markdown', 'string.other.link.title.quarto', 'markup.link'], settings: { foreground: h('info'), fontStyle: 'underline' } },
    { name: 'Markdown Link Refs',    scope: ['punctuation.definition.constant.markdown', 'punctuation.definition.constant.quarto', 'constant.other.reference.link.markdown', 'constant.other.reference.link.quarto', 'markup.substitution.attribute-reference', 'meta.link.reference.def.restructuredtext', 'string.other.link.description', 'string.other.link.title'], settings: { foreground: h('other') } },
    { name: 'Markdown Code',         scope: ['punctuation.definition.raw.markdown', 'punctuation.definition.raw.quarto', 'markup.inline.raw.string.markdown', 'markup.inline.raw.string.quarto', 'markup.raw.block.markdown', 'markup.raw.block.quarto'], settings: { foreground: h('success') } },
    { name: 'Markdown Language ID',  scope: 'fenced_code.block.language',                   settings: { foreground: h('language') } },
    { name: 'Markdown Triple Backticks', scope: ['markup.fenced_code.block punctuation.definition', 'markup.raw support.asciidoc'], settings: { foreground: h('fg2') } },
    { name: 'Markdown Quotes',       scope: ['markup.quote', 'punctuation.definition.quote.begin'], settings: { foreground: h('punctuation') } },
    { name: 'Markdown Separator',    scope: 'meta.separator.markdown',                       settings: { foreground: h('operator') } },
    { name: 'Markdown List Markers', scope: ['punctuation.definition.list.begin.markdown', 'punctuation.definition.list.begin.quarto', 'markup.list.bullet'], settings: { foreground: h('unit') } },
    { name: 'Quarto Headings',       scope: 'markup.heading.quarto',                         settings: { fontStyle: 'bold' } },

    // ── Language: C++ ────────────────────────────────────────────────────────
    { name: 'C++ Extern',            scope: 'storage.modifier.specifier.extern.cpp',         settings: { foreground: h('warning') } },
    { name: 'C++ Scope Resolution',  scope: ['entity.name.scope-resolution.template.call.cpp', 'entity.name.scope-resolution.cpp', 'entity.name.scope-resolution.function.definition.cpp'], settings: { foreground: h('function') } },
    { name: 'C++ Template Params',   scope: ['entity.name.scope-resolution.parameter.cpp'],  settings: { foreground: h('parameter') } },
    { name: 'C++ Doxygen Keywords',  scope: 'storage.type.class.doxygen',                    settings: { foreground: h('class') } },
    { name: 'C++ Reference Ops',     scope: ['storage.modifier.reference.cpp'],              settings: { foreground: h('operator') } },
    { name: 'C++ Namespace',         scope: 'storage.type.namespace.cpp',                    settings: { foreground: h('storage') } },
    { name: 'C++ Template',          scope: 'storage.type.template.cpp',                     settings: { foreground: h('storage') } },

    // ── Language: C# ─────────────────────────────────────────────────────────
    { name: 'C# Interpolated Strings', scope: 'meta.interpolation.cs',                      settings: { foreground: h('fg2') } },
    { name: 'C# XML Doc Comments',    scope: 'comment.block.documentation.cs',               settings: { foreground: h('fg2') } },
    { name: 'C# Preprocessor',        scope: 'keyword.preprocessor.cs',                     settings: { foreground: h('keyword') } },
    { name: 'C# Attributes',          scope: 'meta.attribute.cs',                           settings: { foreground: h('attribute') } },
    { name: 'C# Storage Types',       scope: 'storage.type.cs',                             settings: { foreground: h('type') } },
    { name: 'C# Namespaces',          scope: 'entity.name.type.namespace.cs',               settings: { foreground: h('class') } },
    { name: 'C# Type Parameters',     scope: 'entity.name.type.type-parameter.cs',          settings: { foreground: h('typeParameter') } },
    { name: 'C# LINQ',                scope: 'keyword.linq.cs',                             settings: { foreground: h('controlFlow') } },

    // ── Language: Java ───────────────────────────────────────────────────────
    { name: 'Java Annotations',       scope: ['punctuation.definition.annotation', 'storage.type.annotation'], settings: { foreground: h('type') } },
    { name: 'Java Enum Constants',    scope: 'constant.other.enum.java',                    settings: { foreground: h('fg2') } },
    { name: 'Java Import',            scope: 'storage.modifier.import.java',                settings: { foreground: h('controlImport') } },
    { name: 'Java Generics',          scope: 'storage.type.generic.java',                   settings: { foreground: h('typeParameter') } },
    { name: 'Java Package',           scope: 'storage.modifier.package.java',               settings: { foreground: h('controlImport') } },
    { name: 'Java Inherited Class',   scope: 'entity.other.inherited-class.java',           settings: { foreground: h('class') } },
    { name: 'Java Methods',           scope: 'meta.method.java',                            settings: { foreground: h('method') } },
    { name: 'Java Static/Final',      scope: ['storage.modifier.static.java', 'storage.modifier.final.java'], settings: { foreground: h('modifier') } },

    // ── Language: PHP ────────────────────────────────────────────────────────
    { name: 'PHP Builtin Attributes', scope: ['support.attribute.builtin'],                 settings: { foreground: h('supportProperty') } },
    { name: 'PHP Custom Attributes',  scope: ['meta.attribute.php'],                        settings: { foreground: h('attribute') } },
    { name: 'PHP Function Parameters', scope: 'meta.function.parameters.php punctuation.definition.variable.php', settings: { foreground: h('parameter') } },
    { name: 'PHP Language Constants', scope: 'constant.language.php',                       settings: { foreground: h('language') } },
    { name: 'PHP Builtin Functions',  scope: 'text.html.php support.function',              settings: { foreground: h('supportFunction') } },
    { name: 'PHPDoc Keywords',        scope: 'keyword.other.phpdoc.php',                    settings: { foreground: h('keyword') } },
    { name: 'PHP Variables',          scope: 'variable.other.php',                          settings: { foreground: h('variable') } },
    { name: 'PHP Object Properties',  scope: 'variable.other.property.php',                 settings: { foreground: h('variableProperty') } },

    // ── Language: Nix ────────────────────────────────────────────────────────
    { name: 'Nix Attribute Names',    scope: ['entity.other.attribute-name.multipart.nix', 'entity.other.attribute-name.single.nix'], settings: { foreground: h('attribute') } },
    { name: 'Nix Parameters',         scope: 'variable.parameter.name.nix',                settings: { foreground: h('parameter'), fontStyle: '' } },
    { name: 'Nix Interpolated Params', scope: 'meta.embedded variable.parameter.name.nix', settings: { foreground: h('parameter'), fontStyle: '' } },
    { name: 'Nix File Paths',         scope: 'string.unquoted.path.nix',                   settings: { foreground: h('fg2') } },
    { name: 'Nix Language Constants', scope: 'constant.language.nix',                      settings: { foreground: h('language') } },
    { name: 'Nix Builtin Constants',  scope: 'constant.builtin.readonly.nix',              settings: { foreground: h('supportVariable') } },
    { name: 'Nix Builtin Functions',  scope: 'support.function.builtin.nix',               settings: { foreground: h('supportFunction') } },
    { name: 'Nix Functions',          scope: ['entity.name.function.nix'],                 settings: { foreground: h('function') } },
    { name: 'Nix URI Literals',       scope: 'string.unquoted.uri.nix',                   settings: { foreground: h('info') } },

    // ── Language: Shell ──────────────────────────────────────────────────────
    { name: 'Shell Shebang',          scope: ['comment.line.shebang', 'comment.line.shebang punctuation.definition.comment', 'punctuation.definition.comment.shebang.shell', 'meta.shebang.shell'], settings: { foreground: h('language') } },
    { name: 'Shell Shebang Command',  scope: 'comment.line.shebang constant.language',     settings: { foreground: h('language') } },
    { name: 'Shell Command Interpolation', scope: ['meta.function-call.arguments.shell punctuation.definition.variable.shell', 'meta.function-call.arguments.shell punctuation.section.interpolation'], settings: { foreground: h('parameter') } },
    { name: 'Shell Interpolation Variable', scope: 'meta.string meta.interpolation.parameter.shell variable.other.readwrite', settings: { foreground: h('variableDeclaration') } },
    { name: 'Shell Interpolation Punctuation', scope: ['source.shell punctuation.section.interpolation', 'punctuation.definition.evaluation.backticks.shell'], settings: { foreground: h('function') } },
    { name: 'Shell Heredoc',          scope: 'entity.name.tag.heredoc.shell',              settings: { foreground: h('ac2') } },
    { name: 'Shell Quoted Variables', scope: 'string.quoted.double.shell variable.other.normal.shell', settings: { foreground: h('variable') } },
    { name: 'Shell Builtin Commands', scope: 'support.function.builtin.shell',             settings: { foreground: h('supportFunction') } },

    // ── Language: GraphQL ────────────────────────────────────────────────────
    { name: 'GraphQL Variables',      scope: 'variable.graphql',                            settings: { foreground: h('variableDeclaration') } },
    { name: 'GraphQL Field Aliases',  scope: 'string.unquoted.alias.graphql',              settings: { foreground: h('variable') } },
    { name: 'GraphQL Enum Members',   scope: 'constant.character.enum.graphql',            settings: { foreground: h('fg2') } },
    { name: 'GraphQL Type Fields',    scope: 'meta.objectvalues.graphql constant.object.key.graphql string.unquoted.graphql', settings: { foreground: h('typeParameter') } },
    { name: 'GraphQL Operations',     scope: 'keyword.operation.graphql',                  settings: { foreground: h('keyword') } },
    { name: 'GraphQL Directives',     scope: 'entity.name.function.directive.graphql',     settings: { foreground: h('function') } },

    // ── Language: RegExp ─────────────────────────────────────────────────────
    { name: 'RegExp Delimiters',      scope: ['string.regexp punctuation.definition.string.begin', 'string.regexp punctuation.definition.string.end'], settings: { foreground: h('ac1') } },
    { name: 'RegExp Anchors',         scope: 'keyword.control.anchor.regexp',              settings: { foreground: h('ac2') } },
    { name: 'RegExp Character Match', scope: ['string.regexp', 'string.regexp.ts'],         settings: { foreground: h('fg1') } },
    { name: 'RegExp Groups',          scope: ['punctuation.definition.group.regexp', 'keyword.other.back-reference.regexp'], settings: { foreground: h('fg2') } },
    { name: 'RegExp Char Classes',    scope: ['punctuation.definition.character-class.regexp', 'constant.other.character-class.regexp'], settings: { foreground: h('class') } },
    { name: 'RegExp Char Range',      scope: 'constant.other.character-class.range.regexp', settings: { foreground: h('constant') } },
    { name: 'RegExp Quantifiers',     scope: 'keyword.operator.quantifier.regexp',         settings: { foreground: h('operator') } },
    { name: 'RegExp Numeric',         scope: 'constant.character.numeric.regexp',          settings: { foreground: h('constant') } },
    { scope: ['constant.other.character-class.set.regexp', 'constant.character.escape.backslash.regexp'], settings: { foreground: h('other') } },
    { name: 'RegExp Assertions',      scope: ['punctuation.definition.group.no-capture.regexp', 'meta.assertion.look-ahead.regexp', 'meta.assertion.negative-look-ahead.regexp'], settings: { foreground: h('error') } },
    { name: 'RegExp Capture Groups',  scope: ['punctuation.definition.group.capture.regexp'], settings: { foreground: h('success') } },
    { name: 'RegExp Assertion Negation', scope: ['punctuation.definition.group.assertion.regexp', 'keyword.operator.negation.regexp'], settings: { foreground: h('error') } },

    // ── Language: Data (JSON / YAML / TOML) ──────────────────────────────────
    {
      name: 'JSON Punctuation',
      scope: ['punctuation.definition.dictionary.begin.json', 'punctuation.definition.dictionary.end.json', 'punctuation.definition.array.begin.json', 'punctuation.definition.array.end.json', 'punctuation.separator.dictionary.key-value.json', 'punctuation.separator.dictionary.pair.json', 'punctuation.separator.array.json'],
      settings: { foreground: h('punctuation') },
    },
    { name: 'JSON L1 Properties',    scope: ['source.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ac1') } },
    { name: 'JSON L2 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ac2') } },
    { name: 'JSON L3 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ansiBrightGreen') } },
    { name: 'JSON L4 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ansiBrightCyan') } },
    { name: 'JSON L5 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ansiBrightBlue') } },
    { name: 'JSON L6 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ansiBrightMagenta') } },
    { name: 'JSON L7 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ansiBrightRed') } },
    { name: 'JSON L8 Properties',    scope: ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json meta.structure.dictionary.value.json meta.structure.dictionary.json support.type.property-name.json'], settings: { foreground: h('ansiBrightYellow') } },
    { name: 'YAML Keys',             scope: ['entity.name.tag.yaml'],                      settings: { foreground: h('tag') } },
    { name: 'YAML Other Keys',       scope: ['keyword.other.definition.toml', 'keyword.other.definition.yaml'], settings: { foreground: h('other') } },
    { name: 'JSON/YAML Constants',   scope: ['constant.language.json', 'constant.language.yaml', 'constant.language.toml'], settings: { foreground: h('language') } },
    { name: 'YAML Property Names',   scope: ['punctuation.support.type.property-name.yaml', 'support.type.property-name.yaml', 'punctuation.support.type.property-name.yaml', 'support.type.property-name.toml', 'punctuation.support.type.property-name.toml'], settings: { foreground: h('supportProperty') } },
    { name: 'YAML Anchors/Aliases',  scope: ['entity.name.type.anchor.yaml', 'variable.other.alias.yaml'], settings: { foreground: h('variableReadonly'), fontStyle: 'underline' } },
    { name: 'YAML Anchor Punctuation', scope: ['punctuation.definition.anchor.yaml', 'punctuation.definition.alias.yaml'], settings: { foreground: h('punctuation') } },
    { name: 'YAML Document Markers', scope: 'entity.other.document.begin.yaml',             settings: { foreground: h('ac2') } },
    { name: 'TOML Tables',           scope: ['entity.other.attribute-name.table.toml', 'entity.other.attribute-name.table.array.toml'], settings: { foreground: h('ac2') } },
    { name: 'TOML Section Headers',  scope: ['support.type.property-name.table', 'entity.name.section.group-title.ini'], settings: { foreground: h('supportProperty') } },
    {
      name: 'TOML Dates/Times',
      scope: ['constant.other.time.datetime.offset.toml', 'constant.other.time.datetime.offset.yaml', 'constant.other.datetime.toml', 'constant.other.datetime.yaml', 'constant.other.datetime.offset.toml', 'constant.other.datetime.offset.yaml', 'constant.other.datetime.local.toml', 'constant.other.datetime.local.yaml', 'constant.other.datetime.utc.toml', 'constant.other.datetime.utc.yaml', 'constant.other.datetime.timezone.toml', 'constant.other.datetime.timezone.yaml', 'constant.other.datetime.duration.toml', 'constant.other.datetime.duration.yaml', 'constant.other.timestamp.yaml', 'constant.other.timestamp.toml', 'constant.other.timestamp.local.toml', 'constant.other.timestamp.local.yaml', 'constant.other.timestamp.utc.toml', 'constant.other.timestamp.utc.yaml', 'constant.other.timestamp.timezone.toml', 'constant.other.timestamp.timezone.yaml', 'constant.other.timestamp.duration.toml', 'constant.other.timestamp.duration.yaml'],
      settings: { foreground: h('datetime') },
    },
    { name: 'TOML Numeric Values',   scope: ['constant.numeric.toml'],                     settings: { foreground: h('constant') } },

    // ── Language: Diff ───────────────────────────────────────────────────────
    { name: 'Diff Changed',          scope: ['markup.changed.diff', 'punctuation.definition.changed.diff'], settings: { foreground: h('warning') } },
    { name: 'Diff File Names',       scope: ['meta.diff.header.from-file', 'meta.diff.header.to-file', 'punctuation.definition.from-file.diff', 'punctuation.definition.to-file.diff'], settings: { foreground: h('info') } },
    { name: 'Diff Inserted',         scope: ['markup.inserted.diff', 'punctuation.definition.inserted.diff'], settings: { foreground: h('success') } },
    { name: 'Diff Deleted',          scope: ['markup.deleted.diff', 'punctuation.definition.deleted.diff'], settings: { foreground: h('error') } },
    { name: 'Diff Context',          scope: ['meta.diff'],                                  settings: { foreground: h('fg2') } },
    { name: 'Diff Headers',          scope: ['meta.diff.header', 'meta.diff.range', 'meta.separator.diff', 'meta.diff.index'], settings: { foreground: h('ac1') } },

    // ── Language: dotenv ─────────────────────────────────────────────────────
    { name: 'dotenv Left-hand Side', scope: ['variable.other.env'],                        settings: { foreground: h('other') } },
    { name: 'dotenv References',     scope: ['string.quoted variable.other.env'],          settings: { foreground: h('other') } },

    // ── Language: INI / Properties ───────────────────────────────────────────
    { name: 'INI Section',           scope: ['entity.name.section.group-title.ini', 'punctuation.definition.section.ini'], settings: { foreground: h('ac1') } },
    { name: 'INI Keys',              scope: ['keyword.other.definition.ini', 'support.type.property-name.ini'], settings: { foreground: h('ac2') } },
    { name: 'INI Values',            scope: ['string.unquoted.ini', 'string.quoted.double.ini', 'string.quoted.single.ini'], settings: { foreground: h('fg1') } },

    // ── Language: Svelte ─────────────────────────────────────────────────────
    { scope: ['meta.lang.ts.svelte'], settings: { foreground: h('language') } },
  ];
}
