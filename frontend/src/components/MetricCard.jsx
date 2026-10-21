import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'var(--accent-primary)',
  percent,
  trend,
}) => {
  return (
    <div className="hub-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: '0.75rem', color: trend.positive ? 'var(--success)' : 'var(--error)' }}>
            {trend.label}
          </span>
        )}
      </div>

      {percent !== undefined && (
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, percent))}%`,
              height: '100%',
              backgroundColor:
                percent > 85 ? 'var(--error)' : percent > 65 ? 'var(--warning)' : accentColor,
              borderRadius: '9999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
