import {
  CandidateEducation,
  CandidateExperience,
  CandidateProfile,
  RemotePreference,
  Seniority,
} from "@/lib/recruiting/types";

// ---------------------------------------------------------------------------
// Deterministic mock candidate dataset.
//
// Everything here is generated from fixed seed arrays so the same candidate
// always has the same externalId, skills and history across server restarts.
// This keeps pagination, getCandidate() and scoring reproducible.
// ---------------------------------------------------------------------------

type RoleKey =
  | "backend"
  | "frontend"
  | "ai"
  | "data"
  | "devops"
  | "pm"
  | "qa";

interface RoleDef {
  key: RoleKey;
  titles: string[];
  coreSkills: string[];
  extraSkills: string[];
  industries: string[];
}

const ROLES: RoleDef[] = [
  {
    key: "backend",
    titles: ["Backend Engineer", "Software Engineer", "Backend Developer", "Server Engineer"],
    coreSkills: ["Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Docker", "Redis"],
    extraSkills: ["gRPC", "Kafka", "GraphQL", "AWS", "Microservices", "Go", "Python"],
    industries: ["SaaS", "Fintech", "E-commerce"],
  },
  {
    key: "frontend",
    titles: ["Frontend Engineer", "UI Engineer", "Frontend Developer", "Web Engineer"],
    coreSkills: ["React", "TypeScript", "Next.js", "CSS", "HTML", "Tailwind CSS"],
    extraSkills: ["Redux", "GraphQL", "Testing Library", "Accessibility", "Vue", "Storybook"],
    industries: ["SaaS", "Media", "E-commerce"],
  },
  {
    key: "ai",
    titles: ["AI Engineer", "Machine Learning Engineer", "ML Engineer", "Applied Scientist"],
    coreSkills: ["Python", "PyTorch", "LLMs", "Machine Learning", "TensorFlow", "NLP"],
    extraSkills: ["LangChain", "Vector Databases", "MLOps", "Hugging Face", "CUDA", "RAG"],
    industries: ["AI", "Healthtech", "Fintech"],
  },
  {
    key: "data",
    titles: ["Data Engineer", "Analytics Engineer", "Big Data Engineer", "Data Platform Engineer"],
    coreSkills: ["Python", "SQL", "Spark", "Airflow", "dbt", "Snowflake"],
    extraSkills: ["Kafka", "AWS", "BigQuery", "ETL", "Databricks", "Scala"],
    industries: ["Fintech", "AdTech", "SaaS"],
  },
  {
    key: "devops",
    titles: ["DevOps Engineer", "Site Reliability Engineer", "Platform Engineer", "Cloud Engineer"],
    coreSkills: ["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD", "Linux"],
    extraSkills: ["Prometheus", "Grafana", "Ansible", "GCP", "Helm", "Go"],
    industries: ["SaaS", "Fintech", "Gaming"],
  },
  {
    key: "pm",
    titles: ["Product Manager", "Senior Product Manager", "Technical Product Manager", "Group PM"],
    coreSkills: ["Product Strategy", "Roadmapping", "Agile", "User Research", "Analytics", "Stakeholder Management"],
    extraSkills: ["SQL", "A/B Testing", "Figma", "Go-to-Market", "OKRs", "Jira"],
    industries: ["SaaS", "Fintech", "E-commerce"],
  },
  {
    key: "qa",
    titles: ["QA Engineer", "SDET", "Automation Engineer", "Quality Engineer"],
    coreSkills: ["Test Automation", "Selenium", "Cypress", "Playwright", "Jest", "CI/CD"],
    extraSkills: ["Performance Testing", "Postman", "TypeScript", "Appium", "K6", "Python"],
    industries: ["SaaS", "Healthtech", "E-commerce"],
  },
];

const FIRST_NAMES = [
  "Aarav", "Maya", "Liam", "Sofia", "Noah", "Priya", "Ethan", "Chen", "Olivia", "Diego",
  "Ava", "Kenji", "Isabella", "Omar", "Emma", "Ravi", "Lucas", "Nina", "Mateo", "Zara",
  "Hana", "Leo", "Amara", "Yusuf", "Grace", "Arjun", "Elena", "Tomas", "Fatima", "Ivan",
  "Sara", "Marcus", "Lena", "Kofi", "Ana", "Wei", "Layla", "Sam", "Nadia", "Hugo",
  "Ines", "Rohan", "Julia", "Aria", "Felix", "Mei", "Dylan", "Rosa",
];

const LAST_NAMES = [
  "Sharma", "Rossi", "Nguyen", "Garcia", "Kim", "Patel", "Chen", "Silva", "Johnson", "Costa",
  "Anderson", "Tanaka", "Rodriguez", "Haddad", "Muller", "Kumar", "Martins", "Petrov", "Okafor", "Ali",
  "Novak", "Brown", "Schmidt", "Mensah", "Lopez", "Wang", "Hassan", "Andersson", "Reyes", "Ivanov",
];

const LOCATIONS: { city: string; country: string }[] = [
  { city: "San Francisco", country: "United States" },
  { city: "New York", country: "United States" },
  { city: "Austin", country: "United States" },
  { city: "Seattle", country: "United States" },
  { city: "London", country: "United Kingdom" },
  { city: "Berlin", country: "Germany" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Bangalore", country: "India" },
  { city: "Toronto", country: "Canada" },
  { city: "Sydney", country: "Australia" },
  { city: "Singapore", country: "Singapore" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Warsaw", country: "Poland" },
  { city: "Dublin", country: "Ireland" },
];

const COMPANIES = [
  "Stripe", "Datadog", "Shopify", "Airbnb", "Snowflake", "Cloudflare", "Notion", "Figma",
  "Vercel", "GitLab", "Twilio", "Atlassian", "MongoDB", "HashiCorp", "Databricks", "Canva",
  "Revolut", "Wise", "Monzo", "DoorDash", "Instacart", "Coinbase", "Robinhood", "Plaid",
];

const SCHOOLS = [
  "Stanford University", "MIT", "UC Berkeley", "Carnegie Mellon University", "University of Toronto",
  "IIT Bombay", "TU Munich", "University of Cambridge", "National University of Singapore",
  "Georgia Tech", "University of Washington", "ETH Zurich",
];

const DEGREES = [
  { degree: "B.S.", field: "Computer Science" },
  { degree: "M.S.", field: "Computer Science" },
  { degree: "B.Eng.", field: "Software Engineering" },
  { degree: "M.S.", field: "Data Science" },
  { degree: "B.S.", field: "Information Systems" },
  { degree: "MBA", field: "Product Management" },
];

const REMOTE_PREFS: RemotePreference[] = ["remote", "hybrid", "onsite"];

// --- deterministic pseudo-random helpers -----------------------------------

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function seniorityForYears(years: number, roleKey: RoleKey): Seniority {
  if (roleKey === "pm") {
    if (years < 3) return "mid";
    if (years < 6) return "senior";
    if (years < 10) return "manager";
    return "director";
  }
  if (years < 1) return "intern";
  if (years < 3) return "junior";
  if (years < 6) return "mid";
  if (years < 9) return "senior";
  if (years < 12) return "lead";
  return "principal";
}

function seniorityPrefix(s: Seniority): string {
  switch (s) {
    case "junior":
      return "Junior ";
    case "senior":
      return "Senior ";
    case "lead":
      return "Lead ";
    case "principal":
      return "Principal ";
    case "director":
      return "Director of ";
    default:
      return "";
  }
}

function buildCandidate(index: number): CandidateProfile {
  const rand = seeded(index * 7919 + 17);
  const role = ROLES[index % ROLES.length];

  const first = pick(FIRST_NAMES, rand());
  const last = pick(LAST_NAMES, rand());
  const fullName = `${first} ${last}`;

  const loc = pick(LOCATIONS, rand());
  const remotePreference = pick(REMOTE_PREFS, rand());
  const industry = pick(role.industries, rand());

  const years = 1 + Math.floor(rand() * 15);
  const seniority = seniorityForYears(years, role.key);
  const baseTitle = pick(role.titles, rand());
  const currentJobTitle =
    role.key === "pm" ? baseTitle : `${seniorityPrefix(seniority)}${baseTitle}`.trim();

  const skills = [
    ...pickN(role.coreSkills, 4 + Math.floor(rand() * 2), rand),
    ...pickN(role.extraSkills, 2 + Math.floor(rand() * 3), rand),
  ];

  // experiences (2-3 roles)
  const companies = pickN(COMPANIES, 3, rand);
  const currentCompany = companies[0];
  const now = new Date();
  const experiences: CandidateExperience[] = [];
  let cursorYear = now.getFullYear();
  const numExp = 2 + Math.floor(rand() * 2);
  for (let e = 0; e < numExp; e++) {
    const span = 1 + Math.floor(rand() * 4);
    const endYear = cursorYear;
    const startYear = cursorYear - span;
    cursorYear = startYear;
    experiences.push({
      title: e === 0 ? currentJobTitle : `${pick(role.titles, rand())}`,
      company: companies[e % companies.length],
      startDate: `${startYear}-0${1 + Math.floor(rand() * 8)}`,
      endDate: e === 0 ? undefined : `${endYear}-0${1 + Math.floor(rand() * 8)}`,
      isCurrent: e === 0,
      location: `${loc.city}, ${loc.country}`,
      description: `${baseTitle} focused on ${skills.slice(0, 2).join(" and ")}.`,
    });
  }

  const deg = pick(DEGREES, rand());
  const gradYear = now.getFullYear() - years - 1;
  const education: CandidateEducation[] = [
    {
      school: pick(SCHOOLS, rand()),
      degree: deg.degree,
      fieldOfStudy: deg.field,
      startYear: gradYear - 4,
      endYear: gradYear,
    },
  ];

  const headline = `${currentJobTitle} at ${currentCompany}`;
  const summary = `${fullName} is a ${currentJobTitle.toLowerCase()} with ${years} years of experience in ${industry}. Strong background in ${skills
    .slice(0, 3)
    .join(", ")}.`;

  const externalId = `mock-${role.key}-${String(index).padStart(4, "0")}`;
  const slug = `${first}-${last}-${index}`.toLowerCase();

  return {
    id: externalId,
    provider: "mock",
    externalId,
    fullName,
    headline,
    location: `${loc.city}, ${loc.country}`,
    country: loc.country,
    currentJobTitle,
    currentCompany,
    yearsOfExperience: years,
    seniority,
    remotePreference,
    industry,
    skills,
    experiences,
    education,
    profileUrl: `https://example.com/candidates/${slug}`,
    profileImageUrl: undefined,
    summary,
    lastRefreshedAt: new Date(2026, 0, 1 + (index % 28)).toISOString(),
  };
}

let CACHE: CandidateProfile[] | null = null;

export function getMockCandidates(count = 96): CandidateProfile[] {
  if (CACHE) return CACHE;
  CACHE = Array.from({ length: count }, (_, i) => buildCandidate(i));
  return CACHE;
}
