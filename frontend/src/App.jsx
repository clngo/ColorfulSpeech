import { useState, useRef } from "react";
import EmotionBar from "./components/EmotionBar";
import VADGraph from "./components/VADGraph";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "https://clngo-colorfulspeech.hf.space";

const EMOTION_HUE = {
  joy:55, excitement:35, amusement:50, optimism:48, approval:60,
  love:340, caring:345, desire:330, admiration:320, pride:300,
  gratitude:130, relief:145,
  surprise:185, curiosity:190, realization:195,
  neutral:210, confusion:205, sadness:220, disappointment:230, remorse:235, grief:245,
  anger:5, annoyance:15, disapproval:20,
  fear:270, nervousness:280, embarrassment:310,
  disgust:85,
};

const EMOTION_COLOR_NAME = {
  joy:"Golden Yellow", excitement:"Deep Orange", amusement:"Amber", optimism:"Yellow", approval:"Lime",
  love:"Rose Pink", caring:"Pink", desire:"Magenta", admiration:"Violet", pride:"Purple",
  gratitude:"Green", relief:"Mint",
  surprise:"Cyan", curiosity:"Teal", realization:"Sky Blue",
  neutral:"Steel Blue", confusion:"Slate", sadness:"Blue", disappointment:"Indigo", remorse:"Dark Indigo", grief:"Navy",
  anger:"Red", annoyance:"Coral", disapproval:"Crimson",
  fear:"Deep Purple", nervousness:"Purple", embarrassment:"Mauve",
  disgust:"Olive",
};

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

      {/* ── Hero ── */}
      <section className="hero">
        <h1>ColorfulSpeech</h1>

        <div className="hero-card">
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
              placeholder="Enter text to analyze… (best results under ~400 words)"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); }
              }}
            />
            <div className="example-prompts">
              {[
                "I just got promoted! I can't believe it — all that hard work finally paid off! 🎉",
                "I'm exhausted and completely overwhelmed. Everything feels like too much right now.",
                "The sunset was beautiful and quiet. I sat there for a long time, just breathing.",
                "I'm furious. They lied to me and I trusted them completely.",
                "Today started rough — I spilled coffee, missed my bus, and got to work late. But then my manager pulled me aside and told me I'd been selected for the new project I'd been hoping for. By lunch I was laughing about the morning. Funny how fast things can turn around.",
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
        </div>

        {result && <div className="scroll-hint">↓ Scroll to see results</div>}
      </section>

      {/* ── Results ── */}
      {result && (
        <>
        <section className="results" ref={resultsRef}>

          {/* Charts */}
          <div className="card">
            <h3>Emotion Distribution {result.model && <span className="model-badge">{result.model === "goemotions" ? "28 emotions" : "7 emotions"}</span>}</h3>
            <EmotionBar emotions={result.emotions} />
          </div>

          {/* VAD progress bars */}
          <div className="card">
            <h3>Valence · Arousal · Dominance</h3>
            {[
              {
                label: "Valence",
                pct: (result.vad.valence + 1) / 2 * 100,
                interp: result.vad.valence > 0.5 ? "Very positive — approach, pleasure"
                      : result.vad.valence > 0.2 ? "Mildly positive"
                      : result.vad.valence > -0.2 ? "Neutral"
                      : result.vad.valence > -0.5 ? "Mildly negative"
                      : "Very negative — avoidance, displeasure",
                display: `${result.vad.valence > 0 ? "+" : ""}${result.vad.valence.toFixed(2)}`,
              },
              {
                label: "Arousal",
                pct: result.vad.arousal * 100,
                interp: result.vad.arousal > 0.75 ? "Highly activated — intense, agitated"
                      : result.vad.arousal > 0.55 ? "Energized — alert, engaged"
                      : result.vad.arousal > 0.35 ? "Moderate energy"
                      : "Calm — quiet, passive",
                display: result.vad.arousal.toFixed(2),
              },
              {
                label: "Dominance",
                pct: result.vad.dominance * 100,
                interp: result.vad.dominance > 0.7 ? "In control — empowered, assertive"
                      : result.vad.dominance > 0.5 ? "Mostly in control"
                      : result.vad.dominance > 0.35 ? "Balanced agency"
                      : "Submissive — overpowered, helpless",
                display: result.vad.dominance.toFixed(2),
              },
            ].map(({ label, pct, interp, display }) => (
              <div className="vad-bar-row" key={label}>
                <div className="vad-bar-header">
                  <span className="vad-bar-label">{label}</span>
                  <span className="vad-bar-value">{display}</span>
                </div>
                <div className="vad-bar-track">
                  <div className="vad-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="vad-bar-interp">{interp}</p>
              </div>
            ))}
          </div>

          {/* Color result */}
          {(() => {
            const { h, s, l } = result.color;
            // HSL to hex conversion
            const s1 = s / 100, l1 = l / 100;
            const a = s1 * Math.min(l1, 1 - l1);
            const f = (n) => {
              const k = (n + h / 30) % 12;
              const c = l1 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
              return Math.round(255 * c).toString(16).padStart(2, "0");
            };
            const hex = `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
            const top5 = Object.entries(result.emotions).sort((a,b) => b[1]-a[1]).slice(0,5);
            return (
              <div className="card color-result">
                <h3>Generated Color</h3>
                <div className="color-result-layout">
                  <div className="color-swatch-large" style={{ background: `hsl(${h},${s}%,${l}%)` }} />
                  <div className="color-result-info">
                    <div className="color-values">
                      <span className="color-hex">{hex}</span>
                      <span className="color-hsl">hsl({h}°, {s}%, {l}%)</span>
                    </div>
                    <div className="color-breakdown">
                      <div className="color-breakdown-row">
                        <span>Hue {h}°</span>
                        <span className="color-breakdown-note">from emotion blend</span>
                      </div>
                      <div className="color-breakdown-row">
                        <span>Saturation {s}%</span>
                        <span className="color-breakdown-note">arousal = {result.vad.arousal.toFixed(2)}</span>
                      </div>
                      <div className="color-breakdown-row">
                        <span>Lightness {l}%</span>
                        <span className="color-breakdown-note">valence = {result.vad.valence > 0 ? "+" : ""}{result.vad.valence.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="color-top5">
                      <p className="color-top5-label">Hue influence — each emotion pulls toward its color</p>
                      {top5.map(([emotion, score]) => (
                        <div className="color-top5-row" key={emotion}>
                          <span className="color-top5-swatch" style={{ background: `hsl(${EMOTION_HUE[emotion] ?? 200},70%,50%)` }} />
                          <span className="color-top5-name">{emotion}</span>
                          <span className="color-top5-colorname">{EMOTION_COLOR_NAME[emotion] ?? "—"}</span>
                          <span className="color-top5-pct">{Math.round(score * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="card">
            <h3>VAD Space — Valence × Arousal</h3>
            <VADGraph history={history} current={result.vad} />
          </div>

          {/* Color explainer */}
          <div className="card color-explainer">
            <h3>How emotion becomes color</h3>
            <div className="explainer-grid">
              <div className="explainer-col">
                <p className="explainer-heading">Hue — <em>which color?</em></p>
                <p className="explainer-sub">Set by the blend of emotions present.</p>
                <div className="emotion-groups">
                  {[
                    { color: "hsl(45,90%,55%)",  label: "Yellows",  emotions: "joy, excitement, amusement, optimism" },
                    { color: "hsl(335,75%,60%)",  label: "Pinks",    emotions: "love, caring, desire, admiration, pride" },
                    { color: "hsl(135,55%,45%)",  label: "Greens",   emotions: "gratitude, relief, approval" },
                    { color: "hsl(190,75%,45%)",  label: "Cyans",    emotions: "surprise, curiosity, realization" },
                    { color: "hsl(215,60%,45%)",  label: "Blues",    emotions: "neutral, sadness, disappointment, remorse, grief" },
                    { color: "hsl(8,85%,50%)",    label: "Reds",     emotions: "anger, annoyance, disapproval" },
                    { color: "hsl(275,65%,50%)",  label: "Purples",  emotions: "fear, nervousness, embarrassment, confusion" },
                    { color: "hsl(85,50%,38%)",   label: "Olive",    emotions: "disgust" },
                  ].map(({ color, label, emotions }) => (
                    <div className="emotion-group-row" key={label}>
                      <span className="swatch swatch-wide" style={{ background: color }} />
                      <div>
                        <span className="swatch-label">{label}</span>
                        <span className="swatch-sub">{emotions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="explainer-col">
                <p className="explainer-heading">Saturation — <em>how vivid?</em></p>
                <p className="explainer-sub">Set by arousal (energy level). Saturation controls how pure or washed-out a color appears — 0% is completely grey regardless of hue, 100% is the most vivid version of that color. A calm, low-energy state drains the color toward grey; a high-energy state makes it intense and vivid.</p>
                <div className="scale-bar-wrap">
                  <div className="scale-bar saturation-bar" />
                  <div className="scale-labels"><span>Calm · Grey</span><span>Energized · Vivid</span></div>
                </div>
                <div className="scale-examples">
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,10%,45%)"}} /> Low arousal — washed out</div>
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,90%,45%)"}} /> High arousal — intense</div>
                </div>
              </div>
              <div className="explainer-col">
                <p className="explainer-heading">Brightness — <em>how light?</em></p>
                <p className="explainer-sub">Set by valence (positive vs. negative).</p>
                <div className="scale-bar-wrap">
                  <div className="scale-bar lightness-bar" />
                  <div className="scale-labels"><span>Negative · Dark</span><span>Positive · Bright</span></div>
                </div>
                <div className="scale-examples">
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,60%,20%)"}} /> Negative valence</div>
                  <div className="scale-ex"><span className="swatch" style={{background:"hsl(220,60%,75%)"}} /> Positive valence</div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ── How It Works ── */}
        <section className="research">
          <h2>How It Works</h2>

          <div className="research-block">
            <h4>The VAD Framework</h4>
            <p>
              The VAD model emerged from classical factor-analytic studies (Osgood et al. 1957; Russell 1980), which showed that human judgments of emotion reliably yield three independent dimensions. These three axes underlie both word meaning and emotional experience across languages and cultures.
            </p>
            <div className="vad-def-grid">
              <div className="vad-def">
                <span className="vad-def-label">Valence</span>
                <p>The degree of positivity or pleasure. It indexes the direction of behavioral activation — <em>approach</em> (appetitive) versus <em>avoidance</em> (aversive). "I'm thrilled" scores high; "I'm devastated" scores low.</p>
              </div>
              <div className="vad-def">
                <span className="vad-def-label">Arousal</span>
                <p>The intensity or energy of the emotion, orthogonal to valence. Both joy and anger can be high-arousal; both sadness and contentment can be low-arousal. "I'm furious" and "I'm ecstatic" share similar arousal despite opposite valence.</p>
              </div>
              <div className="vad-def">
                <span className="vad-def-label">Dominance</span>
                <p>The degree of perceived control over the emotion-inducing situation. High dominance implies feeling empowered; low dominance describes being overpowered. Fear is low-dominance; anger is high-dominance — even though both are negative.</p>
              </div>
            </div>
          </div>

          <div className="research-grid">
            <div className="research-card">
              <div className="research-icon">🤗</div>
              <h4>GoEmotions Model</h4>
              <p>ColorfulSpeech uses <strong>SamLowe/roberta-base-go_emotions</strong>, fine-tuned on Google's GoEmotions dataset — 58,000 Reddit comments labeled across 28 emotion categories. Unlike basic sentiment models that output only positive/negative/neutral, this model distinguishes nuanced states like <em>admiration</em>, <em>remorse</em>, <em>nervousness</em>, and <em>relief</em>. More emotion categories means a wider, more accurate color range.</p>
            </div>
            <div className="research-card">
              <div className="research-icon">📐</div>
              <h4>Emotion → VAD</h4>
              <p>Each of the 28 emotions is mapped to a VAD coordinate grounded in the NRC-VAD lexicon (Mohammad, 2018). The model returns a probability for every emotion simultaneously — a weighted average across all 28 produces a single point in 3D affect space that reflects the full emotional mixture of the text. <sup><a href="http://javiergs.com/presentations/speaker/emotionai/" target="_blank" rel="noreferrer">[3]</a></sup></p>
            </div>
            <div className="research-card">
              <div className="research-icon">🎨</div>
              <h4>VAD → Color</h4>
              <p>Hue is derived from the emotional blend — research confirms yellow with happiness, blue with sadness, bright colors with surprise <sup><a href="https://arxiv.org/html/2407.16064v1" target="_blank" rel="noreferrer">[1]</a></sup>. Saturation follows arousal; brightness follows valence. This three-dimensional mapping resolves color ambiguity: anger and love share a red hue but differ in valence, producing dark red vs. bright red. <sup><a href="https://www.sciencedirect.com/science/article/abs/pii/S0952197623010588" target="_blank" rel="noreferrer">[2]</a></sup></p>
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
