# Learn ML source and reuse register

Reviewed 26 October 2026. Learner-facing acknowledgements are in [sources.html](sources.html). The repository comparison (an internal document) records the original gaps and the original activities now delivered.

**Current source-use policy:** the user requested reference-only use of the two repositories. All new implementations, explanations, questions and synthetic datasets were authored independently. No code translation, notebook-cell adaptation, source dataset or visual asset from either repository is included.

## Current relationship to the two repositories

| Source | Creator / edition | Reviewed revision | Current use in Code With Impact | Material imported |
| --- | --- | --- | --- | --- |
| [Practical Statistics for Data Scientists companion repository](https://github.com/gedeck/practical-statistics-for-data-scientists) | Peter Bruce, Andrew Bruce and Peter Gedeck; O’Reilly Media, second edition (2020). Representative source files also carry a 2019 copyright notice naming Peter C. Bruce, Andrew Bruce and Peter Gedeck. | [`8a6d3bb6468e979c861d4b37215e1413702dfdfa`](https://github.com/gedeck/practical-statistics-for-data-scientists/commit/8a6d3bb6468e979c861d4b37215e1413702dfdfa) | Curriculum comparison; conceptual references for original EDA, sampling, uncertainty and evaluation activities; optional notebook reading. Sampling-variation themes informed an independently worded revision to the regression quiz. | None |
| [Hands-On Machine Learning with Scikit-Learn and PyTorch companion repository](https://github.com/ageron/handson-mlp) | Aurélien Géron; O’Reilly Media, first PyTorch edition. | [`710bb45c445bb6789e0267faf4e5b27bbe2b4f49`](https://github.com/ageron/handson-mlp/commit/710bb45c445bb6789e0267faf4e5b27bbe2b4f49) | Curriculum comparison; conceptual references for original preprocessing, repeated validation, classification and end-to-end project activities; optional notebook reading. Validation themes informed the original quiz revision. | None |

“None” means this iteration imported no source code, notebook cells, datasets, book passages, diagrams, screenshots, exercise text or cover images from these repositories. Existing CWI lesson text, synthetic data and browser calculations remain independently authored. Standard ML concepts are discussed in many sources; acknowledging a consulted source does not claim it originated the concept or endorsed this course.

## Source-to-course map

| CWI component | Reference consulted | Relationship and change |
| --- | --- | --- |
| Lesson 1 project brief | Géron chapter 2 | Original six-field decision brief and local Markdown export in `lesson-extensions.js`; topic reference only. |
| Lesson 2 data inspection and sampling | Statistics chapters 1–2; Géron chapter 2 | Original table/histogram, missing/outlier toggles and weekday-selection experiment in `lesson-extensions.js` and `learning-engine.js`. |
| Lesson 3 regression quiz | Statistics chapter 2; Géron chapter 2 | Original question/feedback now asks whether the observed 3-meal validation-MAE reduction is stable and useful. No source exercise is adapted. |
| Lesson 3 sampling variation and residuals | Statistics chapters 2 and 4 | Original repeated-sample-means simulation and signed-residual chart/table; no source data or diagrams used. |
| Lesson 4 prevalence experiment | Géron chapter 3; Statistics chapter 5 | Original expected confusion counts and majority-baseline comparison on 1,000 hypothetical days. |
| Lesson 5 training-size / regularisation activity | Géron chapter 4 | Original normalised polynomial/ridge calculation, nested training subsets and fixed validation set. |
| Lesson 6 repeated validation | Géron chapter 2; Statistics chapter 6 | Original shared-fold evaluation with paired differences; both k controls freeze at final-model lock. |
| Original project starter | Géron's chapter 2 and project checklist; Statistics sampling/evaluation themes | Six-field worksheet in `project.html`/`project.js` and original `notebooks/kitchen-project.ipynb`. The broad workflow is referenced; no checklist text or code is adapted. |
| Planned full capstone and monitoring | Géron's project checklist; Statistics chapter 3 | Further service-impact and monitoring scenarios remain proposals; no source exercises are reproduced. |

The internal repository comparison identifies the exact chapter files. The lesson disclosures name the authors beside their companion links, and the Sources page describes the relationship in plain language.

## Original data and implementation provenance

- `ml-engine.js` retains the independently authored small visitor/demand datasets and fitters used by the existing lessons.
- `learning-engine.js` creates its own deterministic 140-day fictional population, with higher weekend demand deliberately built in to expose selection bias. Its 14-row inspection view changes one value to 260 for the unusual-day toggle and hides two meal counts for the missing-data toggle. Seeded sampling uses replacement; the interface explains that days can repeat.
- The sample-means chart repeats sampling 200 times and displays the simulated central 90% range. It is explicitly labelled as neither a confidence interval nor a prediction interval.
- The prevalence activity calculates expected counts from stated assumptions rather than fitting or importing a classifier. Cross-validation and regularisation use only the original development data; tests reject access to the held-out final-test property.
- The optional notebook independently generates 180 synthetic days and uses chronological 108/36/36 blocks. It is a separate dataset from the browser examples. Standard NumPy, pandas and scikit-learn APIs are dependencies; no code from the reviewed companion repositories is used. The notebook is delivered with empty outputs; it was tested end to end on 26 October 2026.
- Each activity has an adjacent conceptual source acknowledgement. `sources.html` provides author/edition information, and this register records exact files, source relationships and limitations.

## Licence findings and editorial handling

- **Statistics repository:** root [LICENSE](https://github.com/gedeck/practical-statistics-for-data-scientists/blob/master/LICENSE) is GNU GPL version 3. Copying/adapting covered code requires following its applicable licence conditions, including relevant notices and source/copyleft obligations. A credit line alone is insufficient. This iteration uses external references and independently authored material.
- **Géron repository:** root [LICENSE](https://github.com/ageron/handson-mlp/blob/main/LICENSE) is Apache License 2.0. Future covered-code adaptations should preserve applicable attribution/copyright notices, include the licence, identify modifications and retain relevant NOTICE content if present in the chosen source. No NOTICE file was found in the reviewed snapshot.
- **Book assets and external data:** no blanket permission was established for the separately published books, covers, third-party images or externally sourced datasets. For example, sampled Géron notebooks fetch data from other repositories and OpenML. Any future asset selection needs its own source, identifier/version, creator, terms and modification record.
- **Edition/maintenance:** the statistics README points to [AI-Assisted Statistics for Data Scientists](https://github.com/gedeck/ai-assisted-statistics-for-data-scientists) and says the reviewed repository is no longer maintained. That newer repository was not substituted for the requested source or fully reviewed here.

This register records the source statements inspected and this project's reuse choices. It does not grant additional rights or certify every asset in either repository.

## Record for future additions

For each future lesson addition, record its references and original implementation. The current policy remains reference-only use of the reviewed repositories; adapting their code is outside this update. If a later instruction changes that policy, an adaptation would need a separate precise source and licence record.

| Field | Required record |
| --- | --- |
| CWI component | Exact lesson/file/figure and its purpose |
| Relationship | Reference, conceptual inspiration, quotation, adapted code or adapted visual |
| Source | Author, title, original file URL and pinned commit/version |
| Material | Exact functions/cells/assets or a concise description |
| Terms | Applicable licence/permission and any separate dataset/media terms |
| Notices | Copyright/attribution, licence copy and applicable NOTICE information |
| Changes | What was modified and where it is disclosed |
| Visible credit | Attribution alongside the component plus Sources-page entry |
| Verification | Reviewer/date and checks that the actual reuse matches this record |

Use “adapted from” only for an actual adaptation. Use “further reading” or “curriculum review informed by” for the current relationship. The two labels should never be interchanged merely to make attribution sound stronger.
