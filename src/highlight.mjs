export function tokenizeHighlights(value) {
  const segments = [];
  const pattern = /==([^=\n]+)==/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: value.slice(cursor, match.index), highlighted: false });
    }

    segments.push({ text: match[1], highlighted: true });
    cursor = pattern.lastIndex;
  }

  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), highlighted: false });
  }

  if (segments.length === 0 && value.length > 0) {
    segments.push({ text: value, highlighted: false });
  }

  return segments;
}

export function findAtomicPropertyLocation(source) {
  const lines = source.split(/\r?\n/);
  const opening = lines[0]?.replace(/^\uFEFF/, "").trim();

  if (opening !== "---") return null;

  for (let line = 1; line < lines.length; line += 1) {
    const current = lines[line];
    const trimmed = current.trim();

    if (trimmed === "---" || trimmed === "...") break;

    const match = /^atomic\s*:\s*/.exec(current);
    if (match) {
      return { line, ch: match[0].length };
    }
  }

  return null;
}
