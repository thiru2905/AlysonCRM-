// ---------------------------------------------------------------------------
// DeepSeek response JSON extraction — tolerates fences and minor truncation.
// ---------------------------------------------------------------------------

function tryParse(raw: string): unknown {
  return JSON.parse(raw);
}

/** Close a JSON object/array slice that was cut off mid-stream. */
function repairTruncatedObject(raw: string): string {
  let slice = raw.trim();
  slice = slice.replace(/,\s*$/, "");

  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of slice) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  if (inString) slice += '"';
  while (brackets > 0) {
    slice += "]";
    brackets--;
  }
  while (braces > 0) {
    slice += "}";
    braces--;
  }

  return slice;
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;

  const candidates = [
    raw,
    (() => {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start < 0 || end <= start) return null;
      return raw.slice(start, end + 1);
    })(),
    (() => {
      const start = raw.indexOf("{");
      if (start < 0) return null;
      return repairTruncatedObject(raw.slice(start));
    })(),
  ].filter((c): c is string => Boolean(c));

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return tryParse(candidate);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Invalid JSON");
}

export function computeScoreMaxTokens(termCount: number): number {
  // Large searches need room for issues/summary plus remove/replace flags only.
  return Math.min(8192, Math.max(3200, 1600 + termCount * 18));
}
