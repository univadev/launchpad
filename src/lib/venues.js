// Curated catalog of real places a high-school student can submit a project.
//
// This list is deliberately hand-maintained rather than generated. The AI is only
// allowed to pick IDs *from* this catalog, and tiering is computed in code below —
// so the model can't invent a competition that doesn't exist or attach a made-up
// acceptance percentage to a real one.
//
// selectivity: 1 = open to nearly all entrants, 5 = national/international elite.
// types: which PROJECT_TYPES (see utils.js) the venue realistically accepts.
// regions: country codes whose students are eligible (see REGION_BY_COUNTRY).
//   Omitted = open internationally. Check eligibility on the official site
//   before adding a venue — recommending a contest a student can't enter is
//   worse than not recommending one.

export const VENUE_KINDS = {
  competition: 'Competition',
  journal: 'Journal',
  hackathon: 'Hackathon',
  showcase: 'Showcase',
  fellowship: 'Fellowship',
  contest: 'Contest',
  program: 'Program',
  scholarship: 'Scholarship',
}

// profile.country (COUNTRIES in utils.js) -> region code used in `regions`.
export const REGION_BY_COUNTRY = {
  'United States': 'US',
  'Canada': 'CA',
}

export const VENUES = [
  // ---- Research / science fair ----
  {
    id: 'isef',
    name: 'Regeneron ISEF',
    kind: 'competition',
    selectivity: 5,
    url: 'https://www.societyforscience.org/isef/',
    blurb: 'International Science and Engineering Fair. You qualify through an affiliated fair first — in Canada, that means the Canada-Wide Science Fair, then selection to Team Canada-ISEF.',
    timing: 'Regionals winter · finals May',
    types: ['Research', 'Hardware', 'AI/ML Model', 'Data Science', 'Robotics', 'Social Impact'],
  },
  {
    id: 'sts',
    regions: ['US'],
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
    regions: ['US'],
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
    regions: ['US'],
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
    regions: ['US'],
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
    regions: ['US'],
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

  // ---- Canada ----
  {
    id: 'ysc-regional',
    name: 'Youth Science Canada regional STEM fair',
    kind: 'competition',
    selectivity: 2,
    regions: ['CA'],
    url: 'https://youthscience.ca/',
    blurb: 'Enter the regional fair for your home or school address (or the YSC Virtual fair if your area has none). Rules and grades vary by fair. Top projects advance to the Canada-Wide Science Fair.',
    timing: 'Most regional fairs run Mar–Apr',
    types: ['Research', 'Hardware', 'AI/ML Model', 'Data Science', 'Robotics', 'Social Impact', 'Other'],
  },
  {
    id: 'cwsf',
    name: 'Canada-Wide Science Fair',
    kind: 'competition',
    selectivity: 4,
    regions: ['CA'],
    url: 'https://youthscience.ca/',
    blurb: "Canada's national STEM fair, run by Youth Science Canada. You get there by winning a spot at your regional fair; it's also the route to Team Canada-ISEF.",
    timing: 'National fair in May',
    types: ['Research', 'Hardware', 'AI/ML Model', 'Data Science', 'Robotics', 'Social Impact', 'Other'],
  },
  {
    id: 'biogenius',
    name: 'Sanofi Biogenius Canada',
    kind: 'competition',
    selectivity: 4,
    regions: ['CA'],
    url: 'https://www.biogenius.ca/',
    blurb: 'Life-science and biotech research competition for high school and CEGEP students. Start with a proposal, then compete regionally and nationally.',
    timing: 'Proposals usually due mid-November (varies by region)',
    types: ['Research', 'Data Science', 'AI/ML Model', 'Social Impact'],
  },
  {
    id: 'ccc',
    name: 'Canadian Computing Competition (CCC)',
    kind: 'contest',
    selectivity: 3,
    regions: ['CA'],
    url: 'https://cemc.uwaterloo.ca/contests/ccc',
    blurb: "University of Waterloo's programming contest — a skills test, not a project submission. Written at school (a teacher registers); top Senior scorers are invited to the Canadian Computing Olympiad.",
    timing: 'Usually February',
    types: ['Web App', 'Mobile App', 'Game', 'AI/ML Model', 'Data Science', 'Other'],
  },
  {
    id: 'skills-ontario',
    name: 'Skills Ontario Competition',
    kind: 'competition',
    selectivity: 2,
    regions: ['CA'],
    url: 'https://www.skillsontario.com/',
    blurb: 'Ontario-only provincial contests including coding, VEX robotics, graphic design and the trades. Usually entered through your school or board.',
    timing: 'Provincials in May',
    types: ['Robotics', 'Hardware', 'Web App', 'Art/Design', 'Other'],
  },
  {
    id: 'shad',
    name: 'Shad',
    kind: 'program',
    selectivity: 4,
    regions: ['CA'],
    url: 'https://www.shad.ca/',
    blurb: 'Month-long summer STEAM and entrepreneurship program for Grade 10–11 students. Projects you have actually built make for a much stronger application.',
    timing: 'Applications open mid-September, close early winter',
    types: ['Research', 'Hardware', 'AI/ML Model', 'Data Science', 'Robotics', 'Business/Startup', 'Social Impact', 'Web App', 'Mobile App', 'Other'],
  },
  {
    id: 'schulich',
    name: 'Schulich Leader Scholarships',
    kind: 'scholarship',
    selectivity: 5,
    regions: ['CA'],
    url: 'https://www.schulichleaders.com/',
    blurb: 'Major undergraduate scholarship for graduating students heading into science, tech, engineering or entrepreneurship. Each school nominates one student, so make your projects known to your guidance office early.',
    timing: 'School nominations due in winter',
    types: ['Research', 'Hardware', 'AI/ML Model', 'Data Science', 'Robotics', 'Business/Startup', 'Web App', 'Mobile App'],
  },
  {
    id: 'loran',
    name: 'Loran Award',
    kind: 'scholarship',
    selectivity: 5,
    regions: ['CA'],
    url: 'https://loranscholar.ca/',
    blurb: 'Grade 12 award that weighs character, service and leadership, not just grades. Projects with real community impact are strong evidence.',
    timing: 'Applications due mid-October',
    types: ['Social Impact', 'Business/Startup', 'Research', 'Web App', 'Mobile App', 'Other'],
  },

  // ---- Recognition / general ----
  {
    id: 'ncwit',
    regions: ['US'],
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

// Can a student from this profile.country enter the venue? Unknown country
// shows everything rather than hiding venues the student may be eligible for.
export function isEligible(venue, country) {
  if (!venue.regions) return true
  const region = REGION_BY_COUNTRY[country]
  if (!country) return true
  return !!region && venue.regions.includes(region)
}

// Venues worth showing the model: only ones the student can enter, narrowed by
// project type so the prompt stays small.
export function candidatesFor(projectType, country) {
  const eligible = VENUES.filter(v => isEligible(v, country))
  const matched = eligible.filter(v => v.types.includes(projectType))
  return matched.length >= 5 ? matched : eligible
}
