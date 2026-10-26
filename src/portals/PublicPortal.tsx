import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Sparkles,
  UserPlus,
  Globe,
  Moon,
  Sun,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, uploadFileAsBase64, setStoredToken, openRazorpayCheckout, isValid10DigitPhone, clean10DigitPhone } from '../api.ts';
import { type Language, t, formatCurrency } from '../i18n.ts';
import { ResponsiveLogo } from '../components/ResponsiveLogo.tsx';
import { GoogleAdBanner } from '../components/GoogleAdBanner.tsx';
import { applyPlatformMeta } from '../utils/meta.ts';

interface PublicPortalProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onAuthenticated: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
  initialEnrollCode?: string | null;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  lang,
  setLang,
  theme,
  setTheme,
  onAuthenticated,
  notify,
  initialEnrollCode,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [platform, setPlatform] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'NONE' | 'LOGIN' | 'REGISTER_SOCIETY' | 'ENROLL_MEMBER' | 'FORGOT_PASSWORD'>(
    initialEnrollCode ? 'ENROLL_MEMBER' : 'NONE'
  );

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Society Registration State
  const [regForm, setRegForm] = useState({
    adminName: '',
    email: '',
    phone: '',
    password: '',
    societyName: '',
    address: '',
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160062',
    registrationNumber: '',
    planId: '',
    startWithTrial: true,
  });
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  // Public Member Enrolment State (Locked to the invited society)
  const [enrollCode] = useState(initialEnrollCode || 'GVR-2026');
  const [enrollSocietyData, setEnrollSocietyData] = useState<any | null>(null);
  const [flatCheckStatus, setFlatCheckStatus] = useState<{ exists: boolean; message?: string; normalized?: string } | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Member@123',
    address: '',
    flatNumber: '',
    floorNumber: '1',
    blockName: 'Block A',
    ownershipType: 'OWNER',
    emergencyContact: '',
    photoUrl: '',
    enrolmentMode: 'NEW_HOUSEHOLD' as 'NEW_HOUSEHOLD' | 'FAMILY_MEMBER',
    existingHouseholdId: '',
    relationshipToPrimary: 'SPOUSE',
  });

  useEffect(() => {
    apiFetch('/api/public/plans')
      .then((res) => {
        setPlans(res.plans || []);
        setPlatform(res.platform || null);
        if (res.platform) {
          applyPlatformMeta(res.platform);
        }
        if (res.plans?.length > 0) {
          setRegForm((prev) => ({ ...prev, planId: res.plans[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeModal === 'ENROLL_MEMBER' && enrollCode) {
      loadEnrollmentSociety(enrollCode);
    }
  }, [activeModal]);

  async function loadEnrollmentSociety(code: string) {
    try {
      const res = await apiFetch(`/api/public/enroll/${encodeURIComponent(code.trim())}`);
      if (res && res.society) {
        setEnrollSocietyData(res);
        if (res.blocks?.length > 0) {
          setEnrollForm((prev) => ({ ...prev, blockName: res.blocks[0].name }));
        }
      } else {
        setEnrollSocietyData({
          society: { name: 'Green Valley Residency', enrollment_code: code || 'GVR-2026' },
          blocks: [{ id: 'blk-a', name: 'Block A' }, { id: 'blk-b', name: 'Block B' }],
          households: [],
        });
      }
    } catch (err: any) {
      setEnrollSocietyData({
        society: { name: 'Green Valley Residency', enrollment_code: code || 'GVR-2026' },
        blocks: [{ id: 'blk-a', name: 'Block A' }, { id: 'blk-b', name: 'Block B' }],
        households: [],
      });
      notify(err.message, 'error');
    }
  }

  async function handleCheckFlat(flatVal: string) {
    if (!enrollCode || !flatVal.trim()) {
      setFlatCheckStatus(null);
      return;
    }
    try {
      const res = await apiFetch(`/api/public/enroll/${encodeURIComponent(enrollCode.trim())}/check-flat`, {
        method: 'POST',
        body: { flatNumber: flatVal },
      });
      setFlatCheckStatus({
        exists: res.exists,
        message: res.message,
        normalized: res.normalizedFlatNumber,
      });
    } catch {
      setFlatCheckStatus(null);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email: loginEmail, password: loginPassword },
      });
      setStoredToken(res?.token || null);
      const displayName = res?.user?.fullName || res?.user?.email || 'User';
      const roleName = res?.user?.role ? ` (${res.user.role})` : '';
      notify(`Signed in as ${displayName}${roleName}`);
      onAuthenticated();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(email: string, password: string) {
    setLoginEmail(email);
    setLoginPassword(password);
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setStoredToken(res?.token || null);
      const displayName = res?.user?.fullName || res?.user?.email || 'User';
      const roleName = res?.user?.role ? ` (${res.user.role})` : '';
      notify(`Signed in as ${displayName}${roleName}`);
      onAuthenticated();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSociety(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid10DigitPhone(regForm.phone)) {
      notify('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/public/register-society', {
        method: 'POST',
        body: {
          ...regForm,
          phone: clean10DigitPhone(regForm.phone),
        },
      });
      if (res.paymentOrder) {
        setPendingOrder(res.paymentOrder);
        setPendingToken(res.token);
        notify('Registration created! Complete Razorpay payment verification to activate subscription.');
      } else {
        setStoredToken(res.token);
        notify(res.message);
        onAuthenticated();
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRazorpaySubscriptionCheckout() {
    if (!pendingOrder) return;
    setLoading(true);
    try {
      await openRazorpayCheckout({
        amountRupees: Number(pendingOrder.totalAmount),
        currency: pendingOrder.currency || 'INR',
        receipt: pendingOrder.invoiceNumber || `sub_${Date.now()}`,
        merchantName: platform?.platform_name || 'SocietyOS Enterprise SaaS',
        description: `SaaS Subscription (${pendingOrder.invoiceNumber})`,
        prefill: {
          name: regForm.adminName,
          email: regForm.email,
          contact: regForm.phone,
        },
        subscriptionPaymentId: pendingOrder.subscriptionPaymentId,
        legacyOrderId: pendingOrder.orderId,
        isSubscription: true,
        token: pendingToken,
        onSuccess: (verifyRes) => {
          if (pendingToken) {
            setStoredToken(pendingToken);
          }
          notify(verifyRes.message || 'Subscription payment verified!');
          setPendingOrder(null);
          setLoading(false);
          onAuthenticated();
        },
        onDismiss: () => {
          setLoading(false);
          notify('Payment cancelled: checkout modal was closed before completing payment.', 'error');
        },
        onError: (errMsg) => {
          setLoading(false);
          notify(errMsg, 'error');
        },
      });
    } catch (err: any) {
      setLoading(false);
      notify(err.message || 'Failed to initiate Razorpay checkout.', 'error');
    }
  }

  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid10DigitPhone(enrollForm.phone)) {
      notify('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/public/enroll/${encodeURIComponent(enrollCode.trim())}`, {
        method: 'POST',
        body: {
          ...enrollForm,
          phone: clean10DigitPhone(enrollForm.phone),
        },
      });
      notify(res.message);
      // Auto-login newly enrolled resident
      const loginRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email: enrollForm.email, password: enrollForm.password },
      });
      setStoredToken(loginRes.token);
      onAuthenticated();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <ResponsiveLogo
            logoUrl={platform?.logo_url}
            platformName={platform?.platform_name || t(lang, 'appName')}
            subtitle="Multi-Tenant RWA & Housing SaaS"
            maxHeight={36}
          />
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? t(lang, 'darkMode') : t(lang, 'lightMode')}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{theme === 'light' ? t(lang, 'darkMode') : t(lang, 'lightMode')}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveModal('LOGIN')}
          >
            <Lock size={15} />
            <span>{t(lang, 'login')}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveModal('REGISTER_SOCIETY')}
          >
            <Sparkles size={15} />
            <span>{t(lang, 'registerSociety')}</span>
          </button>
        </div>
      </header>

      {/* Header Ad Slot (Google AdSense) */}
      {platform?.google_adsense_enabled && platform?.google_ad_slot_header && (
        <div style={{ maxWidth: 1200, margin: '1rem auto 0', padding: '0 1.5rem', width: '100%' }}>
          <GoogleAdBanner
            clientId={platform.google_adsense_client_id}
            slotId={platform.google_ad_slot_header}
            label="Sponsored Advertisement"
          />
        </div>
      )}

      {/* Hero Section */}
      <section
        style={{
          padding: 'clamp(2rem, 5vw, 4rem) clamp(0.85rem, 3vw, 1.5rem) clamp(1.5rem, 4vw, 3rem)',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--bg-surface)), var(--bg-app))',
          borderBlockEnd: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: 1200, marginInline: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(1.5rem, 3vw, 2.5rem)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }} className="badge badge-info">
              <ShieldCheck size={14} />
              Multi-Tenant SaaS with Strict Tenant Isolation & RLS
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', lineHeight: 1.15 }}>
              {lang === 'pa'
                ? 'ਆਪਣੀ ਰਿਹਾਇਸ਼ੀ ਸੋਸਾਇਟੀ ਅਤੇ ਅਪਾਰਟਮੈਂਟਸ ਦਾ ਸੰਪੂਰਨ ਡਿਜੀਟਲ ਪ੍ਰਬੰਧਨ'
                : 'Complete SaaS Platform for Residential Societies, Apartments & RWAs'}
            </h1>
            <p style={{ fontSize: 'clamp(0.92rem, 2vw, 1.05rem)', color: 'var(--text-muted)', maxWidth: '62ch' }}>
              Automated monthly billing, duplicate-proof household registration, verified UPI & Razorpay collections, double-entry accounting ledger, staff duty tracking, and resident helpdesk — all in one multi-tenant cloud platform.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }} onClick={() => setActiveModal('REGISTER_SOCIETY')}>
                <Sparkles size={18} />
                {t(lang, 'registerSociety')} {platform?.default_trial_enabled ? `(${platform.default_trial_days}-Day Free Trial)` : ''}
              </button>
            </div>
          </div>

          {/* Portal Sign-In Card */}
          <div className="card" style={{ padding: 'clamp(1.25rem, 2.5vw, 1.75rem)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-surface)' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{t(lang, 'login')}</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Sign in to your Society Admin, Staff, or Resident Member portal.
              </p>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="portal-email" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Email Address</label>
                <input
                  id="portal-email"
                  type="email"
                  required
                  autoComplete="username"
                  className="input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@society.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="portal-password" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Password</label>
                <input
                  id="portal-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
                  onClick={() => setActiveModal('FORGOT_PASSWORD')}
                >
                  Forgot password?
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing in...' : t(lang, 'login')}
                </button>
              </div>
            </form>

            {/* Instant Demo Access Buttons (1-Click Login) */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-multiline"
                style={{ justifyContent: 'space-between', padding: '0.75rem 0.95rem', width: '100%', gap: '0.5rem' }}
                onClick={() => quickLogin('superadmin@societyos.com', 'SuperAdmin@123')}
                title="Instant Demo Login as Platform Super Admin"
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <strong style={{ fontSize: '0.88rem' }}>1. Platform Super Admin (SaaS Owner)</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>superadmin@societyos.com • Manage societies, plans, trials, revenue</span>
                </span>
                <ArrowRight size={16} style={{ flexShrink: 0 }} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-multiline"
                style={{ justifyContent: 'space-between', padding: '0.75rem 0.95rem', width: '100%', gap: '0.5rem' }}
                onClick={() => quickLogin('admin@greenvalley.com', 'Admin@123')}
                title="Instant Demo Login as Society Admin"
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <strong style={{ fontSize: '0.88rem' }}>2. Society Admin — Green Valley Residency (Demo)</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>admin@greenvalley.com • Billing, payment verification, ledger, staff</span>
                </span>
                <ArrowRight size={16} style={{ flexShrink: 0 }} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-multiline"
                style={{ justifyContent: 'space-between', padding: '0.75rem 0.95rem', width: '100%', gap: '0.5rem' }}
                onClick={() => quickLogin('admin@royalpalms.com', 'Admin@123')}
                title="Instant Demo Login as Society Admin (Trial)"
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <strong style={{ fontSize: '0.88rem' }}>3. Society Admin — Royal Palms Enclave (14-Day Trial)</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>admin@royalpalms.com • Independent tenant isolated from Green Valley</span>
                </span>
                <ArrowRight size={16} style={{ flexShrink: 0 }} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-multiline"
                style={{ justifyContent: 'space-between', padding: '0.75rem 0.95rem', width: '100%', gap: '0.5rem' }}
                onClick={() => quickLogin('cashier@greenvalley.com', 'Staff@123')}
                title="Instant Demo Login as Society Staff"
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <strong style={{ fontSize: '0.88rem' }}>4. Society Staff — Cashier Role (Permission Scoped)</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>cashier@greenvalley.com • Can verify payments, cannot delete members</span>
                </span>
                <ArrowRight size={16} style={{ flexShrink: 0 }} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-multiline"
                style={{ justifyContent: 'space-between', padding: '0.75rem 0.95rem', width: '100%', gap: '0.5rem' }}
                onClick={() => quickLogin('resident@greenvalley.com', 'Member@123')}
                title="Instant Demo Login as Resident Member"
              >
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <strong style={{ fontSize: '0.88rem' }}>5. Resident Member — Flat A-101 (Green Valley)</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>resident@greenvalley.com • Pay bills, receipts, complaints, on-duty staff</span>
                </span>
                <ArrowRight size={16} style={{ flexShrink: 0 }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section style={{ padding: 'clamp(2rem, 4vw, 3.5rem) clamp(0.85rem, 3vw, 1.5rem)', maxWidth: 1200, marginInline: 'auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.85rem)' }}>Transparent SaaS Subscription Plans for Every Society</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
            {platform?.default_trial_enabled
              ? `All plans include a ${platform.default_trial_days}-day free trial configured by the Super Admin.`
              : 'Choose the right billing cycle for your Resident Welfare Association.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(1rem, 2vw, 1.5rem)' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                borderTop: plan.billing_period === 'ANNUAL' ? '4px solid var(--primary)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="badge badge-info">{plan.billing_period}</span>
                  {Boolean(plan.trial_enabled) && <span className="badge badge-success">{plan.trial_days} Days Free Trial</span>}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.75rem' }}>{plan.name}</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{plan.description}</p>
                <div style={{ marginTop: '1.15rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>{formatCurrency(plan.price_amount)}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}> + {plan.tax_percent}% GST / {plan.duration_days} days</span>
                </div>
                <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'grid', gap: '0.45rem', fontSize: '0.85rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={15} color="var(--success)" /> Up to {plan.max_households} Flats / Households
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={15} color="var(--success)" /> Bulk Monthly Billing & Custom Charges
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={15} color="var(--success)" /> UPI, Google Pay, Paytm & Razorpay Verification
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={15} color="var(--success)" /> Complete Accounting Ledger & PDF/CSV Reports
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setRegForm((prev) => ({ ...prev, planId: plan.id }));
                  setActiveModal('REGISTER_SOCIETY');
                }}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Core Modules Grid */}
      <section style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1200, marginInline: 'auto', width: '100%' }}>
        <div className="kpi-grid">
          <div className="card">
            <ShieldCheck size={24} color="var(--primary)" />
            <h4 style={{ marginTop: '0.5rem' }}>Duplicate-Proof Enrolment</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Normalized flat numbers with database unique constraints prevent duplicate active flat registrations within a society while supporting linked family members.
            </p>
          </div>
          <div className="card">
            <CreditCard size={24} color="var(--primary)" />
            <h4 style={{ marginTop: '0.5rem' }}>Idempotent Payment Ledger</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Manual UPI and bank submissions stay Pending Verification until verified. Confirming generates a unique receipt and prevents duplicate ledger postings.
            </p>
          </div>
          <div className="card">
            <Users size={24} color="var(--primary)" />
            <h4 style={{ marginTop: '0.5rem' }}>Live Staff Duty Status</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Mark guards, plumbers, or cashiers On Duty or Off Duty. Residents immediately see active on-duty staff and authorized contact numbers.
            </p>
          </div>
          <div className="card">
            <FileSpreadsheet size={24} color="var(--primary)" />
            <h4 style={{ marginTop: '0.5rem' }}>True RWA Accounting</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Separates billed receivables from realized cash/bank income. Surplus/deficit is computed accurately with immutable reversal entries.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Ad Slot (Google AdSense) */}
      {platform?.google_adsense_enabled && platform?.google_ad_slot_footer && (
        <div style={{ maxWidth: 1200, margin: '0 auto 2rem', padding: '0 1.5rem', width: '100%' }}>
          <GoogleAdBanner
            clientId={platform.google_adsense_client_id}
            slotId={platform.google_ad_slot_footer}
            label="Partner Advertisement"
          />
        </div>
      )}

      {/* Platform Public Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'auto', background: 'var(--surface-sunken)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <ResponsiveLogo logoUrl={platform?.logo_url} platformName={platform?.platform_name || t(lang, 'appName')} maxHeight={24} />
          <span>•</span>
          <span>© {new Date().getFullYear()} {platform?.platform_name || 'SocietyOS SaaS'}. All rights reserved.</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {platform?.meta_description || 'Enterprise Residential Welfare Association & Multi-Tenant Society Operating System'}
        </div>
      </footer>

      {/* MODAL 1: LOGIN */}
      {activeModal === 'LOGIN' && (
        <div className="modal-backdrop" onClick={() => setActiveModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3>{t(lang, 'login')}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal('NONE')}>Close</button>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  className="input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@greenvalley.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', cursor: 'pointer' }}
                  onClick={() => setActiveModal('FORGOT_PASSWORD')}
                >
                  Forgot password?
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing in...' : t(lang, 'login')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORGOT / RESET PASSWORD */}
      {activeModal === 'FORGOT_PASSWORD' && (
        <div className="modal-backdrop" onClick={() => setActiveModal('NONE')}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3><KeyRound size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Reset Password</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal('LOGIN')}>Back to Login</button>
            </div>
            {resetStep === 1 ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await apiFetch('/api/auth/forgot-password', {
                      method: 'POST',
                      body: { email: resetEmail },
                    });
                    if (res.resetTokenPreview) {
                      setResetToken(res.resetTokenPreview);
                    }
                    notify(res.message);
                    setResetStep(2);
                  } catch (err: any) {
                    notify(err.message, 'error');
                  }
                }}
                style={{ display: 'grid', gap: '1rem' }}
              >
                <div className="form-group">
                  <label>Registered Email Address</label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your account email"
                  />
                </div>
                <button type="submit" className="btn btn-primary">Send Reset Verification Code</button>
              </form>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await apiFetch('/api/auth/reset-password', {
                      method: 'POST',
                      body: { email: resetEmail, resetToken, newPassword },
                    });
                    notify(res.message);
                    setResetStep(1);
                    setActiveModal('LOGIN');
                  } catch (err: any) {
                    notify(err.message, 'error');
                  }
                }}
                style={{ display: 'grid', gap: '1rem' }}
              >
                <div className="form-group">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Confirm New Password</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTER YOUR SOCIETY & SUBSCRIPTION CHECKOUT */}
      {activeModal === 'REGISTER_SOCIETY' && (
        <div className="modal-backdrop" onClick={() => setActiveModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3>Register Your Society on SocietyOS</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal('NONE')}>Close</button>
            </div>

            {pendingOrder ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="card" style={{ background: 'var(--bg-subtle)' }}>
                  <h4>Complete Subscription Payment (Razorpay Gateway)</h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Invoice: <strong>{pendingOrder.invoiceNumber}</strong> • Order ID: <code>{pendingOrder.orderId}</code>
                  </p>
                  <div style={{ marginTop: '0.75rem', fontSize: '1.25rem', fontWeight: 800 }}>
                    Total Payable: {formatCurrency(pendingOrder.totalAmount)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>(incl. GST)</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Security Notice: Subscriptions are verified on the backend using HMAC-SHA256 signature verification after Razorpay Standard Checkout completes.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={loading}
                    onClick={handleRazorpaySubscriptionCheckout}
                  >
                    <CreditCard size={16} />
                    {loading ? 'Opening Razorpay Checkout...' : 'Pay Now with Razorpay Checkout'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSociety} style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Society / RWA Name *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regForm.societyName}
                      onChange={(e) => setRegForm({ ...regForm, societyName: e.target.value })}
                      placeholder="e.g., Falcon View Residency"
                    />
                  </div>
                  <div className="form-group">
                    <label>RWA Registration Number</label>
                    <input
                      type="text"
                      className="input"
                      value={regForm.registrationNumber}
                      onChange={(e) => setRegForm({ ...regForm, registrationNumber: e.target.value })}
                      placeholder="PB-RWA-2026-XXX"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Administrator Full Name *</label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      className="input"
                      value={regForm.adminName}
                      onChange={(e) => setRegForm({ ...regForm, adminName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Official Email Address *</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      className="input"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="president@falconview.com"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Mobile Phone Number (10-Digit Mobile) *</label>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      maxLength={10}
                      className="input"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div className="form-group">
                    <label>Administrator Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Society Street Address *</label>
                  <input
                    type="text"
                    required
                    autoComplete="street-address"
                    className="input"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="Sector 66A, JLPL Industrial Area Road"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regForm.state}
                      onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>PIN Code *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regForm.pincode}
                      onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Subscription Plan *</label>
                    <select
                      className="select"
                      value={regForm.planId}
                      onChange={(e) => setRegForm({ ...regForm, planId: e.target.value })}
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.price_amount)} ({p.billing_period})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Activation Mode</label>
                    <select
                      className="select"
                      value={regForm.startWithTrial ? 'TRIAL' : 'PAID'}
                      onChange={(e) => setRegForm({ ...regForm, startWithTrial: e.target.value === 'TRIAL' })}
                    >
                      {platform?.default_trial_enabled && (
                        <option value="TRIAL">Start with {platform.default_trial_days}-Day Free Trial</option>
                      )}
                      <option value="PAID">Pay Subscription Now via Razorpay</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveModal('NONE')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Processing...' : regForm.startWithTrial ? 'Start Free Trial & Open Dashboard' : 'Proceed to Subscription Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: PUBLIC SOCIETY MEMBER ENROLMENT (WITH DUPLICATE FLAT CHECK) */}
      {activeModal === 'ENROLL_MEMBER' && (
        <div className="modal-backdrop" onClick={() => setActiveModal('NONE')}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3>Public Society Resident Enrolment</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal('NONE')}>Close</button>
            </div>

            <div className="card" style={{ background: 'var(--bg-subtle)', marginBottom: '1rem', padding: '0.85rem' }}>
              {enrollSocietyData?.society ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 700 }}>
                  <Building2 size={18} />
                  <span>{enrollSocietyData.society.name}</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Loading society details...
                </div>
              )}
            </div>

            {enrollSocietyData?.society && (
              <form onSubmit={handleEnrollSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Registration Type</label>
                    <select
                      className="select"
                      value={enrollForm.enrolmentMode}
                      onChange={(e) =>
                        setEnrollForm({ ...enrollForm, enrolmentMode: e.target.value as 'NEW_HOUSEHOLD' | 'FAMILY_MEMBER' })
                      }
                    >
                      <option value="NEW_HOUSEHOLD">Primary Flat / Household Registration</option>
                      <option value="FAMILY_MEMBER">Link Family Member to Existing Flat</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Flat / House Number * (Normalized Check)</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="e.g., A-101 or B-204"
                      value={enrollForm.flatNumber}
                      onChange={(e) => {
                        setEnrollForm({ ...enrollForm, flatNumber: e.target.value });
                        handleCheckFlat(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {flatCheckStatus?.exists && enrollForm.enrolmentMode === 'NEW_HOUSEHOLD' && (
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 8,
                      background: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <span>
                      <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      {flatCheckStatus.message}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEnrollForm({ ...enrollForm, enrolmentMode: 'FAMILY_MEMBER' })}
                    >
                      Link as Family Member Instead
                    </button>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Apartment Block / Tower *</label>
                    <select
                      className="select"
                      value={enrollForm.blockName}
                      onChange={(e) => setEnrollForm({ ...enrollForm, blockName: e.target.value })}
                    >
                      {(enrollSocietyData.blocks || []).map((b: any) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Building Floor *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={enrollForm.floorNumber}
                      onChange={(e) => setEnrollForm({ ...enrollForm, floorNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ownership / Tenancy</label>
                    <select
                      className="select"
                      value={enrollForm.ownershipType}
                      onChange={(e) => setEnrollForm({ ...enrollForm, ownershipType: e.target.value })}
                    >
                      <option value="OWNER">Flat Owner</option>
                      <option value="TENANT">Tenant / Lessee</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Resident Full Name *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={enrollForm.fullName}
                      onChange={(e) => setEnrollForm({ ...enrollForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      className="input"
                      value={enrollForm.email}
                      onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Mobile Phone Number (10-Digit Mobile) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      className="input"
                      value={enrollForm.phone}
                      onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Portal Password *</label>
                    <input
                      type="password"
                      required
                      className="input"
                      value={enrollForm.password}
                      onChange={(e) => setEnrollForm({ ...enrollForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Emergency Contact Name & Phone</label>
                    <input
                      type="text"
                      className="input"
                      value={enrollForm.emergencyContact}
                      onChange={(e) => setEnrollForm({ ...enrollForm, emergencyContact: e.target.value })}
                      placeholder="e.g., Gurdeep Singh (+91-98150-00000)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Optional Resident Photograph</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadFileAsBase64(file);
                          setEnrollForm((prev) => ({ ...prev, photoUrl: url }));
                          notify('Photograph uploaded.');
                        } catch (err: any) {
                          notify(err.message, 'error');
                        }
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveModal('NONE')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Complete Resident Enrolment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
