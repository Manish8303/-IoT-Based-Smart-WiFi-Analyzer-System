import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

export default function StabilityChart({ network, history }) {
  if (!network || !history?.points?.length) {
    return (
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Time-Series Stability</p>
            <h2>RSSI trend</h2>
          </div>
        </div>
        <div className="empty-state">Select a network after data arrives to track signal stability.</div>
      </article>
    );
  }

  const chartData = {
    labels: history.points.map((point) => point.label),
    datasets: [
      {
        label: `${network.ssid} RSSI`,
        data: history.points.map((point) => point.rssi),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: {
          color: '#dbe7ff',
          maxTicksLimit: 6,
        },
        grid: { display: false },
      },
      y: {
        suggestedMin: -100,
        suggestedMax: -30,
        ticks: { color: '#dbe7ff' },
        grid: { color: 'rgba(148, 163, 184, 0.14)' },
      },
    },
  };

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Time-Series Stability</p>
          <h2>{network.ssid}</h2>
        </div>
        <p className="panel-subtitle">Tracking the last {history.points.length} readings</p>
      </div>

      <div className="stability-summary">
        <div>
          <span>Status</span>
          <strong>{history.status}</strong>
        </div>
        <div>
          <span>Stability score</span>
          <strong>{history.score}</strong>
        </div>
        <div>
          <span>Variance</span>
          <strong>{history.variance.toFixed(1)}</strong>
        </div>
      </div>

      <div className="chart-area">
        <Line data={chartData} options={options} />
      </div>
    </article>
  );
}
