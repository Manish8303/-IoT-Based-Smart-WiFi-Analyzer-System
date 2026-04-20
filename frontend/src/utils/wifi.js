const SECURITY_WEIGHT = {
  OPEN: -18,
  WPA: 6,
  WPA2: 12,
  WPA3: 16,
  UNKNOWN: 0,
};

export function normalizeEncryption(encryption) {
  if (!encryption || typeof encryption !== 'string') {
    return 'UNKNOWN';
  }

  const value = encryption.toUpperCase();
  if (value.includes('WPA3')) return 'WPA3';
  if (value.includes('WPA2')) return 'WPA2';
  if (value.includes('WPA')) return 'WPA';
  if (value.includes('OPEN')) return 'OPEN';
  return 'UNKNOWN';
}

export function normalizeNetworks(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => item && typeof item.rssi === 'number')
    .map((item, index) => ({
      id: item.id ?? index,
      ssid: typeof item.ssid === 'string' && item.ssid.trim() ? item.ssid.trim() : 'Hidden Network',
      rssi: item.rssi,
      channel: Number.isFinite(Number(item.channel)) ? Number(item.channel) : null,
      encryption: normalizeEncryption(item.encryption),
      timestamp: item.timestamp ?? Date.now(),
    }));
}

export function toQualityPercent(rssi) {
  return Math.max(0, Math.min(100, 2 * (rssi + 100)));
}

export function getSignalColor(rssi) {
  if (rssi > -60) return '#22c55e';
  if (rssi >= -75) return '#facc15';
  return '#ef4444';
}

export function getSignalQualityLabel(rssi) {
  if (rssi > -60) return 'Strong';
  if (rssi >= -75) return 'Moderate';
  return 'Weak';
}

export function getSignalBars(rssi) {
  const quality = toQualityPercent(rssi);
  if (quality >= 80) return '||||';
  if (quality >= 60) return '|||_';
  if (quality >= 35) return '||__';
  if (quality >= 10) return '|___';
  return '____';
}

export function getSecurityScoreLabel(encryption) {
  if (encryption === 'OPEN') return 'Low';
  if (encryption === 'WPA2' || encryption === 'WPA3') return 'High';
  if (encryption === 'WPA') return 'Medium';
  return 'Unknown';
}

export function dedupeNetworks(networks) {
  const deduped = new Map();

  networks.forEach((network) => {
    const existing = deduped.get(network.ssid);

    if (!existing) {
      deduped.set(network.ssid, { ...network, apCount: 1 });
      return;
    }

    const stronger = network.rssi > existing.rssi ? network : existing;
    deduped.set(network.ssid, {
      ...existing,
      ...stronger,
      apCount: existing.apCount + 1,
    });
  });

  return [...deduped.values()].sort((left, right) => {
    const leftScore = left.rssi + (SECURITY_WEIGHT[left.encryption] ?? 0);
    const rightScore = right.rssi + (SECURITY_WEIGHT[right.encryption] ?? 0);
    return rightScore - leftScore;
  });
}

export function findBestNetwork(networks) {
  return networks[0] || null;
}

export function buildRecommendation(network) {
  if (!network) {
    return 'Waiting for live scan data.';
  }

  if (network.rssi <= -75) {
    return 'Move closer to the router for better signal.';
  }

  if (network.encryption === 'OPEN') {
    return 'Use a secured network when possible to reduce security risk.';
  }

  if (network.rssi <= -60) {
    return 'Signal is usable, but moving closer should improve stability.';
  }

  return 'Excellent signal. This network is the best current choice.';
}

export function countSignalBuckets(networks) {
  return networks.reduce(
    (counts, network) => {
      if (network.rssi > -60) counts.strong += 1;
      else if (network.rssi < -75) counts.weak += 1;
      else counts.moderate += 1;
      return counts;
    },
    { strong: 0, moderate: 0, weak: 0 },
  );
}

export function summarizeSecurity(networks) {
  return networks.reduce(
    (summary, network) => {
      if (network.encryption === 'OPEN') {
        summary.low += 1;
        summary.openCount += 1;
      } else if (network.encryption === 'WPA2' || network.encryption === 'WPA3') {
        summary.high += 1;
      } else if (network.encryption === 'WPA') {
        summary.medium += 1;
      } else {
        summary.unknown += 1;
      }
      return summary;
    },
    { high: 0, medium: 0, low: 0, unknown: 0, openCount: 0 },
  );
}

export function getChannelInsights(networks) {
  const counts = networks.reduce((map, network) => {
    if (network.channel == null) {
      return map;
    }

    map.set(network.channel, (map.get(network.channel) || 0) + 1);
    return map;
  }, new Map());

  const sortedChannels = [...counts.entries()].sort((left, right) => left[0] - right[0]);

  if (!sortedChannels.length) {
    return {
      labels: [],
      values: [],
      mostCrowdedChannel: null,
      leastCrowdedChannel: null,
      bestChannel: null,
    };
  }

  const mostCrowded = [...sortedChannels].sort((left, right) => right[1] - left[1])[0];
  const leastCrowded = [...sortedChannels].sort((left, right) => left[1] - right[1])[0];

  return {
    labels: sortedChannels.map(([channel]) => String(channel)),
    values: sortedChannels.map(([, total]) => total),
    mostCrowdedChannel: mostCrowded[0],
    leastCrowdedChannel: leastCrowded[0],
    bestChannel: leastCrowded[0],
  };
}

export function buildHistoryPoint(network) {
  const time = new Date();
  return {
    label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rssi: network.rssi,
    timestamp: time.getTime(),
  };
}

function calculateVariance(values) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

export function getStabilitySummary(points) {
  const variance = calculateVariance(points.map((point) => point.rssi));
  const score = Math.max(0, Math.min(100, Math.round(100 - variance * 2)));
  return {
    points,
    variance,
    score,
    status: variance <= 30 ? 'Stable' : 'Unstable signal',
  };
}

export function formatLastUpdated(date) {
  if (!date) {
    return 'Waiting for first payload';
  }

  return `Updated ${date.toLocaleTimeString()}`;
}
