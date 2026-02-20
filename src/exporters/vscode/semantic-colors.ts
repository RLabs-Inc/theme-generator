/**
 * VSCode semanticTokenColors — LSP-based semantic highlighting.
 *
 * Ported from the RLabs SvelteKit app, translated from UIColors/SyntaxColors
 * bags into ThemePalette role names.
 *
 * @internal
 */

import type { C } from './token-colors.js';

/** Semantic token value: a hex color string or an object with foreground and/or fontStyle */
export type SemanticValue =
  | string
  | { foreground?: string; fontStyle?: string };

export function buildSemanticColors({ h }: C): Record<string, SemanticValue> {
  return {
    // ── Generic ──────────────────────────────────────────────────────────────
    decorator:              h('ac1'),
    event:                  h('property'),
    comment:                h('comment'),
    string:                 h('fg1'),
    keyword:                h('keyword'),
    number:                 h('constant'),
    operator:               h('operator'),
    selfKeyword:            h('keyword'),
    boolean:                h('constant'),
    support:                h('support'),
    'support.function':     h('supportFunction'),
    'support.method':       h('supportMethod'),
    'support.property':     h('supportProperty'),
    'support.variable':     h('supportVariable'),

    // ── Classes ──────────────────────────────────────────────────────────────
    class:                          h('class'),
    'class.declaration':            h('class'),
    'class.defaultLibrary':         h('language'),
    enum:                           h('class'),
    enumMember:                     h('fg2'),
    struct:                         h('class'),

    // ── Functions ────────────────────────────────────────────────────────────
    function:                       h('functionCall'),
    'function.declaration':         h('function'),
    'function.defaultLibrary':      h('supportFunction'),
    method:                         h('methodCall'),
    'method.declaration':           h('method'),
    'method.defaultLibrary':        h('supportMethod'),

    // ── Types ────────────────────────────────────────────────────────────────
    namespace:                      h('class'),
    type:                           h('type'),
    'type.declaration':             h('type'),
    'type.defaultLibrary':          h('language'),
    interface:                      h('type'),

    // ── Variables ────────────────────────────────────────────────────────────
    variable:                       h('variable'),
    'variable.declaration':         h('variableDeclaration'),
    'variable.readonly.local':      h('variableReadonly'),
    'variable.readonly.defaultLibrary': h('supportVariable'),
    'variable.defaultLibrary':      h('supportVariable'),
    'variable.other':               h('other'),
    'variable.other.readwrite':     h('variable'),
    'variable.other.constant':      h('variableDeclaration'),
    'variable.other.readonly':      h('variableReadonly'),

    // Properties
    property:                       h('property'),
    'property.readonly':            h('variableProperty'),
    'property.declaration':         h('propertyDeclaration'),
    'property.defaultLibrary':      h('supportProperty'),
    parameter:                      h('parameter'),

    // Misc semantic tokens (Typst, markdown)
    heading:                        h('ac1'),
    'text.emph':                    { foreground: h('fg1'), fontStyle: 'italic' },
    'text.strong':                  { foreground: h('fg1'), fontStyle: 'bold' },
    'text.math':                    h('constant'),
    'text.reference':               { foreground: h('fg2'), fontStyle: 'italic' },
    'text.url':                     { foreground: h('info'), fontStyle: 'underline' },

    // TOML
    tomlArrayKey:                   h('ac2'),
    tomlTableKey:                   h('ac2'),

    // ── JavaScript / TypeScript ──────────────────────────────────────────────
    'variable.readonly:javascript':          h('variableDeclaration'),
    'variable.readonly:typescript':          h('variableDeclaration'),
    'property.readonly:javascript':          h('property'),
    'property.readonly:typescript':          h('property'),
    'variable.readonly:javascriptreact':     h('variableDeclaration'),
    'variable.readonly:typescriptreact':     h('variableDeclaration'),
    'property.readonly:javascriptreact':     h('property'),
    'property.readonly:typescriptreact':     h('property'),
    'class.defaultLibrary:javascript':       h('language'),
    'class.defaultLibrary:typescript':       h('language'),
    'interface.defaultLibrary:typescript':   h('language'),
    'function.defaultLibrary:javascript':    h('supportFunction'),
    'function.defaultLibrary:typescript':    h('supportFunction'),
    'method.defaultLibrary:javascript':      h('supportMethod'),
    'method.defaultLibrary:typescript':      h('supportMethod'),
    'variable.defaultLibrary:javascript':    h('supportVariable'),
    'variable.defaultLibrary:typescript':    h('supportVariable'),
    'property.defaultLibrary:javascript':    h('supportProperty'),
    'property.defaultLibrary:typescript':    h('supportProperty'),
    'type.defaultLibrary:javascript':        h('language'),
    'type.defaultLibrary:typescript':        h('language'),
    'namespace:javascript':                  h('class'),
    'namespace:typescript':                  h('class'),
    'enum:typescript':                       h('class'),
    'enumMember:typescript':                 h('fg2'),

    // ── Go ───────────────────────────────────────────────────────────────────
    'type.defaultLibrary:go':               h('type'),
    'variable.readonly.defaultLibrary:go':  h('variableDeclaration'),
    'function.defaultLibrary:go':           h('supportFunction'),
    'interface:go':                         h('type'),
    'struct:go':                            h('class'),
    'variable.readonly:go':                 h('variableDeclaration'),
    'property.readonly:go':                 h('property'),
    'method.defaultLibrary:go':             h('supportMethod'),
    'property.defaultLibrary:go':           h('supportProperty'),
    'namespace:go':                         h('class'),
    'type.parameter:go':                    h('parameter'),
    'variable.constant:go':                 h('constant'),

    // ── Nix ──────────────────────────────────────────────────────────────────
    'constant.builtin.readonly:nix':        h('supportVariable'),
    'variable.readonly:nix':                h('variableDeclaration'),
    'property.readonly:nix':                h('property'),
    'function.defaultLibrary:nix':          h('supportFunction'),

    // ── Python ───────────────────────────────────────────────────────────────
    'class:python':                         h('class'),
    'class.builtin:python':                 h('language'),
    'variable.typeHint:python':             h('variableProperty'),
    'function.decorator:python':            h('ac1'),
    'class.decorator:python':              h('ac1'),
    'method.decorator:python':             h('ac1'),
    'variable.readonly:python':             h('variableDeclaration'),
    'property.readonly:python':             h('property'),
    'type.defaultLibrary:python':           h('language'),

    // ── Rust ─────────────────────────────────────────────────────────────────
    'builtinAttribute.attribute.library:rust': h('language'),
    'generic.attribute:rust':               h('attribute'),
    'variable.readonly:rust':               h('variableDeclaration'),
    'property.readonly:rust':               h('property'),
    'type.defaultLibrary:rust':             h('language'),
    'function.defaultLibrary:rust':         h('supportFunction'),
    'macro:rust':                           h('functionCall'),
    'macro.attribute:rust':                 h('functionCall'),
    'type.parameter:rust':                  h('parameter'),
    'variable.constant:rust':               h('constant'),
    'struct.defaultLibrary:rust':           h('language'),
    'enum.defaultLibrary:rust':             h('language'),
    'enumMember.defaultLibrary:rust':       h('language'),
    'interface.defaultLibrary:rust':        h('language'),

    // ── Scala ────────────────────────────────────────────────────────────────
    'variable.readonly:scala':              h('variableDeclaration'),
    'type.defaultLibrary:scala':            h('language'),
    'class.defaultLibrary:scala':           h('language'),
    'object:scala':                         h('class'),
    'trait:scala':                          h('type'),

    // ── TOML ─────────────────────────────────────────────────────────────────
    'variable.readonly:toml':               h('variableDeclaration'),
    'property.readonly:toml':              h('property'),
  };
}
