# Hook: Pre-deploy checklist

Before deploying, verify:

1. `VITE_API_URL` is set in Vercel environment variables (pointing to HF Space URL)
2. Backend Dockerfile builds successfully locally: `docker build ./backend`
3. Frontend builds without errors: `cd frontend && npm run build`
4. `.kiro/` directory is NOT in any `.gitignore`
5. `LICENSE` file exists at repo root
