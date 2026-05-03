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
  joy: "#f5c518",
  love: "#e91e8c",
  gratitude: "#ff9800",
  amusement: "#ffd54f",
  excitement: "#ff6d00",
  neutral: "#90a4ae",
  surprise: "#00bcd4",
  anger: "#f44336",
  fear: "#7b1fa2",
  disgust: "#558b2f",
  sadness: "#1565c0",
  disappointment: "#5c6bc0",
  grief: "#283593",
  embarrassment: "#ad1457",
  confusion: "#0097a7",
};

export default function EmotionBar({ emotions }) {
  const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
  const data = {
    labels: sorted.map(([e]) => e),
    datasets: [{
      data: sorted.map(([, v]) => v),
      backgroundColor: sorted.map(([e]) => COLORS[e] ?? "#888"),
      borderRadius: 4,
    }],
  };
  const options = {
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: { min: 0, max: 1, ticks: { color: "#ccc" }, grid: { color: "#333" } },
      y: { ticks: { color: "#ccc" }, grid: { display: false } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  return <div style={{ height: 260 }}><Bar data={data} options={options} /></div>;
}
