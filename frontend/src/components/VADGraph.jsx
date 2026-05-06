import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  LineElement,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, LineElement);

const quadrantPlugin = {
  id: "quadrantPlugin",
  beforeDraw(chart) {
    const { ctx, chartArea: { left, right, top, bottom }, scales } = chart;
    const midX = scales.x.getPixelForValue(0);
    const midY = scales.y.getPixelForValue(0.5);

    const quads = [
      { x: midX, y: top,  w: right-midX, h: midY-top,    color: "rgba(255,180,0,0.07)",  label: "Excited", lx: right-8, ly: top+18,   align: "right" },
      { x: left, y: top,  w: midX-left,  h: midY-top,    color: "rgba(220,50,50,0.07)",  label: "Tense",   lx: left+8,  ly: top+18,   align: "left"  },
      { x: midX, y: midY, w: right-midX, h: bottom-midY, color: "rgba(50,180,120,0.07)", label: "Calm",    lx: right-8, ly: bottom-8, align: "right" },
      { x: left, y: midY, w: midX-left,  h: bottom-midY, color: "rgba(50,80,200,0.07)",  label: "Sad",     lx: left+8,  ly: bottom-8, align: "left"  },
    ];

    ctx.save();
    quads.forEach(({ x, y, w, h, color, label, lx, ly, align }) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.font = "12px Inter, system-ui, sans-serif";
      ctx.textAlign = align;
      ctx.fillText(label, lx, ly);
    });
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(midX, top); ctx.lineTo(midX, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, midY); ctx.lineTo(right, midY); ctx.stroke();
    ctx.restore();
  },
};

export default function VADGraph({ history, current }) {
  const histPoints = history.slice(0, -1).map((h) => ({
    x: h.vad.valence,
    y: h.vad.arousal,
  }));
  const curPoint = { x: current.valence, y: current.arousal };

  const data = {
    datasets: [
      {
        label: "History",
        data: histPoints,
        backgroundColor: "rgba(150,150,255,0.35)",
        pointRadius: history.slice(0, -1).map((h) => h.vad.dominance * 12 + 4),
      },
      {
        label: "Current",
        data: [curPoint],
        backgroundColor: "rgba(255,220,50,0.9)",
        pointRadius: current.dominance * 14 + 6,
        pointHoverRadius: 14,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: {
      x: {
        min: -1, max: 1,
        title: { display: true, text: "Valence  (negative ← → positive)", color: "#aaa", font: { size: 13 } },
        ticks: { color: "#ccc", font: { size: 12 } },
        grid: { color: "#2a2a2a" },
      },
      y: {
        min: 0, max: 1,
        title: { display: true, text: "Arousal  (calm ↓ ↑ energized)", color: "#aaa", font: { size: 13 } },
        ticks: { color: "#ccc", font: { size: 12 } },
        grid: { color: "#2a2a2a" },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return <div style={{ height: 380 }}><Scatter data={data} options={options} plugins={[quadrantPlugin]} /></div>;
}
