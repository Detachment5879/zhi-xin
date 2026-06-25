'use client';

interface RadarProps {
  visualScore: number;    // 0-100
  practicalScore: number; // 0-100
  detailScore: number;    // 0-100
}

export default function CognitiveRadar({ visualScore, practicalScore, detailScore }: RadarProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  const n = 3;

  // 3 axes at angles: top (90°), bottom-right (-30°), bottom-left (210°)
  const angles = [-90, 30, 150].map(a => (a * Math.PI) / 180);

  // Generate polygon points from scores
  const scores = [visualScore, practicalScore, detailScore];
  const points = angles.map((angle, i) => {
    const dist = (r * scores[i]) / 100;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Background grid (3 concentric rings)
  const gridRings = [1, 0.66, 0.33];
  const gridPaths = gridRings.map(ratio => {
    const pts = angles.map(a => ({
      x: cx + r * ratio * Math.cos(a),
      y: cy + r * ratio * Math.sin(a),
    }));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  });

  // Axis lines
  const axisLines = angles.map(a => ({
    x1: cx, y1: cy,
    x2: cx + r * Math.cos(a),
    y2: cy + r * Math.sin(a),
  }));

  const labels = [
    { text: '视觉型', x: cx, y: cy - r - 16, align: 'middle' },
    { text: '实战型', x: cx + r + 12, y: cy + r * 0.3 + 4, align: 'start' },
    { text: '详细型', x: cx - r - 12, y: cy + r * 0.3 + 4, align: 'end' },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid rings */}
      {gridPaths.map((d, i) => (
        <path key={`grid-${i}`} d={d} fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray={i === 2 ? '4 4' : '0'} />
      ))}
      {/* Axis lines */}
      {axisLines.map((l, i) => (
        <line key={`axis-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {/* Labels */}
      {labels.map((l, i) => (
        <text key={`label-${i}`} x={l.x} y={l.y} textAnchor={l.align as any} fill="#94a3b8" fontSize={11} fontWeight={500}>
          {l.text}
        </text>
      ))}
      {/* Data polygon */}
      <path d={polygonPath} fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth={2} />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill="#6366f1" stroke="white" strokeWidth={2} />
      ))}
      {/* Center label */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#94a3b8" fontSize={10}>你的</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#94a3b8" fontSize={10}>画像</text>
    </svg>
  );
}
