// ---------------------------------------------------------------------------
// Achievement filters — loose / semantic-style keyword groups for profiles.
// LinkedIn has no native achievement facet; each preset expands to related
// phrases OR'd together so wording variations still match.
// ---------------------------------------------------------------------------

import { dedupe, formatGroup, normalizeTerm } from "./query-builder";
import type { LinkedInSearchConfig, MatchLogic } from "./types";

export interface AchievementPreset {
  id: string;
  label: string;
  /** Related phrases OR'd together for one achievement (loose match). */
  phrases: string[];
}

export const ACHIEVEMENT_PRESETS: AchievementPreset[] = [
  {
    id: "leetcode-top-10",
    label: "Top 10% LeetCode",
    phrases: [
      "LeetCode top 10%",
      "top 10% LeetCode",
      "LeetCode Knight",
      "LeetCode ranking",
      "LeetCode contest rating",
    ],
  },
  {
    id: "leetcode-top-5",
    label: "Top 5% LeetCode",
    phrases: [
      "LeetCode top 5%",
      "top 5% LeetCode",
      "LeetCode Guardian",
      "LeetCode ranking",
      "LeetCode contest",
    ],
  },
  {
    id: "kaggle-expert",
    label: "Kaggle Expert+",
    phrases: [
      "Kaggle Expert",
      "Kaggle Master",
      "Kaggle Grandmaster",
      "Kaggle Competition",
      "Kaggle medal",
      "Kaggle notebooks",
    ],
  },
  {
    id: "hackathon-winner",
    label: "Hackathon winner",
    phrases: [
      "hackathon winner",
      "hackathon champion",
      "won hackathon",
      "1st place hackathon",
      "hackathon first place",
      "winning hackathon",
    ],
  },
  {
    id: "competitive-programming",
    label: "Competitive programming",
    phrases: [
      "competitive programming",
      "ACM ICPC",
      "Codeforces",
      "Google Code Jam",
      "programming contest",
      "IOI",
      "ICPC",
    ],
  },
  {
    id: "olympiad",
    label: "Olympiad / medalist",
    phrases: [
      "Olympiad medal",
      "Science Olympiad",
      "Math Olympiad",
      "International Olympiad",
      "Olympiad winner",
      "Olympiad gold",
    ],
  },
  {
    id: "deans-list",
    label: "Dean's list / honors",
    phrases: [
      "Dean's List",
      "deans list",
      "honor roll",
      "honours roll",
      "distinction",
      "first class honours",
      "summa cum laude",
    ],
  },
  {
    id: "research-publication",
    label: "Research / publications",
    phrases: [
      "published paper",
      "research publication",
      "peer-reviewed",
      "journal publication",
      "conference paper",
      "NeurIPS",
      "ICML",
      "CVPR",
    ],
  },
  {
    id: "open-source",
    label: "Open source impact",
    phrases: [
      "open source contributor",
      "GitHub contributor",
      "maintainer",
      "core contributor",
      "open source project",
    ],
  },
  {
    id: "patent",
    label: "Patent holder",
    phrases: [
      "patent holder",
      "patent author",
      "issued patent",
      "patent pending",
      "US patent",
    ],
  },
];

export const ACHIEVEMENT_SUGGESTIONS = ACHIEVEMENT_PRESETS.map((p) => p.label);

function findPreset(achievement: string): AchievementPreset | undefined {
  const key = normalizeTerm(achievement);
  return ACHIEVEMENT_PRESETS.find(
    (p) => normalizeTerm(p.label) === key || normalizeTerm(p.id) === key
  );
}

/** All search phrases for selected achievements (deduped). */
export function expandAchievementPhrases(achievements: string[]): string[] {
  const out: string[] = [];
  for (const achievement of dedupe(achievements)) {
    const preset = findPreset(achievement);
    if (preset) out.push(...preset.phrases);
    else out.push(achievement.trim());
  }
  return dedupe(out.filter(Boolean));
}

/**
 * One achievement → OR group of related phrases.
 * Multiple achievements → combined with OR/AND per user logic.
 */
export function formatAchievementGroup(
  achievements: string[],
  logic: MatchLogic
): string {
  const blocks: string[] = [];
  for (const achievement of dedupe(achievements)) {
    const preset = findPreset(achievement);
    const phrases = preset ? preset.phrases : [achievement.trim()];
    const block = formatGroup(phrases, "any");
    if (block) blocks.push(block);
  }
  if (blocks.length === 0) return "";
  if (blocks.length === 1) return blocks[0];
  return `(${blocks.join(logic === "all" ? " AND " : " OR ")})`;
}

/** Map a keyword to a preset achievement label, or null if not accolade-like. */
export function mapKeywordToAchievement(keyword: string): string | null {
  const k = normalizeTerm(keyword);
  if (!k) return null;

  for (const preset of ACHIEVEMENT_PRESETS) {
    if (normalizeTerm(preset.label) === k) return preset.label;
    if (preset.phrases.some((p) => normalizeTerm(p) === k)) return preset.label;
  }

  const rules: Array<{ re: RegExp; label: string }> = [
    { re: /top\s*5\s*%|leetcode\s*guardian/, label: "Top 5% LeetCode" },
    { re: /leetcode|knight|rating/, label: "Top 10% LeetCode" },
    { re: /kaggle|grandmaster/, label: "Kaggle Expert+" },
    { re: /hackathon/, label: "Hackathon winner" },
    {
      re: /hackerrank|codechef|codeforces|icpc|competitive programming|ioi|code jam/,
      label: "Competitive programming",
    },
    { re: /olympiad/, label: "Olympiad / medalist" },
    {
      re: /dean'?s list|honou?r roll|summa|distinction|scholarship|medal|topper|trophy|merit|award|honou?rs|first class|gpa|grade|\brank\b|winner|performer|top\s*1\s*%/,
      label: "Dean's list / honors",
    },
    {
      re: /neurips|icml|cvpr|publication|published paper|peer[- ]reviewed/,
      label: "Research / publications",
    },
    { re: /open source|github contributor|maintainer/, label: "Open source impact" },
    { re: /patent/, label: "Patent holder" },
  ];

  for (const { re, label } of rules) {
    if (re.test(k)) return label;
  }
  return null;
}

/** Move accolade-like keywords into achievements (loose search group). */
export function promoteAchievementKeywords(
  config: LinkedInSearchConfig
): LinkedInSearchConfig {
  const achievements = [...(config.achievements ?? [])];
  const keywords: string[] = [];

  for (const kw of config.keywords) {
    const mapped = mapKeywordToAchievement(kw);
    if (mapped) achievements.push(mapped);
    else keywords.push(kw);
  }

  return {
    ...config,
    achievements: dedupe(achievements),
    keywords: dedupe(keywords),
  };
}
