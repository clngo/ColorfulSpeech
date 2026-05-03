import { useState, useRef } from "react";
import EmotionBar from "./components/EmotionBar";
import VADGraph from "./components/VADGraph";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef();

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setHistory((h) => [...h, { text: text.slice(0, 40), ...data }]);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const hsl = result ? `${result.color.h}, ${result.color.s}%, ${result.color.l}%` : null;

  const bgStyle = hsl ? {
    backgroundColor: `hsl(${hsl})`,
    "--accent-h": result.color.h,
    "--accent-s": `${result.color.s}%`,
    "--accent-l": `${result.color.l}%`,
  } : {};

  return (
    <div className="app" style={bgStyle}>
      {/* Hero */}
      <section className="hero">
        <h1>ColorfulSpeech</h1>
        <p className="subtitle">Expressing emotion that you can see</p>
        <p className="subtitle2">Paste any text. Watch it become a color shaped by the emotions inside it.</p>

        <div className="steps">
          <div className="step"><span className="step-icon">✍️</span><span>Write anything</span></div>
          <div className="step-arrow">→</div>
          <div className="step"><span className="step-icon">🧠</span><span>Emotions detected</span></div>
          <div className="step-arrow">→</div>
          <div className="step"><span className="step-icon">🎨</span><span>Color generated</span></div>
        </div>

        <div className="input-block">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze…"
            rows={4}
            onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && analyze()}
          />
          <div className="example-prompts">
            {[
              "I just got promoted! I can't believe it — all that hard work finally paid off! 🎉",
              "I'm exhausted and completely overwhelmed. Everything feels like too much right now.",
              "The sunset was beautiful and quiet. I sat there for a long time, just breathing.",
              "I'm furious. They lied to me and I trusted them completely.",
            ].map((p) => (
              <button key={p} className="prompt-chip" onClick={() => setText(p)}>
                {p.slice(0, 38)}…
              </button>
            ))}
          </div>
          <button onClick={analyze} disabled={loading} className={loading ? "loading" : ""}>
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {result && <div className="scroll-hint">↓ Scroll to see results</div>}
      </section>

      {/* Results */}
      {result && (
        <>
        <section className="results" ref={resultsRef}>
          <div className="card explanation">
            <p>{result.explanation}</p>
            <div className="vad-nums">
              <span>V <strong>{result.vad.valence > 0 ? "+" : ""}{result.vad.valence.toFixed(2)}</strong></span>
              <span>A <strong>{result.vad.arousal.toFixed(2)}</strong></span>
              <span>D <strong>{result.vad.dominance.toFixed(2)}</strong></span>
            </div>
          </div>
          <div className="card color-explainer">
            <h3>How emotion becomes color</h3>
            <div className="explainer-grid">

              {/* Hue table */}
              <div className="explainer-col">
                <p className="explainer-heading">Hue — <em>which color?</em></p>
                <p className="explainer-sub">Set by the blend of emotions present.</p>
                <div className="emotion-swatches">
                  {[
                    { label: "Joy",           hsl: "hsl(55,90%,55%)" },
                    { label: "Excitement",    hsl: "hsl(35,95%,55%)" },
                    { label: "Anger",         hsl: "hsl(5,90%,50%)"  },
                    { label: "Fear",          hsl: "hsl(270,70%,45%)"},
                    { label: "Sadness",       hsl: "hsl(220,70%,45%)"},
                    { label: "Disgust",       hsl: "hsl(100,55%,38%)"},
                    { label: "Surprise",      hsl: "hsl(185,80%,45%)"},
                    { label: "Neutral",       hsl: "hsl(200,20%,50%)"},
                  ].map(({ label, hsl }) => (
                    <div className="swatch-row" key={label}>
                      <span className="swatch" style={{ background: hsl }} />
                      <span className="swatch-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saturation scale */}
              <div className="explainer-col">
                <p className="explainer-heading">Saturation — <em>how vivid?</em></p>
                <p className="explainer-sub">Set by arousal (energy level).</p>
                <div className="scale-bar-wrap">
                  <div className="scale-bar saturation-bar" />
                  <div className="scale-labels">
                    <span>Calm · Grey</span>
                    <span>Energized · Vivid</span>
                  </div>
                </div>
                <div className="scale-examples">
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,10%,45%)"}} /> Low arousal</div>
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,90%,45%)"}} /> High arousal</div>
                </div>
              </div>

              {/* Lightness scale */}
              <div className="explainer-col">
                <p className="explainer-heading">Brightness — <em>how light?</em></p>
                <p className="explainer-sub">Set by valence (positive vs. negative).</p>
                <div className="scale-bar-wrap">
                  <div className="scale-bar lightness-bar" />
                  <div className="scale-labels">
                    <span>Negative · Dark</span>
                    <span>Positive · Bright</span>
                  </div>
                </div>
                <div className="scale-examples">
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,60%,20%)"}} /> Negative valence</div>
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,60%,75%)"}} /> Positive valence</div>
                </div>
              </div>

            </div>
          </div>

          <div className="charts">
            <div className="card">
              <h3>Emotion Distribution</h3>
              <EmotionBar emotions={result.emotions} />
            </div>
            <div className="card">
              <h3>VAD Space</h3>
              <VADGraph history={history} current={result.vad} />
            </div>
          </div>
        </section>

        <section className="research">
          <h2>How It Works</h2>

          <div className="research-grid">
            <div className="research-card">
              <div className="research-icon">🧠</div>
              <h4>Emotion distribution</h4>
              <p>Rather than picking one emotion, the model scores all emotions simultaneously. A mixed text like "nervous but excited" registers both — and both influence the output. <sup><a href="http://javiergs.com/presentations/speaker/emotionai/" target="_blank" rel="noreferrer">[3]</a></sup></p>
            </div>

            <div className="research-card">
              <div className="research-icon">📐</div>
              <h4>VAD affect space</h4>
              <p>Each emotion maps to a research-informed point in Valence-Arousal-Dominance space. The final position is a weighted average across all detected emotions — placing mixed feelings proportionally in 3D. <sup><a href="http://javiergs.com/presentations/speaker/emotionai/" target="_blank" rel="noreferrer">[3]</a></sup></p>
            </div>

            <div className="research-card">
              <div className="research-icon">🎨</div>
              <h4>Affect → color</h4>
              <p>Hue follows the emotional blend (yellow = joy, blue = sadness <sup><a href="https://arxiv.org/html/2407.16064v1" target="_blank" rel="noreferrer">[1]</a></sup>). Saturation follows arousal. Brightness follows valence — so anger and love share a red hue but differ in darkness. <sup><a href="https://www.sciencedirect.com/science/article/abs/pii/S0952197623010588" target="_blank" rel="noreferrer">[2]</a></sup></p>
            </div>
          </div>

          <div className="references">
            <p>References</p>
            <ol>
              <li><a href="https://arxiv.org/html/2407.16064v1" target="_blank" rel="noreferrer">Shagyrov & Shamoi — Color and Sentiment: Emotion-Based Color Palettes in Marketing (2024)</a></li>
              <li><a href="https://www.sciencedirect.com/science/article/abs/pii/S0952197623010588" target="_blank" rel="noreferrer">Integrating color cues to improve multimodal sentiment analysis in social media (2023)</a></li>
              <li><a href="http://javiergs.com/presentations/speaker/emotionai/" target="_blank" rel="noreferrer">Gonzalez-Sanchez — Emotion AI: Building Empathetic Machines, Cal Poly (2022)</a></li>
            </ol>
          </div>
        </section>
        </>
      )}
      <footer className="footer">
        <span>ColorfulSpeech · Built for Kiro Hackathon 2026</span>
        <span>Powered by HuggingFace Transformers · VAD model: Russell &amp; Mehrabian (1977)</span>
      </footer>
    </div>
  );
}
