import React, { useState, useEffect } from 'react';
import {
  Home,
  Receipt,
  MessageSquarePlus,
  User,
  CreditCard,
  Printer,
  PhoneCall,
  Megaphone,
  Calendar,
  RefreshCw,
  LogOut,
  Globe,
  Moon,
  Sun,
  CheckCircle2,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Image as ImageIcon,
  FileText,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, uploadFileAsBase64, openRazorpayCheckout, isValid10DigitPhone, clean10DigitPhone } from '../api.ts';
import { type Language, t, formatCurrency } from '../i18n.ts';
import { printInvoiceDocument, numberToIndianWords } from '../utils/invoicePrinter.ts';

interface MemberPortalProps {
  user: any;
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onLogout: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({
  user,
  lang,
  setLang,
  theme,
  setTheme,
  onLogout,
  notify,
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'BILLS' | 'COMPLAINTS' | 'PROFILE'>('DASHBOARD');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024 && window.innerWidth <= 1280;
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any | null>(null);

  // Bill filters
  const [billSearch, setBillSearch] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('');
  const [billMonthFilter, setBillMonthFilter] = useState('');

  // Modals
  const [modal, setModal] = useState<'NONE' | 'PAY_BILL' | 'PRINT_BILL' | 'PRINT_RECEIPT'>('NONE');
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (modal !== 'NONE') {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.body.classList.remove('print-bill-only');
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.body.classList.remove('print-bill-only');
    };
  }, [modal]);

  const handlePrintDocument = () => {
    document.body.classList.add('print-bill-only');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-bill-only');
    }, 1200);
  };

  const handlePrintCurrentBill = () => {
    if (!selectedBill) return;
    printInvoiceDocument({
      societyName: society.name,
      societyAddress: society.address,
      societyCity: society.city,
      societyState: society.state,
      societyPincode: society.pincode,
      societyRegNo: society.registration_number,
      societyPhone: society.contact_phone,
      societyEmail: society.contact_email,
      societyUpiId: society.upi_id,
      societyUpiName: society.upi_merchant_name,
      billNumber: selectedBill.bill_number,
      billType: selectedBill.bill_type || (selectedBill.bill_number?.startsWith('SUPP') ? 'SUPPLEMENTARY' : 'REGULAR'),
      billingMonth: selectedBill.billing_month,
      billingYear: selectedBill.billing_year,
      invoiceDate: (selectedBill.created_at || '').slice(0, 10),
      flatNumber: member.flat_number,
      blockName: member.block_name,
      memberName: member.full_name || 'Resident Member',
      memberPhone: member.phone,
      dueDate: selectedBill.due_date,
      status: selectedBill.status,
      items: selectedBill.items || [],
      subtotalAmount: selectedBill.subtotal_amount,
      previousBalance: selectedBill.previous_balance,
      penaltyAmount: selectedBill.penalty_amount,
      creditAmount: selectedBill.credit_amount,
      totalAmount: selectedBill.total_amount,
      paidAmount: selectedBill.paid_amount,
      balanceAmount: selectedBill.balance_amount,
    });
  };

  // Payment Submission Form
  const [payForm, setPayForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    referenceNumber: '',
    proofUrl: '',
  });

  // Complaint & Suggestion Forms
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Water supply',
    description: '',
    priority: 'MEDIUM',
    attachmentUrl: '',
  });
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [uploadingComplaintPhoto, setUploadingComplaintPhoto] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    title: '',
    description: '',
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.email || '',
    phone: user?.phone || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
  });

  async function loadMemberDashboard() {
    try {
      const res = await apiFetch('/api/member/dashboard');
      setData(res);
      setProfileForm({
        fullName: res?.member?.full_name || user?.fullName || user?.email || '',
        phone: res?.member?.phone || user?.phone || '',
        emergencyContactName: res?.member?.emergency_contact || '',
        emergencyContactPhone: '',
      });
    } catch (err: any) {
      notify(err.message, 'error');
    }
  }

  useEffect(() => {
    loadMemberDashboard();
  }, []);

  const member = data?.member || {};
  const society = data?.society || {};
  const settings = data?.settings || {};
  const bills: any[] = data?.bills || [];
  const payments: any[] = data?.payments || [];
  const receipts: any[] = data?.receipts || [];
  const complaints: any[] = data?.complaints || [];
  const suggestions: any[] = data?.suggestions || [];
  const announcements: any[] = data?.announcements || [];
  const events: any[] = data?.events || [];
  const onDutyStaff: any[] = data?.onDutyStaff || [];
  const householdMembers: any[] = data?.householdMembers || [];

  const unpaidBills = bills.filter((b) => b.status !== 'PAID');
  const paidBills = bills.filter((b) => b.status === 'PAID');
  const pendingVerifications = payments.filter((p) => p.status === 'PENDING_VERIFICATION');

  const filteredBills = bills.filter((b) => {
    if (billStatusFilter && b.status !== billStatusFilter) return false;
    if (billMonthFilter && String(b.billing_month) !== billMonthFilter) return false;
    if (billSearch) {
      const hay = `${b.bill_number} ${b.billing_month}/${b.billing_year}`.toLowerCase();
      if (!hay.includes(billSearch.toLowerCase())) return false;
    }
    return true;
  });

  function openPaymentModalForBills(targetBillIds: string[]) {
    const targetBills = bills.filter((b) => targetBillIds.includes(b.id));
    const hasPendingVerification =
      pendingVerifications.length > 0 ||
      targetBills.some((b) => b.status === 'PENDING_VERIFICATION');

    if (hasPendingVerification) {
      notify(
        'Already payment made under verification, cannot make another payment till payment status is paid or unpaid.',
        'error'
      );
      return;
    }

    const payableBills = targetBills.filter(
      (b) => b.status !== 'PAID' && b.status !== 'PENDING_VERIFICATION' && Number(b.balance_amount) > 0
    );
    if (payableBills.length === 0) {
      notify('No unpaid bills available for payment.', 'error');
      return;
    }

    const validIds = payableBills.map((b) => b.id);
    setSelectedBillIds(validIds);
    const sum = payableBills.reduce((acc, b) => acc + Number(b.balance_amount || b.total_amount || 0), 0);
    setPayForm({
      amount: sum,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'UPI',
      referenceNumber: '',
      proofUrl: '',
    });
    setModal('PAY_BILL');
  }

  async function handleRazorpayBillPayment(targetBillIds: string[], overrideAmount?: number) {
    const targetBills = bills.filter((b) => targetBillIds.includes(b.id));
    const hasPendingVerification =
      pendingVerifications.length > 0 ||
      targetBills.some((b) => b.status === 'PENDING_VERIFICATION');

    if (hasPendingVerification) {
      notify(
        'Already payment made under verification, cannot make another payment till payment status is paid or unpaid.',
        'error'
      );
      return;
    }

    const payableBills = targetBills.filter(
      (b) => b.status !== 'PAID' && b.status !== 'PENDING_VERIFICATION' && Number(b.balance_amount) > 0
    );
    if (payableBills.length === 0) {
      notify('No unpaid bills available for payment.', 'error');
      return;
    }

    const validIds = payableBills.map((b) => b.id);
    const defaultSum = payableBills.reduce((acc, b) => acc + Number(b.balance_amount || b.total_amount || 0), 0);
    const amountToPay = overrideAmount && overrideAmount > 0 ? overrideAmount : defaultSum;

    try {
      await openRazorpayCheckout({
        amountRupees: amountToPay,
        currency: 'INR',
        receipt: `bill_${Date.now()}`,
        merchantName: society.name || 'SocietyOS RWA',
        description: `Maintenance Bill Payment — Flat ${member.flat_number}`,
        prefill: {
          name: member?.full_name || user?.fullName || user?.email || '',
          email: member?.email || user?.email || '',
          contact: member?.phone || user?.phone || '',
        },
        billIds: validIds,
        onSuccess: (verifyRes) => {
          notify(verifyRes.message || 'Payment verified and receipt generated!');
          setModal('NONE');
          loadMemberDashboard();
        },
        onDismiss: () => {
          notify('Payment cancelled by user.', 'error');
        },
        onError: (errMsg) => {
          notify(errMsg, 'error');
        },
      });
    } catch (err: any) {
      notify(err.message || 'Failed to launch Razorpay checkout.', 'error');
    }
  }

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, flexShrink: 0 }}>
              {(member.flat_number || 'R').slice(0, 3)}
            </div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-sidebar)' }}>Flat {member.flat_number}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-sidebar-muted)' }}>{society.name}</div>
              </div>
            )}
          </div>
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
            <Home size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'dashboard')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'BILLS' ? 'active' : ''}`} onClick={() => { setActiveTab('BILLS'); setMobileMenuOpen(false); }}>
            <Receipt size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'myBills')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'COMPLAINTS' ? 'active' : ''}`} onClick={() => { setActiveTab('COMPLAINTS'); setMobileMenuOpen(false); }}>
            <MessageSquarePlus size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'myComplaints')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`} onClick={() => { setActiveTab('PROFILE'); setMobileMenuOpen(false); }}>
            <User size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'myProfile')}</span>}
          </button>
        </nav>
      </aside>

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
              <h2 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.08rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {society.name} — {t(lang, 'memberPortal')} (Flat {member.flat_number}, {member.block_name})
              </h2>
              <div className="topbar-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Resident: <strong>{member.full_name}</strong> • Helpdesk: {society.contact_phone}
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadMemberDashboard} title="Refresh Dashboard">
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
          {/* TAB 1: MEMBER DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Total Outstanding Balance</span>
                  <span className="kpi-value" style={{ color: Number(data?.totalOutstanding) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatCurrency(data?.totalOutstanding)}
                  </span>
                  <span className="kpi-sub">
                    {Number(data?.openingBalanceDues || 0) > 0 ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Includes Opening Balance: {formatCurrency(data?.openingBalanceDues)}
                      </span>
                    ) : (
                      <>Flat {member.flat_number} ({member.block_name})</>
                    )}
                  </span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Unpaid / Overdue Bills</span>
                  <span className="kpi-value" style={{ color: 'var(--warning)' }}>{unpaidBills.length}</span>
                  <span className="kpi-sub">Paid Bills: {paidBills.length}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Pending Payment Verification</span>
                  <span className="kpi-value">{pendingVerifications.length}</span>
                  <span className="kpi-sub">Confirmed Receipts: {receipts.length}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">My Complaints (Open / Resolved)</span>
                  <span className="kpi-value">
                    {complaints.filter((c) => c.status !== 'RESOLVED').length} / {complaints.filter((c) => c.status === 'RESOLVED').length}
                  </span>
                  <span className="kpi-sub">Suggestions submitted: {suggestions.length}</span>
                </div>
              </div>

              {/* Current Unpaid Bills Quick Pay Card */}
              {unpaidBills.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3>Current Month & Unpaid Society Bills</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Pay via UPI ({settings.upi_id || 'society@upi'}), Google Pay, Paytm, Razorpay, or Bank Transfer and submit your reference for verification.
                      </p>
                      {Number(data?.openingBalanceDues || 0) > 0 && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                          Breakdown: Opening Balance: {formatCurrency(data.openingBalanceDues)} + Other Maintenance Dues: {formatCurrency(data.otherDues || 0)}
                        </div>
                      )}
                      {(pendingVerifications.length > 0 || unpaidBills.some((b) => b.status === 'PENDING_VERIFICATION')) && (
                        <div style={{ marginTop: '0.45rem', fontSize: '0.82rem', color: 'var(--warning)', fontWeight: 700 }}>
                          Already payment made under verification, cannot make another payment till payment status is paid or unpaid.
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleRazorpayBillPayment(unpaidBills.map((b) => b.id))}
                      >
                        <CreditCard size={16} /> Pay Instant via Razorpay ({formatCurrency(data?.totalOutstanding)})
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openPaymentModalForBills(unpaidBills.map((b) => b.id))}
                      >
                        Submit UPI / Bank Proof
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Currently On-Duty Staff & Announcements Split View */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem' }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <PhoneCall size={18} color="var(--primary)" />
                    <h3>{t(lang, 'onDutyStaff')} (Live Duty Roster)</h3>
                  </div>
                  {onDutyStaff.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No staff members are currently marked On Duty.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.65rem' }}>
                      {onDutyStaff.map((st: any) => (
                        <div key={st.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{st.full_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.designation} • {st.duty_schedule}</div>
                            {st.assigned_duties && <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>{st.assigned_duties}</div>}
                          </div>
                          <div style={{ textAlign: 'end' }}>
                            <span className="badge badge-success">ON DUTY</span>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: 4 }}>{st.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <Megaphone size={18} color="var(--primary)" />
                    <h3>Latest Society Notices & Upcoming Events</h3>
                  </div>
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {announcements.map((a: any) => (
                      <div key={a.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                        <span className="badge badge-warning">{a.category}</span>
                        <h4 style={{ marginTop: 4, fontSize: '0.92rem' }}>{a.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.content}</p>
                      </div>
                    ))}
                    {events.map((ev: any) => (
                      <div key={ev.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                          <Calendar size={13} /> {ev.event_date} at {ev.event_time} • {ev.venue}
                        </div>
                        <h4 style={{ marginTop: 3, fontSize: '0.92rem' }}>{ev.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MY BILLS, PAYMENTS & RECEIPTS */}
          {activeTab === 'BILLS' && (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Household Bill History & Invoices</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Filter by billing month or payment status, download invoices, or submit payment proof.
                    </p>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search bill number..."
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                  />
                  <select className="select" value={billMonthFilter} onChange={(e) => setBillMonthFilter(e.target.value)}>
                    <option value="">All Billing Months</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={String(m)}>Month {m}</option>
                    ))}
                  </select>
                  <select className="select" value={billStatusFilter} onChange={(e) => setBillStatusFilter(e.target.value)}>
                    <option value="">All Payment Statuses</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>Period & Type</th>
                        <th>Charge Breakdown</th>
                        <th>Total</th>
                        <th>Paid / Balance</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((b: any) => (
                        <tr key={b.id}>
                          <td><strong>{b.bill_number}</strong></td>
                          <td>
                            {b.bill_type === 'OPENING_BALANCE' || b.bill_number?.startsWith('OP-BAL-') ? (
                              <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                                OPENING BALANCE
                              </span>
                            ) : (
                              <span>{b.billing_month}/{b.billing_year} ({b.bill_type})</span>
                            )}
                          </td>
                          <td>
                            {(b.items || []).map((it: any) => (
                              <div key={it.id} style={{ fontSize: '0.76rem' }}>
                                <strong>{it.category_name}</strong>: {formatCurrency(it.amount)}
                                {it.description && it.description !== it.category_name && (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{it.description}</div>
                                )}
                              </div>
                            ))}
                          </td>
                          <td><strong>{formatCurrency(b.total_amount)}</strong></td>
                          <td>
                            <span style={{ color: 'var(--success)' }}>{formatCurrency(b.paid_amount)}</span> /{' '}
                            <strong style={{ color: Number(b.balance_amount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {formatCurrency(b.balance_amount)}
                            </strong>
                          </td>
                          <td>{b.due_date}</td>
                          <td>
                            <span className={`badge ${b.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedBill(b);
                                  setModal('PRINT_BILL');
                                }}
                              >
                                <Printer size={13} /> Invoice
                              </button>
                              {Number(b.balance_amount) > 0 && b.status !== 'PAID' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleRazorpayBillPayment([b.id])}
                                  >
                                    <CreditCard size={13} /> Pay via Razorpay
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openPaymentModalForBills([b.id])}
                                  >
                                    UPI / Offline Proof
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History & Downloadable Receipts */}
              <div className="card">
                <h3>Submitted Payments & Official Receipts</h3>
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Payment Date</th>
                        <th>Amount</th>
                        <th>Method & Reference</th>
                        <th>Status</th>
                        <th>Official Receipt #</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id}>
                          <td>{p.payment_date}</td>
                          <td><strong>{formatCurrency(p.amount)}</strong></td>
                          <td>
                            <span className="badge badge-info">{p.payment_method}</span> <code>{p.reference_number}</code>
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'CONFIRMED' ? 'badge-success' : p.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                              {p.status}
                            </span>
                            {p.verification_notes && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.verification_notes}</div>
                            )}
                          </td>
                          <td>{p.receipt_number ? <code>{p.receipt_number}</code> : 'Pending Verification'}</td>
                          <td>
                            {p.receipt_number && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedReceipt(p);
                                  setModal('PRINT_RECEIPT');
                                }}
                              >
                                <Printer size={13} /> Download Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: COMPLAINTS & SUGGESTIONS */}
          {activeTab === 'COMPLAINTS' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem' }}>
              <div className="card">
                <h3>Submit a New Complaint</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await apiFetch('/api/member/complaints', {
                        method: 'POST',
                        body: {
                          ...complaintForm,
                          attachmentUrls: complaintForm.attachmentUrl ? [complaintForm.attachmentUrl] : [],
                        },
                      });
                      notify(res.message);
                      setComplaintForm({ title: '', category: 'Water supply', description: '', priority: 'MEDIUM', attachmentUrl: '' });
                      loadMemberDashboard();
                    } catch (err: any) {
                      notify(err.message, 'error');
                    }
                  }}
                  style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Complaint Category *</label>
                      <select className="select" value={complaintForm.category} onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}>
                        {['Water supply', 'Electricity', 'Lift', 'Cleaning', 'Security', 'Parking', 'Noise', 'Maintenance', 'Other'].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select className="select" value={complaintForm.priority} onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Complaint Title *</label>
                    <input type="text" required className="input" value={complaintForm.title} onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })} placeholder="Brief summary of the issue" />
                  </div>
                  <div className="form-group">
                    <label>Detailed Description *</label>
                    <textarea rows={3} required className="textarea" value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Attach Photo / Supporting Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="input"
                      disabled={uploadingComplaintPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingComplaintPhoto(true);
                          const url = await uploadFileAsBase64(file);
                          setComplaintForm((prev) => ({ ...prev, attachmentUrl: url }));
                          notify('Complaint photo attached.');
                        } catch (err: any) {
                          notify(err.message, 'error');
                        } finally {
                          setUploadingComplaintPhoto(false);
                        }
                      }}
                    />
                    {uploadingComplaintPhoto && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 4 }}>
                        Uploading file, please wait...
                      </div>
                    )}
                    {complaintForm.attachmentUrl && !uploadingComplaintPhoto && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border)' }}>
                        <img
                          src={complaintForm.attachmentUrl}
                          alt="Attached preview"
                          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }}
                          onClick={() => setViewingPhotoUrl(complaintForm.attachmentUrl)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Photo attached successfully</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click image to zoom</div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          onClick={() => setComplaintForm((prev) => ({ ...prev, attachmentUrl: '' }))}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={uploadingComplaintPhoto}>
                    {uploadingComplaintPhoto ? 'Uploading...' : 'Submit Complaint'}
                  </button>
                </form>

                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>My Complaint History</h4>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {complaints.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No complaints submitted yet.
                    </div>
                  ) : (
                    complaints.map((c: any) => (
                      <div key={c.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{c.complaint_number}</strong> • [{c.category}] <strong>{c.title}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              Submitted: {(c.created_at || '').slice(0, 16).replace('T', ' ')}
                            </div>
                          </div>
                          <span className={`badge ${c.status === 'RESOLVED' ? 'badge-success' : c.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                            {c.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.45 }}>{c.description}</p>

                        {/* COMPLAINT ATTACHMENTS */}
                        {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <ImageIcon size={12} color="var(--primary)" /> {c.attachments.length} Attached Photo{c.attachments.length > 1 ? 's' : ''}:
                            </span>
                            {c.attachments.map((att: any, idx: number) => {
                              const fileUrl = att.file_url || att.url;
                              if (!fileUrl) return null;
                              const isImg = !att.file_type || att.file_type.includes('image') || /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(fileUrl);
                              return isImg ? (
                                <div
                                  key={att.id || idx}
                                  onClick={() => setViewingPhotoUrl(fileUrl)}
                                  style={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    width: 54,
                                    height: 54,
                                    backgroundColor: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                  }}
                                  title="Click to view full image"
                                >
                                  <img
                                    src={fileUrl}
                                    alt={att.file_name || `Attachment ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'rgba(0,0,0,0.25)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      opacity: 0,
                                      transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                                  >
                                    <Eye size={16} color="#fff" />
                                  </div>
                                </div>
                              ) : (
                                <a
                                  key={att.id || idx}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <FileText size={12} /> {att.file_name || 'Document'}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* RESOLUTION PROOF IMAGE IF RESOLVED */}
                        {c.resolution_image_url && (
                          <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--success)' }}>Resolution Proof:</span>
                            <img
                              src={c.resolution_image_url}
                              alt="Resolution Proof"
                              onClick={() => setViewingPhotoUrl(c.resolution_image_url)}
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }}
                            />
                          </div>
                        )}

                        {/* COMMENTS THREAD */}
                        {(c.comments || []).filter((cm: any) => !cm.is_internal).map((cm: any) => (
                          <div key={cm.id} style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: 4, padding: '0.35rem 0.5rem', background: 'var(--bg-surface)', borderRadius: 4, borderLeft: '3px solid var(--primary)' }}>
                            <strong>{cm.author_name}:</strong> {cm.comment_text}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Submit Suggestion to Society Management</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await apiFetch('/api/member/suggestions', {
                        method: 'POST',
                        body: suggestionForm,
                      });
                      notify(res.message);
                      setSuggestionForm({ title: '', description: '' });
                      loadMemberDashboard();
                    } catch (err: any) {
                      notify(err.message, 'error');
                    }
                  }}
                  style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
                >
                  <div className="form-group">
                    <label>Suggestion Title *</label>
                    <input type="text" required className="input" value={suggestionForm.title} onChange={(e) => setSuggestionForm({ ...suggestionForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Your Suggestion *</label>
                    <textarea rows={3} required className="textarea" value={suggestionForm.description} onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Send Suggestion</button>
                </form>

                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>My Suggestions & Management Responses</h4>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {suggestions.map((s: any) => (
                    <div key={s.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{s.title}</strong>
                        <span className="badge badge-info">{s.status}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.description}</p>
                      {s.admin_response && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: 6 }}>
                          <strong>Management Response:</strong> {s.admin_response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOUSEHOLD & PERSONAL PROFILE */}
          {activeTab === 'PROFILE' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
              <div className="card">
                <h3>Update My Contact & Emergency Information</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (profileForm.phone && !isValid10DigitPhone(profileForm.phone)) {
                      notify('Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.', 'error');
                      return;
                    }
                    const res = await apiFetch('/api/auth/profile', {
                      method: 'PUT',
                      body: {
                        ...profileForm,
                        phone: profileForm.phone ? clean10DigitPhone(profileForm.phone) : '',
                      },
                    });
                    notify(res.message);
                    loadMemberDashboard();
                  }}
                  style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
                >
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" className="input" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number (10-Digit Mobile)</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      className="input"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input type="text" className="input" value={profileForm.emergencyContactName} onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Update Profile</button>
                </form>
              </div>

              <div className="card">
                <h3>Registered Household Members — Flat {member.flat_number}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Family members linked to this household without creating duplicate flat registrations:
                </p>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {householdMembers.map((hm: any) => (
                    <div key={hm.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                      <strong>{hm.full_name}</strong> ({hm.is_primary_member ? 'Primary Member' : hm.relationship_to_primary})
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hm.email} • {hm.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: SUBMIT PAYMENT PROOF */}
      {modal === 'PAY_BILL' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h3>Submit Bill Payment & Verification Proof</h3>
            <div className="card" style={{ background: 'var(--bg-subtle)', marginTop: '0.75rem', padding: '0.85rem', fontSize: '0.82rem' }}>
              <div><strong>Society UPI ID:</strong> <code>{settings.upi_id || 'society@hdfcbank'}</code> ({settings.upi_payee_name || society.name})</div>
              <div><strong>Bank Transfer:</strong> {settings.bank_name || 'HDFC Bank'} • A/C: <code>{settings.bank_account_number || '50200089412210'}</code> • IFSC: <code>{settings.bank_ifsc || 'HDFC0001245'}</code></div>
              <div style={{ marginTop: '0.6rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRazorpayBillPayment(selectedBillIds, payForm.amount)}
                >
                  <CreditCard size={14} /> Pay Instant Online with Razorpay Checkout
                </button>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (payForm.paymentMethod === 'RAZORPAY' && !payForm.referenceNumber.trim()) {
                  await handleRazorpayBillPayment(selectedBillIds, payForm.amount);
                  return;
                }
                try {
                  const res = await apiFetch('/api/member/payments', {
                    method: 'POST',
                    body: {
                      billIds: selectedBillIds,
                      ...payForm,
                    },
                  });
                  notify(res.message);
                  setModal('NONE');
                  loadMemberDashboard();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select className="select" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                    {Boolean(settings.upi_enabled ?? 1) && <option value="UPI">Standard UPI</option>}
                    {Boolean(settings.gpay_upi_enabled ?? 1) && <option value="GPAY_UPI">Google Pay (UPI Flow)</option>}
                    {Boolean(settings.paytm_enabled ?? 1) && <option value="PAYTM">Paytm</option>}
                    {Boolean(settings.razorpay_enabled ?? 1) && <option value="RAZORPAY">Razorpay Gateway</option>}
                    {Boolean(settings.bank_transfer_enabled ?? 1) && <option value="BANK_TRANSFER">NEFT / IMPS Bank Transfer</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount Paid (INR) *</label>
                  <input type="number" required min={1} className="input" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input type="date" required className="input" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>UPI / Bank Reference Number (UTR) *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g., UTR-428910229182"
                    value={payForm.referenceNumber}
                    onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Optional Payment Screenshot / Receipt Upload</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadFileAsBase64(file);
                      setPayForm((prev) => ({ ...prev, proofUrl: url }));
                      notify('Payment screenshot uploaded.');
                    } catch (err: any) {
                      notify(err.message, 'error');
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">{t(lang, 'submitPayment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT BILL INVOICE */}
      {modal === 'PRINT_BILL' && selectedBill && (() => {
        const subtotal = Number(selectedBill.subtotal_amount || 0);
        const previousBalance = Number(selectedBill.previous_balance || 0);
        const penalty = Number(selectedBill.penalty_amount || 0);
        const credit = Number(selectedBill.credit_amount || 0);
        const total = Number(selectedBill.total_amount || 0);
        const balance = Number(selectedBill.balance_amount ?? total);
        const paid = Number(selectedBill.paid_amount || 0);
        const billType = selectedBill.bill_type || (selectedBill.bill_number?.startsWith('SUPP') ? 'SUPPLEMENTARY' : 'REGULAR');
        const billTypeLabel = billType === 'SUPPLEMENTARY' ? 'Supplementary / Adjustment Bill' : 'Regular Monthly Maintenance Bill';

        const validItems = (selectedBill.items || []).filter((it: any) => {
          const val = Number(it.amount);
          return !isNaN(val) && Math.abs(val) > 0;
        });

        interface DisplayRow {
          head: string;
          type: string;
          desc: string;
          amount: number;
        }

        const rows: DisplayRow[] = [];
        if (validItems.length > 0) {
          validItems.forEach((it: any) => {
            const isAdj = Boolean(it.is_adjustment) || billType === 'SUPPLEMENTARY';
            rows.push({
              head: it.category_name || it.categoryName || 'Maintenance Charge',
              type: isAdj ? 'Adjustment' : 'Monthly Recurring',
              desc: it.description || `${it.category_name || 'Charge'} (${selectedBill.billing_month}/${selectedBill.billing_year})`,
              amount: Number(it.amount),
            });
          });
        } else {
          rows.push({
            head: 'Maintenance Charges',
            type: 'Monthly Recurring',
            desc: `Regular Society Maintenance Charges (${selectedBill.billing_month}/${selectedBill.billing_year})`,
            amount: subtotal > 0 ? subtotal : total,
          });
        }

        if (previousBalance > 0) {
          rows.push({
            head: 'Arrears / Previous Dues',
            type: 'Arrears Balance',
            desc: 'Unpaid dues brought forward from previous billing cycles',
            amount: previousBalance,
          });
        }

        if (penalty > 0) {
          rows.push({
            head: 'Late Fee / Surcharge',
            type: 'Penalty',
            desc: 'Late payment penalty surcharge',
            amount: penalty,
          });
        }

        if (credit > 0) {
          rows.push({
            head: 'Credit / Rebate',
            type: 'Concession / Credit',
            desc: 'Advance payment or adjustment rebate',
            amount: -credit,
          });
        }

        const fullSocietyAddress = [
          society.address,
          society.city,
          society.state,
          society.pincode ? `PIN: ${society.pincode}` : '',
        ].filter(Boolean).join(', ');

        const statusColor = selectedBill.status === 'PAID' ? 'var(--success)' : selectedBill.status === 'PARTIALLY_PAID' ? '#d97706' : 'var(--danger)';
        const statusBg = selectedBill.status === 'PAID' ? 'rgba(22, 163, 74, 0.12)' : selectedBill.status === 'PARTIALLY_PAID' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.12)';

        return (
          <div className="modal-backdrop" onClick={() => setModal('NONE')}>
            <div className="modal-card printable-bill-card" style={{ width: 'min(100%, 780px)', maxWidth: '780px', padding: '1.5rem', background: '#fff', color: '#0f172a' }} onClick={(e) => e.stopPropagation()}>
              
              {/* SOCIETY LETTERHEAD & INVOICE META */}
              <div style={{ borderBottom: '2.5px solid #047857', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{society.name}</h2>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', lineHeight: 1.35 }}>{fullSocietyAddress || 'Residential Welfare Association'}</div>
                  {society.registration_number && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Registration #: <strong>{society.registration_number}</strong></div>
                  )}
                  {(society.contact_phone || society.contact_email) && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>
                      {[society.contact_phone, society.contact_email].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'end', flex: '0 0 auto' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857', letterSpacing: '-0.01em' }}>INVOICE #{selectedBill.bill_number}</div>
                  <div style={{ display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', color: '#334155', fontSize: '0.74rem', fontWeight: 700, borderRadius: 4, textTransform: 'uppercase', marginTop: '3px' }}>
                    {billTypeLabel}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                    Billing Period: <strong>{selectedBill.billing_month}/{selectedBill.billing_year}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    Bill Date: <strong>{(selectedBill.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10)}</strong>
                  </div>
                </div>
              </div>

              {/* BILLED TO & STATUS BOX */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Billed Resident / Flat:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    Flat {member.flat_number}{member.block_name ? ` (${member.block_name})` : ''}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                    {member.full_name || 'Resident Member'}
                  </div>
                  {member.phone && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>Phone: {member.phone}</div>
                  )}
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Due Date:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {selectedBill.due_date}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.76rem', fontWeight: 800, background: statusBg, color: statusColor, border: `1px solid ${statusColor}` }}>
                      {selectedBill.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ITEMIZED 5-COLUMN TABLE */}
              <div style={{ width: '100%', overflow: 'visible', marginBottom: '1.25rem' }}>
                <table className="printable-bill-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '6%', textAlign: 'center' }}>#</th>
                      <th style={{ width: '24%', textAlign: 'left' }}>Charge Head</th>
                      <th style={{ width: '18%', textAlign: 'left' }}>Type</th>
                      <th style={{ width: '34%', textAlign: 'left' }}>Description</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', wordBreak: 'break-word' }}>{r.head}</td>
                        <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', color: '#475569', wordBreak: 'break-word' }}>{r.type}</td>
                        <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', color: '#334155', wordBreak: 'break-word' }}>{r.desc}</td>
                        <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', color: r.amount < 0 ? '#16a34a' : '#0f172a' }}>
                          {r.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(r.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SUMMARY: AMOUNT IN WORDS + TOTALS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Amount in Words:</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginTop: '2px', fontStyle: 'italic' }}>
                      {numberToIndianWords(total)}
                    </div>
                  </div>
                  {society.upi_id && (
                    <div style={{ marginTop: '0.5rem', background: '#f0fdf4', border: '1px dashed #047857', borderRadius: '6px', padding: '0.6rem 0.85rem', fontSize: '0.78rem', color: '#14532d' }}>
                      <strong>Pay via UPI:</strong> <code>{society.upi_id}</code>{society.upi_merchant_name ? ` (${society.upi_merchant_name})` : ''}
                      <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>
                        Please mention Bill #{selectedBill.bill_number} & Flat {member.flat_number} in payment notes.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ flex: '0 1 280px', width: '100%', minWidth: '240px' }}>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', padding: '0.6rem 0.85rem' }}>
                    {subtotal > 0 && (previousBalance > 0 || penalty > 0 || credit > 0) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.82rem', color: '#475569' }}>
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
                      </div>
                    )}
                    {previousBalance > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.82rem', color: '#dc2626' }}>
                        <span>Arrears / Prior Balance:</span>
                        <span style={{ fontWeight: 600 }}>+{formatCurrency(previousBalance)}</span>
                      </div>
                    )}
                    {penalty > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.82rem', color: '#dc2626' }}>
                        <span>Late Fee / Penalty:</span>
                        <span style={{ fontWeight: 600 }}>+{formatCurrency(penalty)}</span>
                      </div>
                    )}
                    {credit > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.82rem', color: '#16a34a' }}>
                        <span>Credit / Rebate:</span>
                        <span style={{ fontWeight: 600 }}>-{formatCurrency(credit)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', marginTop: '4px', paddingTop: '4px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      <span>Total Payable:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {paid > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.82rem', color: '#16a34a' }}>
                        <span>Amount Paid:</span>
                        <span>-{formatCurrency(paid)}</span>
                      </div>
                    )}
                    {balance !== total && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontWeight: 800, fontSize: '0.86rem', color: balance > 0 ? '#dc2626' : '#166534' }}>
                        <span>Balance Due:</span>
                        <span>{formatCurrency(balance)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER SIGNATORY & COMPUTER GENERATED NOTICE */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.74rem', color: '#64748b' }}>
                <div>
                  <div>This is a computer-generated invoice issued by <strong>{society.name}</strong>.</div>
                  <div style={{ marginTop: '1px' }}>No physical signature is required. Generated on {new Date().toISOString().slice(0, 10)}.</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>For {society.name}</div>
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid #475569', display: 'inline-block', paddingTop: '2px', fontWeight: 600 }}>
                    Authorized Signatory / Treasurer
                  </div>
                </div>
              </div>

              {/* MODAL ACTION BUTTONS (NO-PRINT) */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handlePrintCurrentBill}>
                  <Printer size={15} /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: PRINT CONFIRMED RECEIPT */}
      {modal === 'PRINT_RECEIPT' && selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3>{society.name} — Official Payment Receipt</h3>
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem' }}>
              <div><strong>Receipt Number:</strong> <code>{selectedReceipt.receipt_number}</code></div>
              <div><strong>Resident & Flat:</strong> {member.full_name} (Flat {member.flat_number})</div>
              <div><strong>Confirmed Amount:</strong> <strong style={{ color: 'var(--success)' }}>{formatCurrency(selectedReceipt.amount)}</strong></div>
              <div><strong>Method & Reference:</strong> {selectedReceipt.payment_method} ({selectedReceipt.reference_number})</div>
              <div><strong>Payment Date:</strong> {selectedReceipt.payment_date}</div>
            </div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Close</button>
              <button type="button" className="btn btn-primary" onClick={handlePrintDocument}>
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PHOTO LIGHTBOX VIEWER */}
      {viewingPhotoUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.65rem',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={15} /> Attachment Image Preview
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={viewingPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)' }}
                >
                  <ExternalLink size={13} /> Full Size
                </a>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)' }}
                  onClick={() => setViewingPhotoUrl(null)}
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <img
              src={viewingPhotoUrl}
              alt="Attachment Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: 8,
                objectFit: 'contain',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
