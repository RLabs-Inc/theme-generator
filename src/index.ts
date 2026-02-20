// ── Types ────────────────────────────────────────────────────────────────────
export type {
  ThemeMode,
  RoleConstraints,
  ContrastConstraint,
  RoleDefinition,
  DerivedTransform,
  BlendTransform,
  AdjustLightnessTransform,
  WithAlphaTransform,
  EnsureContrastTransform,
  CopyTransform,
  WithHexAlphaTransform,
  AdaptiveFgTransform,
  DerivedDefinition,
  ThemeSpec,
  PaletteColor,
  ThemePalette,
  ExtractionOptions,
  ExporterOptions,
  WarpExporterOptions,
  VSCodeExporterOptions,
  VimExporterOptions,
  NvimExporterOptions,
  ZedExporterOptions,
  HelixExporterOptions,
  TerminalSpecOptions,
  VSCodeSpecOptions,
  ZedSpecOptions,
  HelixSpecOptions,
  VimSpecOptions,
  NvimSpecOptions,
  ShadcnSpecOptions,
  BrandingSpecOptions,
  TailwindSpecOptions,
} from './types.js';

// ── Constraints ──────────────────────────────────────────────────────────────
export {
  ANSI_HUE_RANGES,
  UI_ROLES,
  STATUS_ROLES,
  SYNTAX_ROLE_NAMES,
  buildSyntaxRoles,
  buildAnsiRolesFree,
  buildAnsiRolesConstrained,
  buildDefaultConstraints,
  getActiveConstraints,
  satisfiesConstraints,
  projectIntoConstraints,
  enforceContrast,
  enforceCommentContrast,
} from './constraints.js';

// ── Extraction Engine ─────────────────────────────────────────────────────────
export { extract, expandColors, scoreCentrality, scoreDiversity } from './extract.js';

// ── Derived Color Engine ──────────────────────────────────────────────────────
export { applyDerived } from './derive.js';

// ── Spec Presets ──────────────────────────────────────────────────────────────
export {
  createTerminalSpec,
  createVSCodeSpec,
  createZedSpec,
  createHelixSpec,
  createVimSpec,
  createNvimSpec,
  createShadcnSpec,
  createBrandingSpec,
  createTailwindSpec,
  DEFAULT_TAILWIND_FAMILIES,
} from './specs/index.js';

// ── Exporters ─────────────────────────────────────────────────────────────────
export {
  exportWarp,
  exportGhostty,
  exportWezTerm,
  exportVSCode,
  exportZed,
  exportVim,
  exportNvim,
  exportHelix,
} from './exporters/index.js';
