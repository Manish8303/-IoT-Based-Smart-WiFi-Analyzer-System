import {
  getSecurityScoreLabel,
  getSignalBars,
  getSignalColor,
  getSignalQualityLabel,
  toQualityPercent,
} from '../utils/wifi';

export default function SignalTable({ data, selectedSsid, onSelect }) {
  return (
    <article className="panel table-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Signal Quality + Bars</p>
          <h2>SSID analyzer</h2>
        </div>
        <p className="panel-subtitle">De-duplicated by SSID, strongest access point retained</p>
      </div>

      {data.length ? (
        <div className="table-scroll">
          <table className="signal-table">
            <thead>
              <tr>
                <th>SSID</th>
                <th>RSSI</th>
                <th>Quality</th>
                <th>Signal</th>
                <th>Security</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {data.map((network) => {
                const quality = toQualityPercent(network.rssi);
                const rowColor = getSignalColor(network.rssi);
                const active = selectedSsid === network.ssid;

                return (
                  <tr
                    key={network.ssid}
                    className={active ? 'selected-row' : ''}
                    onClick={() => onSelect(network.ssid)}
                  >
                    <td>
                      <div className="ssid-cell">
                        <strong>{network.ssid}</strong>
                        <span>
                          {network.apCount} AP{network.apCount === 1 ? '' : 's'} nearby
                        </span>
                      </div>
                    </td>
                    <td style={{ color: rowColor }}>{network.rssi} dBm</td>
                    <td>
                      <div className="quality-cell">
                        <span className="quality-number">{quality}%</span>
                        <small>{getSignalQualityLabel(network.rssi)}</small>
                      </div>
                    </td>
                    <td>
                      <span className="signal-inline" style={{ color: rowColor }}>
                        <span className="signal-bars">{getSignalBars(network.rssi)}</span>
                        <span>{getSignalQualityLabel(network.rssi)}</span>
                      </span>
                    </td>
                    <td>
                      <div className="security-cell">
                        <span>{network.encryption}</span>
                        <small>{getSecurityScoreLabel(network.encryption)}</small>
                      </div>
                    </td>
                    <td>{network.channel ?? 'Unknown'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No WiFi scan results yet</div>
      )}
    </article>
  );
}
