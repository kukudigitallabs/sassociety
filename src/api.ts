const TOKEN_KEY = 'societyos_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T = any>(
  pathname: string,
  options: { method?: string; body?: any; token?: string | null } = {}
): Promise<T> {
  const token = options.token !== undefined ? options.token : getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(pathname, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export async function uploadFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await apiFetch<{ url: string }>('/api/upload', {
          method: 'POST',
          body: {
            fileName: file.name,
            mimeType: file.type || 'image/png',
            base64Data,
          },
        });
        resolve(res.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.readAsDataURL(file);
  });
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escapeCell = (val: string | number | null | undefined) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

export interface RazorpayCheckoutParams {
  amountRupees: number;
  currency?: string;
  receipt?: string;
  merchantName?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  billIds?: string[];
  subscriptionPaymentId?: string;
  legacyOrderId?: string;
  isSubscription?: boolean;
  societyId?: string;
  planId?: string;
  token?: string | null;
  onSuccess: (verifyResponse: any) => void;
  onDismiss?: () => void;
  onError?: (errorMessage: string) => void;
}

export async function openRazorpayCheckout(params: RazorpayCheckoutParams): Promise<void> {
  const amountPaise = Math.round(Number(params.amountRupees) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    throw new Error('Minimum payable amount is ₹1.00 (100 paise).');
  }

  // Step 1: Create order on backend
  const orderData = await apiFetch<{
    order_id: string;
    amount: number;
    currency: string;
    key_id?: string;
    subscription_payment_id?: string;
    sandbox?: boolean;
  }>('/api/create-order', {
    method: 'POST',
    token: params.token,
    body: {
      amount: amountPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt || `rcpt_${Date.now()}`,
      subscriptionPaymentId: params.subscriptionPaymentId,
      legacyOrderId: params.legacyOrderId,
      isSubscription: params.isSubscription,
      societyId: params.societyId,
      planId: params.planId,
    },
  });

  const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || orderData.key_id;
  if (!keyId) {
    throw new Error('Razorpay Key ID is not configured.');
  }

  const verifyHandler = async (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const verifyRes = await apiFetch('/api/verify-payment', {
        method: 'POST',
        token: params.token,
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          billIds: params.billIds,
          amount: params.amountRupees,
          subscriptionOrderId:
            orderData.subscription_payment_id || params.subscriptionPaymentId || params.legacyOrderId,
        },
      });
      params.onSuccess(verifyRes);
    } catch (err: any) {
      params.onError?.(err?.message || 'Payment signature verification failed.');
    }
  };

  // If the backend returned a sandbox order (when using synthetic test credentials in sandbox mode),
  // render the interactive Razorpay Standard Checkout (Test Mode) modal so the full order -> checkout -> HMAC verify flow works seamlessly
  if (orderData.sandbox) {
    openSandboxCheckoutModal({
      orderId: orderData.order_id,
      amountPaise: orderData.amount,
      currency: orderData.currency,
      keyId,
      merchantName: params.merchantName || 'SocietyOS',
      description: params.description || 'Online Payment',
      prefill: params.prefill,
      token: params.token,
      onComplete: verifyHandler,
      onDismiss: () => params.onDismiss?.(),
      onFailed: (msg) => params.onError?.(msg),
    });
    return;
  }

  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new Error('Razorpay Checkout SDK is not loaded. Please check your internet connection.');
  }

  // Step 2: Open Razorpay Standard Checkout modal with order_id
  const options: Record<string, any> = {
    key: keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: params.merchantName || 'SocietyOS',
    description: params.description || 'Online Payment',
    order_id: orderData.order_id,
    prefill: {
      name: params.prefill?.name || '',
      email: params.prefill?.email || '',
      contact: params.prefill?.contact || '',
    },
    theme: {
      color: '#2563eb',
    },
    // Step 3: On success, send razorpay_payment_id, razorpay_order_id, razorpay_signature to /api/verify-payment
    handler: verifyHandler,
    modal: {
      ondismiss: () => {
        params.onDismiss?.();
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response: any) => {
    const errMsg =
      response?.error?.description ||
      response?.error?.reason ||
      'Payment failed. Please try again.';
    params.onError?.(errMsg);
  });
  rzp.open();
}

function openSandboxCheckoutModal(opts: {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  merchantName: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  token?: string | null;
  onComplete: (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => Promise<void>;
  onDismiss: () => void;
  onFailed: (msg: string) => void;
}) {
  const existing = document.getElementById('rzp-sandbox-modal-backdrop');
  if (existing) existing.remove();

  const amountInr = (opts.amountPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const backdrop = document.createElement('div');
  backdrop.id = 'rzp-sandbox-modal-backdrop';
  backdrop.style.cssText =
    'position:fixed;inset:0;background:rgba(15,23,42,0.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;font-family:Inter,system-ui,sans-serif;';

  const card = document.createElement('div');
  card.style.cssText =
    'width:100%;max-width:410px;background:#ffffff;color:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.35);border:1px solid #e2e8f0;';

  card.innerHTML = `
    <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;padding:1.15rem 1.25rem;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="display:flex;align-items:center;gap:0.45rem;">
          <span style="font-weight:800;font-size:1.02rem;letter-spacing:-0.01em;">${opts.merchantName}</span>
          <span style="background:#f59e0b;color:#111827;font-size:0.65rem;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase;">Test Mode</span>
        </div>
        <div style="font-size:0.78rem;opacity:0.9;margin-top:3px;">${opts.description}</div>
        <div style="font-size:0.7rem;opacity:0.8;margin-top:4px;font-family:monospace;">Order: ${opts.orderId}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.25rem;font-weight:800;">₹${amountInr}</div>
        <button id="rzp-sandbox-close" type="button" style="margin-top:4px;background:rgba(255,255,255,0.18);border:none;color:#fff;border-radius:6px;padding:2px 8px;font-size:0.75rem;cursor:pointer;">✕ Cancel</button>
      </div>
    </div>
    <div style="padding:1.15rem 1.25rem;display:grid;gap:0.85rem;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.65rem 0.8rem;font-size:0.78rem;color:#334155;">
        <div><strong>Customer:</strong> ${opts.prefill?.name || 'Resident Member'} (${opts.prefill?.contact || '+91-9876543210'})</div>
        <div style="margin-top:2px;"><strong>Email:</strong> ${opts.prefill?.email || 'member@societyos.com'}</div>
      </div>
      <div>
        <label style="display:block;font-size:0.76rem;font-weight:700;color:#475569;margin-bottom:0.4rem;">SELECT TEST PAYMENT METHOD</label>
        <select id="rzp-sandbox-method" style="width:100%;padding:0.6rem 0.75rem;border:1px solid #cbd5e1;border-radius:8px;font-size:0.85rem;background:#fff;color:#0f172a;">
          <option value="upi">UPI — success@razorpay (Google Pay / PhonePe / Paytm)</option>
          <option value="card">Card — 4111 •••• •••• 1111 (Visa Test Card)</option>
          <option value="netbanking">Netbanking — HDFC / ICICI / SBI Test Bank</option>
        </select>
      </div>
      <div style="display:grid;gap:0.5rem;margin-top:0.25rem;">
        <button id="rzp-sandbox-pay" type="button" style="width:100%;padding:0.75rem 1rem;background:#2563eb;color:#fff;font-weight:700;font-size:0.92rem;border:none;border-radius:8px;cursor:pointer;">
          Pay ₹${amountInr} Now
        </button>
        <button id="rzp-sandbox-fail" type="button" style="width:100%;padding:0.55rem 1rem;background:#fff1f2;color:#be123c;font-weight:600;font-size:0.78rem;border:1px solid #fecdd3;border-radius:8px;cursor:pointer;">
          Simulate Failed Payment (Test Error Handling)
        </button>
      </div>
      <div style="text-align:center;font-size:0.7rem;color:#64748b;">
        Secured by <strong>Razorpay Standard Checkout</strong> • HMAC-SHA256 Verified
      </div>
    </div>
  `;

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  const closeBtn = card.querySelector('#rzp-sandbox-close') as HTMLButtonElement;
  const payBtn = card.querySelector('#rzp-sandbox-pay') as HTMLButtonElement;
  const failBtn = card.querySelector('#rzp-sandbox-fail') as HTMLButtonElement;

  closeBtn.onclick = () => {
    backdrop.remove();
    opts.onDismiss();
  };

  failBtn.onclick = () => {
    backdrop.remove();
    opts.onFailed('Payment failed: Transaction was declined by the issuing bank in test mode.');
  };

  payBtn.onclick = async () => {
    payBtn.disabled = true;
    payBtn.textContent = 'Verifying Signature...';
    try {
      const sim = await apiFetch<{
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }>('/api/public/razorpay-sandbox/simulate-settlement', {
        method: 'POST',
        token: opts.token,
        body: { orderId: opts.orderId },
      });
      backdrop.remove();
      await opts.onComplete(sim);
    } catch (err: any) {
      backdrop.remove();
      opts.onFailed(err?.message || 'Sandbox settlement failed.');
    }
  };
}


