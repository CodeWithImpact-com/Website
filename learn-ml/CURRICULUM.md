# Learn ML: curriculum and material plan

This is an original CodeWithImpact learning path, designed for people who can read a chart but have not trained a model. It teaches learners to ask a useful question, inspect evidence and explain an error. The browser route needs no installation or Python. There is one learning path. Every lesson includes optional maths and Python in its Go deeper section; planned notebooks extend those same lessons.

The current prototype lives in `Claude_9/learn-ml/`. The first six lessons have interactive browser activities. Lessons 7–12 are an editorial roadmap, not completed lessons. External materials are optional companion references, not prerequisites for the browser path.

## What informed the scope

The supplied `Machine Learning A-Z` folder covers preprocessing; regression; classification; clustering; association rules; reinforcement learning; NLP; deep learning; dimensionality reduction; model selection and boosting. The separate `Machine Learning A-Z (Model Selection)` folder groups regression and classification implementations into Python scripts/notebooks and example datasets. These topic families informed the scope only.

The earlier structural/sample review is recorded in `../../learn-ml/REVIEW-AND-PLAN.md`. This second version changes the order to introduce trustworthy evaluation early and uses practical decisions instead of an algorithm catalogue. The source folders are not website assets. Do not package their notebooks, scripts, figures, exercise wording, video, data rows or screenshots into Learn ML.

## Lesson pattern

1. **A decision:** one concrete question and a short original scenario.
2. **A prediction:** ask the learner what they expect before changing a control.
3. **An experiment:** a small, repeatable interaction with visible inputs and results.
4. **An explanation:** interpret the result, name the idea and expose one limitation.
5. **A check:** one original question with feedback explaining the alternatives.
6. **An application:** a sentence connecting the idea to a real project.
7. **An optional route:** one relevant reference and, when produced, a separate Python notebook.

Use short sentences, UK spelling and visible units. Introduce terminology after the practical idea. Explain the denominator beside a metric. Keep controls keyboard-accessible, provide text equivalents for plots, and make reset available. Progress means that the learner explored a lesson; it must not be presented as proof of competency.

## The twelve-lesson path

**Version 8 change:** lessons 9–11 were revised for a health and charity audience. Text features, PCA and bandits were replaced by explaining predictions, fairness and forecasting. Each live lesson now has three check questions and completes automatically once the learner has tried the experiment and answered all questions correctly.

Times are editorial targets for one browser visit, excluding optional reading or code. Notebook activities below are proposals unless a file is explicitly delivered separately.

| # / lesson ID | Working title and intended outcome | Original interaction and evidence | Optional code activity and companion | Status |
| --- | --- | --- | --- | --- |
| 1 / `framing` | **Ask a useful question.** Distinguish predicting a number, predicting a category, finding groups and following an explicit rule. Recognise that some tasks do not need ML. | Classify small fictional project briefs. Choose what information exists at prediction time and what a useful output would be. Feedback explains why a rule can be sufficient. | Write a six-line problem brief: decision, user, target, inputs, baseline and cost of error. Read selected introductory Google ML material. | Live browser lesson |
| 2 / `data` | **Know what your model can know.** Identify missing values and information unavailable at prediction time. Understand leakage before discussing algorithm choice. | Inspect a fictional community-café table. Select fields for tomorrow’s demand prediction; reveal why future outcomes make suspiciously easy predictors. Explain that preprocessing must learn from training data. | Make an original table with an intentionally leaky column. Compare a pipeline using admissible features with an explicitly labelled invalid experiment. Consult the official scikit-learn pitfalls guide and Inria preprocessing material. | Live browser lesson |
| 3 / `regression` | **Predict a number.** Explain a line’s slope and intercept; interpret a residual and mean absolute error in the target’s units. | Move a line against original toy observations. The predictions, residuals and MAE update from the same observations. Contrast a fitted relationship with a causal explanation. | Generate synthetic demand examples with a documented seed. Compare `DummyRegressor` and `LinearRegression`; retain the toy-data label. Use Google’s regression module or ISLP chapter 3 for depth. | Live browser lesson |
| 4 / `classification` | **Choose a decision threshold.** Separate a score from the decision made from it. Compare false alarms and missed cases. | Adjust a threshold over logistic-regression scores fitted on original synthetic training data and evaluated on separate synthetic validation days. Recompute the confusion matrix, precision and recall. Explain that changing the threshold does not retrain a model or establish calibration. | Train a small classifier on synthetic data, select a threshold using validation results and discuss error costs. Consult Google’s classification material and ISLP chapter 4. | Live browser lesson |
| 5 / `overfitting` | **Learn the pattern, not every wiggle.** Explain why lower training error does not guarantee better unfamiliar-example performance. | Change model complexity and inspect separately labelled training and validation results. State whether curves are simulated illustrations or calculated fits; do not blur the distinction. | Fit low- and high-complexity models to a fresh synthetic dataset. Plot learning/validation curves with training-only preprocessing. Read the relevant Inria model-selection sections. | Live browser lesson |
| 6 / `comparison` | **Compare models fairly.** Use the same validation examples and metric, keep a baseline, and preserve a final test for the end. | Compare a simple baseline with candidate models on identical original examples. Inspect predictions as well as average error. Make a choice justified by the evidence and task. | Build one reproducible pipeline per candidate, use shared cross-validation folds and save the final test. Distinguish variation across folds from a confidence guarantee. Read Inria validation material, scikit-learn pitfalls and ISLP chapter 5. | Live browser lesson |
| 7 / `clustering` | **Find useful groups.** Explain that a cluster is a result of features, scaling and the chosen method; it is not a discovered truth about people. | Add fictional points, change `k`, step through centre updates and switch feature scales. Show when groups change. Avoid presenting segments as sensitive personal attributes. | Compare k-means runs on original synthetic coordinates; inspect inertia, stability and operational usefulness separately. Read ISLP chapter 12. | Planned |
| 8 / `ensembles` | **Combine simple models.** Distinguish a tree, averaging many trees and sequentially improving an ensemble; connect complexity to validation. | Make one tree split on synthetic examples. Compare a shallow tree with a small forest and an illustrative boosting sequence on the same held-out data. Identify which displayed results are actually computed. | Compare `DecisionTreeClassifier`, `RandomForestClassifier` and a gradient boosting estimator with a shared pipeline, folds and metric. Use Inria trees/ensembles material and ISLP chapter 8. | Planned |
| 9 / `explain` | **Why did it predict that?** Explain feature importance and simple local explanations, and their limits. | Remove one input at a time from a small synthetic model and watch error change; compare a global importance chart with one day's explanation. Show that importance is not causation. | Use permutation importance on a fitted pipeline; inspect partial dependence. Read Molnar, *Interpretable Machine Learning*. | Planned |
| 10 / `fairness` | **Does it work for everyone?** Compare errors across groups and discuss what a fair result means for the decision. | Split synthetic results by a fictional, non-sensitive group (for example, kitchen site); compare recall and false alarms per group and see how one threshold affects each. | Compute per-group metrics on validation data and document gaps in a model note. Read Barocas, Hardt and Narayanan, *Fairness and Machine Learning*. | Planned |
| 11 / `forecasting` | **Predict the days ahead.** Use time-based splits, a seasonal baseline and rolling evaluation. | Train on earlier weeks and test on later ones; compare a same-day-last-week baseline with a model, and see how a random split overstates accuracy. | Build a rolling-origin evaluation with a seasonal naive baseline. Read Hyndman and Athanasopoulos, *Forecasting: Principles and Practice*. | Planned |
| 12 / `capstone` | **Make an impact project you can explain.** Join framing, admissible data, a baseline, validation, error analysis and a human decision. | A project worksheet with evidence fields: who benefits, what data exists, evaluation protocol, baseline, result, limits and review/monitoring plan. Offer a synthetic café-demand starter and a carefully attributed public-data alternative. | Produce an original, reproducible notebook and a one-page model note. State the dataset version, source and scope of the result. Use UCI/OpenML for an independently selected dataset only after checking its record. | Planned |

Neural networks are a follow-on bridge after this path. Use the linked 3Blue1Brown explanation for visual intuition and fast.ai for learners ready for a larger coding project. Do not add them as hidden prerequisites to the introductory six lessons.

## Priorities from the repository comparison

The internal review of the two requested repositories found that the existing course is strongest at framing, leakage, basic evaluation and threshold trade-offs. Its main gaps are practical data inspection, sampling/uncertainty and repeated evaluation. These should deepen the same lessons rather than create a second path or expand the algorithm list first.

| Existing lesson | Activity | Current status |
| --- | --- | --- |
| 1 — Frame the question | Editable project brief with decision, user, timing, target, baseline and error costs; local Markdown export | Implemented |
| 2 — Know your data | Table/histogram, mean/median, unusual/missing counts; representative versus weekday-only sampling | Implemented; training-only mixed-column preprocessing is demonstrated in the optional notebook |
| 3 — Regression | Signed residual chart/table and simulated distribution of repeated sample means | Implemented; the simulated central 90% range is explicitly neither a confidence nor prediction interval |
| 4 — Classification | Majority-class baseline and prevalence experiment, retaining threshold/capacity trade-offs | Implemented with expected counts over 1,000 hypothetical days |
| 5 — Overfitting | Nested training-set sizes, polynomial degree and L2 regularisation controls | Implemented with a fixed validation set; no guaranteed monotonic improvement is claimed |
| 6 — Model comparison | Four shared validation folds with paired differences; synchronised k controls frozen before the final test | Implemented on 36 development examples; final-test examples remain separate |
| Project starter / later capstone | Six-section browser worksheet, original 180-day notebook, chronological evaluation and saved model note | Starter delivered. Notebook tested end to end on 26 October 2026; facilitated capstone and service-impact experiment remain planned |

Credit Peter Bruce, Andrew Bruce and Peter Gedeck for the statistics reference, and Aurélien Géron for the end-to-end ML reference. These sources informed the activity topics and optional reading. All activity code, explanations, scenarios and data were authored independently. Current source use and revision IDs are recorded in [CREDITS.md](CREDITS.md); learner-facing and activity-level acknowledgements are in [Sources & credits](sources.html) and the labs.

## Materials to create next

Prioritise a coherent small collection over a long list of links.

| Artifact | Purpose | Content and acceptance target |
| --- | --- | --- |
| Six short lesson notes | A readable companion to each live lab | One diagram, one worked original example, one misconception and a three-question retrieval check per lesson. Every worked number agrees with its lab. |
| A feature-and-target worksheet | Connect lessons 1 and 2 | One fictional project brief; blank prediction-time, target, feature, baseline and error-cost fields; a separate facilitator explanation. |
| Original synthetic café dataset | Carry a familiar context through the path | Document units, generation rule, seed, task, limitations and intended time split. Avoid real personal data and a claim of real-world representativeness. |
| Three starter notebooks | Give coding learners a small first route | Regression baseline; threshold decisions; fair pipeline comparison. Include expected outputs, Python/package versions, random seed and explanations of each data split. |
| An evaluation card | Make scores interpretable | A regression example in units and a classification confusion matrix; explain the task-dependent choice of metric and threshold. |
| A project model-note template | Make the capstone reviewable | Intended use, excluded use, source/version, split, baseline, errors, human action and monitoring plan on one page. |
| Facilitator prompts | Support a classroom or workshop | Prediction questions, paired explanations and a discussion of how dataset context can limit a result. |
| Accessible visual alternatives | Make every key idea available beyond a plot | A short prose interpretation, structured data or metrics table, focus states and controls with programmatic labels. |

Next release priorities: execute and review the delivered notebook in a supported Python environment; perform native-browser and assistive-technology QA on the new labs; develop the full capstone, clustering, ensembles, explanations, fairness and forecasting. Review external links before each release. Publish a new topic only when its explanation, interaction, knowledge check and data provenance are all complete.

## Curated official references

Links and visible source statements were checked on **26 October 2026**. Prerequisite recommendations and lesson mappings below are our editorial choices. A free-to-read page is not automatically permission to reproduce its contents.

| Resource | Where it helps / suggested readiness | How Learn ML uses it |
| --- | --- | --- |
| [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) and [prerequisites](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework) | Lessons 1–5; algebra/charts, with Python/NumPy/pandas for coding | Optional second explanation; link learners to the official material. |
| [Inria/scikit-learn MOOC](https://inria.github.io/scikit-learn-mooc/) | Lessons 2–6 and ensembles; basic Python/tables | Optional coding progression after our own lab. |
| [scikit-learn common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html) | Data and comparison; understand a train/test split first | Official technical reference for leakage and preprocessing. |
| [An Introduction to Statistical Learning](https://www.statlearning.com/) | Regression, classification, resampling, trees and unsupervised learning; algebra/statistics, Python for labs | Link to authors’ free Python-edition book; selective reading. |
| [3Blue1Brown neural networks](https://www.3blue1brown.com/lessons/neural-networks/) | Later bridge; algebra, no coding to watch | Optional visual explanation on the creator’s site. |
| [fast.ai Practical Deep Learning for Coders](https://course.fast.ai/) | Later extension; some coding experience | Link to the free project-oriented course. |
| [UCI Machine Learning Repository](https://archive.ics.uci.edu/) | Classification, clustering and capstone; table skills | Dataset discovery; no repository data is bundled in the prototype. |
| [OpenML](https://www.openml.org/) and [dataset metadata documentation](https://docs.openml.org/reference/datasets/dataset/) | Fair comparison and capstone; validation/Python | Dataset/task discovery; record exact dataset identity and version for later work. |
| [Practical Statistics for Data Scientists repository](https://github.com/gedeck/practical-statistics-for-data-scientists) — Peter Bruce, Andrew Bruce and Peter Gedeck | Data inspection, sampling, uncertainty, experiments and evaluation; Python/R familiarity for notebooks | Chapters 1–6 informed the gap review and proposed lesson extensions. The requested second-edition repository is no longer maintained; its README points to a newer edition. |
| [Hands-On Machine Learning with Scikit-Learn and PyTorch repository](https://github.com/ageron/handson-mlp) — Aurélien Géron | Preprocessing, classification and end-to-end project practice; Python/table familiarity | Chapters 2–4 and the project checklist inform optional reading and the workflow improvements. This is the PyTorch edition. |

Text features, PCA and bandit methods are possible later extensions beyond the current twelve-lesson plan.

## Reuse and provenance register

This register records practical editorial decisions, not legal advice or a blanket clearance of a provider’s assets.

For the two newly reviewed repositories, [CREDITS.md](CREDITS.md) records authors, exact reviewed commits, licence links and the current reference/inspiration relationship. The statistics repository uses GPL version 3; Géron's uses Apache 2.0. No files or assets from either repository are redistributed in this iteration. Any future adaptation needs its own precise attribution and applicable licence compliance, including separate checks for book assets and external datasets.

- **Supplied course folders:** inspiration from topic names and general ML workflows only. No course file, data row, figure, explanation or exercise is adapted or redistributed. Keep these folders outside the website bundle.
- **CodeWithImpact material:** all new lesson prose, questions, scenarios, browser activities and toy examples are written for this project. Mark synthetic data and illustrative model scores explicitly. Existing CodeWithImpact branding comes from the site’s own assets.
- **Google:** [site policies](https://developers.google.com/terms/site-policies) describe CC BY 4.0 documentation and Apache 2.0 code where the relevant notice applies, with exceptions for media and brand features. This prototype only links; it does not reuse their course assets.
- **Inria MOOC:** the [official repository license](https://github.com/INRIA/scikit-learn-mooc/blob/main/LICENSE) is CC BY 4.0. This prototype links to the course; no notebooks, figures or exercise text are imported.
- **scikit-learn:** link to the official guide. Any future adaptation of a code example should be documented against the exact source and applicable license at the time; it is unnecessary for the original browser labs.
- **ISLP:** the [authors’ resources page](https://www.statlearning.com/resources-python) makes different statements for slides and figures, including limits and attribution. A free book download is not treated as permission to republish a chapter. Link to the authors’ site; do not bundle the PDF, slides, labs, figures or datasets.
- **3Blue1Brown and fast.ai:** link to the creators’ pages. No video, stills, transcripts, exercises or notebooks are copied or rehosted. No general republication permission is claimed.
- **UCI:** assess the individual record. For example, [Iris](https://archive.ics.uci.edu/dataset/53/iris) identifies its creator, DOI and CC BY 4.0 license. If used later, retain those details and any modification notice. This does not establish rights for every UCI record or linked paper.
- **OpenML:** [platform terms](https://www.openml.org/terms) request credit and individual citation compliance; the [dataset schema](https://docs.openml.org/reference/datasets/dataset/) contains separate license, creator, version and source fields. Check the chosen record and original source, record its ID/version, and preserve applicable credit. A platform listing alone does not establish suitability for every intended use.

For any future real dataset, store a small provenance note with creator, source URL, identifier/version, retrieval date, license, citation, target, known context limitations and changes made. If that information is missing or unclear, use original synthetic examples until a suitable dataset is selected. Do not treat inclusion in a course download as redistribution permission.

## Review criteria

An editor should be able to answer these before a lesson becomes live: What can a learner now explain? Does the interaction actually calculate the stated quantity? Which result is illustrative? Are the units, split and denominator clear? Does feedback address a misconception? Can the activity be completed with a keyboard? Does it have an original or documented dataset? Is the external reference optional and correctly attributed?

The browser prototype teaches concepts with small examples. It does not validate a model for operational deployment, certify a learner or guarantee that a metric transfers to another population. Communicate those limits inside the relevant explanation, where they help interpret the evidence.
