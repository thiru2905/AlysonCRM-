// ---------------------------------------------------------------------------
// DeepSeek-powered bulk college list extraction (server-only).
// ---------------------------------------------------------------------------

import {
  MAX_BULK_COLLEGE_COUNT,
  MAX_BULK_COLLEGE_INPUT_CHARS,
  normalizeCollegeList,
  parseCollegesHeuristic,
  type ParseCollegesResult,
} from "./parse-colleges";
import { extractJsonObject } from "./deepseek-json";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const SYSTEM_PROMPT = `You extract college and university names from messy pasted text (lists, tables, bullets, paragraphs).

Rules:
- Return ONLY a JSON object: { "colleges": ["string", ...] }
- Each entry is one school — use the full official name when you can infer it (e.g. "Indian Institute of Technology Bombay" instead of "IITB")
- Names should work in LinkedIn's school: filter
- Remove duplicates, footnotes, rankings, locations-only lines, and non-school noise
- Preserve distinct campuses as separate entries when clearly different (e.g. IIT Delhi vs IIT Bombay)
- Maximum ${MAX_BULK_COLLEGE_COUNT} colleges
- Keep each name concise (under 120 characters)`;

function collegeMaxTokens(rawLength: number): number {
  return Math.min(8192, Math.max(4000, 2000 + Math.ceil(rawLength / 8)));
}

export async function parseCollegesWithAI(raw: string): Promise<ParseCollegesResult> {
  const text = raw.trim();
  if (!text) {
    return { colleges: [], source: "heuristic" };
  }
  if (text.length > MAX_BULK_COLLEGE_INPUT_CHARS) {
    throw new Error(
      `Paste is too long (${text.length} chars). Keep it under ${MAX_BULK_COLLEGE_INPUT_CHARS} characters.`
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return { colleges: parseCollegesHeuristic(text), source: "heuristic" };
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: collegeMaxTokens(text.length),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `DeepSeek request failed (${res.status})${body ? `: ${body.slice(0, 200)}` : ""}`
    );
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");

  let parsed: unknown;
  try {
    parsed = extractJsonObject(content);
  } catch {
    return { colleges: parseCollegesHeuristic(text), source: "heuristic" };
  }

  const obj =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  const colleges = normalizeCollegeList(obj.colleges ?? obj.schools ?? obj.universities);
  if (colleges.length === 0) {
    return { colleges: parseCollegesHeuristic(text), source: "heuristic" };
  }

  return { colleges, source: "ai" };
}
