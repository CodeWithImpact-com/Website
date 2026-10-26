# Code With Impact website: Claude_12

Static website with Learn AI, Learn ML and the ML Methods Guide. This is a local development version; it has not been published by this review.

## Preview

With the workspace's local server running, open:

- [Learn AI](http://127.0.0.1:8000/Claude_12/learn/)
- [Learn ML](http://127.0.0.1:8000/Claude_12/learn-ml/)
- [Methods Guide](http://127.0.0.1:8000/Claude_12/learn-ml/methods.html)
- [Website homepage](http://127.0.0.1:8000/Claude_12/)

Alternatively, open the HTML files directly. Lessons run in the browser; external reading links need an internet connection.

## What changed in Claude_12: one colour system

A new stylesheet, `colours.css`, loads last on every page (after `typography.css`). It keeps the brand colours and sets one job for each:

| Colour | Job |
|---|---|
| Cream `#FFFAF3` | Reading surfaces and page title areas |
| Navy `#102033` | Text, headings, demonstrations, repeated lab buttons |
| Coral `#ED7B74` | Primary buttons, accents, borders, icons |
| Dark coral `#A8443C` | Coral used as **text**: links, labels, headline accents, active menu item |
| Gold `#F5BD69` | Secondary buttons, notices, "Ready to explore" tags |
| Teal and chart colours | Data and feedback only, always labelled |

- Coral buttons now have navy labels (6:1 contrast instead of 2.7:1). Coral headline words use dark coral.
- Every page pairs a coral primary button with a gold secondary one (Home, Learn AI, Learn ML).
- The bright yellow coffee buttons are now outlined, and the footer social links are underlined text, so they no longer compete with each page's main action. The gold coffee panel on Get Involved stays the one prominent support area. Its "Stay Connected" band is now a quiet card.
- The coral Mission band keeps its colour, with navy text.
- Learn AI Resources and Sources & Credits now use the same cream title area as the other learning pages, instead of navy.
- The extra ML activities now use the same warm frame as the main lab (the sage and teal frames are gone). Teal stays where it is data: the validation pile and chart series.
- Choosing AI Tools: the "Highest eligible score" badge is gold; "Ruled out" stays coral.
- One focus ring (dark coral) everywhere.
- A thin division line under the header on every page and between sections on the course landing pages. Less empty space between sections. The yellow "Stuck, curious" box now has space below it.
- Removed "plain-English" labels: the link is now simply "Glossary".
- Lesson menus now match in both courses: section names taken from each lesson's own headings, the same "Your progress" checklist box, a "Course contents" list, and the same links at the bottom (Learning materials, Sources & credits, the other course, Glossary).
- Lesson times shortened after learner feedback, estimated from reading time (200 words a minute), about 3 minutes per activity and 30 seconds per quiz question, not counting the optional "Go deeper" sections. Learn AI: 10–20 minutes per lesson, about 3 hours in total. Learn ML: 10–15 minutes per lesson, about 85 minutes in total.
- Lesson 4 (Classification) threshold lab: explains what each circle and number means, labels the "Not flagged" and "Flagged" zones, fixes the key (hollow circle, dark ring), names the four boxes by their real-world result (e.g. "Busy days missed: the kitchen was short") with the technical term underneath, and adds a "What this teaches you" box.
- Lesson 3 (Regression), "Where does the straight line go wrong?": now explains how to read the chart, shades quiet, middle and busy days with their average error, and ends with a "What this teaches you" box.
- New check: `learn-ml/tests/colours.test.cjs`. 88 checks pass.
- To undo the colour changes, remove the `colours.css` line from the pages, or empty the file.

## What changed in Claude_11

**Shared layout and definitions update**
- Every HTML page loads `typography.css` last. Shared text roles now control font families, body line spacing, responsive page/section/lesson headings, card titles, buttons, labels, code and prose links. Chart labels retain their compact component styles.
- The shared layout keeps Code With Impact’s coral (`#ED7B74`), gold (`#F5BD69`), navy (`#102033`) and cream (`#fffaf3`): coral headline emphasis and primary actions, gold secondary actions, and navy demonstrations.
- Learn AI now uses the Learn ML landing layout: one ordered learning path, three-column lesson cards, saved progress and Start/Resume links. Its prompt comparison uses clearly labelled, independently written examples.
- Both programmes use a cream lesson header, clear objectives, open reading sections, boxed activities and a compact left navigation. On phones, navigation uses a disclosure; glossary links remain available. Knowledge checks precede optional technical material, and lessons provide previous/next navigation.
- Definitions appear only at selected teaching locations. Later ordinary mentions are left alone. The repeated six-term box in Inside an LLM has been removed.
- Corrected the reviewed definitions, including clustering, nearest neighbours, generative AI, embeddings, attention, drift and cosine similarity. Inline explanations of drift and DPIAs have also been corrected.
- Tooltips stay open while the pointer crosses into the definition, and changing definitions clears the previous trigger's accessibility state. New regression checks cover these behaviours and course navigation.

**Learn ML**
- Lesson 2 opens with "Three piles of days": training, validation and test days explained with an exam analogy (practice questions, mock exam, real exam) and a 24 / 12 / 12 strip. A fourth question asks why you can't test on the days a model learned from. Lessons 3 and 5 link back to it.

**Learn AI: plain language**
- Five quizzes no longer test terms the lessons didn't teach (Lessons 1, 2, 3, 4 and 8).
- Terms are explained at first use: model, features, LLM, embedding, dimensions, similarity score, chunks, top-k, grounded, guardrails, faithful, UK GDPR, DPIA, special category data, weight, data processing agreement, drift and the uncertainty bars.
- Lesson 2 explains the transformer and attention beside the example, with selected optional definition links.
- Lesson 3 explains what temperature is.
- Lesson 9's three fictional tools are described in plain words.

**Both programmes**
- Hover (or tap, or tab to) a selected dotted-underlined word to see its definition. Each term has at most one optional lookup per page; other mentions stay as normal text. Tooltip and glossary definitions live in `glossary.js`; authored `data-term` markers select where help is useful.
- New glossary page (`glossary.html`) with a search box, built from the same list, linked from both landing pages and every lesson.
- `sitemap.xml` and `robots.txt` so search engines can find every lesson. After publishing, submit https://codewithimpact.com/sitemap.xml in Google Search Console.

## What changed in Claude_10
- Privacy page: Code With Impact is described as a volunteer-led initiative (not yet a company); the 12-month retention period is confirmed.
- The project notebook is tested and runs end to end; the site now says so and explains what its results teach (performance can drift on later days).
- Learn ML invites people to ask questions and collaborate (landing page, project page and every lesson), instead of an FAQ.
- The project page uses the same footer as the rest of the site.
- The internal review documents (code review and repository comparison) were moved out of the website folder so they aren't published.

## Learn ML

There is one learning path, with six available foundation lessons and six planned extensions. Each lesson includes explanations, experiments and three or four check questions. Optional maths, Python and references sit inside a collapsible **Go deeper** section; there is no Explore/Build choice or separate set of lesson durations.

Lessons cover problem framing, data leakage, regression, classification, overfitting and model comparison. Progress completes after a meaningful experiment action and all check questions are answered correctly. It is stored in this browser and can be reset. It is not a qualification or competency assessment.

The Methods Guide explains ten methods. Fitted examples use original synthetic data; the naive Bayes word counts and neural-network architecture are explicitly illustrations. The new ML lessons do not redistribute the supplied third-party course folders.

See [CURRICULUM.md](learn-ml/CURRICULUM.md) for material recommendations and future lessons.

A repository comparison (kept outside the website folder) identified gaps against the Practical Statistics and Hands-On ML/PyTorch companion repositories. Those findings now inform original activities in all six foundations: a project brief, data inspection and sampling bias, residuals and sampling variation, rare-event classification, regularisation/training size and shared-fold validation. The single course takes about 145 minutes before optional reading/code.

[Open the project starter](learn-ml/project.html) to write and download a model note, or download its independently authored [Python notebook](learn-ml/notebooks/kitchen-project.ipynb). The notebook uses its own 180-day synthetic dataset and chronological 108/36/36 split. It has been reviewed for leakage and tested end to end (26 October 2026); the expected results are in the setup guide. See its [setup guide](learn-ml/notebooks/README.md).

[Sources & credits](learn-ml/sources.html) names the authors; [CREDITS.md](learn-ml/CREDITS.md) maps specific topics to each independently authored activity. No code or assets from either reviewed repository are incorporated. The full second-stage lessons and facilitated capstone remain planned.

## Checks

From this folder:

```text
node --test learn-ml/tests/*.test.cjs
```

Tests cover calculations, actual forest members, tree-rule boundaries, chart references, single-path navigation, lesson interactions, progress and analytics preferences. The lesson tests use a lightweight DOM fixture; they do not replace visual desktop/mobile or assistive-technology testing.

All **86 automated checks pass**, including calculation tests, simulated DOM interactions for the lessons, shared layout and glossary, course navigation, synchronised validation controls and project-note downloads. A local audit checked 617 file references across 29 HTML pages with no missing targets and confirmed that the shared typography stylesheet loads last everywhere. Main-site pages, both course landing pages, representative lessons, resources, the project worksheet, glossary and shared stylesheet returned HTTP 200. Fresh visual desktop/mobile and screen-reader testing remains outstanding for this revision because the browser connection was unavailable. The earlier notebook run and its setup guide remain unchanged.

Production analytics is restricted to the configured public domain. A local preview must not send visits to the production counter. Existing lesson activities and saved progress keys are retained.
