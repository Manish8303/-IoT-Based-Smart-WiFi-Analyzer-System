import { useEffect, useMemo, useState } from 'react';
import BestNetworkCard from './components/BestNetworkCard';
import ChannelChart from './components/ChannelChart';
import SignalTable from './components/SignalTable';
import StabilityChart from './components/StabilityChart';
import {
  buildHistoryPoint,
  buildRecommendation,
  countSignalBuckets,
  dedupeNetworks,
  findBestNetwork,
  formatLastUpdated,
  getChannelInsights,
  getStabilitySummary,
  normalizeNetworks,
  summarizeSecurity,
} from './utils/wifi';

const getApiUrl = () => {
  const runtimeDefaultBaseUrl = `http://${window.location.hostname || 'localhost'}:3000`;
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || runtimeDefaultBaseUrl;
  return `${configuredBaseUrl.replace(/\/$/, '')}/data`;
};

const API_URL = getApiUrl();

export default function App() {
  const [rawNetworks, setRawNetworks] = useState([]);
  const [historyBySsid, setHistoryBySsid] = useState({});
  const [selectedSsid, setSelectedSsid] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const dedupedNetworks = useMemo(() => dedupeNetworks(rawNetworks), [rawNetworks]);
  const bestNetwork = useMemo(() => findBestNetwork(dedupedNetworks), [dedupedNetworks]);
  const signalStats = useMemo(() => countSignalBuckets(dedupedNetworks), [dedupedNetworks]);
  const securitySummary = useMemo(() => summarizeSecurity(dedupedNetworks), [dedupedNetworks]);
  const channelInsights = useMemo(() => getChannelInsights(rawNetworks), [rawNetworks]);

  const selectedNetwork = useMemo(() => {
    if (!dedupedNetworks.length) {
      return null;
    }

    return (
      dedupedNetworks.find((network) => network.ssid === selectedSsid) ||
      bestNetwork ||
      dedupedNetworks[0]
    );
  }, [bestNetwork, dedupedNetworks, selectedSsid]);

  const stabilitySummary = useMemo(() => {
    if (!selectedNetwork) {
      return null;
    }

    return getStabilitySummary(historyBySsid[selectedNetwork.ssid] || []);
  }, [historyBySsid, selectedNetwork]);

  useEffect(() => {
    if (!selectedNetwork?.ssid) {
      return;
    }

    setSelectedSsid((current) => current || selectedNetwork.ssid);
  }, [selectedNetwork]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!active) {
        return;
      }

      setIsRefreshing(true);
      setError('');

      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to load WiFi scan data');
        }

        const result = await response.json();
        const normalized = normalizeNetworks(result);

        if (!active) {
          return;
        }

        setRawNetworks(normalized);
        setLastUpdated(new Date());
        setHistoryBySsid((previous) => {
          const nextHistory = {};
          const deduped = dedupeNetworks(normalized);

          deduped.forEach((network) => {
            const previousPoints = previous[network.ssid] || [];
            nextHistory[network.ssid] = [...previousPoints, buildHistoryPoint(network)].slice(-30);
          });

          return nextHistory;
        });
      } catch (fetchError) {
        if (active) {
          console.error('Dashboard fetch failed:', {
            apiUrl: API_URL,
            message: fetchError?.message,
            error: fetchError,
          });
          setError(fetchError.message || 'Unable to fetch dashboard data');
        }
      } finally {
        if (active) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchData();
    const intervalId = window.setInterval(fetchData, 3000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const recommendation = buildRecommendation(bestNetwork);

  return (
    <div className="app-shell">
      <div className="dashboard">
        <header className="hero">
          <div>
            <p className="eyebrow">Professional WiFi Analyzer</p>
            <h1>Wireless Intelligence Dashboard</h1>
            <p className="hero-copy">
              Monitor nearby SSIDs, compare channel congestion, inspect signal quality, and track
              connection stability every 3 seconds from the live IoT scan feed.
            </p>
          </div>

          <div className="hero-status">
            <span className={isRefreshing ? 'status-badge status-badge-live' : 'status-badge'}>
              {loading ? 'Initializing' : isRefreshing ? 'Refreshing' : 'Live'}
            </span>
            <p>{formatLastUpdated(lastUpdated)}</p>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total Networks</span>
            <strong>{rawNetworks.length}</strong>
            <small>{dedupedNetworks.length} unique SSIDs detected</small>
          </article>
          <article className="stat-card">
            <span>Strong Signals</span>
            <strong>{signalStats.strong}</strong>
            <small>RSSI stronger than -60 dBm</small>
          </article>
          <article className="stat-card">
            <span>Weak Signals</span>
            <strong>{signalStats.weak}</strong>
            <small>RSSI weaker than -75 dBm</small>
          </article>
        </section>

        <section className="dashboard-grid">
          <BestNetworkCard
            bestNetwork={bestNetwork}
            recommendation={recommendation}
            securitySummary={securitySummary}
          />

          <article className="panel summary-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Security Analyzer</p>
                <h2>Encryption posture</h2>
              </div>
            </div>

            <div className="security-grid">
              <div className="security-metric">
                <span>High Security</span>
                <strong>{securitySummary.high}</strong>
                <small>WPA2 / WPA3</small>
              </div>
              <div className="security-metric">
                <span>Low Security</span>
                <strong>{securitySummary.low}</strong>
                <small>Open networks</small>
              </div>
              <div className="security-metric">
                <span>Unknown</span>
                <strong>{securitySummary.unknown}</strong>
                <small>Missing encryption metadata</small>
              </div>
            </div>

            <div className={securitySummary.openCount ? 'alert-banner' : 'info-banner'}>
              {securitySummary.openCount
                ? `Warning: ${securitySummary.openCount} open networks detected`
                : 'No open networks detected in the current dataset'}
            </div>
          </article>
        </section>

        <section className="content-grid">
          <SignalTable
            data={dedupedNetworks}
            selectedSsid={selectedNetwork?.ssid || ''}
            onSelect={setSelectedSsid}
          />
          <StabilityChart network={selectedNetwork} history={stabilitySummary} />
          <ChannelChart insights={channelInsights} />
        </section>

        {error ? <div className="error-banner">{error}</div> : null}
      </div>
    </div>
  );
}
