"""Topic modelling service (Phase 3).

Primary backend: **BERTopic** (sentence-transformers embeddings + UMAP +
HDBSCAN + class-based TF-IDF). Robust on medium-to-large corpora and
multilingual when paired with a multilingual sentence-transformer.

Fallback backend: **TF-IDF + KMeans**. BERTopic does not behave well on
very small corpora (UMAP needs at least ~15 docs to be meaningful, HDBSCAN
will mark almost everything as an outlier under that threshold). For small
saved analyses, or if the BERTopic stack fails to import at runtime, we
drop down to a deterministic sklearn pipeline so the endpoint always
returns *something* useful.

The contract returned to the router is identical regardless of backend,
so the frontend never has to branch.
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from functools import lru_cache
from typing import Iterable

from app.schemas.analyze import AnalyzeResponse
from app.schemas.topics import Topic, TopicModelResponse, TopicSample

logger = logging.getLogger(__name__)


# A small multilingual stopword set — we strip these before TF-IDF so the
# topic keywords don't end up dominated by function words. The BERTopic path
# also passes this list through CountVectorizer.
_STOPWORDS: set[str] = {
    # English
    "the", "a", "an", "and", "or", "but", "if", "while", "of", "in", "on",
    "for", "to", "with", "at", "by", "from", "as", "is", "are", "was", "were",
    "be", "been", "being", "this", "that", "these", "those", "it", "its",
    "they", "them", "their", "we", "us", "our", "you", "your", "i", "me",
    "my", "he", "she", "his", "her", "have", "has", "had", "do", "does",
    "did", "will", "would", "should", "could", "can", "may", "might", "not",
    "no", "yes", "so", "than", "then", "too", "very", "just", "about", "out",
    "up", "down", "over", "under", "again", "more", "most", "some", "any",
    "all", "each", "few", "other", "such", "what", "which", "who", "whom",
    "how", "when", "where", "why", "rt",
    # French
    "le", "la", "les", "un", "une", "des", "et", "ou", "mais", "donc", "que",
    "qui", "quoi", "dans", "sur", "avec", "pour", "par", "de", "du", "ce",
    "cette", "ces", "il", "elle", "nous", "vous", "ils", "elles", "est",
    "sont", "était", "été", "être", "ne", "pas", "plus",
    # Spanish
    "el", "la", "los", "las", "un", "una", "unos", "y", "o", "pero", "que",
    "qué", "en", "de", "del", "con", "por", "para", "es", "son", "este",
    "esta", "estos", "estas", "yo", "tú", "él", "ella", "no", "sí",
    # German
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "und", "oder",
    "aber", "ist", "sind", "war", "waren", "im", "in", "auf", "mit", "für",
    "von", "zu", "nicht", "ja", "nein",
    # Common chat noise
    "amp", "https", "http", "www", "com", "co", "rt", "via",
}


_TOKEN_RE = re.compile(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-']+")


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text or "")]


# ---------------------------------------------------------------------------
# BERTopic backend (primary)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _get_bertopic_model():  # pragma: no cover - heavy import
    """Build (and cache) a BERTopic instance.

    We use the multilingual MiniLM sentence-transformer so non-English
    corpora cluster sensibly, mirroring the multilingual XLM-R sentiment
    backend used elsewhere in the API.
    """
    from bertopic import BERTopic
    from sentence_transformers import SentenceTransformer
    from sklearn.feature_extraction.text import CountVectorizer

    embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    vectorizer = CountVectorizer(
        stop_words=list(_STOPWORDS),
        ngram_range=(1, 2),
        min_df=1,
    )
    return BERTopic(
        embedding_model=embedder,
        vectorizer_model=vectorizer,
        calculate_probabilities=False,
        verbose=False,
    )


def _bertopic_topics(
    texts: list[str],
    n_topics: int | None,
    min_topic_size: int,
) -> tuple[list[int], list[list[tuple[str, float]]], list[int]]:
    """Run BERTopic and return (assignments, topic_terms, topic_ids).

    `topic_terms[i]` is the list of (term, weight) for `topic_ids[i]`.
    The outlier topic (-1) is excluded from `topic_ids`.
    """
    from bertopic import BERTopic  # noqa: F401  (ensure import works)

    # We instantiate fresh per request rather than reusing the cached model
    # — BERTopic stores fitted state on the instance, and reusing across
    # requests would mix corpora. The expensive bit (the embedder) is what
    # we cache.
    cached = _get_bertopic_model()
    embedder = cached.embedding_model
    vectorizer = cached.vectorizer_model

    from bertopic import BERTopic as _BT

    model = _BT(
        embedding_model=embedder,
        vectorizer_model=vectorizer,
        min_topic_size=min_topic_size,
        calculate_probabilities=False,
        verbose=False,
    )
    assignments, _ = model.fit_transform(texts)

    info = model.get_topic_info()
    topic_ids = [int(t) for t in info["Topic"].tolist() if int(t) != -1]

    if n_topics is not None and len(topic_ids) > n_topics:
        model.reduce_topics(texts, nr_topics=n_topics)
        assignments = list(model.topics_)
        info = model.get_topic_info()
        topic_ids = [int(t) for t in info["Topic"].tolist() if int(t) != -1]

    topic_terms: list[list[tuple[str, float]]] = []
    for tid in topic_ids:
        terms = model.get_topic(tid) or []
        topic_terms.append([(str(w), float(s)) for w, s in terms])

    return [int(a) for a in assignments], topic_terms, topic_ids


# ---------------------------------------------------------------------------
# TF-IDF + KMeans backend (fallback)
# ---------------------------------------------------------------------------


def _tfidf_kmeans_topics(
    texts: list[str],
    n_topics: int | None,
) -> tuple[list[int], list[list[tuple[str, float]]], list[int]]:
    """Deterministic, no-download topic model.

    Strategy: TF-IDF (1-2 grams, multilingual stopwords) → KMeans →
    per-cluster top terms by mean TF-IDF weight. K is auto-chosen as
    `min(n_topics or sqrt(n_docs), n_docs)`.
    """
    import math

    from sklearn.cluster import KMeans
    from sklearn.feature_extraction.text import TfidfVectorizer

    n = len(texts)
    if n == 0:
        return [], [], []
    if n == 1:
        # Degenerate — one doc, one topic.
        tokens = _tokenize(texts[0])
        keywords = [(w, 1.0) for w, _ in Counter(tokens).most_common(8)
                    if w not in _STOPWORDS]
        return [0], [keywords], [0]

    if n_topics is None:
        k = max(2, min(round(math.sqrt(n)), 8))
    else:
        k = min(n_topics, n)
    k = max(2, min(k, n))

    vectorizer = TfidfVectorizer(
        stop_words=list(_STOPWORDS),
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95 if n >= 5 else 1.0,
        token_pattern=r"(?u)\b[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-']+\b",
    )
    matrix = vectorizer.fit_transform(texts)
    if matrix.shape[1] == 0:
        # No usable vocabulary — return one bucket so the endpoint still
        # answers gracefully.
        return [0] * n, [[]], [0]

    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    assignments = km.fit_predict(matrix).tolist()

    feature_names = vectorizer.get_feature_names_out()
    centers = km.cluster_centers_

    topic_terms: list[list[tuple[str, float]]] = []
    topic_ids: list[int] = []
    for cluster_idx in range(k):
        topic_ids.append(cluster_idx)
        ranked = centers[cluster_idx].argsort()[::-1][:10]
        topic_terms.append(
            [(str(feature_names[j]), float(centers[cluster_idx][j])) for j in ranked]
        )

    return [int(a) for a in assignments], topic_terms, topic_ids


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def _label_for_compound(compound: float) -> str:
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"


def _topic_label_from_keywords(keywords: list[str], max_terms: int = 3) -> str:
    if not keywords:
        return "Untitled topic"
    return ", ".join(keywords[:max_terms])


def extract_topics(
    analysis_id: str,
    texts: list[str],
    results: list[AnalyzeResponse],
    n_topics: int | None,
    min_topic_size: int,
) -> TopicModelResponse:
    """Run topic modelling on a saved analysis.

    `texts` and `results` must be the same length and aligned by index.
    BERTopic is attempted first; on any failure (small corpus, missing dep,
    runtime error) we fall through to the deterministic sklearn path.
    """
    if len(texts) != len(results):
        raise ValueError("texts and results must be aligned (same length)")

    n = len(texts)
    if n == 0:
        return TopicModelResponse(
            analysis_id=analysis_id,
            total_documents=0,
            assigned_documents=0,
            outlier_documents=0,
            topic_count=0,
            backend="tfidf-kmeans",
            topics=[],
        )

    backend = "bertopic"
    assignments: list[int]
    topic_terms: list[list[tuple[str, float]]]
    topic_ids: list[int]

    # BERTopic + UMAP needs a reasonable number of docs to behave sanely.
    # Below ~15 docs we go straight to the fallback.
    use_bertopic = n >= 15
    if use_bertopic:
        try:
            assignments, topic_terms, topic_ids = _bertopic_topics(
                texts, n_topics=n_topics, min_topic_size=min_topic_size
            )
            if not topic_ids:
                # Everything got marked outlier — fall through.
                raise RuntimeError("BERTopic produced no topics (all outliers)")
        except Exception as exc:  # noqa: BLE001
            logger.warning("BERTopic failed, falling back to TF-IDF/KMeans: %s", exc)
            backend = "tfidf-kmeans"
            assignments, topic_terms, topic_ids = _tfidf_kmeans_topics(
                texts, n_topics=n_topics
            )
    else:
        backend = "tfidf-kmeans"
        assignments, topic_terms, topic_ids = _tfidf_kmeans_topics(
            texts, n_topics=n_topics
        )

    id_to_index = {tid: i for i, tid in enumerate(topic_ids)}

    # Bucket documents per topic
    buckets: dict[int, list[int]] = {tid: [] for tid in topic_ids}
    outliers = 0
    for doc_idx, tid in enumerate(assignments):
        if tid in buckets:
            buckets[tid].append(doc_idx)
        else:
            outliers += 1

    assigned = n - outliers
    topics: list[Topic] = []

    for tid in topic_ids:
        doc_indices = buckets[tid]
        if not doc_indices:
            continue

        keywords = [w for w, _ in topic_terms[id_to_index[tid]]]
        keywords = [k for k in keywords if k]  # drop empty
        label = _topic_label_from_keywords(keywords)

        compounds = [results[i].scores.compound for i in doc_indices]
        labels = [results[i].label for i in doc_indices]
        label_counts = dict(Counter(labels))
        total = len(doc_indices)
        label_share = {k: round(v / total, 4) for k, v in label_counts.items()}
        mean_compound = sum(compounds) / total
        dominant = max(label_counts, key=label_counts.get)  # type: ignore[arg-type]

        # Pick up to 3 representative samples — the ones whose compound score
        # is closest to the topic's mean compound, so the samples actually
        # represent the cluster's lean.
        ranked = sorted(
            doc_indices,
            key=lambda i: abs(results[i].scores.compound - mean_compound),
        )[:3]
        samples = [
            TopicSample(
                text=texts[i][:280],
                label=results[i].label,
                compound=round(results[i].scores.compound, 4),
            )
            for i in ranked
        ]

        topics.append(
            Topic(
                id=int(tid),
                label=label,
                keywords=keywords[:8],
                doc_count=total,
                share=round(total / n, 4),
                mean_compound=round(mean_compound, 4),
                label_counts=label_counts,
                label_share=label_share,
                dominant_label=dominant,  # type: ignore[arg-type]
                samples=samples,
            )
        )

    # Largest topics first
    topics.sort(key=lambda t: t.doc_count, reverse=True)

    return TopicModelResponse(
        analysis_id=analysis_id,
        total_documents=n,
        assigned_documents=assigned,
        outlier_documents=outliers,
        topic_count=len(topics),
        backend=backend,
        topics=topics,
    )
