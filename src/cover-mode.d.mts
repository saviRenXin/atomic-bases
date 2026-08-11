export type CoverMode = "click" | "hover";
export type CoverModeSetting = "auto" | CoverMode;

export function resolveCoverMode(
  mode: CoverModeSetting,
  hoverCapable: boolean
): CoverMode;
