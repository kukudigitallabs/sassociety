import React from 'react';
import { FileText, Printer, CheckCircle, RotateCcw, Clock, X, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../i18n.ts';

interface SubscriptionInvoiceModalProps {
  invoice: any;
  platformSettings?: any;
  onClose: () => void;
}

export const SubscriptionInvoiceModal: React.FC<SubscriptionInvoiceModalProps> = ({
  invoice,
  platformSettings,
  onClose,
}) => {
  if (!invoice) return null;

  const isRefunded = invoice.status === 'REFUNDED';
  const isPaid = invoice.status === 'PAID';
  const isUnpaid = invoice.status === 'CREATED' || invoice.status === 'PENDING_APPROVAL';

  const basePrice = Number(invoice.amount || 0);
  const taxAmount = Number(invoice.tax_amount || 0);
  const totalAmount = Number(invoice.total_amount || (basePrice + taxAmount));
  const refundAmount = Number(invoice.refund_amount || totalAmount);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: 680,
          width: '95%',
          background: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: 12,
          padding: '1.75rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary, #047857)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
              {isRefunded ? 'Credit Note & Refund Statement' : 'Subscription Tax Invoice'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              title="Print document"
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Status Stamp Alert */}
        {isRefunded && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1.5px solid #f87171',
              color: '#991b1b',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <RotateCcw size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                REFUND ISSUED — CREDIT NOTE
              </div>
              <div style={{ fontSize: '0.83rem', marginTop: 2 }}>
                A refund of <strong>{formatCurrency(refundAmount)}</strong> was issued on{' '}
                <strong>{(invoice.refunded_at || invoice.created_at || '').slice(0, 10)}</strong>.
              </div>
              {invoice.refund_reference && (
                <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                  Payout Reference / UTR: <code>{invoice.refund_reference}</code> ({invoice.refund_gateway || 'UPI/Bank'})
                </div>
              )}
              {invoice.refund_reason && (
                <div style={{ fontSize: '0.78rem', marginTop: 2, fontStyle: 'italic' }}>
                  Reason: "{invoice.refund_reason}"
                </div>
              )}
            </div>
          </div>
        )}

        {isPaid && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              background: '#ecfdf5',
              border: '1.5px solid #34d399',
              color: '#065f46',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <CheckCircle size={20} color="#059669" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                PAYMENT CONFIRMED — FULLY PAID
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Paid on {(invoice.paid_at || invoice.created_at || '').slice(0, 10)} via {invoice.payment_gateway || 'ONLINE'}
                {invoice.gateway_payment_id && ` • Reference: ${invoice.gateway_payment_id}`}
              </div>
            </div>
          </div>
        )}

        {isUnpaid && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              background: '#fffbeb',
              border: '1.5px solid #fcd34d',
              color: '#92400e',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Clock size={20} color="#d97706" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                INVOICE PENDING — UNPAID
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Amount of {formatCurrency(totalAmount)} is due for subscription activation & renewal.
              </div>
            </div>
          </div>
        )}

        {/* Invoice Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Issuer / Platform
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary, #047857)', marginTop: 2 }}>
              {platformSettings?.platform_name || 'SocietyOS SaaS Platform'}
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
              {platformSettings?.support_email || 'support@societyos.in'} • {platformSettings?.support_phone || '+91 98765 43210'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Multi-Tenant Residential Welfare & Society ERP
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Billed Society Customer
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', marginTop: 2 }}>
              {invoice.society_name || 'Registered Society'}
            </div>
            {invoice.society_address && (
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                {invoice.society_address}
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Invoice No: <strong>{invoice.invoice_number}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Date: {(invoice.paid_at || invoice.created_at || '').slice(0, 10)}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken, #f8fafc)' }}>
                <th style={{ textAlign: 'left' }}>Item Description</th>
                <th style={{ textAlign: 'center', width: 90 }}>Billing Cycle</th>
                <th style={{ textAlign: 'right', width: 120 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{invoice.plan_name || 'Platform Subscription Plan'}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Enterprise Society Management License, Resident Portal & Dual RLS Tenant Security
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {invoice.plan_billing_period || 'Period'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatCurrency(basePrice)}
                </td>
              </tr>
              {taxAmount > 0 && (
                <tr>
                  <td>
                    <span>Applicable GST / Taxes ({platformSettings?.subscription_tax_name || 'GST'})</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>Tax</td>
                  <td style={{ textAlign: 'right' }}>
                    {formatCurrency(taxAmount)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>Total Invoice Amount:</td>
                <td style={{ textAlign: 'right', color: 'var(--brand, #047857)' }}>
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
              {isRefunded && (
                <tr style={{ fontWeight: 700, color: '#dc2626' }}>
                  <td colSpan={2} style={{ textAlign: 'right' }}>Refund Issued / Credit Note Adjustment:</td>
                  <td style={{ textAlign: 'right' }}>
                    - {formatCurrency(refundAmount)}
                  </td>
                </tr>
              )}
              {isRefunded && (
                <tr style={{ fontWeight: 800, background: 'var(--surface-sunken, #f8fafc)' }}>
                  <td colSpan={2} style={{ textAlign: 'right' }}>Net Balance Paid:</td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>
                    {formatCurrency(Math.max(0, totalAmount - refundAmount))}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        {/* Footer Notes */}
        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.85rem', fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            This is a computer-generated tax document from {platformSettings?.platform_name || 'SocietyOS SaaS Platform'}.
          </div>
          <div>
            Status: <strong>{invoice.status}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

