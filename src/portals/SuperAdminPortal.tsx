import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  CreditCard,
  Settings,
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Clock,
  Bell,
  Download,
  RefreshCw,
  LogOut,
  Globe,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Upload,
  Image as ImageIcon,
  QrCode,
  Sliders,
  Sparkles,
  Eye,
  Copy,
  ExternalLink,
  Check,
  Percent,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Printer,
} from 'lucide-react';
import { apiFetch, downloadCsv, uploadFileAsBase64 } from '../api.ts';
import { type Language, t, formatCurrency } from '../i18n.ts';
import { UpiQrCard } from '../components/UpiQrCard.tsx';
import { ResponsiveLogo } from '../components/ResponsiveLogo.tsx';
import { SubscriptionInvoiceModal } from '../components/SubscriptionInvoiceModal.tsx';

interface SuperAdminPortalProps {
  user: any;
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onLogout: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  user,
  lang,
  setLang,
  theme,
  setTheme,
  onLogout,
  notify,
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SOCIETIES' | 'PLANS' | 'PAYMENTS' | 'SETTINGS' | 'AUDIT'>('DASHBOARD');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024 && window.innerWidth <= 1280;
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; societyName: string; invoiceNo: string; amount: number; utr: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Modals
  const [selectedSociety, setSelectedSociety] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'NONE' | 'CREATE_SOCIETY' | 'VIEW_SOCIETY' | 'EXTEND_TRIAL' | 'NOTIFY_ADMIN' | 'CREATE_PLAN'>('NONE');

  // Forms
  const [trialExtendDays, setTrialExtendDays] = useState('7');
  const [trialExtendReason, setTrialExtendReason] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyType, setNotifyType] = useState<'SUBSCRIPTION_PAYMENT_DUE' | 'PLATFORM_NOTICE'>('SUBSCRIPTION_PAYMENT_DUE');
  const [notifyAmountDue, setNotifyAmountDue] = useState('');
  const [notifyDaysPending, setNotifyDaysPending] = useState('');

  // Subscription Invoices & Refund Management State
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'REFUNDED' | 'FAILED'>('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [refundModalPayment, setRefundModalPayment] = useState<any | null>(null);
  const [refundForm, setRefundForm] = useState({
    reason: 'Requested by society administrator',
    customReason: '',
    refundAmount: '',
    refundReference: '',
    refundGateway: 'UPI',
    refundNotes: '',
  });
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [viewingSubInvoice, setViewingSubInvoice] = useState<any | null>(null);
  const [newSocietyForm, setNewSocietyForm] = useState({
    societyName: '',
    adminName: '',
    email: '',
    phone: '',
    password: 'Admin@123',
    address: '',
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160062',
    planId: '',
  });
  const [newPlanForm, setNewPlanForm] = useState({
    code: '',
    name: '',
    description: '',
    billingPeriod: 'MONTHLY',
    durationDays: 30,
    priceAmount: 2499,
    taxPercent: 18,
    taxName: 'GST',
    maxHouseholds: 200,
    trialEnabled: true,
    trialDays: 14,
    gracePeriodDays: 7,
    autoApproveAfterPayment: true,
  });
  const [settingsForm, setSettingsForm] = useState<any>({});

  async function loadDashboard(quiet = false) {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('planId', planFilter);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);

      const res = await apiFetch(`/api/super-admin/dashboard?${params.toString()}`);
      setData(res);
      if (res.platformSettings) {
        setSettingsForm(res.platformSettings);
      }
      if (res.plans?.length > 0 && !newSocietyForm.planId) {
        setNewSocietyForm((prev) => ({ ...prev, planId: res.plans[0].id }));
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function handleManualRefresh() {
    setIsRefreshing(true);
    try {
      await loadDashboard(true);
      notify('Super Admin dashboard & records refreshed successfully.', 'success');
    } catch (err: any) {
      notify(err.message || 'Refresh failed', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadFileAsBase64(file);
      setSettingsForm((prev: any) => ({ ...prev, logo_url: url }));
      notify('Brand logo uploaded successfully! Click "Save Platform & Gateway Settings" below to apply platform-wide.');
    } catch (err: any) {
      notify(err.message || 'Failed to upload logo image', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [statusFilter, planFilter, paymentFilter]);

  async function performSocietyAction(societyId: string, action: string, extra: Record<string, any> = {}) {
    try {
      const res = await apiFetch(`/api/super-admin/societies/${societyId}`, {
        method: 'PUT',
        body: { action, ...extra },
      });
      notify(res.message);
      setModalMode('NONE');
      loadDashboard();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  }

  function openRefundModal(sp: any) {
    setRefundModalPayment(sp);
    setRefundForm({
      reason: sp.refund_reason || 'Requested by society administrator',
      customReason: '',
      refundAmount: String(sp.refund_amount || sp.total_amount || ''),
      refundReference: sp.refund_reference || '',
      refundGateway: sp.refund_gateway || 'UPI',
      refundNotes: sp.refund_notes || '',
    });
  }

  async function handleConfirmRefund() {
    if (!refundModalPayment) return;
    const finalReason = refundForm.reason === 'Other' && refundForm.customReason ? refundForm.customReason : refundForm.reason;
    if (!finalReason) {
      notify('Please specify a refund reason.', 'error');
      return;
    }
    const amt = Number(refundForm.refundAmount) || refundModalPayment.total_amount;
    setIsSubmittingRefund(true);
    try {
      const endpoint = refundModalPayment.status === 'REFUNDED'
        ? `/api/super-admin/subscription-payments/${refundModalPayment.id}/update-refund`
        : `/api/super-admin/subscription-payments/${refundModalPayment.id}/refund`;
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: {
          reason: finalReason,
          refundAmount: amt,
          refundReference: refundForm.refundReference,
          refundGateway: refundForm.refundGateway,
          refundNotes: refundForm.refundNotes,
        },
      });
      notify(res.message);
      setRefundModalPayment(null);
      loadDashboard();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setIsSubmittingRefund(false);
    }
  }

  async function handleMarkUnpaid(sp: any) {
    const notes = window.prompt(`Enter note/reason for marking invoice #${sp.invoice_number} as UNPAID:`, 'Subscription payment is pending or dishonored');
    if (notes === null) return;
    try {
      const res = await apiFetch(`/api/super-admin/subscription-payments/${sp.id}/mark-unpaid`, {
        method: 'POST',
        body: { notes },
      });
      notify(res.message);
      if (refundModalPayment) setRefundModalPayment(null);
      loadDashboard();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  }

  async function handleMarkPaid(sp: any) {
    if (!window.confirm(`Confirm and mark invoice #${sp.invoice_number} of ${formatCurrency(sp.total_amount)} for ${sp.society_name} as PAID & ACTIVE?`)) return;
    try {
      const res = await apiFetch(`/api/super-admin/subscription-payments/${sp.id}/approve`, {
        method: 'POST',
      });
      notify(res.message);
      if (refundModalPayment) setRefundModalPayment(null);
      loadDashboard();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  }

  const kpis = data?.kpis || {};
  const societies = data?.societies || [];
  const plans = data?.plans || [];
  const subscriptionPayments = data?.subscriptionPayments || [];
  const auditLogs = data?.auditLogs || [];

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <ResponsiveLogo
            logoUrl={settingsForm.logo_url}
            platformName="Super Admin"
            defaultIcon={<Shield size={19} />}
            maxHeight={34}
            compactOnMobile={sidebarCollapsed}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', color: 'var(--text-sidebar-muted)', cursor: 'pointer' }}
              title="Toggle Sidebar"
              className="no-mobile"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className={`nav-item ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => { setActiveTab('DASHBOARD'); setMobileMenuOpen(false); }}>
            <Shield size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'dashboard')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'SOCIETIES' ? 'active' : ''}`} onClick={() => { setActiveTab('SOCIETIES'); setMobileMenuOpen(false); }}>
            <Building2 size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'societies')} ({societies.length})</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'PLANS' ? 'active' : ''}`} onClick={() => { setActiveTab('PLANS'); setMobileMenuOpen(false); }}>
            <CreditCard size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'subscriptions')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'PAYMENTS' ? 'active' : ''}`} onClick={() => { setActiveTab('PAYMENTS'); setMobileMenuOpen(false); }}>
            <FileText size={18} />
            {!sidebarCollapsed && <span>Subscription Invoices</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => { setActiveTab('SETTINGS'); setMobileMenuOpen(false); }}>
            <Settings size={18} />
            {!sidebarCollapsed && <span>Platform Settings</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'AUDIT' ? 'active' : ''}`} onClick={() => { setActiveTab('AUDIT'); setMobileMenuOpen(false); }}>
            <FileText size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'auditLogs')}</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-header-info">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t(lang, 'superAdminPortal')}
              </h2>
              <div className="topbar-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Signed in as {user?.fullName || user?.email || 'Super Admin'} ({user?.email || 'owner@societyos.com'})
              </div>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh Dashboard & Metrics"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Light/Dark Theme">
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={onLogout} title={t(lang, 'logout')}>
              <LogOut size={14} /> <span>{t(lang, 'logout')}</span>
            </button>
          </div>
        </header>

        <main className="page-content">
          {/* KPI OVERVIEW (Displayed on Dashboard & Societies tab) */}
          {(activeTab === 'DASHBOARD' || activeTab === 'SOCIETIES') && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Total Societies Registered</span>
                  <span className="kpi-value">{kpis.totalSocieties ?? 0}</span>
                  <span className="kpi-sub">New this month: {kpis.newRegistrationsThisMonth ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Active Paid Societies</span>
                  <span className="kpi-value" style={{ color: 'var(--success)' }}>{kpis.activeSocieties ?? 0}</span>
                  <span className="kpi-sub">Trial Societies: {kpis.trialSocieties ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Pending Society Approvals</span>
                  <span className="kpi-value" style={{ color: 'var(--warning)' }}>{kpis.pendingApprovals ?? 0}</span>
                  <span className="kpi-sub">Suspended: {kpis.suspendedSocieties ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Expired / Renewals Due</span>
                  <span className="kpi-value" style={{ color: 'var(--danger)' }}>
                    {kpis.expiredSubscriptions ?? 0} / {kpis.renewalsDue ?? 0}
                  </span>
                  <span className="kpi-sub">Failed payments: {kpis.failedSubscriptionPayments ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Confirmed SaaS Revenue</span>
                  <span className="kpi-value" style={{ color: 'var(--primary)' }}>
                    {formatCurrency(kpis.confirmedSubscriptionRevenue)}
                  </span>
                  <span className="kpi-sub">Pending Orders: {formatCurrency(kpis.pendingSubscriptionPayments)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Monthly / Annual Revenue</span>
                  <span className="kpi-value">{formatCurrency(kpis.monthlyRevenueSummary)}</span>
                  <span className="kpi-sub">Annual: {formatCurrency(kpis.annualRevenueSummary)}</span>
                </div>
              </div>

              {/* Society Management Table */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Registered Societies & Tenant Accounts</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Approve, suspend, extend trials, change plans, or send reminders to society administrators.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        downloadCsv(
                          'societies-report.csv',
                          ['Society Name', 'Admin', 'Email', 'Phone', 'Plan', 'Sub Status', 'Approval', 'Account', 'Payment'],
                          societies.map((s: any) => [
                            s.name,
                            s.admin_name,
                            s.contact_email,
                            s.contact_phone,
                            s.plan_name,
                            s.subscription_status,
                            s.approval_status,
                            s.account_status,
                            s.payment_status,
                          ])
                        )
                      }
                    >
                      <Download size={14} /> Export CSV
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalMode('CREATE_SOCIETY')}>
                      <Plus size={15} /> Create Society Account
                    </button>
                  </div>
                </div>

                {/* Filters Bar */}
                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Search society, admin, email, city..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" onClick={loadDashboard}>
                      <Search size={15} />
                    </button>
                  </div>
                  <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Subscription / Account Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                  <select className="select" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                    <option value="">All Subscription Plans</option>
                    {plans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select className="select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                    <option value="">All Payment Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="TRIAL">Trial</option>
                    <option value="PENDING">Pending</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Society Name</th>
                        <th>Administrator</th>
                        <th>Contact</th>
                        <th>Plan & Households</th>
                        <th>Trial / Sub Expiry</th>
                        <th>Payment</th>
                        <th>Approval</th>
                        <th>Account</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {societies.map((s: any) => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{s.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Code: <code>{s.enrollment_code}</code> • {s.city}
                              {Boolean(s.is_demo) && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Demo</span>}
                            </div>
                          </td>
                          <td>{s.admin_name || 'Admin'}</td>
                          <td>
                            <div>{s.contact_email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.contact_phone}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{s.plan_name || 'Standard'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700 }}>
                              {formatCurrency(s.total_amount_due || s.plan_price || 0)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(incl. GST)</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{s.household_count ?? 0} Flats</div>
                          </td>
                          <td>
                            <span className={`badge ${s.subscription_status === 'ACTIVE' ? 'badge-success' : s.subscription_status === 'TRIAL' ? 'badge-info' : 'badge-warning'}`}>
                              {s.subscription_status}
                            </span>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
                              Exp: {(s.subscription_ends_at || s.trial_ends_at || '').slice(0, 10) || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: (s.days_remaining ?? 14) <= 14 ? '#d97706' : '#059669', marginTop: 2 }}>
                              {(s.days_remaining ?? 14) >= 0
                                ? `${s.days_remaining ?? 14} days pending to renew`
                                : `Overdue by ${Math.abs(s.days_remaining)} days`}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${s.payment_status === 'PAID' ? 'badge-success' : s.payment_status === 'TRIAL' ? 'badge-info' : 'badge-warning'}`}>
                              {s.payment_status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${s.approval_status === 'APPROVED' ? 'badge-success' : s.approval_status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                              {s.approval_status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${s.account_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {s.account_status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedSociety(s);
                                  setModalMode('VIEW_SOCIETY');
                                }}
                              >
                                Details
                              </button>
                              {s.approval_status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => performSocietyAction(s.id, 'APPROVE')}
                                  title="Approve Society"
                                >
                                  <CheckCircle size={13} /> Approve
                                </button>
                              )}
                              {s.approval_status === 'PENDING' && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => performSocietyAction(s.id, 'REJECT')}
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              )}
                              {s.account_status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    if (window.confirm(`Suspend society account "${s.name}"?`)) {
                                      performSocietyAction(s.id, 'SUSPEND');
                                    }
                                  }}
                                >
                                  <PauseCircle size={13} /> Suspend
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => performSocietyAction(s.id, 'REACTIVATE')}
                                >
                                  <PlayCircle size={13} /> Reactivate
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedSociety(s);
                                  setModalMode('EXTEND_TRIAL');
                                }}
                              >
                                <Clock size={13} /> Extend Trial
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  const amt = Number(s.total_amount_due || s.plan_price || 5499);
                                  const days = Number(s.days_remaining ?? 14);
                                  setSelectedSociety(s);
                                  setNotifyType('SUBSCRIPTION_PAYMENT_DUE');
                                  setNotifyAmountDue(String(amt));
                                  setNotifyDaysPending(String(days));
                                  setNotifyTitle(
                                    `Subscription Payment Due for Approval — ${s.plan_name || 'Society Plan'} (${formatCurrency(amt)})`
                                  );
                                  setNotifyMessage(
                                    `Super Admin Notice: Subscription payment of ${formatCurrency(amt)} (incl. 18% GST) for ${s.name} (${s.plan_name || 'Standard Plan'}) is due with ${days >= 0 ? `${days} days pending to renew` : `${Math.abs(days)} days overdue`}. Please complete your subscription renewal payment from your Society Admin Dashboard for Super Admin approval and uninterrupted service.`
                                  );
                                  setModalMode('NOTIFY_ADMIN');
                                }}
                              >
                                <Bell size={13} /> Notify Payment Due
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB: SUBSCRIPTION PLANS */}
          {activeTab === 'PLANS' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3>Subscription Plans, Free Trials & Pricing Rules</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Configure monthly, quarterly, annual, or custom plans, tax percentages, household limits, and free trial durations.
                  </p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalMode('CREATE_PLAN')}>
                  <Plus size={15} /> Add (+) Subscription Plan
                </button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code & Name</th>
                      <th>Billing Period</th>
                      <th>Price + Tax</th>
                      <th>Max Households</th>
                      <th>Trial Duration</th>
                      <th>Grace Period</th>
                      <th>Auto-Approve Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><code>{p.code}</code></div>
                        </td>
                        <td>{p.billing_period} ({p.duration_days} days)</td>
                        <td>{formatCurrency(p.price_amount)} + {p.tax_percent}% GST</td>
                        <td>{p.max_households} Flats</td>
                        <td>{p.trial_enabled ? `${p.trial_days} Days` : 'Disabled'}</td>
                        <td>{p.grace_period_days} Days</td>
                        <td>
                          <span className={`badge ${p.auto_approve_after_payment ? 'badge-success' : 'badge-warning'}`}>
                            {p.auto_approve_after_payment ? 'Automatic' : 'Manual Approval'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SUBSCRIPTION INVOICES, PROOF VERIFICATIONS & REFUNDS */}
          {activeTab === 'PAYMENTS' && (() => {
            const totalInvoicedAmount = subscriptionPayments.reduce((acc: number, p: any) => acc + Number(p.total_amount || 0), 0);
            const paidPayments = subscriptionPayments.filter((p: any) => p.status === 'PAID');
            const unpaidPayments = subscriptionPayments.filter((p: any) => p.status === 'CREATED' || p.status === 'PENDING_APPROVAL');
            const refundedPayments = subscriptionPayments.filter((p: any) => p.status === 'REFUNDED');
            const failedPayments = subscriptionPayments.filter((p: any) => p.status === 'FAILED');

            const totalPaidAmount = paidPayments.reduce((acc: number, p: any) => acc + Number(p.total_amount || 0), 0);
            const totalUnpaidAmount = unpaidPayments.reduce((acc: number, p: any) => acc + Number(p.total_amount || 0), 0);
            const totalRefundedAmount = refundedPayments.reduce((acc: number, p: any) => acc + Number(p.refund_amount || p.total_amount || 0), 0);

            const filteredPayments = subscriptionPayments.filter((p: any) => {
              if (paymentStatusFilter === 'PAID' && p.status !== 'PAID') return false;
              if (paymentStatusFilter === 'UNPAID' && p.status !== 'CREATED' && p.status !== 'PENDING_APPROVAL') return false;
              if (paymentStatusFilter === 'REFUNDED' && p.status !== 'REFUNDED') return false;
              if (paymentStatusFilter === 'FAILED' && p.status !== 'FAILED') return false;

              if (paymentSearch.trim()) {
                const q = paymentSearch.toLowerCase().trim();
                const matchSoc = (p.society_name || '').toLowerCase().includes(q);
                const matchInv = (p.invoice_number || '').toLowerCase().includes(q);
                const matchRef = (p.gateway_payment_id || '').toLowerCase().includes(q);
                const matchRefundRef = (p.refund_reference || '').toLowerCase().includes(q);
                return matchSoc || matchInv || matchRef || matchRefundRef;
              }
              return true;
            });

            return (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Society Subscription Invoices & Payment Verifications</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                      Audit invoices, verify manual UPI transfers, issue refunds, mark unpaid/paid, or inspect credit notes.
                    </p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleManualRefresh} disabled={isRefreshing}>
                    <RefreshCw size={13} className={isRefreshing ? 'spin-animation' : ''} />
                    <span>Refresh Payments</span>
                  </button>
                </div>

                {/* KPI Metrics Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.85rem', background: 'var(--surface-sunken)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Invoiced</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 2 }}>{formatCurrency(totalInvoicedAmount)}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{subscriptionPayments.length} Total Invoices</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700 }}>Verified & Paid</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>{formatCurrency(totalPaidAmount)}</div>
                    <div style={{ fontSize: '0.74rem', color: '#047857' }}>{paidPayments.length} Active Subscriptions</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.72rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 700 }}>Unpaid / Pending</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', marginTop: 2 }}>{formatCurrency(totalUnpaidAmount)}</div>
                    <div style={{ fontSize: '0.74rem', color: '#b45309' }}>{unpaidPayments.length} Pending Approval</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: '0.72rem', color: '#5b21b6', textTransform: 'uppercase', fontWeight: 700 }}>Refunds Issued</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c3aed', marginTop: 2 }}>{formatCurrency(totalRefundedAmount)}</div>
                    <div style={{ fontSize: '0.74rem', color: '#6d28d9' }}>{refundedPayments.length} Credit Notes</div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(['ALL', 'PAID', 'UNPAID', 'REFUNDED', 'FAILED'] as const).map((filterKey) => (
                      <button
                        key={filterKey}
                        type="button"
                        className={`btn btn-sm ${paymentStatusFilter === filterKey ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem' }}
                        onClick={() => setPaymentStatusFilter(filterKey)}
                      >
                        {filterKey === 'ALL' && `All (${subscriptionPayments.length})`}
                        {filterKey === 'PAID' && `Paid (${paidPayments.length})`}
                        {filterKey === 'UNPAID' && `Unpaid (${unpaidPayments.length})`}
                        {filterKey === 'REFUNDED' && `Refund Issued (${refundedPayments.length})`}
                        {filterKey === 'FAILED' && `Rejected (${failedPayments.length})`}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 240 }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search society, invoice #, UTR..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        style={{ paddingLeft: '2rem', fontSize: '0.82rem' }}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="table-wrap">
                  <table className="data-table data-table-wide">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 155, whiteSpace: 'nowrap' }}>Invoice #</th>
                        <th style={{ minWidth: 140 }}>Society</th>
                        <th style={{ minWidth: 120, whiteSpace: 'nowrap' }}>Plan</th>
                        <th style={{ minWidth: 130, whiteSpace: 'nowrap' }}>Total Amount</th>
                        <th style={{ minWidth: 190 }}>Method & Reference</th>
                        <th style={{ minWidth: 120, whiteSpace: 'nowrap' }}>Proof / Receipt</th>
                        <th style={{ minWidth: 140, whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ minWidth: 100, whiteSpace: 'nowrap' }}>Date</th>
                        <th style={{ minWidth: 180 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No subscription invoices matching the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((sp: any) => (
                          <tr key={sp.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                                onClick={() => setViewingSubInvoice(sp)}
                                title="Click to view full printable invoice / refund credit note"
                              >
                                {sp.invoice_number}
                              </button>
                            </td>
                            <td>
                              <strong>{sp.society_name}</strong>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{sp.plan_name}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <strong style={{ color: 'var(--primary)' }}>{formatCurrency(sp.total_amount)}</strong>
                              {sp.tax_amount > 0 && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  Incl. {formatCurrency(sp.tax_amount)} tax
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 2, flexWrap: 'wrap' }}>
                                <span className={`badge ${sp.payment_gateway === 'UPI' ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                  {sp.payment_gateway || 'ONLINE'}
                                </span>
                                {sp.gateway_payment_id && (
                                  <code style={{ fontSize: '0.78rem', fontWeight: 600, wordBreak: 'break-all' }}>{sp.gateway_payment_id}</code>
                                )}
                              </div>
                              {sp.gateway_order_id && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>Order: {sp.gateway_order_id}</div>
                              )}
                              {sp.notes && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                                  "{sp.notes}"
                                </div>
                              )}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {sp.receipt_url ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                  onClick={() => setSelectedReceipt({
                                    url: sp.receipt_url,
                                    societyName: sp.society_name,
                                    invoiceNo: sp.invoice_number,
                                    amount: sp.total_amount,
                                    utr: sp.gateway_payment_id,
                                  })}
                                >
                                  <Eye size={13} />
                                  <span>View Proof</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>No file attached</span>
                              )}
                            </td>
                            <td>
                              {sp.status === 'PAID' && (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                  <CheckCircle size={12} /> Paid
                                </span>
                              )}
                              {(sp.status === 'CREATED' || sp.status === 'PENDING_APPROVAL') && (
                                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                  <Clock size={12} /> {sp.status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Unpaid'}
                                </span>
                              )}
                              {sp.status === 'REFUNDED' && (
                                <div>
                                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ede9fe', color: '#6d28d9', borderColor: '#c4b5fd', whiteSpace: 'nowrap' }}>
                                    <RotateCcw size={12} /> Refund Issued
                                  </span>
                                  {sp.refund_amount && (
                                    <div style={{ fontSize: '0.72rem', color: '#6d28d9', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap' }}>
                                      {formatCurrency(sp.refund_amount)} refunded
                                    </div>
                                  )}
                                  {sp.refund_reference && (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                      Ref: <code>{sp.refund_reference}</code>
                                    </div>
                                  )}
                                  {sp.refund_reason && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sp.refund_reason}>
                                      "{sp.refund_reason}"
                                    </div>
                                  )}
                                </div>
                              )}
                              {sp.status === 'FAILED' && (
                                <div>
                                  <span className="badge badge-danger" style={{ whiteSpace: 'nowrap' }}>Rejected</span>
                                  {sp.rejection_reason && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 2 }}>
                                      Reason: {sp.rejection_reason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{(sp.paid_at || sp.created_at || '').slice(0, 10)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {/* Action: Unpaid / Pending -> Approve (Paid), Auto-Verify, Reject */}
                                {(sp.status === 'CREATED' || sp.status === 'PENDING_APPROVAL') && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      title="Manually confirm payment and activate society"
                                      onClick={() => handleMarkPaid(sp)}
                                    >
                                      <Check size={13} /> Approve (Paid)
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      title="Auto-validate UTR and activate"
                                      onClick={async () => {
                                        try {
                                          const res = await apiFetch(`/api/super-admin/subscription-payments/${sp.id}/auto-verify`, {
                                            method: 'POST',
                                          });
                                          notify(res.message);
                                          loadDashboard();
                                        } catch (err: any) {
                                          notify(err.message, 'error');
                                        }
                                      }}
                                    >
                                      <Sparkles size={13} /> Auto
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      title="Reject invalid payment"
                                      onClick={async () => {
                                        const reason = window.prompt('Enter rejection reason for society admin:', 'UTR number could not be verified in bank records');
                                        if (!reason) return;
                                        try {
                                          const res = await apiFetch(`/api/super-admin/subscription-payments/${sp.id}/reject`, {
                                            method: 'POST',
                                            body: { reason },
                                          });
                                          notify(res.message);
                                          loadDashboard();
                                        } catch (err: any) {
                                          notify(err.message, 'error');
                                        }
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {/* Action: Paid -> Issue Refund or Mark Unpaid */}
                                {sp.status === 'PAID' && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ borderColor: '#c4b5fd', color: '#6d28d9', fontWeight: 600 }}
                                      title="Issue full or partial refund to society"
                                      onClick={() => openRefundModal(sp)}
                                    >
                                      <RotateCcw size={13} /> Refund Issue
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      title="Mark subscription invoice as unpaid / pending payment"
                                      onClick={() => handleMarkUnpaid(sp)}
                                    >
                                      <Clock size={13} /> Mark Unpaid
                                    </button>
                                  </>
                                )}

                                {/* Action: Refunded -> Refund Details & Actions ("if refunded back to refund issue") */}
                                {sp.status === 'REFUNDED' && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderColor: '#c4b5fd', color: '#6d28d9', fontWeight: 700 }}
                                    title="View or update refund issue details, revert to unpaid or re-confirm paid"
                                    onClick={() => openRefundModal(sp)}
                                  >
                                    <RotateCcw size={13} /> Refund Details & Actions
                                  </button>
                                )}

                                {/* Always: View Printable Invoice */}
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title="View official subscription invoice or credit note"
                                  onClick={() => setViewingSubInvoice(sp)}
                                >
                                  <FileText size={13} /> Invoice
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TAB: PLATFORM SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Platform-Wide SaaS Configuration, Gateways & Customization</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                    Configure responsive logos, subscription tax rules, payment gateway toggles, SEO meta tags, and Google AdSense monetization.
                  </p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleManualRefresh} disabled={isRefreshing}>
                  <RefreshCw size={13} className={isRefreshing ? 'spin-animation' : ''} />
                  <span>Reload Settings</span>
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await apiFetch('/api/super-admin/settings', {
                      method: 'PUT',
                      body: {
                        platformName: settingsForm.platform_name,
                        supportEmail: settingsForm.support_email,
                        supportPhone: settingsForm.support_phone,
                        defaultTrialEnabled: Boolean(settingsForm.default_trial_enabled),
                        defaultTrialDays: Number(settingsForm.default_trial_days),
                        defaultGracePeriodDays: Number(settingsForm.default_grace_period_days),
                        autoApprovePaidSocieties: Boolean(settingsForm.auto_approve_paid_societies),
                        autoApproveTrialSocieties: Boolean(settingsForm.auto_approve_trial_societies),
                        razorpayKeyId: settingsForm.razorpay_key_id,
                        razorpayKeySecret: settingsForm.razorpay_key_secret || undefined,
                        razorpayWebhookSecret: settingsForm.razorpay_webhook_secret || undefined,
                        paytmMerchantId: settingsForm.paytm_merchant_id,
                        paytmMerchantKey: settingsForm.paytm_merchant_key || undefined,
                        customGatewayName: settingsForm.custom_gateway_name,
                        customGatewayApiKey: settingsForm.custom_gateway_api_key,
                        customGatewaySecret: settingsForm.custom_gateway_secret || undefined,
                        upiId: settingsForm.upi_id,
                        upiPayeeName: settingsForm.upi_payee_name,
                        bankName: settingsForm.bank_name,
                        bankAccountNumber: settingsForm.bank_account_number,
                        bankIfsc: settingsForm.bank_ifsc,
                        razorpaySandboxMode: Boolean(settingsForm.razorpay_sandbox_mode),
                        welcomeEmailTemplate: settingsForm.welcome_email_template,

                        // Subscription Taxes
                        subscriptionTaxEnabled: Boolean(settingsForm.subscription_tax_enabled ?? 1),
                        subscriptionTaxName: settingsForm.subscription_tax_name || 'GST',
                        subscriptionTaxPercent: Number(settingsForm.subscription_tax_percent ?? 18),

                        // Master Payment Gateway Controls
                        razorpayEnabled: Boolean(settingsForm.razorpay_enabled ?? 1),
                        upiPaymentEnabled: Boolean(settingsForm.upi_payment_enabled ?? 1),
                        paytmEnabled: Boolean(settingsForm.paytm_enabled ?? 0),
                        customGatewayEnabled: Boolean(settingsForm.custom_gateway_enabled ?? 0),

                        // SEO & Monetization
                        metaTitle: settingsForm.meta_title,
                        metaDescription: settingsForm.meta_description,
                        metaKeywords: settingsForm.meta_keywords,
                        metaAuthor: settingsForm.meta_author,
                        metaOgImage: settingsForm.meta_og_image,
                        faviconUrl: settingsForm.favicon_url,
                        googleAdsenseEnabled: Boolean(settingsForm.google_adsense_enabled ?? 0),
                        googleAdsenseClientId: settingsForm.google_adsense_client_id,
                        googleAdSlotHeader: settingsForm.google_ad_slot_header,
                        googleAdSlotSidebar: settingsForm.google_ad_slot_sidebar,
                        googleAdSlotFooter: settingsForm.google_ad_slot_footer,
                        googleAnalyticsId: settingsForm.google_analytics_id,
                        customHeaderScripts: settingsForm.custom_header_scripts,

                        // Responsive Branding & Logo
                        logoUrl: settingsForm.logo_url,
                        darkLogoUrl: settingsForm.dark_logo_url,
                      },
                    });
                    notify(res.message);
                    setSettingsForm((prev: any) => ({
                      ...prev,
                      razorpay_key_secret: '',
                      razorpay_webhook_secret: '',
                      paytm_merchant_key: '',
                      custom_gateway_secret: '',
                    }));
                    loadDashboard();
                  } catch (err: any) {
                    notify(err.message, 'error');
                  }
                }}
                style={{ display: 'grid', gap: '1.5rem' }}
              >
                {/* 1. BRANDING & RESPONSIVE LOGO */}
                <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <ImageIcon size={19} style={{ color: 'var(--primary)' }} />
                    <h4 style={{ margin: 0, fontSize: '0.98rem' }}>1. Platform Branding & Responsive Logo</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Upload or specify your platform brand logo. The logo dynamically adapts across desktop, tablet, mobile navigation bars, and PDF invoices.
                  </p>

                  <div className="form-grid" style={{ alignItems: 'flex-start' }}>
                    <div className="form-group">
                      <label>Platform Logo URL or File</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="https://... or upload local file"
                          value={settingsForm.logo_url || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                        />
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: isUploadingLogo ? 'wait' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Upload size={14} />
                          <span>{isUploadingLogo ? 'Uploading...' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            style={{ display: 'none' }}
                            disabled={isUploadingLogo}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleLogoUpload(f);
                            }}
                          />
                        </label>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Supported: PNG, SVG, JPG, WebP. Recommended transparent background (max height 60px).
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Live Responsive Preview (Multi-Device)</label>
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 8,
                          background: 'var(--bg-surface, #ffffff)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Desktop Topbar:</span>
                          <ResponsiveLogo
                            logoUrl={settingsForm.logo_url}
                            platformName={settingsForm.platform_name || 'SocietyOS SaaS'}
                            maxHeight={36}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: 6 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mobile Compact:</span>
                          <ResponsiveLogo
                            logoUrl={settingsForm.logo_url}
                            platformName={settingsForm.platform_name || 'SocietyOS SaaS'}
                            maxHeight={28}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. GENERAL PLATFORM DETAILS */}
                <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.98rem' }}>2. Platform Contact & Support Profile</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Platform Brand Name</label>
                      <input
                        type="text"
                        className="input"
                        value={settingsForm.platform_name || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, platform_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Support Email</label>
                      <input
                        type="email"
                        className="input"
                        value={settingsForm.support_email || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Support Phone</label>
                      <input
                        type="text"
                        className="input"
                        value={settingsForm.support_phone || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, support_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SUBSCRIPTION TAX & INVOICING RULES */}
                <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Percent size={18} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ margin: 0, fontSize: '0.98rem' }}>3. Subscription Taxes & GST Setup</h4>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.subscription_tax_enabled ?? 1)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, subscription_tax_enabled: e.target.checked ? 1 : 0 })}
                      />
                      <span className="toggle-slider"></span>
                      <span>{settingsForm.subscription_tax_enabled ? 'Taxes Active (ON)' : 'Taxes Disabled (OFF)'}</span>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Configure the tax percentage and tax authority label applied to society subscription billing and invoices platform-wide.
                  </p>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Tax Name / Label</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="GST, VAT, Sales Tax, Service Tax"
                        value={settingsForm.subscription_tax_name || 'GST'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, subscription_tax_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Default Tax Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="input"
                        value={settingsForm.subscription_tax_percent ?? 18}
                        onChange={(e) => setSettingsForm({ ...settingsForm, subscription_tax_percent: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Calculation Example</label>
                      <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                        <div>Base Price: <strong>₹2,499.00</strong></div>
                        <div>
                          {settingsForm.subscription_tax_enabled ? (
                            <>
                              + {settingsForm.subscription_tax_percent ?? 18}% {settingsForm.subscription_tax_name || 'GST'}:{' '}
                              <strong>₹{((2499 * Number(settingsForm.subscription_tax_percent ?? 18)) / 100).toFixed(2)}</strong>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Taxes Disabled (₹0.00)</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                          Payable Total:{' '}
                          ₹{settingsForm.subscription_tax_enabled
                            ? (2499 * (1 + Number(settingsForm.subscription_tax_percent ?? 18) / 100)).toFixed(2)
                            : '2499.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. MASTER PAYMENT GATEWAY CONTROLS WITH ON/OFF TOGGLES */}
                <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={19} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ margin: 0, fontSize: '0.98rem' }}>4. Master Payment Gateway Controls (ON / OFF Toggles)</h4>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Individually enable or disable payment gateways. When a gateway is toggled OFF, societies cannot check out with that method.
                    </p>
                  </div>

                  {/* GATEWAY 1: RAZORPAY */}
                  <div style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>Gateway 1: Razorpay Online Checkout (Cards / NetBanking / UPI)</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Automated instant subscription activation via webhook</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsForm.razorpay_enabled ?? 1)}
                          onChange={(e) => setSettingsForm({ ...settingsForm, razorpay_enabled: e.target.checked ? 1 : 0 })}
                        />
                        <span className="toggle-slider"></span>
                        <span style={{ color: settingsForm.razorpay_enabled ? '#10b981' : '#64748b' }}>
                          {settingsForm.razorpay_enabled ? 'Razorpay ON (Active)' : 'Razorpay OFF (Disabled)'}
                        </span>
                      </label>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Razorpay Key ID (Public Key)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="rzp_live_xxxxxxxxxxxx or rzp_test_xxxxxxxxxxxx"
                          value={settingsForm.razorpay_key_id || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, razorpay_key_id: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Razorpay Key Secret{' '}
                          {settingsForm.has_razorpay_secret && (
                            <span className="badge badge-success" style={{ marginLeft: '0.35rem', fontSize: '0.68rem' }}>
                              Saved (Encrypted)
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder={settingsForm.has_razorpay_secret ? '•••••••••••••••• (Enter new to replace)' : 'Enter Razorpay Key Secret'}
                          value={settingsForm.razorpay_key_secret || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, razorpay_key_secret: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Razorpay Webhook Secret (Optional){' '}
                          {settingsForm.has_razorpay_webhook_secret && (
                            <span className="badge badge-success" style={{ marginLeft: '0.35rem', fontSize: '0.68rem' }}>
                              Saved
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder={settingsForm.has_razorpay_webhook_secret ? '••••••••••••••••' : 'whsec_xxxxxxxxxxxx'}
                          value={settingsForm.razorpay_webhook_secret || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, razorpay_webhook_secret: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* GATEWAY 2: DIRECT UPI QR & BANK TRANSFER WITH LIVE CARD PREVIEW */}
                  <div style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>Gateway 2: Direct UPI QR Code & Bank Transfer</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Generates dynamic scannable QR card with manual or automated verification</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsForm.upi_payment_enabled ?? 1)}
                          onChange={(e) => setSettingsForm({ ...settingsForm, upi_payment_enabled: e.target.checked ? 1 : 0 })}
                        />
                        <span className="toggle-slider"></span>
                        <span style={{ color: settingsForm.upi_payment_enabled ? '#10b981' : '#64748b' }}>
                          {settingsForm.upi_payment_enabled ? 'UPI Payment ON (Active)' : 'UPI Payment OFF (Disabled)'}
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                      {/* Left: Input Fields */}
                      <div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label>Platform UPI ID (VPA) *</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. taxprofessionals97-1@okaxis or company@icici"
                            value={settingsForm.upi_id || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label>UPI Payee / Account Name</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. SocietyOS Enterprise SaaS"
                            value={settingsForm.upi_payee_name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, upi_payee_name: e.target.value })}
                          />
                        </div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Bank Name</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="HDFC / SBI / ICICI"
                              value={settingsForm.bank_name || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Account Number</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="Bank Account Number"
                              value={settingsForm.bank_account_number || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '0.75rem' }}>
                          <label>IFSC Code</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. HDFC0001234"
                            value={settingsForm.bank_ifsc || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bank_ifsc: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>

                      {/* Right: Live Dynamic UPI QR Code Card */}
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                          LIVE UPI QR CARD PREVIEW (AS SEEN BY SOCIETIES)
                        </div>
                        <UpiQrCard
                          upiId={settingsForm.upi_id}
                          payeeName={settingsForm.upi_payee_name || 'SocietyOS Platform'}
                          amount={2499}
                          note="Subscription Renewal Sample"
                          onCopySuccess={(msg) => notify(msg)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* GATEWAY 3: PAYTM & CUSTOM GATEWAY */}
                  <div style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.92rem' }}>Gateway 3: Paytm & Custom Gateway Provider (PhonePe / Cashfree / Stripe)</strong>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsForm.paytm_enabled ?? 0)}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paytm_enabled: e.target.checked ? 1 : 0 })}
                        />
                        <span className="toggle-slider"></span>
                        <span>{settingsForm.paytm_enabled ? 'Paytm ON' : 'Paytm OFF'}</span>
                      </label>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Paytm Merchant ID (MID)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="PLATFORM1234567890"
                          value={settingsForm.paytm_merchant_id || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paytm_merchant_id: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Paytm Merchant Key</label>
                        <input
                          type="password"
                          className="input"
                          placeholder="Enter Paytm Merchant Key"
                          value={settingsForm.paytm_merchant_key || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paytm_merchant_key: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>Custom Gateway Name (e.g. Cashfree, Stripe)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Cashfree PG"
                          value={settingsForm.custom_gateway_name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, custom_gateway_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Custom Gateway API Key</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter App ID / Public Key"
                          value={settingsForm.custom_gateway_api_key || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, custom_gateway_api_key: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. SEO META TAGS & GOOGLE ADSENSE MONETIZATION */}
                <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Globe size={19} style={{ color: 'var(--primary)' }} />
                    <h4 style={{ margin: 0, fontSize: '0.98rem' }}>5. SEO Meta Tags & Google AdSense Monetization</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Customize SEO meta tags for high Google rankings and configure Google AdSense monetization banners.
                  </p>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>SEO Meta Title</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="SocietyOS — Multi-Tenant Residential Society & RWA Software"
                        value={settingsForm.meta_title || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Browser Favicon URL</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="https://.../favicon.ico or /favicon.ico"
                        value={settingsForm.favicon_url || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, favicon_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: '0.75rem 0' }}>
                    <label>SEO Meta Description</label>
                    <textarea
                      rows={2}
                      className="textarea"
                      placeholder="Comprehensive cloud residential society accounting, billing, maintenance, and resident portal."
                      value={settingsForm.meta_description || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, meta_description: e.target.value })}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>SEO Keywords (comma separated)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="society management, apartment billing, rwa software, housing society erp"
                        value={settingsForm.meta_keywords || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_keywords: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Social Share (OpenGraph) Image URL</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="https://.../og-banner.jpg"
                        value={settingsForm.meta_og_image || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_og_image: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Google AdSense Section */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>Google AdSense Monetization Banners</strong>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsForm.google_adsense_enabled ?? 0)}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_adsense_enabled: e.target.checked ? 1 : 0 })}
                        />
                        <span className="toggle-slider"></span>
                        <span>{settingsForm.google_adsense_enabled ? 'Google Ads ON' : 'Google Ads OFF'}</span>
                      </label>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Google AdSense Client ID (Publisher ID)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="ca-pub-1234567890123456"
                          value={settingsForm.google_adsense_client_id || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_adsense_client_id: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Header Ad Slot ID</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. 1234567890"
                          value={settingsForm.google_ad_slot_header || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_ad_slot_header: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Sidebar Ad Slot ID</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. 9876543210"
                          value={settingsForm.google_ad_slot_sidebar || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_ad_slot_sidebar: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Google Analytics ID (G-XXXXXXXXXX)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="G-XXXXXXXXXX"
                          value={settingsForm.google_analytics_id || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, google_analytics_id: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                      <label>Custom Header / AdSense &lt;head&gt; Scripts</label>
                      <textarea
                        rows={2}
                        className="textarea"
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                        placeholder="<script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js' ...></script>"
                        value={settingsForm.custom_header_scripts || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, custom_header_scripts: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. POLICIES & AUTOMATION */}
                <div style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.98rem' }}>6. Trial Policies & Email Automation</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Default Trial Duration (Days)</label>
                      <input
                        type="number"
                        className="input"
                        value={settingsForm.default_trial_days ?? 14}
                        onChange={(e) => setSettingsForm({ ...settingsForm, default_trial_days: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Default Grace Period (Days)</label>
                      <input
                        type="number"
                        className="input"
                        value={settingsForm.default_grace_period_days ?? 7}
                        onChange={(e) => setSettingsForm({ ...settingsForm, default_grace_period_days: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.default_trial_enabled)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, default_trial_enabled: e.target.checked ? 1 : 0 })}
                      />
                      Enable Free Trial for New Registrations
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.auto_approve_paid_societies)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, auto_approve_paid_societies: e.target.checked ? 1 : 0 })}
                      />
                      Auto-Approve Societies After Verified Payment
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.razorpay_sandbox_mode)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, razorpay_sandbox_mode: e.target.checked ? 1 : 0 })}
                      />
                      Razorpay Sandbox Mode (Test Transactions)
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.85rem', fontSize: '0.96rem', fontWeight: 700 }}
                  >
                    Save Platform, Gateway & Branding Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'AUDIT' && (
            <div className="card">
              <h3>Platform Activity & Security Audit Logs</h3>
              <div className="table-wrap" style={{ marginTop: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor Role</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td>{log.created_at}</td>
                        <td><span className="badge badge-info">{log.actor_role}</span></td>
                        <td><strong>{log.action}</strong></td>
                        <td>{log.entity_type}</td>
                        <td><code style={{ fontSize: '0.75rem' }}>{log.details}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: VIEW / EDIT SOCIETY DETAILS */}
      {modalMode === 'VIEW_SOCIETY' && selectedSociety && (
        <div className="modal-backdrop" onClick={() => setModalMode('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Society Profile — {selectedSociety.name}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalMode('NONE')}>Close</button>
            </div>
            <div className="form-grid" style={{ marginBottom: '1rem' }}>
              <div><strong>Enrolment Code:</strong> <code>{selectedSociety.enrollment_code}</code></div>
              <div><strong>Administrator:</strong> {selectedSociety.admin_name}</div>
              <div><strong>Email:</strong> {selectedSociety.contact_email}</div>
              <div><strong>Phone:</strong> {selectedSociety.contact_phone}</div>
              <div><strong>Address:</strong> {selectedSociety.address}, {selectedSociety.city}</div>
              <div><strong>Registered On:</strong> {selectedSociety.created_at}</div>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Change Subscription Plan</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="select"
                  value={selectedSociety.subscription_plan_id || ''}
                  onChange={(e) => setSelectedSociety({ ...selectedSociety, subscription_plan_id: e.target.value })}
                >
                  {plans.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price_amount)})</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => performSocietyAction(selectedSociety.id, 'CHANGE_PLAN', { planId: selectedSociety.subscription_plan_id })}
                >
                  Update Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXTEND TRIAL WITH RECORDED REASON */}
      {modalMode === 'EXTEND_TRIAL' && selectedSociety && (
        <div className="modal-backdrop" onClick={() => setModalMode('NONE')}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3>Extend Trial — {selectedSociety.name}</h3>
            <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Additional Trial Days *</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  className="input"
                  value={trialExtendDays}
                  onChange={(e) => setTrialExtendDays(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Recorded Audit Reason *</label>
                <textarea
                  rows={3}
                  required
                  className="textarea"
                  placeholder="Enter reason for extending trial..."
                  value={trialExtendReason}
                  onChange={(e) => setTrialExtendReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode('NONE')}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    performSocietyAction(selectedSociety.id, 'EXTEND_TRIAL', {
                      extendDays: Number(trialExtendDays),
                      reason: trialExtendReason,
                    })
                  }
                >
                  Confirm Trial Extension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND NOTIFICATION TO SOCIETY ADMIN */}
      {modalMode === 'NOTIFY_ADMIN' && selectedSociety && (
        <div className="modal-backdrop" onClick={() => setModalMode('NONE')}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <h3>Send Payment Due / Renewal Notice to {selectedSociety.name}</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
              This notification will be displayed prominently on the <strong>Society Admin Dashboard</strong> along with the payable subscription amount, days pending to renew, and a direct Razorpay payment button.
            </p>
            <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Notification Category *</label>
                  <select
                    className="select"
                    value={notifyType}
                    onChange={(e) => setNotifyType(e.target.value as any)}
                  >
                    <option value="SUBSCRIPTION_PAYMENT_DUE">Subscription Payment Due & Approval</option>
                    <option value="PLATFORM_NOTICE">General Platform Notice</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Plan & Current Status</label>
                  <input
                    type="text"
                    className="input"
                    disabled
                    value={`${selectedSociety.plan_name || 'Standard'} (${selectedSociety.subscription_status})`}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Amount Due to Pay (₹ incl. GST) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={notifyAmountDue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNotifyAmountDue(val);
                      const num = Number(val || 0);
                      setNotifyTitle(
                        `Subscription Payment Due for Approval — ${selectedSociety.plan_name || 'Society Plan'} (${formatCurrency(num)})`
                      );
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Days Pending to Renew *</label>
                  <input
                    type="number"
                    className="input"
                    value={notifyDaysPending}
                    onChange={(e) => setNotifyDaysPending(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Subject / Title *</label>
                <input type="text" className="input" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Message to Society Admin *</label>
                <textarea rows={4} className="textarea" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="Upcoming renewal reminder or platform announcement..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode('NONE')}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      const res = await apiFetch(`/api/super-admin/societies/${selectedSociety.id}/notify`, {
                        method: 'POST',
                        body: {
                          title: notifyTitle,
                          message: notifyMessage,
                          notificationType: notifyType,
                          amountDue: Number(notifyAmountDue || 0),
                          daysPending: Number(notifyDaysPending || 0),
                          createInvoice: notifyType === 'SUBSCRIPTION_PAYMENT_DUE',
                        },
                      });
                      notify(res.message);
                      setModalMode('NONE');
                      loadDashboard();
                    } catch (err: any) {
                      notify(err.message, 'error');
                    }
                  }}
                >
                  <Bell size={15} /> Send Payment Due Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SOCIETY */}
      {modalMode === 'CREATE_SOCIETY' && (
        <div className="modal-backdrop" onClick={() => setModalMode('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Society Account</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/super-admin/societies', {
                    method: 'POST',
                    body: newSocietyForm,
                  });
                  notify(res.message);
                  setModalMode('NONE');
                  loadDashboard();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Society Name *</label>
                  <input type="text" required className="input" value={newSocietyForm.societyName} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, societyName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Administrator Name *</label>
                  <input type="text" required className="input" value={newSocietyForm.adminName} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, adminName: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Admin Email *</label>
                  <input type="email" required className="input" value={newSocietyForm.email} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Admin Phone *</label>
                  <input type="tel" required className="input" value={newSocietyForm.phone} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input type="text" required className="input" value={newSocietyForm.address} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, address: e.target.value })} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Subscription Plan *</label>
                  <select className="select" value={newSocietyForm.planId} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, planId: e.target.value })}>
                    {plans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Password *</label>
                  <input type="text" required className="input" value={newSocietyForm.password} onChange={(e) => setNewSocietyForm({ ...newSocietyForm, password: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Society</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SUBSCRIPTION PLAN */}
      {modalMode === 'CREATE_PLAN' && (
        <div className="modal-backdrop" onClick={() => setModalMode('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create Subscription Plan</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/super-admin/plans', {
                    method: 'POST',
                    body: newPlanForm,
                  });
                  notify(res.message);
                  setModalMode('NONE');
                  loadDashboard();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Plan Code *</label>
                  <input type="text" required className="input" placeholder="CUSTOM_SEMI_ANNUAL" value={newPlanForm.code} onChange={(e) => setNewPlanForm({ ...newPlanForm, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input type="text" required className="input" placeholder="Semi-Annual Pro Plan" value={newPlanForm.name} onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Billing Period</label>
                  <select className="select" value={newPlanForm.billingPeriod} onChange={(e) => setNewPlanForm({ ...newPlanForm, billingPeriod: e.target.value })}>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (Days) *</label>
                  <input type="number" required className="input" value={newPlanForm.durationDays} onChange={(e) => setNewPlanForm({ ...newPlanForm, durationDays: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Price (INR) *</label>
                  <input type="number" required className="input" value={newPlanForm.priceAmount} onChange={(e) => setNewPlanForm({ ...newPlanForm, priceAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Max Households</label>
                  <input type="number" className="input" value={newPlanForm.maxHouseholds} onChange={(e) => setNewPlanForm({ ...newPlanForm, maxHouseholds: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Trial Days</label>
                  <input type="number" className="input" value={newPlanForm.trialDays} onChange={(e) => setNewPlanForm({ ...newPlanForm, trialDays: Number(e.target.value) })} />
                </div>
              </div>

              {/* Tax Setup on Subscription Plan */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Tax Name / Label</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="GST, VAT, or None"
                    value={newPlanForm.taxName}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, taxName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tax Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input"
                    value={newPlanForm.taxPercent}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, taxPercent: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Price Calculation Preview Card */}
              <div style={{ background: 'var(--bg-subtle, #f8fafc)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Base Price:</span>
                  <strong>{formatCurrency(newPlanForm.priceAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{newPlanForm.taxName || 'Tax'} ({newPlanForm.taxPercent}%):</span>
                  <strong>{formatCurrency(Number(((newPlanForm.priceAmount * (newPlanForm.taxPercent || 0)) / 100).toFixed(2)))}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 4, fontWeight: 700, color: 'var(--primary)' }}>
                  <span>Total Payable Amount:</span>
                  <span>{formatCurrency(Number((newPlanForm.priceAmount * (1 + (newPlanForm.taxPercent || 0) / 100)).toFixed(2)))}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PAYMENT RECEIPT PROOF */}
      {selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Payment Receipt Proof — {selectedReceipt.invoiceNo}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Society: <strong>{selectedReceipt.societyName}</strong> | Amount: <strong>{formatCurrency(selectedReceipt.amount)}</strong>
                  {selectedReceipt.utr && <span> | UTR: <code>{selectedReceipt.utr}</code></span>}
                </div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedReceipt(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 8, maxHeight: '65vh', overflow: 'auto' }}>
              {selectedReceipt.url.endsWith('.pdf') ? (
                <iframe src={selectedReceipt.url} style={{ width: '100%', height: 420, border: 'none' }} title="PDF Receipt" />
              ) : (
                <img
                  src={selectedReceipt.url}
                  alt="Subscription Payment Receipt"
                  style={{ maxWidth: '100%', maxHeight: 460, objectFit: 'contain', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <a
                href={selectedReceipt.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ExternalLink size={14} /> Open in New Tab / Download
              </a>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE OR MANAGE REFUND */}
      {refundModalPayment && (
        <div className="modal-backdrop" onClick={() => setRefundModalPayment(null)}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={18} color="#7c3aed" />
                <h3 style={{ margin: 0 }}>
                  {refundModalPayment.status === 'REFUNDED'
                    ? 'Refund Details & Actions'
                    : 'Issue Subscription Refund'}
                </h3>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRefundModalPayment(null)}>
                <X size={15} />
              </button>
            </div>

            {/* Society & Invoice Summary Card */}
            <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-sunken)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Billed Society</div>
                  <strong style={{ fontSize: '0.98rem' }}>{refundModalPayment.society_name}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Invoice Number</div>
                  <strong>{refundModalPayment.invoice_number}</strong>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
                <span>Invoice Total: <strong>{formatCurrency(refundModalPayment.total_amount)}</strong></span>
                <span>Payment Mode: <strong>{refundModalPayment.payment_gateway || 'UPI'}</strong></span>
              </div>
            </div>

            {/* If Already Refunded: Notice & Quick Actions */}
            {refundModalPayment.status === 'REFUNDED' && (
              <div style={{ padding: '0.75rem 1rem', background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 8, color: '#5b21b6', marginBottom: '1.25rem', fontSize: '0.83rem' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>Refund Already Issued</div>
                <div style={{ marginTop: 2 }}>
                  Processed on <strong>{(refundModalPayment.refunded_at || refundModalPayment.created_at || '').slice(0, 10)}</strong> for{' '}
                  <strong>{formatCurrency(refundModalPayment.refund_amount || refundModalPayment.total_amount)}</strong>.
                </div>
                {refundModalPayment.refund_reference && (
                  <div style={{ marginTop: 2 }}>
                    Bank/UPI Ref: <code>{refundModalPayment.refund_reference}</code> ({refundModalPayment.refund_gateway || 'UPI'})
                  </div>
                )}
                {refundModalPayment.refund_reason && (
                  <div style={{ marginTop: 2, fontStyle: 'italic' }}>
                    Reason: "{refundModalPayment.refund_reason}"
                  </div>
                )}
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkUnpaid(refundModalPayment)}
                    title="Transition this subscription payment back to Unpaid"
                  >
                    <Clock size={13} /> Revert to Unpaid
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => handleMarkPaid(refundModalPayment)}
                    title="Re-confirm payment as Paid and reactivate society"
                  >
                    <Check size={13} /> Re-confirm as Paid
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setViewingSubInvoice(refundModalPayment);
                    }}
                  >
                    <FileText size={13} /> View Credit Note
                  </button>
                </div>
              </div>
            )}

            {/* Refund Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmRefund();
              }}
              style={{ display: 'grid', gap: '0.85rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Refund Amount (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input"
                    placeholder={String(refundModalPayment.total_amount)}
                    value={refundForm.refundAmount}
                    onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>Max refundable: {formatCurrency(refundModalPayment.total_amount)}</small>
                </div>

                <div className="form-group">
                  <label>Refund Payout Gateway / Mode</label>
                  <select
                    className="select"
                    value={refundForm.refundGateway}
                    onChange={(e) => setRefundForm({ ...refundForm, refundGateway: e.target.value })}
                  >
                    <option value="UPI">Direct UPI Transfer</option>
                    <option value="BANK_TRANSFER">NEFT / IMPS Bank Transfer</option>
                    <option value="RAZORPAY">Razorpay Gateway Refund</option>
                    <option value="PAYTM">Paytm Gateway Refund</option>
                    <option value="MANUAL_CASH">Cash / Offline Settlement</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Refund Payout Reference / UTR Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. UTR 502847291048 or Razorpay rfr_..."
                  value={refundForm.refundReference}
                  onChange={(e) => setRefundForm({ ...refundForm, refundReference: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Refund Reason *</label>
                <select
                  className="select"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                >
                  <option value="Requested by society administrator">Requested by society administrator</option>
                  <option value="Duplicate subscription payment">Duplicate subscription payment</option>
                  <option value="Billing dispute or overcharge adjustment">Billing dispute or overcharge adjustment</option>
                  <option value="Wrong subscription plan selected">Wrong subscription plan selected</option>
                  <option value="Cancellation within satisfaction guarantee">Cancellation within satisfaction guarantee</option>
                  <option value="Other">Other (Specify below)</option>
                </select>
              </div>

              {refundForm.reason === 'Other' && (
                <div className="form-group">
                  <label>Custom Refund Reason *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Enter specific audit reason"
                    value={refundForm.customReason}
                    onChange={(e) => setRefundForm({ ...refundForm, customReason: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Additional Notes (Optional)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Internal audit notes, approvals, or society communication"
                  value={refundForm.refundNotes}
                  onChange={(e) => setRefundForm({ ...refundForm, refundNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRefundModalPayment(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingRefund}
                  style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                >
                  {isSubmittingRefund
                    ? 'Processing...'
                    : refundModalPayment.status === 'REFUNDED'
                    ? 'Save Updated Refund Details'
                    : 'Confirm & Issue Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SUBSCRIPTION INVOICE / CREDIT NOTE */}
      {viewingSubInvoice && (
        <SubscriptionInvoiceModal
          invoice={viewingSubInvoice}
          platformSettings={settingsForm}
          onClose={() => setViewingSubInvoice(null)}
        />
      )}
    </div>
  );
};
