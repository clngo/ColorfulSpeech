import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const COLORS = {
  // Yellows
  joy: "#f5c518", excitement: "#ff6d00", amusement: "#ffd54f", optimism: "#ffb300", approval: "#c8e6c9",
  // Pinks/magentas
  love: "#e91e8c", caring: "#f06292", desire: "#e91e63", admiration: "#ce93d8", pride: "#ab47bc",
  // Greens
  gratitude: "#66bb6a", relief: "#a5d6a7",
  // Cyans
  surprise: "#00bcd4", curiosity: "#26c6da", realization: "#4dd0e1",
  // Blues
  neutral: "#90a4ae", confusion: "#0097a7", sadness: "#1565c0", disappointment: "#5c6bc0", remorse: "#3949ab", grief: "#283593",
  // Reds
  anger: "#f44336", annoyance: "#ef5350", disapproval: "#e53935",
  // Purples
  fear: "#7b1fa2", nervousness: "#8e24aa", embarrassment: "#ad1457",
  // Olive
  disgust: "#558b2f",
};

export default function EmotionBar({ emotions }) {
  const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
  const data = {
    labels: sorted.map(([e]) => e),
    datasets: [{
      data: sorted.map(([, v]) => Math.round(v * 100)),
      backgroundColor: sorted.map(([e]) => COLORS[e] ?? "#888"),
      borderRadius: 4,
    }],
  };
  const options = {
    indexAxis: "x",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y}%` },
      },
    },
    scales: {
      x: {
        ticks: { color: "#ddd", font: { size: 13 }, maxRotation: 45, minRotation: 30 },
        grid: { display: false },
      },
      y: {
        min: 0, max: 100,
        ticks: {
          color: "#ccc",
          font: { size: 13 },
          callback: (v) => `${v}%`,
        },
        grid: { color: "#333" },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  return <div style={{ height: 420 }}><Bar data={data} options={options} /></div>;
}
