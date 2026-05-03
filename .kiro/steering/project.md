# ColorfulSpeech — Project Steering

## Purpose
ColorfulSpeech converts input text into an emotional color experience using multi-label emotion classification and VAD (Valence-Arousal-Dominance) affect mapping.

## Architecture
- **Backend:** FastAPI + HuggingFace Transformers. Single endpoint `POST /analyze` returns emotions, VAD scores, HSL color, and explanation text.
- **Frontend:** React + Vite. Hero section with text input; results section with animated background, emotion bar chart, VAD scatter plot, and research section.

## Key design decisions
- Preserve full emotion probability distribution (never collapse to single label)
- VAD computed as weighted average across all 15 emotion vectors
- Hue computed via circular mean (atan2) to handle 360° wrap-around correctly
- Saturation = arousal × 100; Lightness mapped from valence to range [20, 80]
- CSS custom properties (--accent-h/s/l) drive all color effects from a single source

## Stack constraints
- No new frontend libraries beyond React, Chart.js, Vite
- Backend must remain stateless (no DB, no sessions)
- Free deployment: HuggingFace Spaces (backend) + Vercel (frontend)
