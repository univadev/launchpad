// Short, practical guides. Markdown bodies, rendered by src/pages/Guides.jsx.
// Links starting with "/" stay inside the app.
//
// Keep advice durable: no specific dates, prize amounts or rules that change
// year to year. Point to the official site (via the venue catalog) instead.

export const GUIDES = [
  {
    slug: 'science-fair-write-up',
    title: 'Write up a science fair project judges take seriously',
    summary: 'Structure, evidence and the judging interview, from your regional fair to the Canada-Wide Science Fair.',
    minutes: 5,
    venues: ['ysc-regional', 'cwsf', 'biogenius'],
    body: `
Judges see dozens of projects in a day. The ones that stand out make it easy to answer three questions fast: **what did you try to find out, how did you test it, and what did you actually learn?**

## Pick the right kind of project

- **Experiment:** you change one thing and measure the effect on another. You need a clear question, a control, and enough trials to trust the result.
- **Engineering / innovation:** you build something to meet a goal. You need a measurable target ("detects a fall within 2 seconds") and tests that show whether you hit it.
- **Study:** you analyse data that already exists. You need a sharp question and an honest account of where the data came from and its limits.

Say which kind yours is. Judges grade them differently.

## Structure the write-up

1. **Question or goal.** One sentence. If it takes a paragraph, it's not focused yet.
2. **Why it matters.** Who has this problem, and what already exists to solve it?
3. **Method.** Enough detail that someone else could repeat it. Name your variables and controls.
4. **Results.** Tables and graphs, with units and error bars or ranges where they apply. Show all your data, not just the trials that worked.
5. **Analysis.** What do the results mean? What else could explain them?
6. **Limitations.** What would you do differently? Naming weaknesses yourself reads as maturity, not failure.
7. **Conclusion and next steps.**

## Keep a logbook

Date every entry: what you did, what happened, what you changed and why. It's your proof the work is yours, and it's where your best interview answers come from.

## Prepare for the interview

Judges usually care more about the conversation than the poster. Practise explaining your project in 60 seconds, then expect follow-ups like:

- Why did you choose this method over another?
- What surprised you?
- What was the hardest part, and how did you get past it?
- If you had another month, what would you do next?

"I don't know, but here's how I'd find out" is a good answer. Bluffing is not.

## Where to take it

In Canada, start at your **Youth Science Canada regional STEM fair**. Top projects there advance to the **Canada-Wide Science Fair**. Each fair sets its own rules and grades, so check yours early. Post your project on Launchpad and run AI feedback: it scores how far along the project is and suggests venues you can actually enter.
`,
  },
  {
    slug: 'first-hackathon-result',
    title: 'Get your first hackathon result',
    summary: 'Choose a beginner-friendly event, scope small, and demo something that works.',
    minutes: 4,
    venues: ['mlh', 'devpost', 'hackclub'],
    body: `
Your first hackathon is about finishing something and showing it well. Results come from a small idea that works, not an ambitious one that doesn't.

## Choose the event

- Look for events that say they welcome **high school students and beginners**, many have beginner prize categories.
- Online events are a low-pressure first try; in-person events are better for meeting teammates and mentors.
- Read the **judging criteria** before you start. They usually reward a working demo, originality, and how well you explain it.

## Before it starts

- **Team of 2–4** with mixed skills. Someone who can design and present is worth as much as another coder.
- Set up your tools ahead of time: editor, Git, a starter template you know. Don't spend hour one installing things.
- If the event allows it, have a couple of problem areas in mind. Build the actual project during the event.

## During

1. **Pick one problem, one user, one feature.** Write it as a sentence: "A tool that helps ___ do ___."
2. **Get the core working end to end by the halfway mark,** even if it's ugly. Then improve it.
3. **Cut scope early and often.** A fake login screen is fine; a broken demo is not.
4. **Commit often** so you can roll back when something breaks at 2 a.m.
5. **Stop building with time to spare** for the submission and the demo.

## The submission and demo

- Lead with the **problem**, then show the product **working** live or in a short video.
- Say what you built during the event versus what came from libraries or templates. Judges notice, and honesty helps.
- Your write-up should cover: what it does, how you built it, challenges, what you learned, what's next.

## After

Post it on Launchpad within a day while it's fresh, with a screenshot, the repo and what you'd improve. A finished hackathon project you keep improving is strong evidence for applications later.
`,
  },
  {
    slug: 'projects-on-applications',
    title: 'Make a project count on a university application',
    summary: 'Admissions readers want evidence of what you did and what changed because of it, not a tech list.',
    minutes: 4,
    venues: ['shad', 'schulich', 'loran'],
    body: `
Many programs ask about activities, achievements or a project you're proud of, in a supplementary form, profile or interview. A good project answer is specific, honest and shows how you think.

## What a strong answer shows

- **The problem.** Why this mattered, and to whom.
- **Your role.** What *you* did, especially on a team. "I built the sensor pipeline" beats "we made a robot."
- **The result.** Something you can point to: users, measurements, a placement, a published write-up, a teacher or community group using it.
- **What you learned.** A real change in how you work or think, not "I learned teamwork."

## Common mistakes

- **Listing technologies** instead of explaining the problem and outcome.
- **Overclaiming.** "Revolutionary app used by thousands" falls apart under one follow-up question. Readers trust specific, modest claims.
- **Describing, not reflecting.** Spend less space on what the project is and more on why you made the choices you did.
- **Ignoring the question.** Answer what's asked, in the word limit you're given.

## Build the evidence before you need it

The best time to strengthen your answer is months before the application:

1. Get honest **AI feedback** on each project and work through the top fix; [your path](/tracker) shows what to fix next.
2. Measure something real: test with users, record accuracy, track usage.
3. Enter a competition or showcase that fits where the project is. A placement or even an accepted submission is evidence.
4. Keep notes on decisions and setbacks. They become your best reflection material.

## Writing the answer

Use the [Application coach](/coach) to plan talking points from your own record, or to review a draft you wrote. It won't write the answer for you; admissions answers need to be in your own words.
`,
  },
  {
    slug: 'email-a-researcher',
    title: 'Ask a professor or lab for mentorship',
    summary: 'How to find the right person, write a short email they can say yes to, and stay safe.',
    minutes: 4,
    venues: ['biogenius', 'jei'],
    body: `
Many researchers are happy to help a motivated high school student, but they're busy. A short, specific email with a small ask gets far more replies than a long, general one.

## Find the right person

- Search your local university's department pages for researchers working on your topic. Read the summary of one or two recent papers or projects.
- Graduate students and postdocs in a lab are often more available than the professor, and just as helpful.
- Programs that pair students with a mentor at a real lab (like **Sanofi Biogenius Canada**) are a structured way in.

## Write a short email

Keep it to about five sentences:

1. **Who you are:** grade, school, and your interest in one line.
2. **Why them:** one specific thing about their work, to show you looked.
3. **What you've done:** link your Launchpad project or a short write-up.
4. **A small ask:** a 20-minute call, feedback on your method, or a pointer to a dataset. Not "can I join your lab."
5. **Thanks,** with your availability.

Use a clear subject line, like "High school student question about your work on soil microbes."

## Follow up, then move on

If there's no reply after one to two weeks, send one short follow-up. If there's still nothing, try someone else. No reply usually means busy, not no. Expect to contact several people before one says yes.

## Stay safe

- Tell a parent, guardian or teacher who you're contacting, and copy them on emails if you're under 18.
- Meet in public or institutional settings, like a university building or video call, never somewhere private.
- Use your school or a dedicated email address. Don't share your home address or other personal details.
- Real mentorship never costs money upfront and never involves pressure to keep secrets. If something feels off, stop and tell an adult you trust.

## Make it count

When someone helps, follow through on what you said you'd do and send a short update on how it went. That's how one call turns into ongoing mentorship.
`,
  },
]

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map(g => [g.slug, g]))
