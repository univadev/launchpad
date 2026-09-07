
export const GRADE_12_COURSES = [
  { code: 'ENG4U', name: 'English' },
  { code: 'ETS4U', name: 'Studies in Literature' },
  { code: 'EWC4U', name: "The Writer's Craft" },
  { code: 'MHF4U', name: 'Advanced Functions' },
  { code: 'MCV4U', name: 'Calculus and Vectors' },
  { code: 'MDM4U', name: 'Mathematics of Data Management' },
  { code: 'MGA4U', name: 'Geometry and Discrete Mathematics' },
  { code: 'SCH4U', name: 'Chemistry' },
  { code: 'SPH4U', name: 'Physics' },
  { code: 'SBI4U', name: 'Biology' },
  { code: 'SES4U', name: 'Earth and Space Science' },
  { code: 'SNC4M', name: 'Science' },
  { code: 'ICS4U', name: 'Computer Science' },
  { code: 'BBB4M', name: 'International Business Fundamentals' },
  { code: 'BAT4M', name: 'Financial Accounting Principles' },
  { code: 'BOH4M', name: 'Business Leadership' },
  { code: 'CIA4U', name: 'Analysing Current Economic Issues' },
  { code: 'CGW4U', name: 'World Issues (Geography)' },
  { code: 'CHY4U', name: 'World History' },
  { code: 'HZT4U', name: 'Philosophy' },
  { code: 'HHS4U', name: 'Families in Canada' },
  { code: 'HSB4U', name: 'Challenge and Change in Society' },
  { code: 'FSF4U', name: 'French' },
  { code: 'PSE4U', name: 'Exercise Science' },
  { code: 'PLF4M', name: 'Recreation and Healthy Active Living Leadership' },
  { code: 'AVI4M', name: 'Visual Arts' },
  { code: 'AMU4M', name: 'Music' },
  { code: 'ADA4M', name: 'Dramatic Arts' },
  { code: 'TDJ4M', name: 'Technological Design' },
  { code: 'TGJ4M', name: 'Communications Technology' },
  { code: 'TEJ4M', name: 'Computer Engineering Technology' },
  { code: 'TFJ4M', name: 'Hospitality and Tourism' },
  { code: 'CLN4U', name: 'Canadian and International Law' },
  { code: 'CPW4U', name: 'Canadian and International Politics' },
  { code: 'CGU4M', name: 'The Environment and Resource Management' },
  { code: 'HFA4U', name: 'Nutrition and Health' },
  { code: 'HHG4M', name: 'Human Development Throughout the Lifespan' },
  { code: 'HSE4M', name: 'Equity and Social Justice' },
  { code: 'IDC4U', name: 'Interdisciplinary Studies' },
]

export const UNIVERSITIES = [
  'Carleton University',
  'McMaster University',
  "Queen's University",
  'University of Guelph',
  'University of Ottawa',
  'University of Toronto',
  'University of Waterloo',
  'Western University',
  'Wilfrid Laurier University',
]

export const APPLICATION_STATUSES = ['Applied', 'Pending', 'Accepted', 'Waitlisted', 'Declined']

export const PROGRAMS = [
  { id: 'laurier-ahs', university: 'Wilfrid Laurier University', name: 'Laurier Applied Health Sciences', requirements: ['ENG4U', 'SCH4U'] },
  { id: 'laurier-cs', university: 'Wilfrid Laurier University', name: 'Laurier Computer Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'laurier-bba', university: 'Wilfrid Laurier University', name: 'Laurier Business Administration (BBA)', requirements: ['ENG4U', 'MHF4U'] },
  { id: 'laurier-data', university: 'Wilfrid Laurier University', name: 'Laurier Data Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'laurier-psych', university: 'Wilfrid Laurier University', name: 'Laurier Psychology', requirements: ['ENG4U'] },
  { id: 'laurier-kin', university: 'Wilfrid Laurier University', name: 'Laurier Kinesiology', requirements: ['ENG4U', 'SBI4U'] },

  { id: 'waterloo-cs', university: 'University of Waterloo', name: 'Computer Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'waterloo-se', university: 'University of Waterloo', name: 'Software Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SPH4U', 'SCH4U'] },
  { id: 'waterloo-mech', university: 'University of Waterloo', name: 'Mechatronics Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SPH4U', 'SCH4U'] },
  { id: 'waterloo-math', university: 'University of Waterloo', name: 'Mathematics', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'waterloo-health', university: 'University of Waterloo', name: 'Health Sciences', requirements: ['ENG4U', 'SBI4U'] },

  { id: 'uoft-cs', university: 'University of Toronto', name: 'Computer Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'uoft-engsci', university: 'University of Toronto', name: 'Engineering Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SPH4U', 'SCH4U'] },
  { id: 'uoft-lifesci', university: 'University of Toronto', name: 'Life Sciences', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'uoft-rotman', university: 'University of Toronto', name: 'Rotman Commerce', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },

  { id: 'mac-health', university: 'McMaster University', name: 'Health Sciences (BHSc)', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'mac-cs', university: 'McMaster University', name: 'Computer Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'mac-eng', university: 'McMaster University', name: 'Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SPH4U', 'SCH4U'] },
  { id: 'mac-lifesci', university: 'McMaster University', name: 'Life Sciences', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },

  { id: 'queens-commerce', university: "Queen's University", name: 'Commerce', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'queens-computing', university: "Queen's University", name: 'Computing', requirements: ['ENG4U', 'MHF4U'] },
  { id: 'queens-bhsc', university: "Queen's University", name: 'Health Sciences (BHSc)', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'queens-eng', university: "Queen's University", name: 'Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SCH4U', 'SPH4U'] },

  { id: 'western-medsci', university: 'Western University', name: 'Medical Sciences', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'western-bmos', university: 'Western University', name: 'Management & Organizational Studies (BMOS)', requirements: ['ENG4U', 'MHF4U'] },
  { id: 'western-cs', university: 'Western University', name: 'Computer Science', requirements: ['ENG4U', 'MHF4U'] },
  { id: 'western-eng', university: 'Western University', name: 'Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SCH4U', 'SPH4U'] },

  { id: 'guelph-biomed', university: 'University of Guelph', name: 'Biomedical Science', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'guelph-cs', university: 'University of Guelph', name: 'Computer Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'guelph-vet', university: 'University of Guelph', name: 'Animal Biology', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'guelph-commerce', university: 'University of Guelph', name: 'Commerce', requirements: ['ENG4U', 'MHF4U'] },

  { id: 'ottawa-cs', university: 'University of Ottawa', name: 'Computer Science', requirements: ['ENG4U', 'MCV4U', 'MHF4U'] },
  { id: 'ottawa-biomed', university: 'University of Ottawa', name: 'Biomedical Science', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'ottawa-health', university: 'University of Ottawa', name: 'Health Sciences', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
  { id: 'ottawa-eng', university: 'University of Ottawa', name: 'Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SCH4U', 'SPH4U'] },

  { id: 'carleton-cs', university: 'Carleton University', name: 'Computer Science', requirements: ['ENG4U', 'MHF4U'] },
  { id: 'carleton-eng', university: 'Carleton University', name: 'Engineering', requirements: ['ENG4U', 'MCV4U', 'MHF4U', 'SCH4U', 'SPH4U'] },
  { id: 'carleton-commerce', university: 'Carleton University', name: 'Bachelor of Commerce', requirements: ['ENG4U', 'MHF4U'] },
  { id: 'carleton-health', university: 'Carleton University', name: 'Health Sciences', requirements: ['ENG4U', 'SBI4U', 'SCH4U'] },
]

export const MIN_COURSES = 6
export const MAX_PROGRAMS = 20

export function programById(id) {
  return PROGRAMS.find(p => p.id === id) || null
}

// A ranked program is either a reference into PROGRAMS (`programId`) or a
// user-entered one stored inline (`custom`). Always resolve through this so a
// custom entry is never treated as "not found" — several call sites drop or hide
// programs that fail to resolve, which would silently delete a user's data.
export function resolveProgram(entry) {
  if (!entry) return null
  if (entry.custom) {
    return {
      id: entry.uid,
      name: entry.custom.name,
      university: entry.custom.university,
      requirements: Array.isArray(entry.custom.requirements) ? entry.custom.requirements : [],
      isCustom: true,
    }
  }
  return programById(entry.programId)
}

// Courses are de-duplicated by `code`, and custom ones (e.g. "AP Calculus BC")
// have no Ontario-style code. Derive a stable one from the name so dedupe and
// the requirements check keep working.
export function customCourseCode(name) {
  const slug = String(name || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `CUSTOM-${slug || 'COURSE'}`
}

export function isCustomCourseCode(code) {
  return typeof code === 'string' && code.startsWith('CUSTOM-')
}
