"""Multi-provider LLM abstraction layer (Phase 4).

Supports: Google Gemini, OpenAI, Anthropic Claude, Deepseek, Mistral,
Cohere, HuggingFace (incl. Meta Llama models), and any OpenAI-compatible
endpoint.

Provider selection is driven by environment variables. At runtime the
first provider whose API key is set will be used, unless the caller
explicitly picks one.

Environment variables (set in api/.env or the shell):
    GOOGLE_API_KEY       — Google Gemini
    OPENAI_API_KEY       — OpenAI (GPT-4o, etc.)
    ANTHROPIC_API_KEY    — Anthropic Claude
    DEEPSEEK_API_KEY     — Deepseek
    MISTRAL_API_KEY      — Mistral
    COHERE_API_KEY       — Cohere
    HF_TOKEN             — HuggingFace Inference router (Llama, Qwen, etc.)
    DASHSCOPE_API_KEY    — Qwen via Alibaba DashScope (international region)
    CUSTOM_LLM_BASE_URL  — any OpenAI-compatible endpoint
    CUSTOM_LLM_API_KEY   — key for the custom endpoint
    CUSTOM_LLM_MODEL     — model name for the custom endpoint
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

import httpx

# ---------------------------------------------------------------------------
# Provider registry
# ---------------------------------------------------------------------------

@dataclass
class ProviderConfig:
    """Immutable config for an LLM provider."""

    name: str
    env_key: str
    base_url: str
    default_model: str
    auth_header: str = "Authorization"
    auth_prefix: str = "Bearer "
    # Some providers use a different request/response shape
    api_style: str = "openai"  # "openai" | "google" | "anthropic" | "cohere"


PROVIDERS: list[ProviderConfig] = [
    ProviderConfig(
        name="google",
        env_key="GOOGLE_API_KEY",
        base_url="https://generativelanguage.googleapis.com/v1beta",
        default_model="gemini-2.0-flash",
        api_style="google",
    ),
    ProviderConfig(
        name="openai",
        env_key="OPENAI_API_KEY",
        base_url="https://api.openai.com/v1",
        default_model="gpt-4o-mini",
        api_style="openai",
    ),
    ProviderConfig(
        name="anthropic",
        env_key="ANTHROPIC_API_KEY",
        base_url="https://api.anthropic.com/v1",
        default_model="claude-sonnet-4-20250514",
        auth_header="x-api-key",
        auth_prefix="",
        api_style="anthropic",
    ),
    ProviderConfig(
        name="deepseek",
        env_key="DEEPSEEK_API_KEY",
        base_url="https://api.deepseek.com/v1",
        default_model="deepseek-chat",
        api_style="openai",
    ),
    ProviderConfig(
        name="mistral",
        env_key="MISTRAL_API_KEY",
        base_url="https://api.mistral.ai/v1",
        default_model="mistral-small-latest",
        api_style="openai",
    ),
    ProviderConfig(
        name="cohere",
        env_key="COHERE_API_KEY",
        base_url="https://api.cohere.com/v2",
        default_model="command-r",
        api_style="openai",  # Cohere v2 chat is OpenAI-compatible
    ),
    ProviderConfig(
        name="huggingface",
        env_key="HF_TOKEN",
        base_url="https://router.huggingface.co/v1",
        default_model="meta-llama/Llama-3.3-70B-Instruct",
        api_style="openai",  # HF Inference router is OpenAI-compatible
    ),
    ProviderConfig(
        name="qwen",
        env_key="DASHSCOPE_API_KEY",
        # International (Singapore) endpoint — keys are region-specific;
        # mainland-China keys need https://dashscope.aliyuncs.com instead.
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        default_model="qwen-plus",
        api_style="openai",  # DashScope compatible-mode is OpenAI-compatible
    ),
]

PROVIDER_LABELS: dict[str, str] = {
    "google": "Google Gemini",
    "openai": "OpenAI",
    "anthropic": "Anthropic Claude",
    "deepseek": "Deepseek",
    "mistral": "Mistral",
    "cohere": "Cohere",
    "huggingface": "HuggingFace (Meta Llama & more)",
    "qwen": "Qwen (Alibaba DashScope)",
    "custom": "Custom (OpenAI-compatible)",
}


def _custom_provider() -> ProviderConfig | None:
    base = os.getenv("CUSTOM_LLM_BASE_URL")
    key = os.getenv("CUSTOM_LLM_API_KEY")
    model = os.getenv("CUSTOM_LLM_MODEL", "default")
    if base and key:
        return ProviderConfig(
            name="custom",
            env_key="CUSTOM_LLM_API_KEY",
            base_url=base.rstrip("/"),
            default_model=model,
            api_style="openai",
        )
    return None


# ---------------------------------------------------------------------------
# LLM response
# ---------------------------------------------------------------------------

@dataclass
class LLMResponse:
    """Normalised response from any provider."""

    text: str
    provider: str
    model: str
    usage: dict[str, int]  # prompt_tokens, completion_tokens, total_tokens


# ---------------------------------------------------------------------------
# Provider resolution
# ---------------------------------------------------------------------------

def available_providers() -> list[str]:
    """Return names of providers whose API key is set."""
    names: list[str] = []
    for p in PROVIDERS:
        if os.getenv(p.env_key):
            names.append(p.name)
    if _custom_provider():
        names.append("custom")
    return names


def provider_catalogue() -> list[dict[str, Any]]:
    """Return every supported provider with its configuration status.

    Used by the frontend to render a full provider picker — configured
    providers are selectable, the rest show which env key would enable them.
    """
    catalogue: list[dict[str, Any]] = [
        {
            "name": p.name,
            "label": PROVIDER_LABELS.get(p.name, p.name),
            "default_model": p.default_model,
            "env_key": p.env_key,
            "configured": bool(os.getenv(p.env_key)),
        }
        for p in PROVIDERS
    ]
    custom = _custom_provider()
    catalogue.append(
        {
            "name": "custom",
            "label": PROVIDER_LABELS["custom"],
            "default_model": custom.default_model if custom else None,
            "env_key": "CUSTOM_LLM_BASE_URL + CUSTOM_LLM_API_KEY",
            "configured": custom is not None,
        }
    )
    return catalogue


def _resolve_provider(name: str | None = None) -> tuple[ProviderConfig, str]:
    """Return (config, api_key) for the requested or first-available provider."""
    if name:
        if name == "custom":
            cp = _custom_provider()
            if cp:
                return cp, os.getenv("CUSTOM_LLM_API_KEY", "")
            raise ValueError("Custom LLM provider not configured (set CUSTOM_LLM_BASE_URL + CUSTOM_LLM_API_KEY).")
        for p in PROVIDERS:
            if p.name == name:
                key = os.getenv(p.env_key, "")
                if not key:
                    raise ValueError(f"Provider '{name}' selected but {p.env_key} is not set.")
                return p, key
        raise ValueError(f"Unknown provider '{name}'. Available: {[p.name for p in PROVIDERS]}")

    # Auto-select: first provider with an API key
    for p in PROVIDERS:
        key = os.getenv(p.env_key, "")
        if key:
            return p, key
    cp = _custom_provider()
    if cp:
        return cp, os.getenv("CUSTOM_LLM_API_KEY", "")
    raise ValueError(
        "No LLM provider configured. Set at least one API key "
        "(GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)."
    )


# ---------------------------------------------------------------------------
# Chat completion — unified interface
# ---------------------------------------------------------------------------

async def chat(
    *,
    system: str,
    user: str,
    provider: str | None = None,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> LLMResponse:
    """Send a system+user message pair and return the assistant reply.

    Automatically picks the first available provider if *provider* is None.
    """
    cfg, api_key = _resolve_provider(provider)
    model_name = model or cfg.default_model

    if cfg.api_style == "google":
        return await _chat_google(cfg, api_key, model_name, system, user, temperature, max_tokens)
    elif cfg.api_style == "anthropic":
        return await _chat_anthropic(cfg, api_key, model_name, system, user, temperature, max_tokens)
    else:
        return await _chat_openai(cfg, api_key, model_name, system, user, temperature, max_tokens)


# ---------------------------------------------------------------------------
# HTTP helper — timeout + one retry on transient failures
# ---------------------------------------------------------------------------

# 120 s per call meant a provider outage hung requests for two minutes.
# 45 s is generous for a 2k-token completion; transient errors get one
# retry with a short backoff, anything else surfaces immediately.
LLM_TIMEOUT_SECONDS = 45
_RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}


class LLMProviderError(RuntimeError):
    """Raised when a provider is unreachable or returns a non-2xx response."""


async def _post_json(url: str, headers: dict[str, str], payload: dict) -> dict:
    """POST JSON with a bounded timeout and a single retry."""
    import asyncio

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=LLM_TIMEOUT_SECONDS) as client:
                resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in _RETRYABLE_STATUS and attempt == 0:
                last_error = LLMProviderError(f"HTTP {resp.status_code} from provider")
                await asyncio.sleep(1.5)
                continue
            resp.raise_for_status()
            return resp.json()
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            last_error = exc
            if attempt == 0:
                await asyncio.sleep(1.5)
                continue
        except httpx.HTTPStatusError as exc:
            raise LLMProviderError(
                f"Provider returned HTTP {exc.response.status_code}: "
                f"{exc.response.text[:200]}"
            ) from exc
    raise LLMProviderError(
        f"LLM provider unavailable after retry: {last_error}"
    ) from last_error


# ---------------------------------------------------------------------------
# OpenAI-compatible (OpenAI, Deepseek, Mistral, Cohere v2, custom)
# ---------------------------------------------------------------------------

async def _chat_openai(
    cfg: ProviderConfig,
    api_key: str,
    model: str,
    system: str,
    user: str,
    temperature: float,
    max_tokens: int,
) -> LLMResponse:
    url = f"{cfg.base_url}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        cfg.auth_header: f"{cfg.auth_prefix}{api_key}",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    data = await _post_json(url, headers, payload)

    usage = data.get("usage", {})
    return LLMResponse(
        text=data["choices"][0]["message"]["content"],
        provider=cfg.name,
        model=model,
        usage={
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        },
    )


# ---------------------------------------------------------------------------
# Google Gemini
# ---------------------------------------------------------------------------

async def _chat_google(
    cfg: ProviderConfig,
    api_key: str,
    model: str,
    system: str,
    user: str,
    temperature: float,
    max_tokens: int,
) -> LLMResponse:
    url = f"{cfg.base_url}/models/{model}:generateContent?key={api_key}"
    payload: dict[str, Any] = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }

    data = await _post_json(url, {"Content-Type": "application/json"}, payload)

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    usage_meta = data.get("usageMetadata", {})
    return LLMResponse(
        text=text,
        provider="google",
        model=model,
        usage={
            "prompt_tokens": usage_meta.get("promptTokenCount", 0),
            "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
            "total_tokens": usage_meta.get("totalTokenCount", 0),
        },
    )


# ---------------------------------------------------------------------------
# Anthropic Claude
# ---------------------------------------------------------------------------

async def _chat_anthropic(
    cfg: ProviderConfig,
    api_key: str,
    model: str,
    system: str,
    user: str,
    temperature: float,
    max_tokens: int,
) -> LLMResponse:
    url = f"{cfg.base_url}/messages"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    payload = {
        "model": model,
        "system": system,
        "messages": [{"role": "user", "content": user}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    data = await _post_json(url, headers, payload)

    text = data["content"][0]["text"]
    usage = data.get("usage", {})
    return LLMResponse(
        text=text,
        provider="anthropic",
        model=model,
        usage={
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        },
    )
