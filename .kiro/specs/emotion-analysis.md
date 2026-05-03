# Spec: Emotion Analysis & VAD Mapping

## Overview
Convert input text into a VAD affect vector and HSL color via multi-label emotion classification.

## Requirements

### Functional
- Accept arbitrary text input via `POST /analyze`
- Return probability scores for all emotions (not just top-1)
- Compute VAD as probability-weighted average of per-emotion VAD vectors
- Compute HSL color: hue via circular mean of emotion hues, saturation = arousal × 100, lightness = 20 + (valence+1)/2 × 60
- Return top-3 emotions, full emotion dict, VAD dict, HSL color, and explanation string

### Non-functional
- Model loaded once at startup, not per request
- All values clamped to valid ranges (valence ∈ [-1,1], arousal/dominance ∈ [0,1])
- CORS open for frontend access

## Model
`j-hartmann/emotion-english-distilroberta-base` via HuggingFace Transformers pipeline
