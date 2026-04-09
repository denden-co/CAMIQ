"""Bias & Fairness audit service (Phase 4).

Operates on a saved batch analysis and computes:

1. Per-language slices (n, label distribution, mean confidence, mean compound).
2. Confidence disparity (4/5ths rule) across language groups.
3. Chi-square independence test: does label distribution depend on language?
4. Corpus skew check (is one label dominating the whole corpus?).
5. A small rule-based verdict aggregator.

scipy is already in requirements-ml.txt but the sentiment batch path
itself doesn't need it, so we import lazily inside the function that
uses it and degrade gracefully if scipy is unavailable in a stripped
deployment.
"""

from __future__ import annotations

from collections import Counter, defaultdict

from app.schemas.analyze import AnalyzeResponse
from app.schemas.bias import (
    BiasAuditResponse,
    ChiSquareTest,
    ConfidenceDisparity,
    CorpusSkew,
    FairnessFlag,
    LanguageGroupStats,
    Severity,
    Verdict,
)

LABELS: tuple[str, ...] = ("positive", "neutral", "negative")

# Thresholds — tuned for political-intelligence data where we often have
# fewer rows per language than a typical ML fairness audit would.
FOUR_FIFTHS_THRESHOLD = 0.80
CORPUS_SKEW_THRESHOLD = 0.70
CHI2_MIN_EXPECTED = 5.0  # Cochran's rule of thumb for chi-square validity.
P_SIGNIFICANT = 0.05


def _language_key(result: AnalyzeResponse) -> tuple[str, str]:
    """Return (code, name) for a row's detected language, or 'unknown'."""
    lang = result.language
    if lang is None or not lang.code:
        return ("unknown", "Unknown")
    return (lang.code, lang.name or lang.code)


def _label_share(counts: dict[str, int], n: int) -> dict[str, float]:
    if n == 0:
        return {label: 0.0 for label in LABELS}
    return {label: counts.get(label, 0) / n for label in LABELS}


def _group_language_stats(
    results: list[AnalyzeResponse],
    min_group_size: int,
) -> list[LanguageGroupStats]:
    """Slice results by detected language and compute per-group stats."""
    groups: dict[str, dict] = defaultdict(
        lambda: {
            "name": "",
            "rows": [],
        }
    )
    for r in results:
        code, name = _language_key(r)
        groups[code]["name"] = name
        groups[code]["rows"].append(r)

    total = len(results)
    out: list[LanguageGroupStats] = []
    for code, bucket in groups.items():
        rows: list[AnalyzeResponse] = bucket["rows"]
        n = len(rows)
        counts = Counter(r.label for r in rows)
        label_counts = {label: int(counts.get(label, 0)) for label in LABELS}
        mean_conf = sum(r.confidence for r in rows) / n if n else 0.0
        mean_comp = sum(r.scores.compound for r in rows) / n if n else 0.0
        out.append(
            LanguageGroupStats(
                code=code,
                name=bucket["name"] or code,
                n=n,
                share=n / total if total else 0.0,
                label_counts=label_counts,
                label_share=_label_share(label_counts, n),
                mean_confidence=round(mean_conf, 4),
                mean_compound=round(mean_comp, 4),
                small_sample=n < min_group_size,
            )
        )

    out.sort(key=lambda g: g.n, reverse=True)
    return out


def _confidence_disparity(
    groups: list[LanguageGroupStats],
    min_group_size: int,
) -> ConfidenceDisparity:
    """Apply the 4/5ths rule to mean confidence across trustworthy groups."""
    eligible = [g for g in groups if g.n >= min_group_size]
    if len(eligible) < 2:
        return ConfidenceDisparity(
            min_group=None,
            max_group=None,
            min_mean_confidence=None,
            max_mean_confidence=None,
            disparity_ratio=None,
            passes_four_fifths=None,
        )
    lo = min(eligible, key=lambda g: g.mean_confidence)
    hi = max(eligible, key=lambda g: g.mean_confidence)
    ratio = lo.mean_confidence / hi.mean_confidence if hi.mean_confidence > 0 else 0.0
    return ConfidenceDisparity(
        min_group=lo.code,
        max_group=hi.code,
        min_mean_confidence=round(lo.mean_confidence, 4),
        max_mean_confidence=round(hi.mean_confidence, 4),
        disparity_ratio=round(ratio, 4),
        passes_four_fifths=ratio >= FOUR_FIFTHS_THRESHOLD,
    )


def _chi_square(
    groups: list[LanguageGroupStats],
    min_group_size: int,
) -> ChiSquareTest:
    """Chi-square test of independence between label and language group."""
    eligible = [g for g in groups if g.n >= min_group_size]
    if len(eligible) < 2:
        return ChiSquareTest(
            computable=False,
            reason=(
                f"Need at least 2 language groups with n ≥ {min_group_size} "
                f"(have {len(eligible)})."
            ),
        )

    # Build the contingency table: rows = groups, cols = labels.
    observed = [
        [float(g.label_counts.get(label, 0)) for label in LABELS] for g in eligible
    ]
    row_totals = [sum(row) for row in observed]
    col_totals = [sum(row[j] for row in observed) for j in range(len(LABELS))]
    grand = sum(row_totals)

    if grand == 0:
        return ChiSquareTest(computable=False, reason="No data in eligible groups.")

    expected = [
        [(row_totals[i] * col_totals[j]) / grand for j in range(len(LABELS))]
        for i in range(len(eligible))
    ]
    min_expected = min(e for row in expected for e in row)
    if min_expected < CHI2_MIN_EXPECTED:
        return ChiSquareTest(
            computable=False,
            reason=(
                f"Smallest expected cell count is {min_expected:.2f}, below "
                f"the Cochran threshold of {CHI2_MIN_EXPECTED}."
            ),
        )

    chi2 = 0.0
    for i in range(len(eligible)):
        for j in range(len(LABELS)):
            e = expected[i][j]
            if e > 0:
                chi2 += (observed[i][j] - e) ** 2 / e

    dof = (len(eligible) - 1) * (len(LABELS) - 1)

    # scipy is optional; fall back to "not significant" if unavailable.
    try:
        from scipy.stats import chi2 as chi2_dist  # type: ignore

        p_value = float(chi2_dist.sf(chi2, dof))
    except Exception:  # noqa: BLE001
        return ChiSquareTest(
            computable=True,
            chi2=round(chi2, 4),
            dof=dof,
            p_value=None,
            significant=None,
            reason="scipy unavailable — chi2 statistic reported without p-value.",
        )

    return ChiSquareTest(
        computable=True,
        chi2=round(chi2, 4),
        dof=dof,
        p_value=round(p_value, 6),
        significant=p_value < P_SIGNIFICANT,
    )


def _corpus_skew(results: list[AnalyzeResponse]) -> CorpusSkew:
    counts = Counter(r.label for r in results)
    total = len(results)
    if total == 0:
        return CorpusSkew(dominant_label="neutral", dominant_share=0.0, skew_flag=False)
    label, n = counts.most_common(1)[0]
    share = n / total
    return CorpusSkew(
        dominant_label=label,
        dominant_share=round(share, 4),
        skew_flag=share > CORPUS_SKEW_THRESHOLD,
    )


def _build_flags(
    groups: list[LanguageGroupStats],
    conf: ConfidenceDisparity,
    chi: ChiSquareTest,
    skew: CorpusSkew,
    total: int,
) -> list[FairnessFlag]:
    flags: list[FairnessFlag] = []

    small = [g for g in groups if g.small_sample and g.n > 0]
    if small:
        codes = ", ".join(f"{g.code} (n={g.n})" for g in small[:5])
        flags.append(
            FairnessFlag(
                code="SMALL_GROUPS",
                severity="info",
                message=(
                    f"{len(small)} language group(s) have too few rows for "
                    f"trustworthy per-group metrics: {codes}."
                ),
            )
        )

    if conf.passes_four_fifths is False:
        flags.append(
            FairnessFlag(
                code="CONF_DISPARITY",
                severity="alert",
                message=(
                    f"Confidence parity fails the 4/5ths rule: "
                    f"{conf.min_group}={conf.min_mean_confidence:.2f} vs "
                    f"{conf.max_group}={conf.max_mean_confidence:.2f} "
                    f"(ratio {conf.disparity_ratio:.2f} < 0.80)."
                ),
            )
        )

    if chi.significant is True:
        flags.append(
            FairnessFlag(
                code="LABEL_LANG_DEPENDENT",
                severity="warning",
                message=(
                    f"Chi-square test finds label distribution is not "
                    f"independent of language "
                    f"(χ²={chi.chi2:.2f}, dof={chi.dof}, p={chi.p_value:.4f})."
                ),
            )
        )

    if skew.skew_flag:
        flags.append(
            FairnessFlag(
                code="CORPUS_SKEW",
                severity="warning",
                message=(
                    f"Corpus is heavily skewed: {skew.dominant_share:.0%} of "
                    f"rows are labelled '{skew.dominant_label}'. Downstream "
                    f"analyses will inherit this imbalance."
                ),
            )
        )

    if total < 20:
        flags.append(
            FairnessFlag(
                code="TINY_CORPUS",
                severity="info",
                message=(
                    f"Only {total} row(s) in the saved analysis — all "
                    f"fairness metrics should be treated as indicative."
                ),
            )
        )

    return flags


def _verdict(flags: list[FairnessFlag]) -> Verdict:
    severities: set[Severity] = {f.severity for f in flags}
    if "alert" in severities:
        return "red"
    if "warning" in severities:
        return "yellow"
    return "green"


def run_bias_audit(
    analysis_id: str,
    results: list[AnalyzeResponse],
    min_group_size: int = 5,
) -> BiasAuditResponse:
    """Run the full bias & fairness audit on a saved analysis's batch results."""
    total = len(results)
    groups = _group_language_stats(results, min_group_size=min_group_size)
    conf = _confidence_disparity(groups, min_group_size=min_group_size)
    chi = _chi_square(groups, min_group_size=min_group_size)
    skew = _corpus_skew(results)
    flags = _build_flags(groups, conf, chi, skew, total)

    return BiasAuditResponse(
        analysis_id=analysis_id,
        total_rows=total,
        languages_detected=len(groups),
        min_group_size=min_group_size,
        language_groups=groups,
        confidence_disparity=conf,
        chi_square=chi,
        corpus_skew=skew,
        flags=flags,
        verdict=_verdict(flags),
    )
