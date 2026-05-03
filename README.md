# ColorfulSpeech

**Expressing emotion that you can see.**

Paste any text. Watch it become a color shaped by the emotions inside it.

ColorfulSpeech performs multi-label emotion classification, maps the result to a continuous Valence-Arousal-Dominance (VAD) affect space, and renders the output as an animated HSL color experience.

## Stack

- **Frontend:** React + Vite + Chart.js
- **Backend:** FastAPI + HuggingFace Transformers (`j-hartmann/emotion-english-distilroberta-base`)

## Running locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` in a `.env` file in the `frontend/` directory to point to your backend:
```
VITE_API_URL=http://localhost:8000
```

## Deployment

- **Backend:** HuggingFace Spaces (Docker SDK) — see `backend/Dockerfile`
- **Frontend:** Vercel — see `frontend/vercel.json`

## License

MIT — see [LICENSE](./LICENSE)
