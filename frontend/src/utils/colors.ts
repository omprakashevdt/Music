// Deterministic warm/dark gradient pairs derived from a seed string.
// Used for artwork fallbacks and the Now Playing backdrop so the app stays
// cinematic even when a track has no embedded artwork.

const GRADIENTS: [string, string][] = [
  ["#4A3512", "#0D0D11"],
  ["#3A2A2A", "#0D0D11"],
  ["#2C3A2A", "#0D0D11"],
  ["#3A2C3A", "#0D0D11"],
  ["#3A3520", "#0D0D11"],
  ["#2A2E3A", "#0D0D11"],
  ["#4A2C22", "#0D0D11"],
  ["#233A38", "#0D0D11"],
];

const SOLIDS = [
  "#8A5A22",
  "#7A4444",
  "#4A6A44",
  "#6A447A",
  "#7A6A22",
  "#44557A",
  "#8A4A32",
  "#227A6E",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function gradientFor(seed: string): [string, string] {
  return GRADIENTS[hash(seed) % GRADIENTS.length];
}

export function solidFor(seed: string): string {
  return SOLIDS[hash(seed) % SOLIDS.length];
}
