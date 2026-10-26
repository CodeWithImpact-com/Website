# Your first community-kitchen ML project

This optional notebook joins the six Learn ML lessons into one workflow. All explanations, code and synthetic data were independently authored for Code With Impact. No repository code, notebook cells, images or datasets were copied.

## Run locally

Use Python 3.10 or later in a virtual environment. From this directory:

```powershell
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m jupyterlab kitchen-project.ipynb
```

If your Python command is `python` instead of `py`, use that command to create the environment. On macOS/Linux, use `python3 -m venv .venv` and `.venv/bin/python` for the remaining commands. Jupyter runs locally; no account, API key or dataset download is required. Package installation requires internet access.

Open the notebook and run the cells in order. Stop at the **final-test gate** and write your decision before continuing. Do not use final-test results to redesign the model. For an automated run, only after choosing the fixed design:

```powershell
.\.venv\Scripts\python -m jupyter nbconvert --to notebook --execute kitchen-project.ipynb --output kitchen-project.executed.ipynb
```

The distributed notebook intentionally has empty outputs, so you see the results yourself. Tested on 26 October 2026 with Python 3.13, NumPy 2.5, pandas 3.0 and scikit-learn 1.9: it runs from start to finish.

**Expected results** (your numbers should match closely): validation error is 12.2 meals for the median baseline, 6.5 for Ridge and 7.7 for the small forest, so Ridge is selected. The final test gives 9.0 meals, with 72% of days underestimated. This is the intended teaching point: performance can drift on later days, so the model note includes a monitoring plan.

## What you will do

1. Define tomorrow's planning decision and a useful improvement before seeing scores.
2. Generate 180 deterministic fictional days, with a prior-day visitor estimate, a rain forecast, a known weekday/weekend category and missing visitor estimates.
3. Split chronologically into 108 training, 36 validation and 36 final-test days. Inspect training rows only while making modelling choices.
4. Fit median imputation, scaling and categorical encoding inside each training-only scikit-learn pipeline.
5. Compare a training-median baseline, Ridge and a small random forest on the same validation days. Prefer a candidate only if it improves validation MAE by at least two meals; discuss underestimation costs separately.
6. Freeze that choice, evaluate once on the last 36 days, save the fitted pipeline and write a short model note with a monitoring action.

The two-meal threshold is an arbitrary exercise requirement. The generator and model settings are fixed for learning, and a complex model is not guaranteed to win. The notebook's dataset is independent of the smaller browser experiments, so their scores are not comparable. One time split is a limited estimate: in a larger project use repeated **forward** validation windows inside the development period before unlocking the final period.

## Expected outputs

When you execute it, the notebook displays a training summary, chronological split sizes, validation MAE for all candidates, and the final result for the selected model. It creates a local `kitchen-project-output/` directory containing:

- `synthetic-kitchen-days.csv`: the original generated data, exported after evaluation.
- `kitchen-pipeline.joblib`: the selected fitted preprocessing-and-model pipeline.
- `model-note.md`: its selection reason, final score, limits and monitoring plan.
- `environment.json`: Python and package versions used for that run.

Only load model files you produced or otherwise trust. Keep the environment record with the model; persisted scikit-learn models are sensitive to package-version changes. The notebook saves a learning artifact, not a deployed service.

## Credits and documentation

The broad end-to-end project approach is informed by **Aurélien Géron**, [Hands-On Machine Learning repository, chapter 2](https://github.com/ageron/handson-mlp/blob/main/02_end_to_end_machine_learning_project.ipynb). Attention to sampling, error and evaluation is informed by **Peter Bruce, Andrew Bruce and Peter Gedeck**, [Practical Statistics for Data Scientists](https://github.com/gedeck/practical-statistics-for-data-scientists). These are conceptual references, not sources of this notebook's code or data. See [Sources & credits](../sources.html) and the course [credits register](../CREDITS.md).

Implementation reference: official [scikit-learn pipelines and column transformers](https://scikit-learn.org/stable/modules/compose.html), [data leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage), and [model persistence](https://scikit-learn.org/stable/model_persistence.html). The notebook uses public APIs rather than copying documentation examples.
