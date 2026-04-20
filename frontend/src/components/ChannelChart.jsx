import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChannelChart({ insights }) {
  if (!insights.labels.length) {
    return (
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Channel & Interference</p>
            <h2>Channel occupancy</h2>
          </div>
        </div>
        <div className="empty-state">Channel data is unavailable in the current payload.</div>
      </article>
    );
  }

  const chartData = {
    labels: insights.labels,
    datasets: [
      {
        label: 'Networks on channel',
        data: insights.values,
        borderRadius: 10,
        backgroundColor: insights.labels.map((label) => {
          if (Number(label) === insights.mostCrowdedChannel) {
            return '#f97316';
          }

          if (Number(label) === insights.leastCrowdedChannel) {
            return '#22c55e';
          }

          return '#38bdf8';
        }),
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
        ticks: { color: '#dbe7ff' },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#dbe7ff',
          precision: 0,
        },
        grid: { color: 'rgba(148, 163, 184, 0.14)' },
      },
    },
  };

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Channel & Interference</p>
          <h2>Channel occupancy</h2>
        </div>
        <p className="panel-subtitle">Best channel suggestion: {insights.bestChannel ?? 'Unknown'}</p>
      </div>

      <div className="channel-summary">
        <div>
          <span>Most crowded</span>
          <strong>{insights.mostCrowdedChannel ?? 'Unknown'}</strong>
        </div>
        <div>
          <span>Least crowded</span>
          <strong>{insights.leastCrowdedChannel ?? 'Unknown'}</strong>
        </div>
        <div>
          <span>Recommended</span>
          <strong>Best Channel: {insights.bestChannel ?? 'Unknown'}</strong>
        </div>
      </div>

      <div className="chart-area">
        <Bar data={chartData} options={options} />
      </div>
    </article>
  );
}

