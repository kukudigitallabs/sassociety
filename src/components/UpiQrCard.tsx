import React, { useState } from 'react';
import { QrCode, Copy, Check, ExternalLink, Smartphone, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../i18n.ts';

interface UpiQrCardProps {
  upiId: string;
  payeeName?: string;
  amount?: number;
  note?: string;
  invoiceNumber?: string;
  compact?: boolean;
  onCopySuccess?: (msg: string) => void;
}

export const UpiQrCard: React.FC<UpiQrCardProps> = ({
  upiId,
  payeeName = 'SocietyOS Platform',
  amount,
  note = 'SaaS Subscription Payment',
  invoiceNumber,
  compact = false,
  onCopySuccess,
}) => {
  const [copiedField, setCopiedField] = useState<'upi' | 'amount' | null>(null);

  const cleanUpiId = (upiId || '').trim();
  const cleanAmount = amount && amount > 0 ? Number(amount).toFixed(2) : '';
  const cleanNote = note || (invoiceNumber ? `Invoice ${invoiceNumber}` : 'Subscription Payment');

  // Build standard NPCI UPI Intent URI:
  // upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
  const upiUri = cleanUpiId
    ? `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(payeeName)}` +
      (cleanAmount ? `&am=${cleanAmount}&cu=INR` : '') +
      (cleanNote ? `&tn=${encodeURIComponent(cleanNote)}` : '')
    : '';

  // Safe QR server API with high resolution & margin
  const qrImageUrl = cleanUpiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUri)}`
    : '';

  function copyToClipboard(text: string, field: 'upi' | 'amount') {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (onCopySuccess) {
      onCopySuccess(field === 'upi' ? 'UPI ID copied to clipboard!' : 'Amount copied to clipboard!');
    }
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  }

  if (!cleanUpiId) {
    return (
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 12,
          background: 'var(--bg-subtle, #f8fafc)',
          border: '1.5px dashed var(--border, #cbd5e1)',
          textAlign: 'center',
          color: 'var(--text-muted, #64748b)',
        }}
      >
        <QrCode size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>UPI ID Not Yet Configured</div>
        <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
          Enter a valid UPI ID (e.g. <code>taxprofessionals97-1@okaxis</code>) to generate live payment QR code card.
        </div>
      </div>
    );
  }

  return (
    <div
      className="upi-qr-card"
      style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1.5px solid var(--border, #e2e8f0)',
        borderRadius: 14,
        padding: compact ? '1rem' : '1.25rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#047857',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={16} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main, #0f172a)' }}>
              Official UPI QR Code
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
              NPCI Standard Bharat QR / UPI 2.0
            </div>
          </div>
        </div>

        {cleanAmount ? (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Amount Due</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand, #4f46e5)' }}>
              {formatCurrency(Number(cleanAmount))}
            </div>
          </div>
        ) : null}
      </div>

      {/* QR Code Container */}
      <div
        style={{
          padding: '0.75rem',
          borderRadius: 12,
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          display: 'inline-block',
          position: 'relative',
        }}
      >
        <img
          src={qrImageUrl}
          alt={`Scan to pay ${cleanUpiId}`}
          width={compact ? 170 : 200}
          height={compact ? 170 : 200}
          style={{
            display: 'block',
            borderRadius: 6,
            imageRendering: 'crisp-edges',
          }}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            borderRadius: '50%',
            padding: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#047857',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 900,
            }}
          >
            UPI
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', width: '100%' }}>
        {/* UPI ID Pill with Copy Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, #f1f5f9)',
            border: '1px solid var(--border, #cbd5e1)',
            borderRadius: 8,
            padding: '0.5rem 0.75rem',
            margin: '0.5rem 0',
          }}
        >
          <div style={{ textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              Platform VPA / UPI ID
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--primary, #047857)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cleanUpiId}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => copyToClipboard(cleanUpiId, 'upi')}
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', flexShrink: 0, gap: '0.3rem' }}
            title="Copy UPI ID"
          >
            {copiedField === 'upi' ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
            <span>{copiedField === 'upi' ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Payee Name & Note Details */}
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', margin: '0.35rem 0' }}>
          <div>Verified Payee: <strong>{payeeName}</strong></div>
          {invoiceNumber && <div>Invoice Ref: <code>{invoiceNumber}</code></div>}
        </div>

        {/* Mobile Deep-link Button */}
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <a
            href={upiUri}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: '#047857',
              borderColor: '#047857',
              textDecoration: 'none',
              borderRadius: 8,
              color: '#ffffff',
            }}
          >
            <Smartphone size={16} />
            <span>Pay Directly in Any UPI App</span>
            <ExternalLink size={14} />
          </a>

          {/* Supported App Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.68rem',
              color: 'var(--text-muted, #64748b)',
              fontWeight: 600,
              marginTop: '0.25rem',
              flexWrap: 'wrap',
            }}
          >
            <span>Scan via:</span>
            <span style={{ padding: '0.15rem 0.4rem', background: '#e0f2fe', color: '#0369a1', borderRadius: 4 }}>GPay</span>
            <span style={{ padding: '0.15rem 0.4rem', background: '#ede9fe', color: '#6d28d9', borderRadius: 4 }}>PhonePe</span>
            <span style={{ padding: '0.15rem 0.4rem', background: '#e0f2fe', color: '#0284c7', borderRadius: 4 }}>Paytm</span>
            <span style={{ padding: '0.15rem 0.4rem', background: '#dcfce7', color: '#15803d', borderRadius: 4 }}>BHIM</span>
            <span style={{ padding: '0.15rem 0.4rem', background: '#ffedd5', color: '#c2410c', borderRadius: 4 }}>Any Bank App</span>
          </div>
        </div>
      </div>
    </div>
  );
};

