interface Props {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function getColor(value: number): string {
  if (value >= 90) return 'var(--success-500)';
  if (value >= 75) return 'var(--primary-500)';
  if (value >= 60) return 'var(--accent-500)';
  return 'var(--danger-500)';
}

export default function ConfidenceMeter({ value, showLabel = true, size = 'md' }: Props) {
  const color = getColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        className="confidence-bar"
        style={{ height: size === 'sm' ? '4px' : '6px' }}
      >
        <div
          className="confidence-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: '36px' }}>
          {value}%
        </span>
      )}
    </div>
  );
}
