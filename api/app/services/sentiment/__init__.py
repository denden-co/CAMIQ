"""Sentiment analysis service.

v0: VADER (English, lexicon-based — zero model download).
v1: XLM-RoBERTa (cardiffnlp/twitter-xlm-roberta-base-sentiment) — multilingual
    transformer covering 8 languages (en, ar, fr, de, hi, it, pt, es) out of
    the box, and reasonable zero-shot behaviour on 100+ others.

The service picks the best available backend at startup. If `transformers` +
`torch` are installed (see requirements-ml.txt), XLM-RoBERTa is used. If they
are not, it falls back to VADER so the slim `requirements.txt` demo still
runs. The `/analyze` API contract is identical either way — only the
`model` field in the response changes.

Future v2: weighted ensemble (XLM-RoBERTa + BERTweet for English) matching
the thesis approach that hit 80.3% accuracy / F1 on the 2024 UK GE corpus.
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from functools import lru_cache
from typing import Any

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.schemas.analyze import (
    AnalyzeResponse,
    BatchAggregate,
    BatchAnalyzeResponse,
    DetectedLanguage,
    KeyPhrase,
    SentimentScores,
)

# ISO-639-1 → human name map for the languages XLM-R handles well + common EU
# neighbours. Anything not in this map falls back to the uppercased code.
_LANGUAGE_NAMES = {
    "en": "English", "fr": "French", "es": "Spanish", "de": "German",
    "it": "Italian", "pt": "Portuguese", "ar": "Arabic", "hi": "Hindi",
    "nl": "Dutch", "pl": "Polish", "ro": "Romanian", "sv": "Swedish",
    "da": "Danish", "fi": "Finnish", "no": "Norwegian", "cs": "Czech",
    "hu": "Hungarian", "tr": "Turkish", "ru": "Russian", "uk": "Ukrainian",
    "zh-cn": "Chinese (Simplified)", "zh-tw": "Chinese (Traditional)",
    "ja": "Japanese", "ko": "Korean", "th": "Thai", "vi": "Vietnamese",
    "id": "Indonesian", "ms": "Malay", "sw": "Swahili", "he": "Hebrew",
    "bn": "Bengali", "ta": "Tamil", "te": "Telugu", "ur": "Urdu",
    "fa": "Persian", "el": "Greek", "bg": "Bulgarian", "hr": "Croatian",
    "sk": "Slovak", "sl": "Slovenian", "lt": "Lithuanian", "lv": "Latvian",
    "et": "Estonian", "ca": "Catalan", "gl": "Galician", "eu": "Basque",
    "cy": "Welsh", "ga": "Irish", "af": "Afrikaans", "sq": "Albanian",
    "mk": "Macedonian", "so": "Somali", "tl": "Tagalog",
}

log = logging.getLogger(__name__)

# Hugging Face model id. Chosen for:
#   * multilingual (8 primary + decent zero-shot elsewhere)
#   * 3-class labels matching our schema (positive / neutral / negative)
#   * ~1.1GB — tolerable one-time download, CPU-inferenceable
#   * trained on Twitter/X data, which matches the thesis corpus
_XLMR_MODEL_ID = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

# Label map from the model card. Order matches softmax output indices.
_XLMR_LABELS = ("negative", "neutral", "positive")

_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by",
    "for", "from", "had", "has", "have", "he", "her", "hers", "him", "his",
    "i", "if", "in", "into", "is", "it", "its", "me", "my", "no", "not", "of",
    "on", "or", "our", "ours", "she", "so", "that", "the", "their", "them",
    "there", "these", "they", "this", "those", "to", "was", "we", "were",
    "what", "when", "where", "which", "who", "whom", "why", "will", "with",
    "would", "you", "your", "yours", "do", "does", "did", "doing", "also",
    "can", "just", "than", "then", "too", "very", "s", "t", "don", "now",
}


# ---------------------------------------------------------------------------
# Backend selection
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _get_vader() -> SentimentIntensityAnalyzer:
    return SentimentIntensityAnalyzer()


@lru_cache(maxsize=1)
def _get_xlmr() -> Any | None:
    """Try to load XLM-RoBERTa. Return None if unavailable.

    We import inside the function so a slim install (no torch/transformers)
    still boots the API cleanly.
    """
    try:
        import torch  # noqa: F401
        from transformers import (  # type: ignore
            AutoModelForSequenceClassification,
            AutoTokenizer,
        )
    except ImportError:
        log.info("transformers/torch not installed — falling back to VADER")
        return None

    try:
        log.info("Loading XLM-RoBERTa sentiment model (%s)…", _XLMR_MODEL_ID)
        tokenizer = AutoTokenizer.from_pretrained(_XLMR_MODEL_ID)
        model = AutoModelForSequenceClassification.from_pretrained(_XLMR_MODEL_ID)
        model.eval()
        return {"tokenizer": tokenizer, "model": model, "torch": __import__("torch")}
    except Exception as exc:  # noqa: BLE001
        log.warning("Failed to load XLM-RoBERTa (%s) — falling back to VADER", exc)
        return None


def active_model_name() -> str:
    """Public helper so /health and logs can report which backend is live."""
    return _XLMR_MODEL_ID if _get_xlmr() is not None else "vader-lexicon-3.3.2"


# ---------------------------------------------------------------------------
# Language detection (optional, shared across backends)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _langdetect_available() -> bool:
    try:
        import langdetect  # noqa: F401
        from langdetect import DetectorFactory  # type: ignore

        # langdetect is non-deterministic by default — seed it so the same
        # text always returns the same code. Important for reproducibility
        # when the same tweet is analysed twice.
        DetectorFactory.seed = 0
        return True
    except ImportError:
        return False


def _detect_language(text: str) -> DetectedLanguage | None:
    """Best-effort language detection. Returns None if langdetect missing.

    langdetect returns an ISO-639-1 code; we map to a friendly name and
    report the probability of the top-ranked candidate as confidence.
    """
    if not _langdetect_available():
        return None
    try:
        from langdetect import detect_langs  # type: ignore

        ranked = detect_langs(text)
        if not ranked:
            return None
        top = ranked[0]
        code = top.lang.lower()
        return DetectedLanguage(
            code=code,
            name=_LANGUAGE_NAMES.get(code, code.upper()),
            confidence=round(float(top.prob), 3),
        )
    except Exception:  # noqa: BLE001 — langdetect raises LangDetectException on empty/short input
        return None


# ---------------------------------------------------------------------------
# Key-phrase extraction (shared by both backends)
# ---------------------------------------------------------------------------


def _extract_key_phrases(text: str, top_n: int = 8) -> list[KeyPhrase]:
    """Unigram frequency key-phrase extraction. Replaced by BERTopic in v2."""
    tokens = [
        t.lower()
        for t in re.findall(r"[A-Za-z][A-Za-z'-]+", text)
        if len(t) > 2 and t.lower() not in _STOPWORDS
    ]
    if not tokens:
        return []

    counts = Counter(tokens).most_common(top_n)
    max_count = counts[0][1]
    return [
        KeyPhrase(phrase=word, weight=round(count / max_count, 3))
        for word, count in counts
    ]


# ---------------------------------------------------------------------------
# Backends
# ---------------------------------------------------------------------------


def _analyze_vader(text: str) -> AnalyzeResponse:
    analyzer = _get_vader()
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    confidence = max(abs(compound), scores[label[:3]])

    return AnalyzeResponse(
        label=label,
        confidence=round(confidence, 3),
        scores=SentimentScores(
            positive=scores["pos"],
            neutral=scores["neu"],
            negative=scores["neg"],
            compound=compound,
        ),
        key_phrases=_extract_key_phrases(text),
        language=_detect_language(text),
        model="vader-lexicon-3.3.2",
        word_count=len(re.findall(r"\S+", text)),
        character_count=len(text),
    )


def _analyze_xlmr(text: str, backend: dict) -> AnalyzeResponse:
    """Run XLM-RoBERTa inference and map to our schema.

    The model returns logits over (negative, neutral, positive). We softmax to
    probabilities, pick the argmax, and synthesise a VADER-style compound
    score as `positive - negative` so downstream charts keep working.
    """
    tokenizer = backend["tokenizer"]
    model = backend["model"]
    torch = backend["torch"]

    # XLM-R max input is 512 tokens; truncate defensively.
    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    with torch.no_grad():
        logits = model(**encoded).logits[0]
    probs = torch.softmax(logits, dim=-1).tolist()

    # probs is ordered per _XLMR_LABELS = (negative, neutral, positive)
    neg, neu, pos = probs
    compound = round(pos - neg, 4)

    idx = int(max(range(3), key=lambda i: probs[i]))
    label = _XLMR_LABELS[idx]
    confidence = round(probs[idx], 3)

    return AnalyzeResponse(
        label=label,
        confidence=confidence,
        scores=SentimentScores(
            positive=round(pos, 3),
            neutral=round(neu, 3),
            negative=round(neg, 3),
            compound=compound,
        ),
        key_phrases=_extract_key_phrases(text),
        language=_detect_language(text),
        model=_XLMR_MODEL_ID,
        word_count=len(re.findall(r"\S+", text)),
        character_count=len(text),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def analyze_text(text: str) -> AnalyzeResponse:
    """Analyse a single text. Uses XLM-RoBERTa if available, else VADER."""
    backend = _get_xlmr()
    if backend is not None:
        try:
            return _analyze_xlmr(text, backend)
        except Exception as exc:  # noqa: BLE001
            # Never let a model blow up the request — fall back gracefully.
            log.exception("XLM-RoBERTa inference failed, falling back: %s", exc)
    return _analyze_vader(text)


# ---------------------------------------------------------------------------
# Batch analysis
# ---------------------------------------------------------------------------


def analyze_batch(texts: list[str]) -> BatchAnalyzeResponse:
    """Analyse many texts and compute distribution + aggregate stats.

    Per-item inference for now — straightforward and reuses the fallback
    path. A later optimisation can pass the whole batch through XLM-R in
    one forward pass for ~5-10x speedup on CPU.
    """
    results = [analyze_text(t) for t in texts if t and t.strip()]
    total = len(results)

    if total == 0:
        # Defensive — route layer should have rejected this, but handle it.
        return BatchAnalyzeResponse(
            results=[],
            aggregate=BatchAggregate(
                total=0,
                label_counts={"positive": 0, "neutral": 0, "negative": 0},
                label_share={"positive": 0.0, "neutral": 0.0, "negative": 0.0},
                mean_compound=0.0,
                language_counts={},
                top_phrases=[],
            ),
            model=active_model_name(),
        )

    label_counts = {"positive": 0, "neutral": 0, "negative": 0}
    language_counts: Counter[str] = Counter()
    phrase_totals: Counter[str] = Counter()
    compound_sum = 0.0

    for r in results:
        label_counts[r.label] += 1
        compound_sum += r.scores.compound
        if r.language is not None:
            language_counts[r.language.code] += 1
        for kp in r.key_phrases:
            # Weight by per-text weight so words dominant in multiple texts
            # still outrank words dominant in one.
            phrase_totals[kp.phrase] += kp.weight

    label_share = {k: round(v / total, 3) for k, v in label_counts.items()}
    mean_compound = round(compound_sum / total, 4)

    top = phrase_totals.most_common(12)
    max_weight = top[0][1] if top else 1.0
    top_phrases = [
        KeyPhrase(phrase=p, weight=round(w / max_weight, 3)) for p, w in top
    ]

    return BatchAnalyzeResponse(
        results=results,
        aggregate=BatchAggregate(
            total=total,
            label_counts=label_counts,
            label_share=label_share,
            mean_compound=mean_compound,
            language_counts=dict(language_counts),
            top_phrases=top_phrases,
        ),
        model=active_model_name(),
    )
