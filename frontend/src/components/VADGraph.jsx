import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  LineElement,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, LineElement);

// Draws quadrant labels directly on the canvas
const quadrantLabels = {
  id: "quadrantLabels",
  afterDraw(chart) {
    const { ctx, chartArea: { left, right, top, bottom } } = chart;
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;
    const labels = [
      { text: "Excited",  x: right - 8,  y: top + 14,     align: "right" },
      { text: "Angry",    x: left + 8,   y: top + 14,     align: "left"  },
      { text: "Calm",     x: right - 8,  y: bottom - 8,   align: "right" },
      { text: "Sad",      x: left + 8,   y: bottom - 8,   align: "left"  },
    ];
    ctx.save();
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    labels.forEach(({ text, x, y, align }) => {
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    });
    // faint crosshair lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(midX, top); ctx.lineTo(midX, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, midY); ctx.lineTo(right, midY); ctx.stroke();
    ctx.restore();
  },
};

ChartJS.register(quadrantLabels);

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
        title: { display: true, text: "Valence", color: "#aaa" },
        ticks: { color: "#ccc" },
        grid: { color: "#333" },
      },
      y: {
        min: 0, max: 1,
        title: { display: true, text: "Arousal", color: "#aaa" },
        ticks: { color: "#ccc" },
        grid: { color: "#333" },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return <div style={{ height: 260 }}><Scatter data={data} options={options} /></div>;
}
