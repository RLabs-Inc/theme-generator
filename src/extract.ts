import {
  distance,
  fromHex,
  toColorOutput,
  clampToGamut,
  createRng,
  type OklchColor,
} from '@rlabs-inc/color-generator';

import { applyDerived } from './derive.js';

import type {
  ThemeMode,
  ThemeSpec,
  ThemePalette,
  PaletteColor,
  ExtractionOptions,
  RoleConstraints,
} from './types.js';

import {
  getActiveConstraints,
  satisfiesConstraints,
  projectIntoConstraints,
  enforceContrast,
  enforceCommentContrast,
} from './constraints.js';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Roles excluded from iso-lightness (uniform) mode — must stay at lightness extremes */
const UNIFORM_EXCLUDED = new Set(['bg1', 'bg2', 'bg3', 'fg1', 'fg2', 'fg3', 'border']);

/** Bright ANSI role names (derived in Phase 4) */
const BRIGHT_ANSI_NAMES = new Set([
  'ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow',
  'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite',
]);

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Circular midpoint of two hue values (handles wrapping correctly) */
function midpointHue(h1: number, h2: number): number {
  let diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((h1 + diff / 2) + 360) % 360;
}

// ── Exported Primitives (for testability) ─────────────────────────────────────

/**
 * Expand a color cloud to at least `targetCount` entries by interpolating between pairs.
 * Used when the cloud has fewer points than the number of roles to assign.
 */
export function expandColors(colors: OklchColor[], targetCount: number): OklchColor[] {
  if (colors.length === 0) {
    throw new Error('expandColors: cannot expand an empty color array');
  }
  if (colors.length >= targetCount) return colors;

  const result = [...colors];
  let i = 0;
  while (result.length < targetCount) {
    const a = result[i % result.length];
    const b = result[(i + 1) % result.length];
    result.push(clampToGamut({
      l: (a.l + b.l) / 2,
      c: (a.c + b.c) / 2,
      h: midpointHue(a.h, b.h),
    }));
    i++;
  }
  return result;
}

/**
 * Score how central a color is within a role's constraint box.
 * Returns 0 (at the edge of the box) to 1 (exactly at the center).
 */
export function scoreCentrality(color: OklchColor, constraints: RoleConstraints): number {
  const [lMin, lMax] = constraints.l;
  const [cMin, cMax] = constraints.c;
  const lRange = lMax - lMin;
  const cRange = cMax - cMin;

  const lCenter = lMin + lRange / 2;
  const lScore = lRange > 0
    ? Math.max(0, 1 - Math.abs(color.l - lCenter) / (lRange / 2))
    : 1;

  const cCenter = cMin + cRange / 2;
  const cScore = cRange > 0
    ? Math.max(0, 1 - Math.abs(color.c - cCenter) / (cRange / 2))
    : 1;

  let hScore = 1;
  if (constraints.h) {
    const [hMin, hMax] = constraints.h;
    const hRange = hMin <= hMax ? hMax - hMin : (360 - hMin) + hMax;
    const hCenter = (hMin + hRange / 2) % 360;
    const h = color.h ?? 0;
    const distToCenter = Math.min(Math.abs(h - hCenter), 360 - Math.abs(h - hCenter));
    hScore = hRange > 0 ? Math.max(0, 1 - distToCenter / (hRange / 2)) : 1;
  }

  return (lScore + cScore + hScore) / 3;
}

/**
 * Score how diverse a candidate is relative to already-assigned colors.
 * Returns 0 (identical to an existing assignment) to 1 (maximally distant from all).
 */
export function scoreDiversity(color: OklchColor, assigned: OklchColor[]): number {
  if (assigned.length === 0) return 1;

  let minDist = Infinity;
  for (const a of assigned) {
    const d = distance(color, a);
    if (d < minDist) minDist = d;
  }

  // Normalize: cap at 0.5 (colors this far apart are essentially "maximally diverse")
  return Math.min(minDist / 0.5, 1);
}

/** Combined score: 0.4 × centrality + 0.6 × diversity */
function scoreCandidate(
  color: OklchColor,
  constraints: RoleConstraints,
  assigned: OklchColor[],
): number {
  return 0.4 * scoreCentrality(color, constraints) + 0.6 * scoreDiversity(color, assigned);
}

// ── Main Extraction Engine ────────────────────────────────────────────────────

/**
 * Extract a ThemePalette from a 3D OKLCH color cloud.
 *
 * @param colors  - OKLCH color cloud from `@rlabs-inc/color-generator`
 * @param spec    - Target spec defining roles, constraints, and derived colors
 * @param mode    - 'dark' or 'light' theme mode
 * @param options - Optional: locked colors, random seed, ANSI mode override, uniform mode
 */
export function extract(
  colors: OklchColor[],
  spec: ThemeSpec,
  mode: ThemeMode,
  options?: ExtractionOptions,
): ThemePalette {
  const lockedHex = options?.locked ?? {};
  const uniformMode = options?.uniform ?? false;
  const uniformBrightDelta = options?.uniformBrightDelta ?? 0.20;

  // Seeded PRNG for deterministic tie-breaking
  const rng: () => number = options?.randomSeed !== undefined
    ? createRng(options.randomSeed)
    : Math.random;

  // ── Phase 0: Honor Locked Colors ──────────────────────────────────────────

  const locked = new Map<string, OklchColor>();
  for (const [role, hex] of Object.entries(lockedHex)) {
    try {
      locked.set(role, fromHex(hex));
    } catch {
      // Invalid hex — skip this locked entry
    }
  }
  const lockedNames = new Set(locked.keys());
  const unlocked = spec.roles.filter((r) => !lockedNames.has(r.name));

  // ── Phase 1: Prepare ──────────────────────────────────────────────────────

  // Sort unlocked roles by priority descending (most constrained assigned first)
  const sortedRoles = [...unlocked].sort((a, b) => b.priority - a.priority);

  // Expand color cloud if it has fewer points than we need
  // Fallback to a neutral color if the cloud is empty
  const baseColors: OklchColor[] = colors.length > 0
    ? colors
    : [{ l: 0.5, c: 0.1, h: 180 }];
  const cloud = sortedRoles.length > 0
    ? expandColors(baseColors, sortedRoles.length + 10)
    : [...baseColors];

  // ── Phase 2: Assign Roles ─────────────────────────────────────────────────

  const assigned = new Map<string, OklchColor>(locked);
  // Diversity tracker starts with all locked colors (locked colors affect diversity scoring)
  const assignedList: OklchColor[] = [...locked.values()];
  // Track the established hue for each hue group (groupName → hue)
  const hueGroups = new Map<string, number>();

  for (const role of sortedRoles) {
    const constraints = getActiveConstraints(role, mode);

    // Filter cloud to colors within this role's constraint box
    let candidates = cloud.filter((c) => satisfiesConstraints(c, constraints));

    // Fallback: no candidates found — project the nearest color into the constraint box
    if (candidates.length === 0) {
      const boxCenter: OklchColor = {
        l: (constraints.l[0] + constraints.l[1]) / 2,
        c: (constraints.c[0] + constraints.c[1]) / 2,
        h: constraints.h ? midpointHue(constraints.h[0], constraints.h[1]) : 180,
      };
      const nearest = cloud.reduce((best, c) =>
        distance(c, boxCenter) < distance(best, boxCenter) ? c : best,
        cloud[0],
      );
      candidates = [projectIntoConstraints(nearest, constraints)];
    }

    // Score all candidates
    const scored = candidates.map((c) => ({
      color: c,
      score: scoreCandidate(c, constraints, assignedList),
    }));
    scored.sort((a, b) => b.score - a.score);

    // Select: PRNG tie-breaking among candidates within 0.001 of the top score
    const topScore = scored[0].score;
    const tied = scored.filter((s) => topScore - s.score < 0.001);
    const selected = tied.length === 1
      ? tied[0].color
      : tied[Math.floor(rng() * tied.length)].color;

    // Hue group: subsequent roles in a group snap to the group's established hue
    let finalColor: OklchColor;
    if (role.hueGroup && hueGroups.has(role.hueGroup)) {
      finalColor = clampToGamut({ ...selected, h: hueGroups.get(role.hueGroup)! });
    } else {
      finalColor = selected;
      if (role.hueGroup) {
        hueGroups.set(role.hueGroup, selected.h ?? 0);
      }
    }

    assigned.set(role.name, finalColor);
    assignedList.push(finalColor);
  }

  // ── Phase 3: Enforce Cross-Role Contrast Constraints ──────────────────────

  const bg1Color = assigned.get('bg1');
  const bg3Color = assigned.get('bg3');

  for (const constraint of spec.constraints) {
    const roleColor = assigned.get(constraint.role);
    const againstColor = assigned.get(constraint.against);

    if (!roleColor || !againstColor) continue;

    // Comment requires dual-BG enforcement (appears in both editor area and gutter)
    if (constraint.role === 'comment' && bg1Color && bg3Color) {
      assigned.set(
        constraint.role,
        enforceCommentContrast(roleColor, bg1Color, bg3Color, mode, {
          min: constraint.min,
          max: constraint.max,
        }),
      );
    } else {
      assigned.set(
        constraint.role,
        enforceContrast(roleColor, againstColor, constraint.min, constraint.max),
      );
    }
  }

  // ── Phase 4: Generate Derived Colors ──────────────────────────────────────

  const allColors = applyDerived(spec.derived, assigned);

  // ── Iso-Lightness (Uniform) Mode ──────────────────────────────────────────
  // Applied after derivation so bright ANSI variants are also normalized.

  if (uniformMode) {
    const uniformL = allColors.get('ac1')?.l ?? 0.5;
    const brightL = Math.min(1, uniformL + uniformBrightDelta);

    for (const [name, color] of allColors) {
      if (UNIFORM_EXCLUDED.has(name)) continue;
      const targetL = BRIGHT_ANSI_NAMES.has(name) ? brightL : uniformL;
      allColors.set(name, clampToGamut({ ...color, l: targetL }));
    }
  }

  // ── Phase 5: Build ThemePalette ───────────────────────────────────────────

  const paletteColors: Record<string, PaletteColor> = {};
  for (const [role, color] of allColors) {
    paletteColors[role] = { role, ...toColorOutput(color) };
  }

  return {
    spec: spec.name,
    mode,
    colors: paletteColors,
    get: (role: string) => paletteColors[role],
    hex: (role: string) => paletteColors[role]?.hex ?? '',
  };
}
