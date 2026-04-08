"""Pydantic schemas for the Single Text Analysis endpoint."""

from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="Raw text to analyse (speech, post, manifesto excerpt, etc.)",
    )
    language: str | None = Field(
        None,
        description="Optional ISO-639-1 code. Defaults to English for VADER.",
    )


class SentimentScores(BaseModel):
    positive: float = Field(..., ge=0, le=1)
    neutral: float = Field(..., ge=0, le=1)
    negative: float = Field(..., ge=0, le=1)
    compound: float = Field(..., ge=-1, le=1)


class KeyPhrase(BaseModel):
    phrase: str
    weight: float = Field(..., ge=0, le=1)


class AnalyzeResponse(BaseModel):
    label: Literal["positive", "neutral", "negative"]
    confidence: float = Field(..., ge=0, le=1)
    scores: SentimentScores
    key_phrases: list[KeyPhrase]
    model: str
    word_count: int
    character_count: int
