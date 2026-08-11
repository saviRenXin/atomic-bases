export function resolveCoverMode(mode, hoverCapable) {
  return mode === "auto" ? (hoverCapable ? "hover" : "click") : mode;
}
