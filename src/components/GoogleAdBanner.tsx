import React, { useEffect } from 'react';

interface GoogleAdBannerProps {
  clientId?: string;
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  style?: React.CSSProperties;
  label?: string;
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({
  clientId,
  slotId,
  format = 'auto',
  responsive = true,
  style,
  label = 'Advertisement / Sponsored',
}) => {
  useEffect(() => {
    if (clientId && slotId) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // Ignored if adsbygoogle is already loaded or blocked
      }
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) {
    return null;
  }

  return (
    <div
      className="google-ad-container"
      style={{
        width: '100%',
        margin: '1.25rem 0',
        padding: '0.75rem',
        borderRadius: 10,
        background: 'var(--bg-subtle, #f8fafc)',
        border: '1px solid var(--border, #e2e8f0)',
        textAlign: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted, #94a3b8)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '0.45rem',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 90 }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', ...(style || {}) }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
};

