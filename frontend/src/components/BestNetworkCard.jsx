import { getSecurityScoreLabel, getSignalBars, getSignalColor, toQualityPercent } from '../utils/wifi';

export default function BestNetworkCard({ bestNetwork, recommendation, securitySummary }) {
  if (!bestNetwork) {
    return (
      <article className="panel best-network-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Smart Recommendation</p>
            <h2>Best network</h2>
          </div>
        </div>
        <div className="empty-state">Waiting for WiFi scan data...</div>
      </article>
    );
  }

  const quality = toQualityPercent(bestNetwork.rssi);
  const signalColor = getSignalColor(bestNetwork.rssi);

  return (
    <article className="panel best-network-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Smart Recommendation</p>
          <h2>Best network</h2>
        </div>
        <span className="quality-chip" style={{ borderColor: signalColor, color: signalColor }}>
          {quality}% quality
        </span>
      </div>

      <div className="best-network-main">
        <div>
          <p className="best-network-label">Top pick</p>
          <h3>Best Network: {bestNetwork.ssid}</h3>
          <p className="best-network-meta">
            {bestNetwork.rssi} dBm, {bestNetwork.encryption}
          </p>
        </div>
        <div className="signal-badge" style={{ color: signalColor }}>
          <span className="signal-bars">{getSignalBars(bestNetwork.rssi)}</span>
          <span>{getSecurityScoreLabel(bestNetwork.encryption)} Security</span>
        </div>
      </div>

      <p className="recommendation-text">Suggestion: {recommendation}</p>

      <div className="best-network-footer">
        <div>
          <span>Nearby APs</span>
          <strong>{bestNetwork.apCount}</strong>
        </div>
        <div>
          <span>Open Networks</span>
          <strong>{securitySummary.openCount}</strong>
        </div>
      </div>
    </article>
  );
}
