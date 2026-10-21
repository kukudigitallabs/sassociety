import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  UserCheck,
  MessageSquareWarning,
  CalendarDays,
  Landmark,
  Settings,
  Plus,
  Copy,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  RefreshCw,
  LogOut,
  Globe,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  ShieldCheck,
  ArrowRightLeft,
  Bell,
  Clock,
} from 'lucide-react';
import { apiFetch, uploadFileAsBase64, downloadCsv, openRazorpayCheckout } from '../api.ts';
import { type Language, t, formatCurrency } from '../i18n.ts';

interface SocietyAdminPortalProps {
  user: any;
  society: any;
  permissions: Record<string, boolean> | null;
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onLogout: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const SocietyAdminPortal: React.FC<SocietyAdminPortalProps> = ({
  user,
  society: initialSociety,
  permissions,
  lang,
  setLang,
  theme,
  setTheme,
  onLogout,
  notify,
}) => {
  const isStaff = user.role === 'STAFF';
  const can = (perm: string) => !isStaff || Boolean(permissions?.[perm]);

  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'NOTIFICATIONS' | 'MEMBERS' | 'BILLING' | 'PAYMENTS' | 'MANUAL_PAYMENT' | 'STAFF' | 'COMPLAINTS' | 'EVENTS' | 'ACCOUNTING' | 'SETTINGS'
  >('DASHBOARD');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'SUPER_ADMIN'>('ALL');
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  // Loaded Data States
  const [dashData, setDashData] = useState<any | null>(null);
  const [membersData, setMembersData] = useState<{ members: any[]; households: any[]; blocks: any[] }>({
    members: [],
    households: [],
    blocks: [],
  });
  const [chargeCategories, setChargeCategories] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [manualPaymentContext, setManualPaymentContext] = useState<{
    households: any[];
    members: any[];
    unpaidBills: any[];
  }>({ households: [], members: [], unpaidBills: [] });
  const [manualPaymentForm, setManualPaymentForm] = useState({
    householdId: '',
    memberId: '',
    billIds: [] as string[],
    amount: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: 'Cash / Manual payment received at Society Office',
    proofUrl: '',
    autoConfirm: true,
  });
  const [staffData, setStaffData] = useState<{ staff: any[]; attendance: any[] }>({ staff: [], attendance: [] });
  const [roles, setRoles] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<{ complaints: any[]; suggestions: any[] }>({
    complaints: [],
    suggestions: [],
  });
  const [eventsData, setEventsData] = useState<{ events: any[]; announcements: any[] }>({
    events: [],
    announcements: [],
  });
  const [expensesData, setExpensesData] = useState<{ expenses: any[]; categories: any[]; accounts: any[] }>({
    expenses: [],
    categories: [],
    accounts: [],
  });
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [settingsData, setSettingsData] = useState<{ society: any; settings: any } | null>(null);

  // Search & Filter States
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBlockFilter, setMemberBlockFilter] = useState('');
  const [billMonthFilter, setBillMonthFilter] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('');
  const [billSearch, setBillSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [ledgerFlatFilter, setLedgerFlatFilter] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('');

  // Modal States
  const [modal, setModal] = useState<
    | 'NONE'
    | 'ADD_MEMBER'
    | 'ADD_BLOCK'
    | 'TRANSFER_FLAT'
    | 'UPDATE_OPENING_BALANCE'
    | 'ADD_CHARGE_CAT'
    | 'GENERATE_BILLS'
    | 'SUPPLEMENTARY_BILL'
    | 'PRINT_INVOICE'
    | 'PRINT_RECEIPT'
    | 'ADD_STAFF'
    | 'ADD_ROLE'
    | 'ADD_ATTENDANCE'
    | 'ADD_EXPENSE_CAT'
    | 'ADD_EXPENSE'
    | 'RENEW_SUBSCRIPTION'
  >('NONE');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [transferHousehold, setTransferHousehold] = useState<any | null>(null);
  const [selectedHouseholdForOpBal, setSelectedHouseholdForOpBal] = useState<{
    id: string;
    flat_number: string;
    opening_balance?: number;
    opening_balance_notes?: string;
  } | null>(null);
  const [opBalForm, setOpBalForm] = useState({ openingBalance: '', notes: '' });

  // Forms
  const [newMemberForm, setNewMemberForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Member@123',
    flatNumber: '',
    blockName: 'Block A',
    floorNumber: '1',
    areaSqft: 1400,
    ownershipType: 'OWNER',
    emergencyContact: '',
    enrolmentMode: 'NEW_HOUSEHOLD',
    existingHouseholdId: '',
    relationshipToPrimary: 'SPOUSE',
    openingBalance: '',
    openingBalanceNotes: '',
  });
  const [newBlockName, setNewBlockName] = useState('');
  const [transferForm, setTransferForm] = useState({ newFlatNumber: '', newBlockName: '', reason: '' });

  const [newChargeCatForm, setNewChargeCatForm] = useState({
    name: '',
    description: '',
    defaultAmount: 500,
    billingFrequency: 'MONTHLY',
    applicableFlats: 'ALL',
    dueDay: 10,
  });

  const [genBillForm, setGenBillForm] = useState({
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    householdId: '', // empty = bulk all active flats
    chargeCategoryIds: [] as string[],
    penaltyAmount: 0,
    creditAmount: 0,
    asDraft: false,
    dueDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`,
  });

  const [suppBillForm, setSuppBillForm] = useState({
    householdId: '',
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    chargeCategoryId: '',
    amount: 500,
    reason: '',
  });

  const [newStaffForm, setNewStaffForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    roleId: '',
    designation: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    wageType: 'MONTHLY',
    salaryAmount: 18000,
    dutySchedule: 'Daily 09:00 AM - 06:00 PM',
    assignedDuties: '',
    isOnDuty: true,
    showContactToMembers: true,
    documentType: 'AADHAAR',
    documentNumber: '',
    documentUrl: '',
  });

  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    isOfficeBearer: false,
    permissions: {
      view_members: true,
      manage_members: false,
      generate_bills: false,
      verify_payments: false,
      manage_expenses: false,
      view_financial_reports: false,
      manage_complaints: true,
      manage_events: false,
      manage_staff: false,
      change_society_settings: false,
    },
  });

  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    attendanceDate: new Date().toISOString().slice(0, 10),
    status: 'PRESENT',
    checkInTime: '09:00',
    checkOutTime: '18:00',
    salaryPaid: 0,
    notes: '',
  });

  const [newEventForm, setNewEventForm] = useState({
    eventType: 'MEETING',
    title: '',
    description: '',
    eventDate: new Date().toISOString().slice(0, 10),
    eventTime: '11:00 AM',
    venue: 'Society Community Hall',
  });

  const [newAnnForm, setNewAnnForm] = useState({
    category: 'GENERAL',
    title: '',
    content: '',
    sendEmail: true,
  });

  const [newExpCatName, setNewExpCatName] = useState('');
  const [newExpenseForm, setNewExpenseForm] = useState({
    expenseCategoryId: '',
    description: '',
    amount: 1000,
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'BANK_TRANSFER',
    accountType: 'BANK',
    vendorName: '',
    invoiceUrl: '',
  });

  async function refreshCurrentTab() {
    try {
      if (activeTab === 'DASHBOARD' || activeTab === 'NOTIFICATIONS') {
        const res = await apiFetch('/api/society/dashboard');
        setDashData(res);
      } else if (activeTab === 'MEMBERS') {
        const res = await apiFetch(`/api/society/members?search=${encodeURIComponent(memberSearch)}&block=${encodeURIComponent(memberBlockFilter)}`);
        setMembersData(res);
      } else if (activeTab === 'BILLING') {
        const [catsRes, billsRes, memRes] = await Promise.all([
          apiFetch('/api/society/charge-categories'),
          apiFetch(`/api/society/bills?month=${billMonthFilter}&status=${billStatusFilter}&search=${encodeURIComponent(billSearch)}`),
          apiFetch('/api/society/members'),
        ]);
        setChargeCategories(catsRes.categories || []);
        setBills(billsRes.bills || []);
        setMembersData(memRes);
        if (catsRes.categories?.length > 0 && genBillForm.chargeCategoryIds.length === 0) {
          setGenBillForm((prev) => ({
            ...prev,
            chargeCategoryIds: catsRes.categories.slice(0, 3).map((c: any) => c.id),
          }));
          setSuppBillForm((prev) => ({ ...prev, chargeCategoryId: catsRes.categories[0].id }));
        }
      } else if (activeTab === 'PAYMENTS') {
        const res = await apiFetch(`/api/society/payments?status=${paymentStatusFilter}&search=${encodeURIComponent(paymentSearch)}`);
        setPayments(res.payments || []);
      } else if (activeTab === 'MANUAL_PAYMENT') {
        const res = await apiFetch('/api/society/payments?includeManualContext=1');
        setPayments(res.payments || []);
        const hhList = res.households || [];
        const memList = res.members || [];
        const ubList = res.unpaidBills || [];
        setManualPaymentContext({
          households: hhList,
          members: memList,
          unpaidBills: ubList,
        });
        if (hhList.length > 0 && !manualPaymentForm.householdId) {
          const defaultHh = hhList[0];
          const hhBills = ubList.filter((b: any) => b.household_id === defaultHh.id);
          const totalDue = hhBills.reduce((s: number, b: any) => s + Number(b.balance_amount || 0), 0);
          setManualPaymentForm((prev) => ({
            ...prev,
            householdId: defaultHh.id,
            memberId: defaultHh.primary_member_id || '',
            billIds: hhBills.map((b: any) => b.id),
            amount: totalDue > 0 ? Number(totalDue.toFixed(2)) : 3500,
          }));
        }
      } else if (activeTab === 'STAFF') {
        const [stRes, rlRes] = await Promise.all([
          apiFetch('/api/society/staff'),
          apiFetch('/api/society/roles'),
        ]);
        setStaffData(stRes);
        setRoles(rlRes.roles || []);
        if (rlRes.roles?.length > 0 && !newStaffForm.roleId) {
          setNewStaffForm((prev) => ({ ...prev, roleId: rlRes.roles[0].id }));
        }
      } else if (activeTab === 'COMPLAINTS') {
        const [cmpRes, stRes] = await Promise.all([
          apiFetch('/api/society/complaints'),
          apiFetch('/api/society/staff'),
        ]);
        setComplaintsData(cmpRes);
        setStaffData(stRes);
      } else if (activeTab === 'EVENTS') {
        const res = await apiFetch('/api/society/events');
        setEventsData(res);
      } else if (activeTab === 'ACCOUNTING') {
        const [expRes, repRes] = await Promise.all([
          apiFetch('/api/society/expenses'),
          apiFetch(`/api/society/reports?flatNumber=${encodeURIComponent(ledgerFlatFilter)}&category=${encodeURIComponent(ledgerTypeFilter)}`),
        ]);
        setExpensesData(expRes);
        setReportsData(repRes);
        if (expRes.categories?.length > 0 && !newExpenseForm.expenseCategoryId) {
          setNewExpenseForm((prev) => ({ ...prev, expenseCategoryId: expRes.categories[0].id }));
        }
      } else if (activeTab === 'SETTINGS') {
        const res = await apiFetch('/api/society/settings');
        setSettingsData(res);
      }
    } catch (err: any) {
      notify(err.message, 'error');
    }
  }

  useEffect(() => {
    refreshCurrentTab();
  }, [activeTab, memberBlockFilter, billMonthFilter, billStatusFilter, paymentStatusFilter, ledgerTypeFilter]);

  const currentSociety = dashData?.society || settingsData?.society || initialSociety || {};
  const kpis = dashData?.kpis || {};
  const publicEnrollUrl = `${window.location.origin}/?enroll=${encodeURIComponent(currentSociety.enrollment_code || '')}`;
  const allNotificationsList: any[] = dashData?.allSocietyNotifications || dashData?.superAdminNotifications || [];
  const unreadNotificationsCount = allNotificationsList.filter((n) => !n.is_read).length;

  return (
    <div className="app-shell">
      {/* Sidebar — Strictly Society Admin & Staff Only (Zero Super Admin Controls) */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
              {(currentSociety.name || 'S').slice(0, 1)}
            </div>
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentSociety.name || 'Society Panel'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {user.role === 'SOCIETY_ADMIN' ? 'Society Administrator' : 'Authorized Staff'}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className={`nav-item ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
            <LayoutDashboard size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'dashboard')}</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'NOTIFICATIONS' ? 'active' : ''}`}
            onClick={() => setActiveTab('NOTIFICATIONS')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Bell size={18} />
              {!sidebarCollapsed && <span>Notifications</span>}
            </span>
            {!sidebarCollapsed && unreadNotificationsCount > 0 && (
              <span
                style={{
                  background: '#f59e0b',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 999,
                }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          {can('view_members') && (
            <button type="button" className={`nav-item ${activeTab === 'MEMBERS' ? 'active' : ''}`} onClick={() => setActiveTab('MEMBERS')}>
              <Users size={18} />
              {!sidebarCollapsed && <span>{t(lang, 'members')}</span>}
            </button>
          )}
          <button type="button" className={`nav-item ${activeTab === 'BILLING' ? 'active' : ''}`} onClick={() => setActiveTab('BILLING')}>
            <Receipt size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'billing')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'PAYMENTS' ? 'active' : ''}`} onClick={() => setActiveTab('PAYMENTS')}>
            <CreditCard size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'payments')}</span>}
          </button>
          {can('verify_payments') && (
            <button type="button" className={`nav-item ${activeTab === 'MANUAL_PAYMENT' ? 'active' : ''}`} onClick={() => setActiveTab('MANUAL_PAYMENT')}>
              <Plus size={18} />
              {!sidebarCollapsed && <span>Receive Payment (Manual)</span>}
            </button>
          )}
          <button type="button" className={`nav-item ${activeTab === 'STAFF' ? 'active' : ''}`} onClick={() => setActiveTab('STAFF')}>
            <UserCheck size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'staff')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'COMPLAINTS' ? 'active' : ''}`} onClick={() => setActiveTab('COMPLAINTS')}>
            <MessageSquareWarning size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'complaints')}</span>}
          </button>
          <button type="button" className={`nav-item ${activeTab === 'EVENTS' ? 'active' : ''}`} onClick={() => setActiveTab('EVENTS')}>
            <CalendarDays size={18} />
            {!sidebarCollapsed && <span>{t(lang, 'events')}</span>}
          </button>
          {can('view_financial_reports') && (
            <button type="button" className={`nav-item ${activeTab === 'ACCOUNTING' ? 'active' : ''}`} onClick={() => setActiveTab('ACCOUNTING')}>
              <Landmark size={18} />
              {!sidebarCollapsed && <span>{t(lang, 'accounting')}</span>}
            </button>
          )}
          {can('change_society_settings') && (
            <button type="button" className={`nav-item ${activeTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActiveTab('SETTINGS')}>
              <Settings size={18} />
              {!sidebarCollapsed && <span>{t(lang, 'settings')}</span>}
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-area">
        <header className="topbar">
          <div>
            <h2 style={{ fontSize: '1.08rem' }}>
              {currentSociety.name} — {user.role === 'SOCIETY_ADMIN' ? t(lang, 'societyAdminPortal') : t(lang, 'staffPortal')}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.fullName} ({user.email}) • Enrolment Code: <code>{currentSociety.enrollment_code}</code>
              {Boolean(currentSociety.is_demo) && <span className="badge badge-warning" style={{ marginLeft: 8 }}>Demo Tenant</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={refreshCurrentTab}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={onLogout}>
              <LogOut size={14} /> {t(lang, 'logout')}
            </button>
          </div>
        </header>

        <main className="page-content">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <>
              {/* Super Admin Subscription Payment Due, Renewal & Approval Notification Card */}
              {(() => {
                const subSummary = dashData?.subscriptionSummary || {
                  planId: currentSociety.subscription_plan_id || 'plan-quarterly-growth',
                  planName: currentSociety.plan_name || 'Growth Quarterly Plan',
                  billingPeriod: currentSociety.plan_billing_period || 'QUARTERLY',
                  baseAmount: Number(currentSociety.plan_price || 5499),
                  taxPercent: Number(currentSociety.plan_tax_percent ?? 18),
                  taxAmount: Number((((Number(currentSociety.plan_price || 5499)) * Number(currentSociety.plan_tax_percent ?? 18)) / 100).toFixed(2)),
                  totalAmountDue: Number(
                    currentSociety.total_amount_due ||
                      Number((Number(currentSociety.plan_price || 5499) * 1.18).toFixed(2))
                  ),
                  subscriptionStatus: currentSociety.subscription_status || 'TRIAL',
                  approvalStatus: currentSociety.approval_status || 'APPROVED',
                  paymentStatus: currentSociety.payment_status || 'TRIAL',
                  expiryDate: currentSociety.subscription_ends_at || currentSociety.trial_ends_at || null,
                  daysRemaining:
                    currentSociety.days_remaining ??
                    (currentSociety.subscription_ends_at || currentSociety.trial_ends_at
                      ? Math.ceil(
                          (new Date(currentSociety.subscription_ends_at || currentSociety.trial_ends_at).getTime() - Date.now()) /
                            86400_000
                        )
                      : 14),
                  pendingInvoice: null,
                };

                const superAdminNotices: any[] = dashData?.superAdminNotifications || [];
                const unreadSuperAdminNotices = superAdminNotices.filter((n) => !n.is_read);

                // Dues notification is displayed ONLY when <= 30 days remain to renewal,
                // or if subscription is EXPIRED, trial is pending, or payment/approval is overdue.
                // Otherwise (> 30 days remain & ACTIVE & PAID & APPROVED), display ONLY the status of the subscription.
                const isRenewalDue =
                  subSummary.subscriptionStatus !== 'ACTIVE' ||
                  subSummary.paymentStatus !== 'PAID' ||
                  subSummary.approvalStatus !== 'APPROVED' ||
                  subSummary.daysRemaining <= 30;

                if (!isRenewalDue) {
                  return (
                    <div
                      className="card"
                      style={{
                        background: 'var(--bg-subtle)',
                        borderColor: 'var(--border)',
                        borderWidth: '1px',
                        padding: '1.1rem 1.35rem',
                        display: 'grid',
                        gap: '0.9rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: '#059669',
                              color: '#fff',
                            }}
                          >
                            <ShieldCheck size={18} />
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: '0.98rem', margin: 0 }}>
                                Society Subscription Status
                              </h4>
                              <span className="badge badge-success">
                                Status: {subSummary.subscriptionStatus}
                              </span>
                              <span className="badge badge-success">
                                Super Admin Approval: {subSummary.approvalStatus}
                              </span>
                              <span className="badge badge-success">
                                Payment: PAID
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                              Your society subscription is active and in good standing. Next renewal is scheduled in {subSummary.daysRemaining} days ({(subSummary.expiryDate || '').slice(0, 10) || 'N/A'}).
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setActiveTab('NOTIFICATIONS')}
                          >
                            <Bell size={15} /> Notifications List ({allNotificationsList.length})
                          </button>
                        </div>
                      </div>

                      {/* Clean Subscription Status Metrics (No Dues) */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '0.75rem 1rem',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Subscription Plan
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>{subSummary.planName}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Billing Cycle: {subSummary.billingPeriod}
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '0.75rem 1rem',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Subscription Status
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
                            Fully Paid & Active
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Plan Fee: {formatCurrency(subSummary.totalAmountDue)} (Paid in Full)
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '0.75rem 1rem',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Days Until Renewal
                          </div>
                          <div
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: '#059669',
                              marginTop: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <Clock size={15} />
                            {subSummary.daysRemaining} Days Remaining
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Next Renewal Date: {(subSummary.expiryDate || '').slice(0, 10) || 'N/A'}
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '0.75rem 1rem',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Super Admin Approval
                          </div>
                          <div
                            style={{
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: '#059669',
                              marginTop: 2,
                            }}
                          >
                            Approved & Active
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Account verified and in good standing
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // When renewal is due (<= 30 days or unpaid/trial): display full dues & renewal notification card
                return (
                  <div
                    className="card"
                    style={{
                      background: 'var(--warning-bg)',
                      borderColor: 'var(--warning)',
                      borderWidth: '1.5px',
                      padding: '1.1rem 1.35rem',
                      display: 'grid',
                      gap: '0.9rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: '#f59e0b',
                            color: '#fff',
                          }}
                        >
                          <Bell size={18} />
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '0.98rem', margin: 0 }}>
                              Super Admin Subscription Renewal & Approval Status
                            </h4>
                            <span
                              className={`badge ${
                                subSummary.subscriptionStatus === 'ACTIVE'
                                  ? 'badge-success'
                                  : subSummary.subscriptionStatus === 'TRIAL'
                                  ? 'badge-info'
                                  : 'badge-warning'
                              }`}
                            >
                              Status: {subSummary.subscriptionStatus}
                            </span>
                            <span
                              className={`badge ${
                                subSummary.approvalStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'
                              }`}
                            >
                              Super Admin Approval: {subSummary.approvalStatus}
                            </span>
                            <span className="badge badge-warning">
                              Payment: {subSummary.paymentStatus === 'PAID' ? 'RENEWAL DUE' : 'DUE FOR RENEWAL / APPROVAL'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            {subSummary.daysRemaining <= 0
                              ? 'Your subscription is overdue. Please complete renewal payment immediately to avoid service interruption.'
                              : `Subscription renewal is due in ${subSummary.daysRemaining} days (${(subSummary.expiryDate || '').slice(0, 10)}). Complete payment for instant renewal and approval.`}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setActiveTab('NOTIFICATIONS')}
                        >
                          <Bell size={15} /> Notifications List ({allNotificationsList.length})
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={async () => {
                            try {
                              await openRazorpayCheckout({
                                amountRupees: subSummary.totalAmountDue,
                                currency: 'INR',
                                receipt: `sub_${currentSociety.id.slice(0, 8)}_${Date.now()}`,
                                merchantName: 'SocietyOS Platform Subscription',
                                description: `${subSummary.planName} Renewal & Approval — ${currentSociety.name}`,
                                prefill: {
                                  name: user.fullName || currentSociety.name,
                                  email: user.email || currentSociety.contact_email,
                                  contact: user.phone || currentSociety.contact_phone,
                                },
                                isSubscription: true,
                                societyId: currentSociety.id,
                                planId: subSummary.planId,
                                subscriptionPaymentId: subSummary.pendingInvoice?.id,
                                onSuccess: (verified: any) => {
                                  notify(
                                    verified?.message ||
                                      `Subscription payment of ${formatCurrency(subSummary.totalAmountDue)} verified! Society is ACTIVE & APPROVED.`
                                  );
                                  refreshCurrentTab();
                                },
                                onDismiss: () => {
                                  notify('Subscription checkout was cancelled.', 'error');
                                },
                                onError: (errMsg: string) => {
                                  notify(errMsg || 'Subscription payment verification failed.', 'error');
                                },
                              });
                            } catch (err: any) {
                              notify(err.message || 'Subscription payment was cancelled or failed.', 'error');
                            }
                          }}
                        >
                          <CreditCard size={15} /> Pay {formatCurrency(subSummary.totalAmountDue)} & Renew Subscription Now
                        </button>
                      </div>
                    </div>

                    {/* Key Subscription Amount & Days Pending Metrics */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '0.75rem 1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Subscription Plan
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>{subSummary.planName}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Billing Cycle: {subSummary.billingPeriod}
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '0.75rem 1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Amount Due to Renew / Approve
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand)', marginTop: 2 }}>
                          {formatCurrency(subSummary.totalAmountDue)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Base {formatCurrency(subSummary.baseAmount)} + {subSummary.taxPercent}% GST ({formatCurrency(subSummary.taxAmount)})
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '0.75rem 1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Days Pending to Renew
                        </div>
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: subSummary.daysRemaining <= 14 ? '#d97706' : '#059669',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Clock size={15} />
                          {subSummary.daysRemaining >= 0
                            ? `${subSummary.daysRemaining} Days Pending`
                            : `Overdue by ${Math.abs(subSummary.daysRemaining)} Days`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Renewal / Expiry Date: {(subSummary.expiryDate || '').slice(0, 10) || 'N/A'}
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '0.75rem 1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Super Admin Approval
                        </div>
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: subSummary.approvalStatus === 'APPROVED' ? '#059669' : '#d97706',
                            marginTop: 2,
                          }}
                        >
                          {subSummary.approvalStatus === 'APPROVED' ? 'Approved & Active' : 'Pending Payment & Approval'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {subSummary.pendingInvoice
                            ? `Pending Invoice: ${subSummary.pendingInvoice.invoice_number}`
                            : 'Auto-approved upon Razorpay settlement'}
                        </div>
                      </div>
                    </div>

                    {/* Unread Notifications from Super Admin (Removed from Dashboard when Marked as Read & Redirected to Notifications Page) */}
                    {unreadSuperAdminNotices.length > 0 && (
                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '0.8rem 1rem',
                          display: 'grid',
                          gap: '0.55rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Unread Notifications from Super Admin ({unreadSuperAdminNotices.length})
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}
                            onClick={async () => {
                              try {
                                const latestNotice = unreadSuperAdminNotices[0];
                                await apiFetch('/api/notifications/mark-read', { method: 'POST', body: {} });
                                if (latestNotice) {
                                  setSelectedNotification({ ...latestNotice, is_read: 1 });
                                }
                                setNotificationFilter('ALL');
                                notify('All notifications marked as read, removed from Dashboard, and saved under Notifications.');
                                setActiveTab('NOTIFICATIONS');
                              } catch (err: any) {
                                notify(err.message, 'error');
                              }
                            }}
                          >
                            <CheckCircle2 size={13} /> Mark All Read & View in Notifications Page
                          </button>
                        </div>
                        {unreadSuperAdminNotices.map((notice: any) => (
                          <div
                            key={notice.id}
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: 8,
                              background: 'rgba(245, 158, 11, 0.12)',
                              borderLeft: '3px solid #f59e0b',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.85rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 240 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {notice.title}
                                <span className="badge badge-warning">UNREAD</span>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                                {notice.message}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                Received: {(notice.created_at || '').slice(0, 16).replace('T', ' ')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                  try {
                                    await apiFetch('/api/notifications/mark-read', {
                                      method: 'POST',
                                      body: { notificationId: notice.id },
                                    });
                                    setSelectedNotification({ ...notice, is_read: 1 });
                                    setNotificationFilter('ALL');
                                    notify('Notification marked as read, removed from Dashboard, and opened in Notifications page.');
                                    setActiveTab('NOTIFICATIONS');
                                  } catch (err: any) {
                                    notify(err.message, 'error');
                                  }
                                }}
                              >
                                <CheckCircle2 size={13} /> Mark as Read
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Shareable Public Enrolment Link Card */}
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-subtle)' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Shareable Resident Flat Enrolment Link</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Share this locked society invitation link with new residents. Flat numbers are normalized and checked against duplicate registrations automatically:
                  </p>
                  <div style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.25rem' }}>
                    Society: {currentSociety.name}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(publicEnrollUrl);
                    notify(`Enrolment link for ${currentSociety.name} copied to clipboard!`);
                  }}
                >
                  <Copy size={14} /> Copy Enrolment Link
                </button>
              </div>

              {/* All 17 KPI Cards from Section 14 */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'totalHouseholds')}</span>
                  <span className="kpi-value">{kpis.totalRegisteredHouseholds ?? 0}</span>
                  <span className="kpi-sub">Active Members: {kpis.activeMembers ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'pendingApprovals')}</span>
                  <span className="kpi-value" style={{ color: 'var(--warning)' }}>{kpis.pendingEnrolmentApprovals ?? 0}</span>
                  <span className="kpi-sub">Blocked Members: {kpis.blockedMembers ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Bills Issued This Month</span>
                  <span className="kpi-value">{kpis.billsIssuedThisMonth ?? 0}</span>
                  <span className="kpi-sub">{t(lang, 'totalBilled')}: {formatCurrency(kpis.totalBilledAmount)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'totalCollected')}</span>
                  <span className="kpi-value" style={{ color: 'var(--success)' }}>{formatCurrency(kpis.totalCollectedAmount)}</span>
                  <span className="kpi-sub">Rejected: {formatCurrency(kpis.rejectedPaymentsAmount)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'pendingVerification')}</span>
                  <span className="kpi-value" style={{ color: 'var(--warning)' }}>{formatCurrency(kpis.pendingPaymentVerification)}</span>
                  <span className="kpi-sub">Partial Bills: {kpis.partialPaymentsCount ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'outstandingDues')}</span>
                  <span className="kpi-value" style={{ color: 'var(--danger)' }}>{formatCurrency(kpis.totalOutstandingDues)}</span>
                  <span className="kpi-sub">Overdue Bills: {kpis.overdueBills ?? 0}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Monthly Income / Expenses</span>
                  <span className="kpi-value" style={{ color: 'var(--primary)' }}>{formatCurrency(kpis.monthlyIncome)}</span>
                  <span className="kpi-sub">Expenses: {formatCurrency(kpis.monthlyExpenses)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'bankBalance')} & Cash</span>
                  <span className="kpi-value">{formatCurrency(kpis.currentBankBalance)}</span>
                  <span className="kpi-sub">{t(lang, 'cashBalance')}: {formatCurrency(kpis.currentCashBalance)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Open / Resolved Complaints</span>
                  <span className="kpi-value">{kpis.openComplaints ?? 0} / {kpis.resolvedComplaints ?? 0}</span>
                  <span className="kpi-sub">{t(lang, 'onDutyStaff')}: {kpis.onDutyStaff ?? 0}</span>
                </div>
              </div>

              {/* Recent Payments & Recent Complaints Split View */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem' }}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4>Recent Member Payments</h4>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('PAYMENTS')}>
                      Verify Payments
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Flat & Member</th>
                          <th>Amount</th>
                          <th>Method & Ref</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashData?.recentPayments || []).map((p: any) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.flat_number}</strong> — {p.member_name}
                            </td>
                            <td>{formatCurrency(p.amount)}</td>
                            <td>
                              <div>{p.payment_method}</div>
                              <code style={{ fontSize: '0.72rem' }}>{p.reference_number}</code>
                            </td>
                            <td>
                              <span className={`badge ${p.status === 'CONFIRMED' ? 'badge-success' : p.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4>Recent Resident Complaints</h4>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('COMPLAINTS')}>
                      Manage Complaints
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID & Flat</th>
                          <th>Title & Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashData?.recentComplaints || []).map((c: any) => (
                          <tr key={c.id}>
                            <td>
                              <strong>{c.complaint_number}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flat {c.flat_number}</div>
                            </td>
                            <td>
                              <div>{c.title}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{c.category}</div>
                            </td>
                            <td><span className="badge badge-info">{c.priority}</span></td>
                            <td>
                              <span className={`badge ${c.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MEMBERS & HOUSEHOLDS */}
          {activeTab === 'MEMBERS' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3>Society Households, Flats & Enrolled Residents</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Duplicate active flat numbers within this society are blocked automatically. Multiple family members can be linked to one household.
                  </p>
                </div>
                {can('manage_members') && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal('ADD_BLOCK')}>
                      <Plus size={14} /> Add (+) Block
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal('ADD_MEMBER')}>
                      <Plus size={14} /> Enrol Member / Flat
                    </button>
                  </div>
                )}
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search member name, flat number, email, phone..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && refreshCurrentTab()}
                />
                <select className="select" value={memberBlockFilter} onChange={(e) => setMemberBlockFilter(e.target.value)}>
                  <option value="">All Blocks / Towers</option>
                  {membersData.blocks.map((b: any) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary" onClick={refreshCurrentTab}>Search Records</button>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Normalized Flat</th>
                      <th>Block & Floor</th>
                      <th>Resident Name</th>
                      <th>Role / Household Link</th>
                      <th>Contact</th>
                      <th>Opening Bal / Dues</th>
                      <th>Approval</th>
                      <th>Status</th>
                      {can('manage_members') && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {membersData.members.map((m: any) => (
                      <tr key={m.id}>
                        <td><strong>{m.normalized_flat_number}</strong></td>
                        <td>{m.block_name}, Floor {m.floor_number}</td>
                        <td>{m.full_name}</td>
                        <td>
                          <span className="badge badge-info">
                            {m.is_primary_member ? `PRIMARY (${m.ownership_type})` : `FAMILY (${m.relationship_to_primary})`}
                          </span>
                        </td>
                        <td>
                          <div>{m.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.phone}</div>
                        </td>
                        <td>
                          {Boolean(m.is_primary_member) ? (
                            <div>
                              <div><strong>{formatCurrency(m.opening_balance || 0)}</strong></div>
                              {Number(m.opening_balance_dues || 0) > 0 ? (
                                <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>
                                  Due: {formatCurrency(m.opening_balance_dues)}
                                </div>
                              ) : Number(m.opening_balance || 0) > 0 ? (
                                <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Paid</div>
                              ) : null}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${m.approval_status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                            {m.approval_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${m.account_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                            {m.account_status}
                          </span>
                        </td>
                        {can('manage_members') && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {m.approval_status === 'PENDING' && (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={async () => {
                                    await apiFetch(`/api/society/members/${m.id}`, { method: 'PUT', body: { action: 'APPROVE' } });
                                    notify('Member enrolment approved.');
                                    refreshCurrentTab();
                                  }}
                                >
                                  Approve
                                </button>
                              )}
                              {m.account_status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={async () => {
                                    await apiFetch(`/api/society/members/${m.id}`, { method: 'PUT', body: { action: 'BLOCK' } });
                                    notify('Member blocked.');
                                    refreshCurrentTab();
                                  }}
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={async () => {
                                    await apiFetch(`/api/society/members/${m.id}`, { method: 'PUT', body: { action: 'REACTIVATE' } });
                                    notify('Member reactivated.');
                                    refreshCurrentTab();
                                  }}
                                >
                                  Reactivate
                                </button>
                              )}
                              {Boolean(m.is_primary_member) && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      setSelectedHouseholdForOpBal({
                                        id: m.household_id,
                                        flat_number: m.normalized_flat_number,
                                        opening_balance: m.opening_balance || 0,
                                        opening_balance_notes: m.opening_balance_notes || '',
                                      });
                                      setOpBalForm({
                                        openingBalance: String(m.opening_balance || 0),
                                        notes: m.opening_balance_notes || '',
                                      });
                                      setModal('UPDATE_OPENING_BALANCE');
                                    }}
                                    title="Configure or adjust opening balance"
                                  >
                                    ₹ Opening Bal
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      setTransferHousehold({ id: m.household_id, flat_number: m.normalized_flat_number, block_name: m.block_name });
                                      setTransferForm({ newFlatNumber: m.normalized_flat_number, newBlockName: m.block_name, reason: '' });
                                      setModal('TRANSFER_FLAT');
                                    }}
                                    title="Logged Flat Correction / Transfer"
                                  >
                                    <ArrowRightLeft size={13} /> Transfer Flat
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MONTHLY BILLING & CHARGE CATEGORIES */}
          {activeTab === 'BILLING' && (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Society Charge Categories (Society-Isolated Configuration)</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Default and unlimited custom charge categories configured specifically for {currentSociety.name}.
                    </p>
                  </div>
                  {can('generate_bills') && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal('ADD_CHARGE_CAT')}>
                      <Plus size={14} /> Add (+) Charge Category
                    </button>
                  )}
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Code</th>
                        <th>Default Amount</th>
                        <th>Billing Frequency</th>
                        <th>Applicable Flats</th>
                        <th>Due Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargeCategories.map((c: any) => (
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong></td>
                          <td><code>{c.code}</code></td>
                          <td>{formatCurrency(c.default_amount)}</td>
                          <td><span className="badge badge-info">{c.billing_frequency}</span></td>
                          <td>{c.applicable_flats}</td>
                          <td>Day {c.due_day} of month</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Monthly Bills & Invoices</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Generate bulk or individual bills. Database constraints prevent duplicate standard bills for the same flat, period, and category.
                    </p>
                  </div>
                  {can('generate_bills') && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal('SUPPLEMENTARY_BILL')}>
                        <Plus size={14} /> Issue Adjustment / Supplementary Bill
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal('GENERATE_BILLS')}>
                        <Plus size={14} /> {t(lang, 'generateBills')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search bill #, flat #, member name..."
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                  />
                  <select className="select" value={billMonthFilter} onChange={(e) => setBillMonthFilter(e.target.value)}>
                    <option value="">All Billing Months</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>Month {m}</option>
                    ))}
                  </select>
                  <select className="select" value={billStatusFilter} onChange={(e) => setBillStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={refreshCurrentTab}>Filter Bills</button>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bill Number</th>
                        <th>Flat & Resident</th>
                        <th>Period & Type</th>
                        <th>Total Amount</th>
                        <th>Paid / Balance</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((b: any) => (
                        <tr key={b.id}>
                          <td><strong>{b.bill_number}</strong></td>
                          <td>
                            <strong>{b.flat_number}</strong> — {b.member_name || 'Household'}
                          </td>
                          <td>
                            {b.bill_type === 'OPENING_BALANCE' || b.bill_number?.startsWith('OP-BAL-') ? (
                              <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                                OPENING BALANCE
                              </span>
                            ) : (
                              <>{b.billing_month}/{b.billing_year} • <span className="badge badge-info">{b.bill_type}</span></>
                            )}
                          </td>
                          <td>{formatCurrency(b.total_amount)}</td>
                          <td>
                            <span style={{ color: 'var(--success)' }}>{formatCurrency(b.paid_amount)}</span> /{' '}
                            <strong style={{ color: Number(b.balance_amount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {formatCurrency(b.balance_amount)}
                            </strong>
                          </td>
                          <td>{b.due_date}</td>
                          <td>
                            <span className={`badge ${b.status === 'PAID' ? 'badge-success' : b.status === 'DRAFT' ? 'badge-info' : 'badge-warning'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedInvoice(b);
                                  setModal('PRINT_INVOICE');
                                }}
                              >
                                <Printer size={13} /> Invoice
                              </button>
                              {b.status === 'DRAFT' && can('generate_bills') && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={async () => {
                                    await apiFetch(`/api/society/bills/${b.id}/publish`, { method: 'POST' });
                                    notify('Draft bill published.');
                                    refreshCurrentTab();
                                  }}
                                >
                                  Publish
                                </button>
                              )}
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

          {/* TAB 4: PAYMENT VERIFICATION & RECEIPTS */}
          {activeTab === 'PAYMENTS' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3>Member Payment Submissions & Idempotent Verification</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Confirming a payment posts an INCOME entry to the financial ledger, updates bill balances, and generates a unique receipt. Repeating confirmation is idempotent.
                  </p>
                </div>
                {can('verify_payments') && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('MANUAL_PAYMENT')}
                  >
                    <Plus size={14} /> Receive Manual Payment (Cash / Cheque / UPI)
                  </button>
                )}
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search reference #, receipt #, flat, member..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
                <select className="select" value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                  <option value="">All Payment Statuses</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button type="button" className="btn btn-secondary" onClick={refreshCurrentTab}>Search Payments</button>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Flat & Member</th>
                      <th>Amount</th>
                      <th>Method & Reference #</th>
                      <th>Allocated Bills</th>
                      <th>Status & Receipt</th>
                      {can('verify_payments') && <th>Verification Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.payment_date}</td>
                        <td>
                          <strong>{p.flat_number}</strong> — {p.member_name}
                        </td>
                        <td><strong>{formatCurrency(p.amount)}</strong></td>
                        <td>
                          <span className="badge badge-info">{p.payment_method}</span>
                          <div style={{ marginTop: 3 }}><code>{p.reference_number}</code></div>
                          {p.proof_url && (
                            <a href={p.proof_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                              View Uploaded Proof
                            </a>
                          )}
                        </td>
                        <td>
                          {(p.allocations || []).map((al: any) => (
                            <div key={al.id} style={{ fontSize: '0.76rem' }}>
                              {al.bill_number} ({formatCurrency(al.allocated_amount)})
                            </div>
                          ))}
                        </td>
                        <td>
                          <span className={`badge ${p.status === 'CONFIRMED' ? 'badge-success' : p.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                            {p.status}
                          </span>
                          {p.receipt_number && (
                            <div style={{ fontSize: '0.75rem', marginTop: 3 }}>
                              Receipt: <code>{p.receipt_number}</code>
                            </div>
                          )}
                        </td>
                        {can('verify_payments') && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {p.status !== 'CONFIRMED' && (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={async () => {
                                    try {
                                      const res = await apiFetch(`/api/society/payments/${p.id}/verify`, {
                                        method: 'POST',
                                        body: { decision: 'CONFIRM', notes: 'Verified and settled in society account' },
                                      });
                                      notify(res.message);
                                      refreshCurrentTab();
                                    } catch (err: any) {
                                      notify(err.message, 'error');
                                    }
                                  }}
                                >
                                  <CheckCircle2 size={13} /> Confirm
                                </button>
                              )}
                              {p.status === 'PENDING_VERIFICATION' && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={async () => {
                                    const reason = window.prompt('Enter rejection reason for member notification:', 'Invalid UPI transaction reference');
                                    if (!reason) return;
                                    try {
                                      const res = await apiFetch(`/api/society/payments/${p.id}/verify`, {
                                        method: 'POST',
                                        body: { decision: 'REJECT', notes: reason },
                                      });
                                      notify(res.message);
                                      refreshCurrentTab();
                                    } catch (err: any) {
                                      notify(err.message, 'error');
                                    }
                                  }}
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              )}
                              {p.receipt_number && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedReceipt(p);
                                    setModal('PRINT_RECEIPT');
                                  }}
                                >
                                  <Printer size={13} /> Receipt
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4B: DEDICATED MANUAL PAYMENT RECEIVED PAGE (CASH / CHEQUE / UPI DESK COLLECTION) */}
          {activeTab === 'MANUAL_PAYMENT' && (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Receive Manual Payment from Society Member (Desk Collection)</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Record Cash, Cheque, Bank Transfer, or UPI payments received directly from residents. Automatically updates member bills, generates an official receipt, and posts to the Cash/Bank ledger.
                    </p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('PAYMENTS')}>
                    View All Payment Records
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await apiFetch('/api/society/payments/manual', {
                        method: 'POST',
                        body: manualPaymentForm,
                      });
                      notify(res.message);
                      if (res.receipt) {
                        setSelectedReceipt(res.receipt);
                        setModal('PRINT_RECEIPT');
                      }
                      setManualPaymentForm((prev) => ({
                        ...prev,
                        referenceNumber: '',
                        proofUrl: '',
                      }));
                      refreshCurrentTab();
                    } catch (err: any) {
                      notify(err.message, 'error');
                    }
                  }}
                  style={{ display: 'grid', gap: '1.1rem' }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Select Flat / Household *</label>
                      <select
                        className="select"
                        required
                        value={manualPaymentForm.householdId}
                        onChange={(e) => {
                          const hhId = e.target.value;
                          const hh = manualPaymentContext.households.find((h: any) => h.id === hhId);
                          const hhBills = manualPaymentContext.unpaidBills.filter((b: any) => b.household_id === hhId);
                          const totalDue = hhBills.reduce((s: number, b: any) => s + Number(b.balance_amount || 0), 0);
                          setManualPaymentForm((prev) => ({
                            ...prev,
                            householdId: hhId,
                            memberId: hh?.primary_member_id || '',
                            billIds: hhBills.map((b: any) => b.id),
                            amount: totalDue > 0 ? Number(totalDue.toFixed(2)) : prev.amount,
                          }));
                        }}
                      >
                        <option value="" disabled>-- Choose Flat / Household --</option>
                        {manualPaymentContext.households.map((h: any) => (
                          <option key={h.id} value={h.id}>
                            Flat {h.normalized_flat_number} ({h.block_name}) — {h.primary_member_name || 'Resident'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Paid By Resident Member</label>
                      <select
                        className="select"
                        value={manualPaymentForm.memberId}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, memberId: e.target.value })}
                      >
                        {manualPaymentContext.members
                          .filter((m: any) => m.household_id === manualPaymentForm.householdId)
                          .map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name} ({m.phone}) {m.is_primary_member ? '• Primary' : '• Family'}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Payment Mode / Method *</label>
                      <select
                        className="select"
                        value={manualPaymentForm.paymentMethod}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, paymentMethod: e.target.value })}
                      >
                        <option value="CASH">Cash (Credits Society Cash Account)</option>
                        <option value="UPI">UPI QR / VPA (Credits Society Bank Account)</option>
                        <option value="GPAY_UPI">Google Pay UPI (Credits Society Bank Account)</option>
                        <option value="PAYTM">Paytm (Credits Society Bank Account)</option>
                        <option value="BANK_TRANSFER">Cheque / NEFT / IMPS (Credits Bank Account)</option>
                        <option value="OTHER">Other / Demand Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* Unpaid / Partially Paid Bills for Selected Flat */}
                  <div className="card" style={{ background: 'var(--bg-subtle)', padding: '0.95rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                        Pending / Unpaid Bills for Selected Flat (Select bills to settle)
                      </label>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Supports single bill, multiple bills, or partial payment
                      </span>
                    </div>
                    {(() => {
                      const flatBills = manualPaymentContext.unpaidBills.filter(
                        (b: any) => b.household_id === manualPaymentForm.householdId
                      );
                      if (flatBills.length === 0) {
                        return (
                          <div style={{ fontSize: '0.84rem', color: 'var(--success)', fontWeight: 600 }}>
                            No pending unpaid bills for this flat. You can still record an advance/custom payment amount below.
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'grid', gap: '0.45rem' }}>
                          {flatBills.map((b: any) => {
                            const checked = manualPaymentForm.billIds.includes(b.id);
                            return (
                              <label
                                key={b.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: 6,
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.84rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const nextIds = e.target.checked
                                        ? [...manualPaymentForm.billIds, b.id]
                                        : manualPaymentForm.billIds.filter((id) => id !== b.id);
                                      const nextTotal = flatBills
                                        .filter((fb: any) => nextIds.includes(fb.id))
                                        .reduce((sum: number, fb: any) => sum + Number(fb.balance_amount || 0), 0);
                                      setManualPaymentForm({
                                        ...manualPaymentForm,
                                        billIds: nextIds,
                                        amount: nextTotal > 0 ? Number(nextTotal.toFixed(2)) : manualPaymentForm.amount,
                                      });
                                    }}
                                  />
                                  <strong>{b.bill_number}</strong> — Period {b.billing_month}/{b.billing_year} ({b.bill_type}) • Due: {b.due_date}
                                </span>
                                <span>
                                  Balance Due: <strong style={{ color: 'var(--danger)' }}>{formatCurrency(b.balance_amount)}</strong> (Total: {formatCurrency(b.total_amount)})
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Amount Received (₹) * (Editable for Partial Payment)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        className="input"
                        value={manualPaymentForm.amount}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, amount: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Payment Date *</label>
                      <input
                        type="date"
                        required
                        className="input"
                        value={manualPaymentForm.paymentDate}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, paymentDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Receipt / UTR / Cheque / Reference # (Auto-generated if blank)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., CASH-DESK-101 or Cheque #452910"
                        value={manualPaymentForm.referenceNumber}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, referenceNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Remarks / Verification Notes</label>
                      <input
                        type="text"
                        className="input"
                        value={manualPaymentForm.notes}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, notes: e.target.value })}
                        placeholder="e.g., Received cash at society office counter"
                      />
                    </div>

                    <div className="form-group">
                      <label>Optional Payment Proof / Cheque Image</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="input"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadFileAsBase64(file);
                            setManualPaymentForm((prev) => ({ ...prev, proofUrl: url }));
                            notify('Payment proof attached.');
                          } catch (err: any) {
                            notify(err.message, 'error');
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={manualPaymentForm.autoConfirm}
                        onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, autoConfirm: e.target.checked })}
                      />
                      Confirm Immediately, Post to Financial Ledger & Generate Printable Receipt
                    </label>

                    <button type="submit" className="btn btn-primary">
                      <CheckCircle2 size={16} /> Record Manual Payment & Issue Receipt
                    </button>
                  </div>
                </form>
              </div>

              <div className="card">
                <h3>Recently Recorded Member Payments & Receipts</h3>
                <div className="table-wrap" style={{ marginTop: '0.85rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Flat & Member</th>
                        <th>Amount</th>
                        <th>Method & Ref</th>
                        <th>Status</th>
                        <th>Receipt</th>
                        <th>Print</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0, 12).map((p: any) => (
                        <tr key={p.id}>
                          <td>{p.payment_date}</td>
                          <td><strong>{p.flat_number}</strong> — {p.member_name}</td>
                          <td><strong>{formatCurrency(p.amount)}</strong></td>
                          <td>
                            <span className="badge badge-info">{p.payment_method}</span>{' '}
                            <code style={{ fontSize: '0.75rem' }}>{p.reference_number}</code>
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'CONFIRMED' ? 'badge-success' : p.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>{p.receipt_number ? <code>{p.receipt_number}</code> : '—'}</td>
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
                                <Printer size={13} /> Print Receipt
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

          {/* TAB 5: STAFF, DUTY MANAGEMENT & ROLE PERMISSIONS */}
          {activeTab === 'STAFF' && (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Society Staff, Guards, Office Bearers & Live Duty Status</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Toggle staff On Duty / Off Duty. On-duty staff immediately appear in the Resident Member Portal. Aadhaar numbers are masked automatically.
                    </p>
                  </div>
                  {can('manage_staff') && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal('ADD_ATTENDANCE')}>
                        <Plus size={14} /> Record Attendance / Wage
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal('ADD_ROLE')}>
                        <Plus size={14} /> Add (+) Custom Role
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal('ADD_STAFF')}>
                        <Plus size={14} /> Add (+) Staff Member
                      </button>
                    </div>
                  )}
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name & Designation</th>
                        <th>Role</th>
                        <th>Phone & Schedule</th>
                        <th>Salary / Wage</th>
                        <th>Masked ID Docs</th>
                        <th>Live Duty Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.staff.map((st: any) => (
                        <tr key={st.id}>
                          <td>
                            <strong>{st.full_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.designation}</div>
                          </td>
                          <td><span className="badge badge-info">{st.role_name}</span></td>
                          <td>
                            <div>{st.phone}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.duty_schedule}</div>
                          </td>
                          <td>{formatCurrency(st.salary_amount)} ({st.wage_type})</td>
                          <td>
                            {(st.documents || []).map((d: any) => (
                              <div key={d.id} style={{ fontSize: '0.75rem' }}>
                                {d.document_type}: <code>{d.masked_document_number}</code>
                              </div>
                            ))}
                            {(!st.documents || st.documents.length === 0) && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified on file</span>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className={`badge ${st.is_on_duty ? 'badge-success' : 'badge-warning'}`}>
                                {st.is_on_duty ? 'ON DUTY' : 'OFF DUTY'}
                              </span>
                              {can('manage_staff') && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={async () => {
                                    const res = await apiFetch(`/api/society/staff/${st.id}/duty`, {
                                      method: 'PUT',
                                      body: { isOnDuty: !st.is_on_duty },
                                    });
                                    notify(res.message);
                                    refreshCurrentTab();
                                  }}
                                >
                                  Mark {st.is_on_duty ? 'Off Duty' : 'On Duty'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Permission Matrix */}
              <div className="card">
                <h3>Configurable Office Bearer & Staff Role Permissions</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Server-side authorization checks these permissions on every protected request (e.g., a Cashier can verify payments without permission to manage members).
                </p>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Role Name</th>
                        <th>View Members</th>
                        <th>Manage Members</th>
                        <th>Generate Bills</th>
                        <th>Verify Payments</th>
                        <th>Manage Expenses</th>
                        <th>Financial Reports</th>
                        <th>Complaints</th>
                        <th>Events</th>
                        <th>Staff</th>
                        <th>Settings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r: any) => {
                        const permKeys = [
                          'view_members',
                          'manage_members',
                          'generate_bills',
                          'verify_payments',
                          'manage_expenses',
                          'view_financial_reports',
                          'manage_complaints',
                          'manage_events',
                          'manage_staff',
                          'change_society_settings',
                        ];
                        return (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.name}</strong>
                              {Boolean(r.is_office_bearer) && <span className="badge badge-info" style={{ marginLeft: 6 }}>Office Bearer</span>}
                            </td>
                            {permKeys.map((pk) => (
                              <td key={pk} style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(r[pk])}
                                  disabled={!can('manage_staff')}
                                  onChange={async (e) => {
                                    const updated = { ...r, [pk]: e.target.checked ? 1 : 0 };
                                    await apiFetch(`/api/society/roles/${r.id}/permissions`, {
                                      method: 'PUT',
                                      body: { permissions: updated },
                                    });
                                    notify(`Updated ${r.name} permissions.`);
                                    refreshCurrentTab();
                                  }}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 6: COMPLAINTS & SUGGESTIONS */}
          {activeTab === 'COMPLAINTS' && (
            <>
              <div className="card">
                <h3>Resident Complaints & Resolution Workflow</h3>
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID & Flat</th>
                        <th>Complaint Details</th>
                        <th>Priority</th>
                        <th>Assigned Staff</th>
                        <th>Status</th>
                        {can('manage_complaints') && <th>Update & Respond</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {complaintsData.complaints.map((c: any) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.complaint_number}</strong>
                            <div style={{ fontSize: '0.75rem' }}>Flat {c.flat_number} ({c.member_name})</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>[{c.category}] {c.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                            {(c.comments || []).map((cm: any) => (
                              <div key={cm.id} style={{ fontSize: '0.75rem', marginTop: 4, color: cm.is_internal ? 'var(--warning)' : 'var(--primary)' }}>
                                <strong>{cm.author_name} {cm.is_internal ? '(Internal Note)' : ''}:</strong> {cm.comment_text}
                              </div>
                            ))}
                          </td>
                          <td><span className="badge badge-info">{c.priority}</span></td>
                          <td>{c.assigned_staff_name || 'Unassigned'}</td>
                          <td>
                            <span className={`badge ${c.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                              {c.status}
                            </span>
                          </td>
                          {can('manage_complaints') && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <select
                                  className="select"
                                  style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                                  value={c.status}
                                  onChange={async (e) => {
                                    await apiFetch(`/api/society/complaints/${c.id}`, {
                                      method: 'PUT',
                                      body: { status: e.target.value },
                                    });
                                    notify(`Complaint updated to ${e.target.value}.`);
                                    refreshCurrentTab();
                                  }}
                                >
                                  <option value="SUBMITTED">SUBMITTED</option>
                                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                                  <option value="RESOLVED">RESOLVED</option>
                                  <option value="REJECTED">REJECTED</option>
                                </select>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={async () => {
                                    const note = window.prompt('Enter response for resident:', 'Our maintenance team is resolving this issue.');
                                    if (!note) return;
                                    await apiFetch(`/api/society/complaints/${c.id}`, {
                                      method: 'PUT',
                                      body: { commentText: note, isInternal: false },
                                    });
                                    notify('Response posted.');
                                    refreshCurrentTab();
                                  }}
                                >
                                  Reply
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3>Resident Suggestions Box</h3>
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Flat & Member</th>
                        <th>Suggestion</th>
                        <th>Status</th>
                        <th>Admin Response</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaintsData.suggestions.map((sg: any) => (
                        <tr key={sg.id}>
                          <td><strong>{sg.flat_number}</strong> — {sg.member_name}</td>
                          <td>
                            <strong>{sg.title}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sg.description}</div>
                          </td>
                          <td><span className="badge badge-info">{sg.status}</span></td>
                          <td>{sg.admin_response || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={async () => {
                                const resp = window.prompt('Enter management response to suggestion:', sg.admin_response || 'Thank you! We will review this in the next RWA meeting.');
                                if (!resp) return;
                                await apiFetch(`/api/society/suggestions/${sg.id}`, {
                                  method: 'PUT',
                                  body: { status: 'ACKNOWLEDGED', adminResponse: resp },
                                });
                                notify('Suggestion response saved.');
                                refreshCurrentTab();
                              }}
                            >
                              Respond
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 7: EVENTS, NOTICES & ANNOUNCEMENTS */}
          {activeTab === 'EVENTS' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem' }}>
              <div className="card">
                <h3>Publish Resident Announcement / Notice</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await apiFetch('/api/society/announcements', {
                      method: 'POST',
                      body: newAnnForm,
                    });
                    notify('Announcement published and residents notified!');
                    setNewAnnForm({ category: 'GENERAL', title: '', content: '', sendEmail: true });
                    refreshCurrentTab();
                  }}
                  style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
                >
                  <div className="form-group">
                    <label>Notice Category</label>
                    <select className="select" value={newAnnForm.category} onChange={(e) => setNewAnnForm({ ...newAnnForm, category: e.target.value })}>
                      <option value="GENERAL">General Resident Notice</option>
                      <option value="MEETING">Society Meeting</option>
                      <option value="MAINTENANCE">Maintenance Notice</option>
                      <option value="WATER_INTERRUPTION">Water Supply Interruption</option>
                      <option value="SECURITY_ALERT">Security Alert</option>
                      <option value="EMERGENCY">Emergency Announcement</option>
                      <option value="FESTIVAL">Festival & Celebration</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Notice Title *</label>
                    <input type="text" required className="input" value={newAnnForm.title} onChange={(e) => setNewAnnForm({ ...newAnnForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Announcement Content *</label>
                    <textarea rows={3} required className="textarea" value={newAnnForm.content} onChange={(e) => setNewAnnForm({ ...newAnnForm, content: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Publish Announcement</button>
                </form>

                <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                  {eventsData.announcements.map((a: any) => (
                    <div key={a.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                      <span className="badge badge-info">{a.category}</span>
                      <h4 style={{ marginTop: 4 }}>{a.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Schedule Society Event / General Body Meeting</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await apiFetch('/api/society/events', {
                      method: 'POST',
                      body: newEventForm,
                    });
                    notify('Society event scheduled!');
                    setNewEventForm({ ...newEventForm, title: '', description: '' });
                    refreshCurrentTab();
                  }}
                  style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
                >
                  <div className="form-group">
                    <label>Event Title *</label>
                    <input type="text" required className="input" value={newEventForm.title} onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })} />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date *</label>
                      <input type="date" required className="input" value={newEventForm.eventDate} onChange={(e) => setNewEventForm({ ...newEventForm, eventDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input type="text" required className="input" value={newEventForm.eventTime} onChange={(e) => setNewEventForm({ ...newEventForm, eventTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Venue *</label>
                    <input type="text" required className="input" value={newEventForm.venue} onChange={(e) => setNewEventForm({ ...newEventForm, venue: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea rows={2} required className="textarea" value={newEventForm.description} onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Create Society Event</button>
                </form>

                <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                  {eventsData.events.map((ev: any) => (
                    <div key={ev.id} className="card" style={{ background: 'var(--bg-subtle)', padding: '0.85rem' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {ev.event_date} • {ev.event_time} • {ev.venue}
                      </div>
                      <h4 style={{ marginTop: 3 }}>{ev.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACCOUNTING, EXPENSES & FINANCIAL REPORTS */}
          {activeTab === 'ACCOUNTING' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Realized Income (Confirmed)</span>
                  <span className="kpi-value" style={{ color: 'var(--success)' }}>
                    {formatCurrency(reportsData?.summary?.realizedIncome)}
                  </span>
                  <span className="kpi-sub">Settled Member Collections</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Approved Society Expenses</span>
                  <span className="kpi-value" style={{ color: 'var(--danger)' }}>
                    {formatCurrency(reportsData?.summary?.approvedExpenses)}
                  </span>
                  <span className="kpi-sub">Total Verified Vouchers</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Net Surplus / Deficit</span>
                  <span className="kpi-value" style={{ color: 'var(--primary)' }}>
                    {formatCurrency(reportsData?.summary?.netSurplusOrDeficit)}
                  </span>
                  <span className="kpi-sub">Realized Cash Basis (Excludes Unpaid Bills)</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Total Billed / Receivables</span>
                  <span className="kpi-value">{formatCurrency(reportsData?.summary?.totalBilledReceivables)}</span>
                  <span className="kpi-sub">Unpaid Dues: {formatCurrency(reportsData?.summary?.outstandingReceivables)}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t(lang, 'bankBalance')}</span>
                  <span className="kpi-value">{formatCurrency(reportsData?.summary?.bankBalance)}</span>
                  <span className="kpi-sub">{t(lang, 'cashBalance')}: {formatCurrency(reportsData?.summary?.cashBalance)}</span>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Society Vouchers & Expense Register</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Financial transactions are never erased; use reversal entries to adjust mistaken expenses.
                    </p>
                  </div>
                  {can('manage_expenses') && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModal('ADD_EXPENSE_CAT')}>
                        <Plus size={14} /> Add (+) Expense Category
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal('ADD_EXPENSE')}>
                        <Plus size={14} /> Record Expense
                      </button>
                    </div>
                  )}
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description & Vendor</th>
                        <th>Account & Method</th>
                        <th>Amount</th>
                        <th>Status</th>
                        {can('manage_expenses') && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {expensesData.expenses.map((ex: any) => (
                        <tr key={ex.id}>
                          <td>{ex.expense_date}</td>
                          <td><strong>{ex.category_name}</strong></td>
                          <td>
                            <div>{ex.description}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vendor: {ex.vendor_name}</div>
                          </td>
                          <td>{ex.account_type} ({ex.payment_method})</td>
                          <td><strong>{formatCurrency(ex.amount)}</strong></td>
                          <td>
                            <span className={`badge ${ex.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                              {ex.status}
                            </span>
                          </td>
                          {can('manage_expenses') && (
                            <td>
                              {ex.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={async () => {
                                    const reason = window.prompt('Enter reason for immutable reversal entry:', 'Voucher amount correction');
                                    if (!reason) return;
                                    await apiFetch(`/api/society/expenses/${ex.id}/reverse`, {
                                      method: 'POST',
                                      body: { reason },
                                    });
                                    notify('Expense reversed via ledger entry.');
                                    refreshCurrentTab();
                                  }}
                                >
                                  Reverse Entry
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immutable Date-Wise Financial Ledger */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3>Immutable Financial Ledger & Flat-Wise Statements</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        downloadCsv(
                          'society-financial-ledger.csv',
                          ['Transaction Code', 'Date', 'Type', 'Account', 'Category', 'Description', 'Flat', 'Direction', 'Amount'],
                          (reportsData?.ledger || []).map((l: any) => [
                            l.transaction_code,
                            l.entry_date,
                            l.entry_type,
                            l.account_type,
                            l.category,
                            l.description,
                            l.flat_number || '',
                            l.direction,
                            l.amount,
                          ])
                        )
                      }
                    >
                      <Download size={14} /> {t(lang, 'exportCsv')}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <Printer size={14} /> {t(lang, 'printPdf')}
                    </button>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Filter by Flat Number (e.g., A-101)..."
                    value={ledgerFlatFilter}
                    onChange={(e) => setLedgerFlatFilter(e.target.value)}
                  />
                  <select className="select" value={ledgerTypeFilter} onChange={(e) => setLedgerTypeFilter(e.target.value)}>
                    <option value="">All Ledger Entry Types</option>
                    <option value="INCOME">INCOME (Credit)</option>
                    <option value="EXPENSE">EXPENSE (Debit)</option>
                    <option value="REVERSAL">REVERSAL</option>
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={refreshCurrentTab}>Apply Filter</button>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Account</th>
                        <th>Category & Description</th>
                        <th>Flat</th>
                        <th>Credit / Debit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportsData?.ledger || []).map((l: any) => (
                        <tr key={l.id}>
                          <td><code>{l.transaction_code}</code></td>
                          <td>{l.entry_date}</td>
                          <td>
                            <span className={`badge ${l.entry_type === 'INCOME' ? 'badge-success' : l.entry_type === 'EXPENSE' ? 'badge-danger' : 'badge-info'}`}>
                              {l.entry_type}
                            </span>
                          </td>
                          <td>{l.account_type}</td>
                          <td>
                            <strong>{l.category}</strong> — {l.description}
                          </td>
                          <td>{l.flat_number || '—'}</td>
                          <td>
                            <strong style={{ color: l.direction === 'CREDIT' ? 'var(--success)' : 'var(--danger)' }}>
                              {l.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(l.amount)}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Flat-Wise Account Statement Table */}
              <div className="card">
                <h3>Flat-Wise & Member-Wise Account Statement</h3>
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Flat Number</th>
                        <th>Block</th>
                        <th>Primary Member</th>
                        <th>Total Billed</th>
                        <th>Confirmed Paid</th>
                        <th>Outstanding Dues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportsData?.flatStatements || []).map((fs: any) => (
                        <tr key={fs.household_id}>
                          <td><strong>{fs.normalized_flat_number}</strong></td>
                          <td>{fs.block_name}</td>
                          <td>{fs.primary_member_name || '—'}</td>
                          <td>{formatCurrency(fs.total_billed)}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(fs.total_paid)}</td>
                          <td style={{ color: Number(fs.outstanding_dues) > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                            {formatCurrency(fs.outstanding_dues)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 9: SOCIETY SETTINGS & PAYMENT GATEWAYS */}
          {activeTab === 'SETTINGS' && settingsData && (
            <div className="card">
              <h3>Society Branding, Payment Methods & Custom Payment Gateway Integration</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Configure your society's own Payment Gateway API keys (Razorpay, Paytm, or Custom Merchant Gateway), UPI ID, and Bank details for receiving resident maintenance payments directly into your society account. Secret keys are stored encrypted on the server and never exposed in browser responses.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const soc = settingsData.society;
                  const set = settingsData.settings || {};
                  const res = await apiFetch('/api/society/settings', {
                    method: 'PUT',
                    body: {
                      name: soc.name,
                      address: soc.address,
                      contactEmail: soc.contact_email,
                      contactPhone: soc.contact_phone,
                      upiEnabled: Boolean(set.upi_enabled),
                      gpayUpiEnabled: Boolean(set.gpay_upi_enabled),
                      paytmEnabled: Boolean(set.paytm_enabled),
                      razorpayEnabled: Boolean(set.razorpay_enabled),
                      bankTransferEnabled: Boolean(set.bank_transfer_enabled),
                      upiId: set.upi_id,
                      upiPayeeName: set.upi_payee_name,
                      bankName: set.bank_name,
                      bankAccountNumber: set.bank_account_number,
                      bankIfsc: set.bank_ifsc,
                      razorpayKeyId: set.razorpay_key_id,
                      razorpayKeySecret: set.razorpay_key_secret_input || undefined,
                      razorpayWebhookSecret: set.razorpay_webhook_secret_input || undefined,
                      paytmMerchantId: set.paytm_merchant_id,
                      paytmMerchantKey: set.paytm_merchant_key_input || undefined,
                      customGatewayName: set.custom_gateway_name,
                      customGatewayApiKey: set.custom_gateway_api_key,
                      customGatewaySecret: set.custom_gateway_secret_input || undefined,
                      billDueDay: Number(set.bill_due_day || 10),
                      lateFeeAmount: Number(set.late_fee_amount || 100),
                      allowMemberStaffContacts: Boolean(set.allow_member_staff_contacts),
                    },
                  });
                  notify(res.message);
                  refreshCurrentTab();
                }}
                style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label>Society Name</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.society.name || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, society: { ...settingsData.society, name: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Email</label>
                    <input
                      type="email"
                      className="input"
                      value={settingsData.society.contact_email || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, society: { ...settingsData.society, contact_email: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.society.contact_phone || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, society: { ...settingsData.society, contact_phone: e.target.value } })}
                    />
                  </div>
                </div>

                <h4>Enabled Resident Payment Methods</h4>
                <div className="form-grid">
                  {[
                    ['upi_enabled', 'Standard UPI Flow'],
                    ['gpay_upi_enabled', 'Google Pay (via UPI Intent)'],
                    ['paytm_enabled', 'Paytm Integration'],
                    ['razorpay_enabled', 'Razorpay Gateway'],
                    ['bank_transfer_enabled', 'NEFT / IMPS Bank Transfer'],
                    ['allow_member_staff_contacts', 'Show On-Duty Staff Phone in Member Portal'],
                  ].map(([field, label]) => (
                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsData.settings?.[field])}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, [field]: e.target.checked ? 1 : 0 },
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Custom Payment Gateway API Keys Section */}
                <div className="card" style={{ background: 'var(--bg-subtle)', padding: '1rem', display: 'grid', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.96rem' }}>1. Razorpay Payment Gateway Keys (Society Merchant Account)</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Enter your society's own Razorpay Key ID, Key Secret, and Webhook Secret for automated online bill collection.
                    </p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Razorpay Key ID (Public Key)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., rzp_live_xxxxxxxxxxxx or rzp_test_xxxxxxxxxxxx"
                        value={settingsData.settings?.razorpay_key_id || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, razorpay_key_id: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Razorpay Key Secret{' '}
                        {settingsData.settings?.has_razorpay_secret && (
                          <span className="badge badge-success" style={{ marginLeft: 6 }}>Saved (Encrypted)</span>
                        )}
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder={settingsData.settings?.has_razorpay_secret ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter Razorpay Key Secret'}
                        value={settingsData.settings?.razorpay_key_secret_input || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, razorpay_key_secret_input: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Razorpay Webhook Secret{' '}
                        {settingsData.settings?.has_razorpay_webhook_secret && (
                          <span className="badge badge-success" style={{ marginLeft: 6 }}>Saved</span>
                        )}
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder={settingsData.settings?.has_razorpay_webhook_secret ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter Webhook Signing Secret'}
                        value={settingsData.settings?.razorpay_webhook_secret_input || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, razorpay_webhook_secret_input: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                    <h4 style={{ fontSize: '0.96rem' }}>2. Paytm & Custom Payment Gateway Credentials</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Integrate Paytm Merchant credentials or any custom payment gateway (PhonePe PG, Cashfree, CCAvenue, Stripe).
                    </p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Paytm Merchant ID (MID)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., GREENVALLEY849201"
                        value={settingsData.settings?.paytm_merchant_id || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, paytm_merchant_id: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Paytm Merchant Key{' '}
                        {settingsData.settings?.has_paytm_secret && (
                          <span className="badge badge-success" style={{ marginLeft: 6 }}>Saved</span>
                        )}
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder={settingsData.settings?.has_paytm_secret ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter Paytm Merchant Key'}
                        value={settingsData.settings?.paytm_merchant_key_input || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, paytm_merchant_key_input: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Custom Gateway Provider Name</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., PhonePe PG / Cashfree / Stripe"
                        value={settingsData.settings?.custom_gateway_name || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, custom_gateway_name: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Custom Gateway API Key / App ID</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter Merchant API Key / App ID"
                        value={settingsData.settings?.custom_gateway_api_key || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, custom_gateway_api_key: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Custom Gateway Secret Key{' '}
                        {settingsData.settings?.has_custom_gateway_secret && (
                          <span className="badge badge-success" style={{ marginLeft: 6 }}>Saved</span>
                        )}
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder={settingsData.settings?.has_custom_gateway_secret ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter Custom Gateway Secret Key'}
                        value={settingsData.settings?.custom_gateway_secret_input || ''}
                        onChange={(e) =>
                          setSettingsData({
                            ...settingsData,
                            settings: { ...settingsData.settings, custom_gateway_secret_input: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <h4>Society UPI & Bank Account Details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Society UPI ID (VPA)</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.settings?.upi_id || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, settings: { ...settingsData.settings, upi_id: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>UPI Payee Name</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.settings?.upi_payee_name || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, settings: { ...settingsData.settings, upi_payee_name: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.settings?.bank_name || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, settings: { ...settingsData.settings, bank_name: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Account Number</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.settings?.bank_account_number || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, settings: { ...settingsData.settings, bank_account_number: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank IFSC Code</label>
                    <input
                      type="text"
                      className="input"
                      value={settingsData.settings?.bank_ifsc || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, settings: { ...settingsData.settings, bank_ifsc: e.target.value } })}
                    />
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn btn-primary">Save Society Configuration & Gateway Keys</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: NOTIFICATIONS PAGE (READ & UNREAD NOTIFICATIONS LIST & DETAILS) */}
          {activeTab === 'NOTIFICATIONS' && (() => {
            const subSummary = dashData?.subscriptionSummary || {
              planId: currentSociety.subscription_plan_id || 'plan-quarterly-growth',
              planName: currentSociety.plan_name || 'Growth Quarterly Plan',
              billingPeriod: currentSociety.plan_billing_period || 'QUARTERLY',
              baseAmount: Number(currentSociety.plan_price || 5499),
              taxPercent: Number(currentSociety.plan_tax_percent ?? 18),
              taxAmount: Number((((Number(currentSociety.plan_price || 5499)) * Number(currentSociety.plan_tax_percent ?? 18)) / 100).toFixed(2)),
              totalAmountDue: Number(
                currentSociety.total_amount_due ||
                  Number((Number(currentSociety.plan_price || 5499) * 1.18).toFixed(2))
              ),
              subscriptionStatus: currentSociety.subscription_status || 'TRIAL',
              approvalStatus: currentSociety.approval_status || 'APPROVED',
              paymentStatus: currentSociety.payment_status || 'TRIAL',
              expiryDate: currentSociety.subscription_ends_at || currentSociety.trial_ends_at || null,
              daysRemaining: currentSociety.days_remaining ?? 14,
              pendingInvoice: null,
            };

            const isRenewalDue =
              subSummary.subscriptionStatus !== 'ACTIVE' ||
              subSummary.paymentStatus !== 'PAID' ||
              subSummary.approvalStatus !== 'APPROVED' ||
              subSummary.daysRemaining <= 30;

            const superAdminTypes = [
              'SUBSCRIPTION_PAYMENT_DUE',
              'PLATFORM_NOTICE',
              'SUBSCRIPTION_RENEWAL',
              'TRIAL_EXPIRY',
              'SUBSCRIPTION_PAYMENT_CONFIRMED',
            ];

            const filteredNotifications = allNotificationsList.filter((n: any) => {
              if (notificationFilter === 'UNREAD') return !n.is_read;
              if (notificationFilter === 'READ') return Boolean(n.is_read);
              if (notificationFilter === 'SUPER_ADMIN') return superAdminTypes.includes(n.notification_type);
              return true;
            });

            const readCount = allNotificationsList.filter((n: any) => Boolean(n.is_read)).length;
            const superAdminCount = allNotificationsList.filter((n: any) =>
              superAdminTypes.includes(n.notification_type)
            ).length;

            return (
              <div style={{ display: 'grid', gap: '1.1rem' }}>
                {/* Header & Summary Card */}
                <div className="card" style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Bell size={20} /> Society Admin Notifications
                      </h3>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Notifications marked as read are removed from your Society Admin Dashboard and kept here with full details.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveTab('DASHBOARD')}
                      >
                        <LayoutDashboard size={14} /> Back to Dashboard
                      </button>
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              await apiFetch('/api/notifications/mark-read', { method: 'POST', body: {} });
                              notify('All notifications marked as read and removed from Dashboard.');
                              refreshCurrentTab();
                            } catch (err: any) {
                              notify(err.message, 'error');
                            }
                          }}
                        >
                          <CheckCircle2 size={14} /> Mark All as Read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${notificationFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNotificationFilter('ALL')}
                    >
                      All Notifications ({allNotificationsList.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${notificationFilter === 'READ' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNotificationFilter('READ')}
                    >
                      Read / Removed from Dashboard ({readCount})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${notificationFilter === 'UNREAD' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNotificationFilter('UNREAD')}
                    >
                      Unread on Dashboard ({unreadNotificationsCount})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${notificationFilter === 'SUPER_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNotificationFilter('SUPER_ADMIN')}
                    >
                      Super Admin & Renewal Notices ({superAdminCount})
                    </button>
                  </div>
                </div>

                {/* Selected / Recently Marked-as-Read Notification Detail View */}
                {selectedNotification && (
                  <div
                    className="card"
                    style={{
                      border: '1.5px solid var(--brand)',
                      background: 'var(--bg-subtle)',
                      display: 'grid',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-info">NOTIFICATION DETAILS</span>
                          <span className={`badge ${selectedNotification.is_read ? 'badge-success' : 'badge-warning'}`}>
                            {selectedNotification.is_read ? 'READ • Removed from Dashboard' : 'UNREAD • Visible on Dashboard'}
                          </span>
                          <span className="badge badge-secondary">{selectedNotification.notification_type}</span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', marginTop: '0.5rem', marginBottom: 0 }}>
                          {selectedNotification.title}
                        </h4>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          Received: {(selectedNotification.created_at || '').slice(0, 19).replace('T', ' ')} • Channel: {selectedNotification.channel || 'IN_APP'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {selectedNotification.is_read ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                              try {
                                await apiFetch('/api/notifications/mark-read', {
                                  method: 'POST',
                                  body: { notificationId: selectedNotification.id, isRead: false },
                                });
                                setSelectedNotification({ ...selectedNotification, is_read: 0 });
                                notify('Notification marked as unread and restored to Dashboard.');
                                refreshCurrentTab();
                              } catch (err: any) {
                                notify(err.message, 'error');
                              }
                            }}
                          >
                            Restore as Unread (Show on Dashboard)
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={async () => {
                              try {
                                await apiFetch('/api/notifications/mark-read', {
                                  method: 'POST',
                                  body: { notificationId: selectedNotification.id, isRead: true },
                                });
                                setSelectedNotification({ ...selectedNotification, is_read: 1 });
                                notify('Notification marked as read and removed from Dashboard.');
                                refreshCurrentTab();
                              } catch (err: any) {
                                notify(err.message, 'error');
                              }
                            }}
                          >
                            <CheckCircle2 size={13} /> Mark as Read
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedNotification(null)}
                        >
                          Close Details
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '0.9rem 1rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {selectedNotification.message}
                    </div>

                    {superAdminTypes.includes(selectedNotification.notification_type) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 8,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: '0.84rem' }}>
                          <strong>Plan:</strong> {subSummary.planName} •{' '}
                          {isRenewalDue ? (
                            <>
                              <strong>Amount Due:</strong> {formatCurrency(subSummary.totalAmountDue)} (incl. GST) •{' '}
                              <strong>Days Pending to Renew:</strong>{' '}
                              {subSummary.daysRemaining >= 0
                                ? `${subSummary.daysRemaining} Days`
                                : `Overdue by ${Math.abs(subSummary.daysRemaining)} Days`}
                            </>
                          ) : (
                            <>
                              <strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>Fully Paid & Active</span> •{' '}
                              <strong>Next Renewal:</strong> in {subSummary.daysRemaining} Days ({(subSummary.expiryDate || '').slice(0, 10) || 'N/A'})
                            </>
                          )}
                        </div>
                        {isRenewalDue && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={async () => {
                              try {
                                await openRazorpayCheckout({
                                  amountRupees: subSummary.totalAmountDue,
                                  currency: 'INR',
                                  receipt: `sub_${currentSociety.id.slice(0, 8)}_${Date.now()}`,
                                  merchantName: 'SocietyOS Platform Subscription',
                                  description: `${subSummary.planName} Renewal & Approval — ${currentSociety.name}`,
                                  prefill: {
                                    name: user.fullName || currentSociety.name,
                                    email: user.email || currentSociety.contact_email,
                                    contact: user.phone || currentSociety.contact_phone,
                                  },
                                  isSubscription: true,
                                  societyId: currentSociety.id,
                                  planId: subSummary.planId,
                                  subscriptionPaymentId: subSummary.pendingInvoice?.id,
                                  onSuccess: (verified: any) => {
                                    notify(
                                      verified?.message ||
                                        `Subscription payment of ${formatCurrency(subSummary.totalAmountDue)} verified!`
                                    );
                                    refreshCurrentTab();
                                  },
                                });
                              } catch (err: any) {
                                notify(err.message || 'Subscription checkout failed.', 'error');
                              }
                            }}
                          >
                            <CreditCard size={14} /> Pay {formatCurrency(subSummary.totalAmountDue)} & Renew Now
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Complete Notifications List */}
                <div className="card">
                  <div className="section-header" style={{ marginBottom: '0.85rem' }}>
                    <h4>Notifications History & Details List ({filteredNotifications.length})</h4>
                  </div>

                  {filteredNotifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No notifications match the selected filter.
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Notification Title & Details</th>
                            <th>Received At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredNotifications.map((n: any) => {
                            const isSelected = selectedNotification?.id === n.id;
                            return (
                              <tr
                                key={n.id}
                                style={{
                                  background: isSelected
                                    ? 'var(--bg-subtle)'
                                    : !n.is_read
                                    ? 'rgba(245, 158, 11, 0.06)'
                                    : undefined,
                                }}
                              >
                                <td>
                                  <span className={`badge ${n.is_read ? 'badge-success' : 'badge-warning'}`}>
                                    {n.is_read ? 'READ (Removed from Dashboard)' : 'UNREAD (On Dashboard)'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge badge-info">{n.notification_type}</span>
                                </td>
                                <td style={{ maxWidth: 480 }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{n.title}</div>
                                  <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                                    {n.message}
                                  </div>
                                </td>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {(n.created_at || '').slice(0, 16).replace('T', ' ')}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => setSelectedNotification(n)}
                                    >
                                      View Details
                                    </button>
                                    {!n.is_read ? (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={async () => {
                                          try {
                                            await apiFetch('/api/notifications/mark-read', {
                                              method: 'POST',
                                              body: { notificationId: n.id, isRead: true },
                                            });
                                            setSelectedNotification({ ...n, is_read: 1 });
                                            notify('Notification marked as read and removed from Dashboard.');
                                            refreshCurrentTab();
                                          } catch (err: any) {
                                            notify(err.message, 'error');
                                          }
                                        }}
                                      >
                                        <CheckCircle2 size={13} /> Mark as Read
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={async () => {
                                          try {
                                            await apiFetch('/api/notifications/mark-read', {
                                              method: 'POST',
                                              body: { notificationId: n.id, isRead: false },
                                            });
                                            if (selectedNotification?.id === n.id) {
                                              setSelectedNotification({ ...n, is_read: 0 });
                                            }
                                            notify('Notification restored as unread on Dashboard.');
                                            refreshCurrentTab();
                                          } catch (err: any) {
                                            notify(err.message, 'error');
                                          }
                                        }}
                                      >
                                        Mark Unread
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* MODAL: ADD MEMBER / HOUSEHOLD */}
      {modal === 'ADD_MEMBER' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Enrol Society Member / Flat</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/members', {
                    method: 'POST',
                    body: newMemberForm,
                  });
                  notify(res.message);
                  setNewMemberForm({
                    fullName: '',
                    email: '',
                    phone: '',
                    password: 'Member@123',
                    flatNumber: '',
                    blockName: 'Block A',
                    floorNumber: '1',
                    areaSqft: 1400,
                    ownershipType: 'OWNER',
                    emergencyContact: '',
                    enrolmentMode: 'NEW_HOUSEHOLD',
                    existingHouseholdId: '',
                    relationshipToPrimary: 'SPOUSE',
                    openingBalance: '',
                    openingBalanceNotes: '',
                  });
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Registration Mode</label>
                  <select
                    className="select"
                    value={newMemberForm.enrolmentMode}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, enrolmentMode: e.target.value })}
                  >
                    <option value="NEW_HOUSEHOLD">New Flat / Household</option>
                    <option value="FAMILY_MEMBER">Link Family Member to Existing Household</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Flat / House Number * (Normalized Uniqueness Check)</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g., A-105"
                    value={newMemberForm.flatNumber}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, flatNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Block *</label>
                  <input type="text" required className="input" value={newMemberForm.blockName} onChange={(e) => setNewMemberForm({ ...newMemberForm, blockName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Floor *</label>
                  <input type="text" required className="input" value={newMemberForm.floorNumber} onChange={(e) => setNewMemberForm({ ...newMemberForm, floorNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Ownership</label>
                  <select className="select" value={newMemberForm.ownershipType} onChange={(e) => setNewMemberForm({ ...newMemberForm, ownershipType: e.target.value })}>
                    <option value="OWNER">OWNER</option>
                    <option value="TENANT">TENANT</option>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Resident Full Name *</label>
                  <input type="text" required className="input" value={newMemberForm.fullName} onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" required className="input" value={newMemberForm.email} onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" required className="input" value={newMemberForm.phone} onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })} />
                </div>
              </div>
              {newMemberForm.enrolmentMode === 'NEW_HOUSEHOLD' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Opening Balance (₹) (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      placeholder="e.g. 2500"
                      value={newMemberForm.openingBalance}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, openingBalance: e.target.value })}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Set prior dues/balance to be payable by resident.
                    </small>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Opening Balance Remarks / Reason</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Carry-forward outstanding dues from previous ledger"
                      value={newMemberForm.openingBalanceNotes}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, openingBalanceNotes: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE OPENING BALANCE */}
      {modal === 'UPDATE_OPENING_BALANCE' && selectedHouseholdForOpBal && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3>Manage Resident Opening Balance</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Flat <strong>{selectedHouseholdForOpBal.flat_number}</strong> • Add or adjust prior outstanding dues to be payable by the resident along with monthly dues.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch(`/api/society/households/${selectedHouseholdForOpBal.id}/opening-balance`, {
                    method: 'POST',
                    body: {
                      openingBalance: Number(opBalForm.openingBalance || 0),
                      notes: opBalForm.notes,
                    },
                  });
                  notify(res.message || 'Opening balance updated.');
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem' }}
            >
              <div className="form-group">
                <label>Opening Balance Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="input"
                  placeholder="e.g. 5000"
                  value={opBalForm.openingBalance}
                  onChange={(e) => setOpBalForm({ ...opBalForm, openingBalance: e.target.value })}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  An Opening Balance invoice will be automatically synchronized for resident checkout and cashier receipting.
                </small>
              </div>
              <div className="form-group">
                <label>Notes / Reason for Opening Balance</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. Prior outstanding maintenance dues before system migration"
                  value={opBalForm.notes}
                  onChange={(e) => setOpBalForm({ ...opBalForm, notes: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Opening Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BLOCK */}
      {modal === 'ADD_BLOCK' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3>Add Apartment Block / Tower</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/blocks', {
                    method: 'POST',
                    body: { name: newBlockName },
                  });
                  notify(res.message);
                  setNewBlockName('');
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Block / Tower Name *</label>
                <input type="text" required className="input" placeholder="e.g., Block D" value={newBlockName} onChange={(e) => setNewBlockName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Block</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOGGED FLAT TRANSFER / CORRECTION */}
      {modal === 'TRANSFER_FLAT' && transferHousehold && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3>Logged Flat Correction / Transfer ({transferHousehold.flat_number})</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch(`/api/society/households/${transferHousehold.id}/transfer`, {
                    method: 'POST',
                    body: transferForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Corrected / New Flat Number *</label>
                <input type="text" required className="input" value={transferForm.newFlatNumber} onChange={(e) => setTransferForm({ ...transferForm, newFlatNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Audit Reason *</label>
                <textarea rows={2} required className="textarea" placeholder="Reason for correcting or transferring flat registration..." value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM CHARGE CATEGORY */}
      {modal === 'ADD_CHARGE_CAT' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3>Add (+) Custom Charge Category</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/charge-categories', {
                    method: 'POST',
                    body: newChargeCatForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Charge Category Name *</label>
                <input type="text" required className="input" placeholder="e.g., Club House / Gym Subscription" value={newChargeCatForm.name} onChange={(e) => setNewChargeCatForm({ ...newChargeCatForm, name: e.target.value })} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Default Amount (INR) *</label>
                  <input type="number" required className="input" value={newChargeCatForm.defaultAmount} onChange={(e) => setNewChargeCatForm({ ...newChargeCatForm, defaultAmount: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Billing Frequency</label>
                  <select className="select" value={newChargeCatForm.billingFrequency} onChange={(e) => setNewChargeCatForm({ ...newChargeCatForm, billingFrequency: e.target.value })}>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="ONE_TIME">ONE_TIME</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Applicable Flats ('ALL' or comma-separated like A-101, B-201)</label>
                <input type="text" className="input" value={newChargeCatForm.applicableFlats} onChange={(e) => setNewChargeCatForm({ ...newChargeCatForm, applicableFlats: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE MONTHLY BILLS (BULK OR INDIVIDUAL) */}
      {modal === 'GENERATE_BILLS' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Generate Monthly Bills (Bulk or Individual Flat)</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/bills/generate', {
                    method: 'POST',
                    body: {
                      ...genBillForm,
                      householdId: genBillForm.householdId || null,
                    },
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Target Scope</label>
                  <select
                    className="select"
                    value={genBillForm.householdId}
                    onChange={(e) => setGenBillForm({ ...genBillForm, householdId: e.target.value })}
                  >
                    <option value="">Bulk — All Eligible Active Households ({membersData.households.length} Flats)</option>
                    {membersData.households.map((hh: any) => (
                      <option key={hh.id} value={hh.id}>Individual Flat: {hh.normalized_flat_number} ({hh.block_name})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Billing Month (1-12) *</label>
                  <input type="number" min={1} max={12} required className="input" value={genBillForm.billingMonth} onChange={(e) => setGenBillForm({ ...genBillForm, billingMonth: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Billing Year *</label>
                  <input type="number" required className="input" value={genBillForm.billingYear} onChange={(e) => setGenBillForm({ ...genBillForm, billingYear: Number(e.target.value) })} />
                </div>
              </div>

              <div className="form-group">
                <label>Select Charge Categories to Include on Bill *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.45rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  {chargeCategories.map((c: any) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}>
                      <input
                        type="checkbox"
                        checked={genBillForm.chargeCategoryIds.includes(c.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...genBillForm.chargeCategoryIds, c.id]
                            : genBillForm.chargeCategoryIds.filter((id) => id !== c.id);
                          setGenBillForm({ ...genBillForm, chargeCategoryIds: next });
                        }}
                      />
                      {c.name} ({formatCurrency(c.default_amount)})
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Due Date *</label>
                  <input type="date" required className="input" value={genBillForm.dueDate} onChange={(e) => setGenBillForm({ ...genBillForm, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Late Penalty (INR)</label>
                  <input type="number" className="input" value={genBillForm.penaltyAmount} onChange={(e) => setGenBillForm({ ...genBillForm, penaltyAmount: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Credit / Discount (INR)</label>
                  <input type="number" className="input" value={genBillForm.creditAmount} onChange={(e) => setGenBillForm({ ...genBillForm, creditAmount: Number(e.target.value) })} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem' }}>
                <input type="checkbox" checked={genBillForm.asDraft} onChange={(e) => setGenBillForm({ ...genBillForm, asDraft: e.target.checked })} />
                Save as Draft Bill first for review before publishing
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Bills</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPPLEMENTARY / ADJUSTMENT BILL */}
      {modal === 'SUPPLEMENTARY_BILL' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3>Issue Supplementary / Adjustment Bill (Logged)</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/bills/adjustment', {
                    method: 'POST',
                    body: suppBillForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Select Flat / Household *</label>
                <select
                  required
                  className="select"
                  value={suppBillForm.householdId}
                  onChange={(e) => setSuppBillForm({ ...suppBillForm, householdId: e.target.value })}
                >
                  <option value="">-- Choose Flat --</option>
                  {membersData.households.map((hh: any) => (
                    <option key={hh.id} value={hh.id}>{hh.normalized_flat_number} ({hh.block_name})</option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Charge Category *</label>
                  <select
                    required
                    className="select"
                    value={suppBillForm.chargeCategoryId}
                    onChange={(e) => setSuppBillForm({ ...suppBillForm, chargeCategoryId: e.target.value })}
                  >
                    {chargeCategories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (INR) *</label>
                  <input type="number" required className="input" value={suppBillForm.amount} onChange={(e) => setSuppBillForm({ ...suppBillForm, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Mandatory Audit Reason *</label>
                <textarea rows={2} required className="textarea" placeholder="Reason for supplementary bill..." value={suppBillForm.reason} onChange={(e) => setSuppBillForm({ ...suppBillForm, reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Issue Supplementary Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE INVOICE */}
      {modal === 'PRINT_INVOICE' && selectedInvoice && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ borderBlockEnd: '2px solid var(--primary)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{currentSociety.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentSociety.address}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontWeight: 800 }}>INVOICE #{selectedInvoice.bill_number}</div>
                <div style={{ fontSize: '0.8rem' }}>Period: {selectedInvoice.billing_month}/{selectedInvoice.billing_year}</div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
              <strong>Billed To:</strong> Flat {selectedInvoice.flat_number} ({selectedInvoice.member_name || 'Resident'}) • Due Date: <strong>{selectedInvoice.due_date}</strong>
            </div>
            <table className="data-table" style={{ marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Charge Head</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice.items || []).map((it: any) => (
                  <tr key={it.id}>
                    <td><strong>{it.category_name}</strong></td>
                    <td>{it.description}</td>
                    <td>{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'end', fontSize: '1.1rem', fontWeight: 800 }}>
              Total Payable: {formatCurrency(selectedInvoice.total_amount)} (Balance: {formatCurrency(selectedInvoice.balance_amount)})
            </div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE RECEIPT */}
      {modal === 'PRINT_RECEIPT' && selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ borderBlockEnd: '2px solid var(--success)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3>{currentSociety.name} — OFFICIAL PAYMENT RECEIPT</h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Receipt #: <strong>{selectedReceipt.receipt_number}</strong></div>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div><strong>Received From:</strong> {selectedReceipt.member_name} (Flat {selectedReceipt.flat_number})</div>
              <div><strong>Amount Confirmed:</strong> <span style={{ color: 'var(--success)', fontWeight: 800 }}>{formatCurrency(selectedReceipt.amount)}</span></div>
              <div><strong>Payment Method:</strong> {selectedReceipt.payment_method}</div>
              <div><strong>Transaction Reference:</strong> <code>{selectedReceipt.reference_number}</code></div>
              <div><strong>Payment Date:</strong> {selectedReceipt.payment_date}</div>
              <div><strong>Status:</strong> CONFIRMED & POSTED TO SOCIETY LEDGER</div>
            </div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {modal === 'ADD_STAFF' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add (+) Society Staff / Office Bearer</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/staff', {
                    method: 'POST',
                    body: newStaffForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" required className="input" value={newStaffForm.fullName} onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" required className="input" value={newStaffForm.phone} onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Role & Permission Profile *</label>
                  <select className="select" value={newStaffForm.roleId} onChange={(e) => setNewStaffForm({ ...newStaffForm, roleId: e.target.value })}>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation Title *</label>
                  <input type="text" required className="input" placeholder="e.g., Night Shift Guard" value={newStaffForm.designation} onChange={(e) => setNewStaffForm({ ...newStaffForm, designation: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Monthly / Daily Wage (INR)</label>
                  <input type="number" className="input" value={newStaffForm.salaryAmount} onChange={(e) => setNewStaffForm({ ...newStaffForm, salaryAmount: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Duty Schedule</label>
                  <input type="text" className="input" value={newStaffForm.dutySchedule} onChange={(e) => setNewStaffForm({ ...newStaffForm, dutySchedule: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Identity Document Type</label>
                  <select className="select" value={newStaffForm.documentType} onChange={(e) => setNewStaffForm({ ...newStaffForm, documentType: e.target.value })}>
                    <option value="AADHAAR">Aadhaar Card (Auto-Masked)</option>
                    <option value="PAN">PAN Card</option>
                    <option value="POLICE_VERIFICATION">Police Verification</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ID Document Number (Never Displayed Publicly)</label>
                  <input type="text" className="input" placeholder="1234 5678 9012" value={newStaffForm.documentNumber} onChange={(e) => setNewStaffForm({ ...newStaffForm, documentNumber: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Optional Staff Portal Email</label>
                  <input type="email" className="input" value={newStaffForm.email} onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Optional Staff Portal Password</label>
                  <input type="password" className="input" value={newStaffForm.password} onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Staff Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM STAFF ROLE */}
      {modal === 'ADD_ROLE' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3>Create Custom Office Bearer / Staff Role</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/roles', {
                    method: 'POST',
                    body: newRoleForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Role / Position Title *</label>
                <input type="text" required className="input" placeholder="e.g., Cultural Committee Head" value={newRoleForm.name} onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={newRoleForm.isOfficeBearer} onChange={(e) => setNewRoleForm({ ...newRoleForm, isOfficeBearer: e.target.checked })} />
                Mark as Society Office Bearer Position
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD ATTENDANCE */}
      {modal === 'ADD_ATTENDANCE' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3>Record Staff Attendance & Salary</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/attendance', {
                    method: 'POST',
                    body: attendanceForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Select Staff *</label>
                <select required className="select" value={attendanceForm.staffId} onChange={(e) => setAttendanceForm({ ...attendanceForm, staffId: e.target.value })}>
                  <option value="">-- Choose Staff --</option>
                  {staffData.staff.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.designation})</option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" required className="input" value={attendanceForm.attendanceDate} onChange={(e) => setAttendanceForm({ ...attendanceForm, attendanceDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="select" value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                    <option value="PRESENT">PRESENT</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="LEAVE">LEAVE</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE CATEGORY */}
      {modal === 'ADD_EXPENSE_CAT' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h3>Add (+) Custom Expense Category</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/expense-categories', {
                    method: 'POST',
                    body: { name: newExpCatName },
                  });
                  notify(res.message);
                  setNewExpCatName('');
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
            >
              <div className="form-group">
                <label>Expense Category Name *</label>
                <input type="text" required className="input" placeholder="e.g., Solar Panel Maintenance" value={newExpCatName} onChange={(e) => setNewExpCatName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD EXPENSE */}
      {modal === 'ADD_EXPENSE' && (
        <div className="modal-backdrop" onClick={() => setModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Record Society Expense Voucher</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await apiFetch('/api/society/expenses', {
                    method: 'POST',
                    body: newExpenseForm,
                  });
                  notify(res.message);
                  setModal('NONE');
                  refreshCurrentTab();
                } catch (err: any) {
                  notify(err.message, 'error');
                }
              }}
              style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Expense Category *</label>
                  <select required className="select" value={newExpenseForm.expenseCategoryId} onChange={(e) => setNewExpenseForm({ ...newExpenseForm, expenseCategoryId: e.target.value })}>
                    {expensesData.categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (INR) *</label>
                  <input type="number" required min={1} className="input" value={newExpenseForm.amount} onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vendor / Payee Name *</label>
                  <input type="text" required className="input" value={newExpenseForm.vendorName} onChange={(e) => setNewExpenseForm({ ...newExpenseForm, vendorName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Debit Account *</label>
                  <select className="select" value={newExpenseForm.accountType} onChange={(e) => setNewExpenseForm({ ...newExpenseForm, accountType: e.target.value })}>
                    <option value="BANK">Society Main Bank Account</option>
                    <option value="CASH">Society Petty Cash Account</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description / Voucher Particulars *</label>
                <input type="text" required className="input" value={newExpenseForm.description} onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal('NONE')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Expense to Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
