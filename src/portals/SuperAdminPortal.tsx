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
} from 'lucide-react';
import { apiFetch, downloadCsv } from '../api.ts';
import { type Language, t, formatCurrency } from '../i18n.ts';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
    maxHouseholds: 200,
    trialEnabled: true,
    trialDays: 14,
    gracePeriodDays: 7,
    autoApproveAfterPayment: true,
  });
  const [settingsForm, setSettingsForm] = useState<any>({});

  async function loadDashboard() {
    setLoading(true);
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
      setLoading(false);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <Shield size={19} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Super Admin</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SaaS Platform Owner</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadDashboard} title="Refresh Dashboard">
              <RefreshCw size={14} /> <span>Refresh</span>
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

          {/* TAB: SUBSCRIPTION INVOICES & REFUNDS */}
          {activeTab === 'PAYMENTS' && (
            <div className="card">
              <h3>Society Subscription Invoices, Webhook Verifications & Refunds</h3>
              <div className="table-wrap" style={{ marginTop: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Society</th>
                      <th>Plan</th>
                      <th>Total (incl. GST)</th>
                      <th>Gateway Order / Payment ID</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionPayments.map((sp: any) => (
                      <tr key={sp.id}>
                        <td><strong>{sp.invoice_number}</strong></td>
                        <td>{sp.society_name}</td>
                        <td>{sp.plan_name}</td>
                        <td>{formatCurrency(sp.total_amount)}</td>
                        <td>
                          <div style={{ fontSize: '0.76rem' }}>Order: <code>{sp.gateway_order_id || 'N/A'}</code></div>
                          <div style={{ fontSize: '0.76rem' }}>Pay: <code>{sp.gateway_payment_id || 'Pending'}</code></div>
                        </td>
                        <td>
                          <span className={`badge ${sp.status === 'PAID' ? 'badge-success' : sp.status === 'REFUNDED' ? 'badge-danger' : 'badge-warning'}`}>
                            {sp.status}
                          </span>
                        </td>
                        <td>{(sp.paid_at || sp.created_at || '').slice(0, 10)}</td>
                        <td>
                          {(sp.status === 'CREATED' || sp.status === 'PENDING_APPROVAL') && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={async () => {
                                if (!window.confirm(`Approve subscription payment of ${formatCurrency(sp.total_amount)} for ${sp.society_name} and activate subscription?`)) return;
                                try {
                                  const res = await apiFetch(`/api/super-admin/subscription-payments/${sp.id}/approve`, {
                                    method: 'POST',
                                  });
                                  notify(res.message);
                                  loadDashboard();
                                } catch (err: any) {
                                  notify(err.message, 'error');
                                }
                              }}
                            >
                              Approve & Activate
                            </button>
                          )}
                          {sp.status === 'PAID' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={async () => {
                                const reason = window.prompt('Enter refund reason for audit log:', 'Requested by society administrator');
                                if (!reason) return;
                                try {
                                  const res = await apiFetch(`/api/super-admin/subscription-payments/${sp.id}/refund`, {
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
                              Issue Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PLATFORM SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="card">
              <h3>Platform-Wide SaaS Configuration, Payment Gateways & Trial Policies</h3>
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
                style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}
              >
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

                {/* PAYMENT GATEWAY INTEGRATION SECTION */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                      Platform Payment Gateway Integration (SaaS Subscription Billing)
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Configure your platform merchant API keys to collect SaaS subscription payments from registered societies. Secret keys are encrypted at rest and never exposed in plain text after saving.
                    </p>
                  </div>

                  {/* Razorpay Gateway Card */}
                  <div style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-body)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>1. Razorpay Payment Gateway Keys (Platform Merchant Account)</strong>
                      <span className={`badge ${settingsForm.razorpay_key_id ? 'badge-success' : 'badge-neutral'}`}>
                        {settingsForm.razorpay_key_id ? 'Key ID Configured' : 'Not Configured'}
                      </span>
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
                          placeholder={settingsForm.has_razorpay_secret ? '•••••••••••••••• (Enter new secret to replace)' : 'Enter Razorpay Key Secret'}
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
                          placeholder={settingsForm.has_razorpay_webhook_secret ? '•••••••••••••••• (Enter new webhook secret)' : 'whsec_xxxxxxxxxxxx'}
                          value={settingsForm.razorpay_webhook_secret || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, razorpay_webhook_secret: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Paytm & Custom Gateway Card */}
                  <div style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-body)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>2. Paytm & Custom Payment Gateway Credentials</strong>
                      <span className={`badge ${settingsForm.paytm_merchant_id || settingsForm.custom_gateway_api_key ? 'badge-success' : 'badge-neutral'}`}>
                        {settingsForm.paytm_merchant_id || settingsForm.custom_gateway_api_key ? 'Configured' : 'Optional'}
                      </span>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Paytm Merchant ID (MID)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. PLATFORM1234567890"
                          value={settingsForm.paytm_merchant_id || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paytm_merchant_id: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Paytm Merchant Key{' '}
                          {settingsForm.has_paytm_secret && (
                            <span className="badge badge-success" style={{ marginLeft: '0.35rem', fontSize: '0.68rem' }}>
                              Saved (Encrypted)
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder={settingsForm.has_paytm_secret ? '•••••••••••••••• (Enter new key to replace)' : 'Enter Paytm Merchant Key'}
                          value={settingsForm.paytm_merchant_key || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paytm_merchant_key: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label>Custom Gateway Provider Name (PhonePe / Cashfree / Stripe)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. PhonePe PG, Cashfree, CCAvenue"
                          value={settingsForm.custom_gateway_name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, custom_gateway_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Custom Gateway API Key / App ID</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter Merchant App ID / Public API Key"
                          value={settingsForm.custom_gateway_api_key || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, custom_gateway_api_key: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Custom Gateway Secret Key{' '}
                          {settingsForm.has_custom_gateway_secret && (
                            <span className="badge badge-success" style={{ marginLeft: '0.35rem', fontSize: '0.68rem' }}>
                              Saved (Encrypted)
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder={settingsForm.has_custom_gateway_secret ? '•••••••••••••••• (Enter new secret to replace)' : 'Enter Custom Gateway Secret Key'}
                          value={settingsForm.custom_gateway_secret || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, custom_gateway_secret: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platform UPI & Bank Account Details */}
                  <div style={{ padding: '1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>3. Platform UPI & Bank Account Details (Direct Subscription Transfers)</strong>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Platform UPI ID (VPA)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. societyos@icici"
                          value={settingsForm.upi_id || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>UPI Payee Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. SocietyOS SaaS Platform"
                          value={settingsForm.upi_payee_name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, upi_payee_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. HDFC Bank, SBI, ICICI"
                          value={settingsForm.bank_name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Bank Account Number</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Account Number for NEFT/RTGS/IMPS"
                          value={settingsForm.bank_account_number || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Bank IFSC Code</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. HDFC0001234"
                          value={settingsForm.bank_ifsc || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bank_ifsc: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(settingsForm.default_trial_enabled)}
                      onChange={(e) => setSettingsForm({ ...settingsForm, default_trial_enabled: e.target.checked ? 1 : 0 })}
                    />
                    Enable Free Trial for New Society Registrations
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
                    Razorpay Sandbox Testing Mode Enabled
                  </label>
                </div>

                <div className="form-group">
                  <label>Welcome Email Template</label>
                  <textarea
                    rows={3}
                    className="textarea"
                    value={settingsForm.welcome_email_template || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, welcome_email_template: e.target.value })}
                  />
                </div>

                <div>
                  <button type="submit" className="btn btn-primary">Save Platform & Gateway Settings</button>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
