import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ResponsiveLogoProps {
  logoUrl?: string | null;
  platformName?: string;
  subtitle?: string;
  defaultIcon?: React.ReactNode;
  maxHeight?: number;
  className?: string;
  compactOnMobile?: boolean;
  showText?: boolean;
}

export const ResponsiveLogo: React.FC<ResponsiveLogoProps> = ({
  logoUrl,
  platformName = 'SocietyOS SaaS',
  subtitle,
  defaultIcon,
  maxHeight = 36,
  className = '',
  compactOnMobile = true,
  showText = true,
}) => {
  const [loadError, setLoadError] = useState(false);

  const hasValidLogo = Boolean(logoUrl && !loadError);

  if (hasValidLogo) {
    return (
      <div
        className={`responsive-logo-wrapper ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          maxWidth: '100%',
        }}
      >
        <img
          src={logoUrl!}
          alt={platformName}
          onError={() => setLoadError(true)}
          style={{
            maxHeight: maxHeight,
            maxWidth: 'clamp(110px, 30vw, 190px)',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
          className="brand-logo-img"
        />
        {showText && !compactOnMobile && (
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div
              className="brand-logo-text"
              style={{
                fontWeight: 800,
                fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {platformName}
            </div>
            {subtitle && (
              <div
                className="topbar-subtitle"
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted, #64748b)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback: Custom Icon or Default Building2 Icon + Platform Name
  return (
    <div
      className={`responsive-logo-wrapper ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: maxHeight + 4,
          height: maxHeight + 4,
          borderRadius: 8,
          background: 'var(--primary, #047857)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {defaultIcon || <Building2 size={Math.round(maxHeight * 0.55)} />}
      </div>
      {showText && (
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {platformName}
          </div>
          <div
            className="topbar-subtitle"
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted, #64748b)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle || 'Multi-Tenant RWA SaaS'}
          </div>
        </div>
      )}
    </div>
  );
};

