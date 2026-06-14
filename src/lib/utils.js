// Format relative time
export function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Format date
export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Truncate text
export function truncate(str, n) {
  return str.length > n ? str.substring(0, n - 1) + "…" : str;
}

// Ensure a user-entered URL has a protocol. Returns null for empty input.
// Accepts "linkedin.com/in/foo" → "https://linkedin.com/in/foo"
// Leaves "https://..." and "http://..." untouched.
export function normalizeUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Streak update logic
export function calculateStreak(lastPostDate, currentStreak) {
  if (!lastPostDate) return { newStreak: 1 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = new Date(lastPostDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - last) / 86400000);

  if (diffDays === 0) return { newStreak: currentStreak }; // already posted today
  if (diffDays === 1) return { newStreak: (currentStreak || 0) + 1 }; // consecutive day
  return { newStreak: 1 }; // streak broken
}

// Field of interest options
export const FIELDS_OF_INTEREST = [
  "Computer Science",
  "AI/ML",
  "Robotics",
  "Biotech",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Environmental Science",
  "Aerospace",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Economics",
  "Business",
  "Finance",
  "Entrepreneurship",
  "Psychology",
  "Neuroscience",
  "Medicine",
  "Data Science",
  "Cybersecurity",
  "Other",
];

// Project type options
export const PROJECT_TYPES = [
  "Web App",
  "Mobile App",
  "Hardware",
  "Research",
  "Business/Startup",
  "AI/ML Model",
  "Game",
  "Art/Design",
  "Social Impact",
  "Data Science",
  "Robotics",
  "Other",
];

// Popular tech stack suggestions
export const TECH_SUGGESTIONS = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "TypeScript",
  "JavaScript",
  "Python",
  "Node.js",
  "FastAPI",
  "Django",
  "Flask",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "TensorFlow",
  "PyTorch",
  "OpenAI API",
  "Supabase",
  "Firebase",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Vercel",
  "Netlify",
  "Arduino",
  "Raspberry Pi",
  "Figma",
  "Tailwind CSS",
  "GraphQL",
  "REST API",
];

// Country list (abbreviated)
export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "India",
  "Germany",
  "France",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Belgium",
  "Spain",
  "Italy",
  "Portugal",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Colombia",
  "Singapore",
  "Japan",
  "South Korea",
  "China",
  "New Zealand",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Kyrgyzstan",
  "Kazakhstan",
  "Uzbekistan",
  "Tajikistan",
  "Russia",
  "Egypt",
  "Turkey",
  "UAE",
  "Saudi Arabia",
  "Pakistan",
  "Bangladesh",
  "Other",
];
