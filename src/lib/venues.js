// Curated catalog of real places a high-school student can submit a project.
//
// This list is deliberately hand-maintained rather than generated. The AI is only
// allowed to pick IDs *from* this catalog, and tiering is computed in code below —
// so the model can't invent a competition that doesn't exist or attach a made-up
// acceptance percentage to a real one.
//
// selectivity: 1 = open to nearly all entrants, 5 = national/international elite.
// types: which PROJECT_TYPES (see utils.js) the venue realistically accepts.

export const VENUE_KINDS = {
  competition: 'Competition',
  journal: 'Journal',
  hackathon: 'Hackathon',
  showcase: 'Showcase',
  fellowship: 'Fellowship',
}

export const VENUES = [
  // ---- Research / science fair ----
  {
    id: 'isef',
    name: 'Regeneron ISEF',
    kind: 'competition',
    selectivity: 5,
    url: 'https://www.societyforscience.org/isef/',
    blurb: 'International Science and Engineering Fair. You qualify through an affiliated regional fair first.',
    timing: 'Regionals winter · finals May',
    types: ['Research', 'Hardware', 'AI/ML Model', 'Data Science', 'Robotics', 'Social Impact'],
  },
  {
    id: 'sts',
    name: 'Regeneron Science Talent Search',
    kind: 'competition',
    selectivity: 5,
    url: 'https://www.societyforscience.org/regeneron-sts/',
    blurb: 'Seniors only, original research. The most selective pre-college research competition in the US.',
    timing: 'Applications due November',
    types: ['Research', 'Data Science', 'AI/ML Model', 'Hardware'],
  },
  {
    id: 'jshs',
    name: 'JSHS (Junior Science & Humanities Symposium)',
    kind: 'competition',
    selectivity: 3,
    url: 'https://www.jshs.org/',
    blurb: 'Regional symposium where you present original STEM research to judges. Regional-first structure makes it far more reachable than ISEF.',
    timing: 'Regionals Jan–Mar',
    types: ['Research', 'Data Science', 'AI/ML Model', 'Hardware', 'Robotics'],
  },
  {
    id: 'think',
    name: 'MIT THINK Scholars',
    kind: 'fellowship',
    selectivity: 5,
    url: 'https://think.mit.edu/',
    blurb: 'Funds and mentors projects that have NOT been built yet — you apply with a proposal, not a finished product.',
    timing: 'Applications due January',
    types: ['Research', 'Hardware', 'Robotics', 'AI/ML Model'],
  },
  {
    id: 'davidson',
    name: 'Davidson Fellows',
    kind: 'fellowship',
    selectivity: 5,
    url: 'https://www.davidsongifted.org/fellows-scholarship/',
    blurb: 'Scholarships up to $50k for extraordinarily deep work. Expects something close to professional quality.',
    timing: 'Applications due February',
    types: ['Research', 'AI/ML Model', 'Hardware', 'Art/Design', 'Data Science'],
  },

  // ---- Journals ----
  {
    id: 'jei',
    name: 'Journal of Emerging Investigators',
    kind: 'journal',
    selectivity: 3,
    url: 'https://emerginginvestigators.org/',
    blurb: 'Peer-reviewed journal built specifically for middle/high school research. Reviewers send real revision requests.',
    timing: 'Rolling submissions',
    types: ['Research', 'Data Science', 'AI/ML Model', 'Social Impact'],
  },
  {
    id: 'jsr',
    name: 'Journal of Student Research',
    kind: 'journal',
    selectivity: 2,
    url: 'https://www.jsr.org/',
    blurb: 'Accepts high school submissions across disciplines. Good first publication if your work has a written method and results.',
    timing: 'Rolling, quarterly issues',
    types: ['Research', 'Data Science', 'Social Impact', 'Business/Startup', 'Other'],
  },
  {
    id: 'nhsjs',
    name: 'National High School Journal of Science',
    kind: 'journal',
    selectivity: 2,
    url: 'https://nhsjs.com/',
    blurb: 'Student-run, peer-reviewed, free to submit. Realistic target for a solid first research write-up.',
    timing: 'Rolling submissions',
    types: ['Research', 'Data Science', 'AI/ML Model', 'Other'],
  },
  {
    id: 'curieux',
    name: 'Curieux Academic Journal',
    kind: 'journal',
    selectivity: 1,
    url: 'https://www.curieuxacademicjournal.com/',
    blurb: 'Publishes high school research monthly across most subjects. Lower bar — useful for getting a first citation.',
    timing: 'Rolling submissions',
    types: ['Research', 'Data Science', 'Social Impact', 'Art/Design', 'Other'],
  },

  // ---- Software / apps ----
  {
    id: 'congressional-app',
    name: 'Congressional App Challenge',
    kind: 'competition',
    selectivity: 2,
    url: 'https://www.congressionalappchallenge.us/',
    blurb: 'You compete only within your congressional district, so the field is small. Genuinely one of the best odds-to-prestige ratios available.',
    timing: 'Submissions due late October',
    types: ['Web App', 'Mobile App', 'Game', 'AI/ML Model', 'Social Impact', 'Data Science'],
  },
  {
    id: 'technovation',
    name: 'Technovation Girls',
    kind: 'competition',
    selectivity: 3,
    url: 'https://www.technovation.org/',
    blurb: 'Global program for girls building mobile apps that solve a community problem. Team-based with mentorship.',
    timing: 'Season Jan–Apr',
    types: ['Mobile App', 'Web App', 'Social Impact', 'AI/ML Model'],
  },
  {
    id: 'mlh',
    name: 'MLH Member Hackathons',
    kind: 'hackathon',
    selectivity: 1,
    url: 'https://mlh.io/seasons',
    blurb: 'Hundreds of sanctioned student hackathons a year, most open to high schoolers. Fastest way to turn a project into an award.',
    timing: 'Year-round',
    types: ['Web App', 'Mobile App', 'Game', 'AI/ML Model', 'Hardware', 'Data Science', 'Other'],
  },
  {
    id: 'hackclub',
    name: 'Hack Club',
    kind: 'showcase',
    selectivity: 1,
    url: 'https://hackclub.com/',
    blurb: '100k+ teenage builders. Shipping into their community gets you real peer feedback fast, not just a submission receipt.',
    timing: 'Always open',
    types: ['Web App', 'Mobile App', 'Game', 'Hardware', 'AI/ML Model', 'Robotics', 'Art/Design', 'Other'],
  },
  {
    id: 'devpost',
    name: 'Devpost',
    kind: 'showcase',
    selectivity: 1,
    url: 'https://devpost.com/hackathons',
    blurb: 'Open online hackathons running constantly, many with sponsor prizes and no age restriction.',
    timing: 'Year-round',
    types: ['Web App', 'Mobile App', 'AI/ML Model', 'Game', 'Data Science', 'Other'],
  },

  // ---- Business / entrepreneurship ----
  {
    id: 'diamond',
    name: 'Diamond Challenge',
    kind: 'competition',
    selectivity: 3,
    url: 'https://diamondchallenge.org/',
    blurb: 'High school entrepreneurship competition run by U. Delaware. Submit a written concept, top teams pitch live.',
    timing: 'Submissions due January',
    types: ['Business/Startup', 'Social Impact', 'Web App', 'Mobile App'],
  },
  {
    id: 'wharton',
    name: 'Wharton Global Youth Investment Competition',
    kind: 'competition',
    selectivity: 4,
    url: 'https://globalyouth.wharton.upenn.edu/investment-competition/',
    blurb: 'Team-based investment strategy competition judged by Wharton. Strong signal for finance-leaning applicants.',
    timing: 'Registration opens fall',
    types: ['Business/Startup', 'Data Science'],
  },
  {
    id: 'nfte',
    name: 'NFTE World Series of Innovation',
    kind: 'competition',
    selectivity: 2,
    url: 'https://www.nfte.com/world-series-of-innovation/',
    blurb: 'Solve a sponsor-set challenge tied to a UN sustainability goal. Multiple prize categories keeps odds reasonable.',
    timing: 'Submissions close winter',
    types: ['Business/Startup', 'Social Impact', 'Web App', 'Mobile App', 'Other'],
  },
  {
    id: 'conrad',
    name: 'Conrad Challenge',
    kind: 'competition',
    selectivity: 3,
    url: 'https://www.conradchallenge.org/',
    blurb: 'Teams build a commercially viable solution to a real-world problem. Multi-stage, so you get feedback between rounds.',
    timing: 'Entries open fall',
    types: ['Business/Startup', 'Hardware', 'Social Impact', 'AI/ML Model', 'Robotics'],
  },

  // ---- Hardware / robotics ----
  {
    id: 'first',
    name: 'FIRST Robotics Competition',
    kind: 'competition',
    selectivity: 2,
    url: 'https://www.firstinspires.org/',
    blurb: 'Team robotics leagues with regional events worldwide. Best route if your project is mechanical or embedded.',
    timing: 'Season Jan–Apr',
    types: ['Robotics', 'Hardware'],
  },

  // ---- Recognition / general ----
  {
    id: 'ncwit',
    name: 'NCWIT Aspirations in Computing',
    kind: 'competition',
    selectivity: 2,
    url: 'https://www.aspirations.org/',
    blurb: 'Award for women and nonbinary students in computing, judged on your whole computing story, not one polished product.',
    timing: 'Applications due fall',
    types: ['Web App', 'Mobile App', 'AI/ML Model', 'Data Science', 'Game', 'Robotics', 'Other'],
  },
  {
    id: 'blueocean',
    name: 'Blue Ocean Entrepreneurship Competition',
    kind: 'competition',
    selectivity: 2,
    url: 'https://www.blueoceancompetition.org/',
    blurb: 'Fully virtual, video-pitch based, no travel or team requirement. Very low friction to enter.',
    timing: 'Submissions due late winter',
    types: ['Business/Startup', 'Social Impact', 'Web App', 'Mobile App', 'Other'],
  },
]

export const VENUE_BY_ID = Object.fromEntries(VENUES.map(v => [v.id, v]))

// Tier a venue against how far along the project actually is.
// readiness and selectivity are both 1-5, so this is a deliberate, explainable
// comparison rather than a fabricated probability.
export function tierFor(venue, readiness) {
  const r = Math.max(1, Math.min(5, Number(readiness) || 3))
  if (venue.selectivity <= r - 1) return 'safe'
  if (venue.selectivity <= r + 1) return 'fit'
  return 'reach'
}

export const TIER_META = {
  safe: {
    label: 'Safe bet',
    hint: 'Your project already clears the typical bar here.',
  },
  fit: {
    label: 'Good fit',
    hint: 'Well matched to where the project is right now.',
  },
  reach: {
    label: 'Reach',
    hint: 'A stretch at this stage — worth it if you keep building.',
  },
}

export const TIER_ORDER = ['fit', 'safe', 'reach']

// Venues worth showing the model, narrowed by project type so the prompt stays small.
export function candidatesFor(projectType) {
  const matched = VENUES.filter(v => v.types.includes(projectType))
  return matched.length >= 5 ? matched : VENUES
}
