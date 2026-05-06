from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import math

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─────────────────────────────────────────────
# MODEL SELECTION
# Switch between models by changing MODEL_KEY.
#
#   "hartmann"  — 7 emotions (Ekman + neutral)
#                 j-hartmann/emotion-english-distilroberta-base
#                 Faster, simpler, narrower color range
#
#   "goemotions" — 28 emotions (GoEmotions / NRC-VAD)
#                  SamLowe/roberta-base-go_emotions
#                  Slower, richer, full color wheel
# ─────────────────────────────────────────────
MODEL_KEY = "goemotions"

MODELS = {
    "hartmann":   "j-hartmann/emotion-english-distilroberta-base",
    "goemotions": "SamLowe/roberta-base-go_emotions",
}

classifier = pipeline("text-classification", model=MODELS[MODEL_KEY], top_k=None)

# ─────────────────────────────────────────────
# VAD vectors [valence, arousal, dominance]
# Sources: NRC-VAD lexicon (Mohammad 2018),
#          Russell & Mehrabian (1977)
# ─────────────────────────────────────────────
VAD = {
    # Positive high-energy
    "joy":            [ 0.92,  0.72,  0.65],
    "excitement":     [ 0.88,  0.95,  0.60],
    "amusement":      [ 0.80,  0.80,  0.55],
    "admiration":     [ 0.82,  0.55,  0.55],
    "approval":       [ 0.70,  0.45,  0.60],
    "optimism":       [ 0.78,  0.60,  0.62],
    "pride":          [ 0.85,  0.65,  0.80],
    # Positive low-energy
    "love":           [ 0.95,  0.65,  0.70],
    "caring":         [ 0.84,  0.45,  0.60],
    "gratitude":      [ 0.85,  0.45,  0.60],
    "relief":         [ 0.75,  0.25,  0.55],
    "desire":         [ 0.72,  0.70,  0.55],
    # Neutral / ambiguous
    "neutral":        [ 0.00,  0.20,  0.50],
    "realization":    [ 0.10,  0.45,  0.50],
    "curiosity":      [ 0.30,  0.65,  0.50],
    "surprise":       [ 0.20,  0.85,  0.50],
    "confusion":      [-0.20,  0.60,  0.40],
    # Negative high-energy
    "anger":          [-0.75,  0.90,  0.85],
    "annoyance":      [-0.55,  0.70,  0.65],
    "disapproval":    [-0.60,  0.55,  0.55],
    "nervousness":    [-0.60,  0.85,  0.25],
    "fear":           [-0.80,  0.88,  0.20],
    "disgust":        [-0.70,  0.65,  0.55],
    "embarrassment":  [-0.40,  0.75,  0.35],
    # Negative low-energy
    "sadness":        [-0.85,  0.25,  0.35],
    "disappointment": [-0.70,  0.40,  0.45],
    "remorse":        [-0.78,  0.35,  0.30],
    "grief":          [-0.90,  0.30,  0.25],
}

# Hue angles (degrees) per emotion
EMOTION_HUE = {
    # Yellows / oranges — joy, warmth
    "joy":            55,
    "excitement":     35,
    "amusement":      50,
    "optimism":       48,
    "approval":       60,
    # Warm pinks / magentas — love, care
    "love":           340,
    "caring":         345,
    "desire":         330,
    "admiration":     320,
    "pride":          300,
    # Greens — gratitude, relief
    "gratitude":      130,
    "relief":         145,
    # Cyans — surprise, curiosity
    "surprise":       185,
    "curiosity":      190,
    "realization":    195,
    # Blues — sadness, neutral
    "neutral":        210,
    "confusion":      205,
    "sadness":        220,
    "disappointment": 230,
    "remorse":        235,
    "grief":          245,
    # Reds — anger
    "anger":          5,
    "annoyance":      15,
    "disapproval":    20,
    # Purples — fear, nervousness
    "fear":           270,
    "nervousness":    280,
    "embarrassment":  310,
    # Olive / brown — disgust
    "disgust":        85,
}

class TextInput(BaseModel):
    text: str

def compute_vad(emotions: dict) -> dict:
    total = sum(emotions.values())
    if total == 0:
        return {"valence": 0.0, "arousal": 0.5, "dominance": 0.5}
    norm = {k: v / total for k, v in emotions.items()}
    v = a = d = 0.0
    for emotion, prob in norm.items():
        vad = VAD.get(emotion, [0.0, 0.5, 0.5])
        v += prob * vad[0]
        a += prob * vad[1]
        d += prob * vad[2]
    return {
        "valence":   max(-1.0, min(1.0, v)),
        "arousal":   max(0.0,  min(1.0, a)),
        "dominance": max(0.0,  min(1.0, d)),
    }

def compute_color(emotions: dict, vad: dict) -> dict:
    total = sum(emotions.values())
    norm = {k: v / total for k, v in emotions.items()} if total else emotions
    # Circular mean for hue (handles 0°/360° wrap correctly)
    sin_sum = cos_sum = 0.0
    for emotion, prob in norm.items():
        rad = math.radians(EMOTION_HUE.get(emotion, 200))
        sin_sum += prob * math.sin(rad)
        cos_sum += prob * math.cos(rad)
    hue = math.degrees(math.atan2(sin_sum, cos_sum)) % 360
    saturation = vad["arousal"] * 100
    lightness = 5 + (vad["valence"] + 1) / 2 * 90  # maps [-1,1] → [5,95]
    return {"h": round(hue, 1), "s": round(saturation, 1), "l": round(lightness, 1)}

def generate_explanation(emotions: dict, vad: dict) -> str:
    top3 = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:3]
    dominant = top3[0][0]
    valence_word = "positive" if vad["valence"] > 0.2 else ("negative" if vad["valence"] < -0.2 else "neutral")
    arousal_word = "energetic" if vad["arousal"] > 0.6 else ("calm" if vad["arousal"] < 0.4 else "moderate")
    parts = [f"{e} ({p:.0%})" for e, p in top3 if p > 0.05]
    return (
        f"This text is primarily {dominant} with contributions from {', '.join(parts)}. "
        f"It maps to a {valence_word} and {arousal_word} emotional state "
        f"(V={vad['valence']:+.2f}, A={vad['arousal']:.2f}, D={vad['dominance']:.2f})."
    )

@app.post("/analyze")
def analyze(body: TextInput):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    results = classifier(body.text)[0]
    emotions = {r["label"].lower(): round(r["score"], 4) for r in results}
    vad = compute_vad(emotions)
    color = compute_color(emotions, vad)
    dominant = max(emotions, key=emotions.get)
    top3 = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:3]
    return {
        "emotions": emotions,
        "vad": vad,
        "dominant_emotion": dominant,
        "top3": [{"emotion": e, "score": s} for e, s in top3],
        "color": color,
        "explanation": generate_explanation(emotions, vad),
        "model": MODEL_KEY,
    }
