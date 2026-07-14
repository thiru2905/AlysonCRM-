// Suggestion lists for the recruiting search / LinkedIn builder inputs.
// These are hints only — every field accepts arbitrary custom values.

export const SKILL_SUGGESTIONS = [
  "TypeScript", "JavaScript", "Python", "Go", "Java", "Rust", "C++", "Scala",
  "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "NestJS",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Snowflake", "BigQuery",
  "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure", "CI/CD",
  "Kafka", "Spark", "Airflow", "dbt", "GraphQL", "REST APIs", "gRPC",
  "PyTorch", "TensorFlow", "LLMs", "LangChain", "RAG", "Machine Learning",
  "NLP", "Vector Databases", "MLOps", "Hugging Face",
  "Cypress", "Playwright", "Selenium", "Jest", "Test Automation",
  "Product Strategy", "Roadmapping", "Agile", "User Research", "Analytics",
  "Tailwind CSS", "CSS", "HTML", "Accessibility", "Prometheus", "Grafana",
  // Soft skills
  "Communication", "Leadership", "Team Management", "Collaboration",
  "Problem Solving", "Mentoring", "Stakeholder Management", "Time Management",
  "Critical Thinking", "Adaptability", "Conflict Resolution", "Public Speaking",
  "Cross-functional Collaboration", "Coaching", "Decision Making",
];

export const TITLE_SUGGESTIONS = [
  "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
  "AI Engineer", "Machine Learning Engineer", "Data Engineer",
  "DevOps Engineer", "Site Reliability Engineer", "Platform Engineer",
  "Product Manager", "Technical Product Manager", "QA Engineer", "SDET",
  "Software Engineer", "Staff Engineer", "Engineering Manager",
];

export const COMPANY_SUGGESTIONS = [
  "Stripe", "Datadog", "Shopify", "Airbnb", "Snowflake", "Cloudflare",
  "Notion", "Figma", "Vercel", "GitLab", "Twilio", "Atlassian", "MongoDB",
  "HashiCorp", "Databricks", "Canva", "Revolut", "Wise", "Coinbase", "Plaid",
];

export const COUNTRY_SUGGESTIONS = [
  "United States", "United Kingdom", "Germany", "Netherlands", "India",
  "Canada", "Australia", "Singapore", "Portugal", "Poland", "Ireland",
];

export const INDUSTRY_SUGGESTIONS = [
  "SaaS", "Fintech", "E-commerce", "AI", "Healthtech", "AdTech", "Gaming", "Media",
];

export const FUNCTION_SUGGESTIONS = [
  "Engineering", "Information Technology", "Product Management", "Design",
  "Data", "Research", "Sales", "Marketing", "Operations", "Finance",
  "Human Resources", "Customer Success", "Legal", "Business Development",
  "Consulting", "Program & Project Management", "Quality Assurance",
];

export const EMPLOYMENT_TYPE_SUGGESTIONS = [
  "Full-time", "Part-time", "Contract", "Temporary", "Internship",
  "Freelance", "Self-employed",
];

export const LANGUAGE_SUGGESTIONS = [
  "English", "Spanish", "French", "German", "Dutch", "Portuguese",
  "Mandarin", "Hindi", "Arabic", "Japanese", "Italian", "Polish",
];

export const EDUCATION_SUGGESTIONS = [
  "Bachelor's Degree", "Master's Degree", "MBA", "PhD", "Associate Degree",
  "Bootcamp", "Diploma", "Self-taught",
];

export const UNIVERSITY_SUGGESTIONS = [
  "Stanford University", "MIT", "Carnegie Mellon University",
  "UC Berkeley", "University of Oxford", "University of Cambridge",
  "IIT Bombay", "IIT Delhi", "University of Toronto", "ETH Zurich",
  "Georgia Tech", "University of Waterloo",
];

/** Top 10 colleges shown as quick-pick filters in the LinkedIn search builder. */
export const COLLEGE_FILTER_SUGGESTIONS = [
  "Stanford University",
  "MIT",
  "Carnegie Mellon University",
  "UC Berkeley",
  "Georgia Tech",
  "University of Waterloo",
  "IIT Bombay",
  "IIT Delhi",
  "University of Oxford",
  "University of Cambridge",
];

export const SENIORITY_SUGGESTIONS = [
  "Intern", "Entry", "Junior", "Mid", "Senior", "Staff", "Principal",
  "Lead", "Manager", "Director", "VP", "C-level",
];

// Structured option lists for native <select> inputs in the candidate search.
export const REMOTE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const RESULTS_PER_PAGE_OPTIONS = [
  { value: "10", label: "10 per page" },
  { value: "20", label: "20 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];
