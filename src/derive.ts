import {
  clampToGamut,
  blend as coreBlend,
  withAlpha as coreWithAlpha,
  adjustLightness as coreAdjustLightness,
  ensureContrast as coreEnsureContrast,
  type OklchColor,
} from '@rlabs-inc/color-generator';
import type { DerivedDefinition } from './types.js';

/**
 * Apply all derived color transforms in sequence.
 * Each transform can reference roles assigned in Phase 2–3, plus any previously
 * derived colors from the same list. Missing sources are silently skipped.
 *
 * @param definitions - Ordered list of derived color definitions from the ThemeSpec
 * @param assigned    - Map of role names → colors (locked + extracted + contrast-enforced)
 * @returns           - New map including all original colors plus all derived colors
 */
export function applyDerived(
  definitions: DerivedDefinition[],
  assigned: Map<string, OklchColor>,
): Map<string, OklchColor> {
  const all = new Map(assigned);

  for (const { name, transform } of definitions) {
    try {
      let result: OklchColor | undefined;

      switch (transform.type) {
        case 'blend': {
          const a = all.get(transform.a);
          const b = all.get(transform.b);
          if (a && b) {
            // Convention: amount=fraction of A (0=all B, 1=all A)
            // coreBlend(x, y, ratio) = x*(1-ratio) + y*ratio — so pass (1 - amount)
            result = coreBlend(a, b, 1 - transform.amount);
          }
          break;
        }
        case 'adjustLightness': {
          const src = all.get(transform.source);
          if (src) result = clampToGamut(coreAdjustLightness(src, transform.delta));
          break;
        }
        case 'withAlpha': {
          const src = all.get(transform.source);
          if (src) result = coreWithAlpha(src, transform.alpha);
          break;
        }
        case 'ensureContrast': {
          const src = all.get(transform.source);
          const against = all.get(transform.against);
          if (src && against) result = coreEnsureContrast(src, against, transform.min);
          break;
        }
        case 'copy': {
          const src = all.get(transform.source);
          if (src) result = { ...src };
          break;
        }
        case 'withHexAlpha': {
          const src = all.get(transform.source);
          if (src) {
            const alphaFloat = parseInt(transform.hexAlpha, 16) / 255;
            result = { ...src, alpha: alphaFloat };
          }
          break;
        }
        case 'adaptiveFg': {
          // Mirrors RLabs getAC1Foreground/getAC2Foreground:
          // - Infer mode from bgRole (default: 'bg1') luminance (l < 0.5 → dark mode)
          // - Dark mode + dark accent → fgRole (default: fg1 — light text on dark accent)
          // - Dark mode + light accent → fgAltRole (default: fg3 — near-bg text on light accent)
          // - Light mode + dark accent → fgAltRole (default: fg3 — near-bg text on dark accent)
          // - Light mode + light accent → fgRole (default: fg1 — dark text on light accent)
          // Optional role overrides allow use in non-editor specs (shadcn, etc.)
          const accent   = all.get(transform.background);
          const bgRef    = all.get(transform.bgRole  ?? 'bg1');
          const fg1      = all.get(transform.fgRole  ?? 'fg1');
          const fg3      = all.get(transform.fgAltRole ?? 'fg3');
          if (accent && bgRef && fg1 && fg3) {
            const isDarkMode   = bgRef.l < 0.5;
            const accentIsDark = accent.l < 0.5;
            if (isDarkMode) {
              result = accentIsDark ? { ...fg1 } : { ...fg3 };
            } else {
              result = accentIsDark ? { ...fg3 } : { ...fg1 };
            }
          }
          break;
        }
      }

      if (result !== undefined) all.set(name, result);
    } catch {
      // Skip failed transforms — source role may not exist in this spec variant
    }
  }

  return all;
}
