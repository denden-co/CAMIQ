"""Sentiment analysis service.

v0: VADER (English, lexicon-based, zero model download — ideal for first
demo). v1 will layer in XLM-RoBERTa for multilingual support, matching the
ensemble approach from the CampaignIQ thesis.
"""

from __future__ import annotations

import re
from collections import Counter
from functools import lru_cache

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.schemas.analyze import (
    AnalyzeResponse,
    KeyPhrase,
    SentimentScores,
)

# Minimal English stopword list for key-phrase extraction.
# Kept inline to avoid an extra NLTK download on first run.
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


@lru_cache(maxsize=1)
def _get_analyzer() -> SentimentIntensityAnalyzer:
    """Lazy singleton — VADER is cheap but still worth caching."""
    return SentimentIntensityAnalyzer()


def _extract_key_phrases(text: str, top_n: int = 8) -> list[KeyPhrase]:
    """Crude but effective unigram key-phrase extraction.

    Tokenises on word boundaries, drops stopwords and short tokens, counts
    frequency, and normalises the top N to a 0..1 weight. Good enough for a v0
    demo — real BERTopic / KeyBERT ranking lands in Phase 2.
    """
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


def analyze_text(text: str) -> AnalyzeResponse:
    """Run VADER sentiment + key-phrase extraction on a single text."""
    analyzer = _get_analyzer()
    scores = analyzer.polarity_scores(text)

    compound = scores["compound"]
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    # Confidence = magnitude of compound score, floored at the dominant bucket.
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
        model="vader-lexicon-3.3.2",
        word_count=len(re.findall(r"\S+", text)),
        character_count=len(text),
    )
