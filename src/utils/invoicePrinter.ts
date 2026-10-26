import { formatCurrency } from '../i18n.ts';

export interface PrintableBillItem {
  id?: string;
  categoryName?: string;
  category_name?: string;
  description: string;
  amount: number | string;
  is_adjustment?: number | boolean;
}

export interface PrintableBillData {
  societyName: string;
  societyAddress?: string;
  societyCity?: string;
  societyState?: string;
  societyPincode?: string;
  societyRegNo?: string;
  societyPhone?: string;
  societyEmail?: string;
  societyUpiId?: string;
  societyUpiName?: string;
  billNumber: string;
  billType?: string;
  billingMonth: number | string;
  billingYear: number | string;
  invoiceDate?: string;
  flatNumber: string;
  blockName?: string;
  memberName: string;
  memberPhone?: string;
  dueDate: string;
  status: string;
  items: PrintableBillItem[];
  subtotalAmount?: number | string;
  previousBalance?: number | string;
  penaltyAmount?: number | string;
  creditAmount?: number | string;
  totalAmount: number | string;
  paidAmount?: number | string;
  balanceAmount: number | string;
}

export function numberToIndianWords(num: number): string {
  const n = Math.round(Number(num || 0));
  if (n === 0) return 'Rupees Zero Only';
  if (n < 0) return 'Minus ' + numberToIndianWords(Math.abs(n));

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(val: number): string {
    let str = '';
    if (val >= 100) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += b[Math.floor(val / 20)] + (val % 20 > 0 ? ' ' + a[val % 20] : '');
    } else if (val > 0) {
      str += a[val];
    }
    return str.trim();
  }

  let result = '';
  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const remainder = rem;

  if (crore > 0) result += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  return 'Rupees ' + result.trim() + ' Only';
}

export function generateInvoiceHtml(data: PrintableBillData): string {
  const subtotal = Number(data.subtotalAmount || 0);
  const previousBalance = Number(data.previousBalance || 0);
  const penalty = Number(data.penaltyAmount || 0);
  const credit = Number(data.creditAmount || 0);
  const total = Number(data.totalAmount || 0);
  const balance = Number(data.balanceAmount ?? total);
  const paid = Number(data.paidAmount || 0);

  const billTypeLabel =
    data.billType === 'SUPPLEMENTARY'
      ? 'Supplementary / Adjustment Bill'
      : 'Regular Monthly Maintenance Bill';

  // Filter out any 0-amount items
  const rawItems = (data.items || []).filter((it) => {
    const val = Number(it.amount);
    return !isNaN(val) && Math.abs(val) > 0;
  });

  interface ItemRow {
    head: string;
    type: string;
    desc: string;
    amount: number;
  }

  const rows: ItemRow[] = [];

  if (rawItems.length > 0) {
    for (const it of rawItems) {
      const isAdj = Boolean(it.is_adjustment) || data.billType === 'SUPPLEMENTARY';
      rows.push({
        head: it.category_name || it.categoryName || 'Maintenance Charge',
        type: isAdj ? 'Adjustment' : 'Monthly Recurring',
        desc: it.description || `${it.category_name || 'Charge'} (${data.billingMonth}/${data.billingYear})`,
        amount: Number(it.amount),
      });
    }
  } else {
    rows.push({
      head: 'Maintenance Charges',
      type: 'Monthly Recurring',
      desc: `Regular Society Maintenance Charges (${data.billingMonth}/${data.billingYear})`,
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

  const fullAddress = [
    data.societyAddress,
    data.societyCity,
    data.societyState,
    data.societyPincode ? `PIN: ${data.societyPincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const statusColor = data.status === 'PAID' ? '#166534' : data.status === 'PARTIALLY_PAID' ? '#b45309' : '#b91c1c';
  const statusBg = data.status === 'PAID' ? '#dcfce7' : data.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#fee2e2';

  const tableRowsHtml = rows
    .map(
      (r, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 12px; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; font-size: 12.5px; color: #0f172a; word-break: break-word;">${r.head}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 12px; color: #475569; word-break: break-word;">${r.type}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 12px; color: #334155; word-break: break-word;">${r.desc}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; font-size: 13px; white-space: nowrap; color: ${r.amount < 0 ? '#16a34a' : '#0f172a'};">
        ${r.amount < 0 ? '-' : ''}${formatCurrency(Math.abs(r.amount))}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${data.billNumber} - ${data.societyName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 16px;
      font-size: 12.5px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 780px;
      margin: 0 auto;
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: 20px 24px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #047857;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .header-table td {
      vertical-align: top;
      padding-bottom: 8px;
    }
    .society-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }
    .society-meta {
      font-size: 11.5px;
      color: #475569;
      margin-top: 3px;
      line-height: 1.35;
    }
    .bill-title-box {
      text-align: right;
    }
    .bill-tag {
      font-size: 15px;
      font-weight: 800;
      color: #047857;
      letter-spacing: -0.01em;
    }
    .bill-badge {
      display: inline-block;
      padding: 2px 7px;
      background: #f1f5f9;
      color: #334155;
      font-size: 10.5px;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .resident-card {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .resident-card td {
      padding: 8px 12px;
      font-size: 12px;
      vertical-align: top;
    }
    .bill-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 12px;
    }
    .bill-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid #0f172a;
      padding: 7px 10px;
    }
    .bill-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      vertical-align: middle;
    }
    .summary-area {
      display: table;
      width: 100%;
      margin-bottom: 12px;
    }
    .summary-col-words {
      display: table-cell;
      width: 55%;
      vertical-align: top;
      padding-right: 15px;
    }
    .summary-col-totals {
      display: table-cell;
      width: 45%;
      vertical-align: top;
    }
    .totals-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 8px 12px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 12px;
    }
    .totals-row.grand {
      border-top: 2px solid #0f172a;
      margin-top: 5px;
      padding-top: 6px;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .upi-box {
      border: 1px dashed #047857;
      background: #f0fdf4;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11.5px;
      color: #14532d;
      margin-bottom: 14px;
    }
    .footer-sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
    }
    .footer-sign-table td {
      vertical-align: bottom;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .invoice-card {
        border: 1.5px solid #0f172a;
        padding: 16px 20px;
        margin: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="width: 58%;">
          <div class="society-title">${data.societyName}</div>
          <div class="society-meta">${fullAddress || 'Residential Welfare Association'}</div>
          ${data.societyRegNo ? `<div class="society-meta">Registration #: <strong>${data.societyRegNo}</strong></div>` : ''}
          ${data.societyPhone || data.societyEmail ? `<div class="society-meta">${[data.societyPhone, data.societyEmail].filter(Boolean).join(' • ')}</div>` : ''}
        </td>
        <td style="width: 42%; text-align: right;">
          <div class="bill-tag">INVOICE #${data.billNumber}</div>
          <div class="bill-badge">${billTypeLabel}</div>
          <div class="society-meta" style="margin-top: 4px;">Billing Period: <strong>${data.billingMonth}/${data.billingYear}</strong></div>
          <div class="society-meta">Bill Date: <strong>${data.invoiceDate || new Date().toISOString().slice(0, 10)}</strong></div>
        </td>
      </tr>
    </table>

    <table class="resident-card">
      <tr>
        <td style="width: 60%; border-right: 1px solid #e2e8f0;">
          <div style="font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700;">Billed Resident / Flat:</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">
            Flat ${data.flatNumber}${data.blockName ? ` (${data.blockName})` : ''}
          </div>
          <div style="font-size: 12.5px; font-weight: 600; color: #334155; margin-top: 2px;">
            ${data.memberName || 'Resident Member'}
          </div>
          ${data.memberPhone ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">Phone: ${data.memberPhone}</div>` : ''}
        </td>
        <td style="width: 40%; text-align: right;">
          <div style="font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700;">Due Date & Status:</div>
          <div style="font-size: 14px; font-weight: 800; color: #dc2626; margin-top: 2px;">
            ${data.dueDate}
          </div>
          <div style="margin-top: 4px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor};">
              ${data.status}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <table class="bill-table">
      <thead>
        <tr>
          <th style="width: 6%; text-align: center;">#</th>
          <th style="width: 24%; text-align: left;">Charge Head</th>
          <th style="width: 16%; text-align: left;">Type</th>
          <th style="width: 36%; text-align: left;">Description</th>
          <th style="width: 18%; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <div class="summary-area">
      <div class="summary-col-words">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700;">Amount in Words:</div>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px; font-style: italic;">
            ${numberToIndianWords(total)}
          </div>
        </div>
        ${data.societyUpiId ? `
          <div class="upi-box" style="margin-top: 8px;">
            <strong>Pay via UPI:</strong> <code>${data.societyUpiId}</code>${data.societyUpiName ? ` (${data.societyUpiName})` : ''}
            <div style="font-size: 10.5px; color: #166534; margin-top: 2px;">
              Please mention Bill #${data.billNumber} & Flat ${data.flatNumber} in UPI payment notes.
            </div>
          </div>
        ` : ''}
      </div>

      <div class="summary-col-totals">
        <div class="totals-box">
          ${subtotal > 0 && (previousBalance > 0 || penalty > 0 || credit > 0) ? `
            <div class="totals-row">
              <span style="color: #475569;">Subtotal:</span>
              <span style="font-weight: 600;">${formatCurrency(subtotal)}</span>
            </div>
          ` : ''}
          ${previousBalance > 0 ? `
            <div class="totals-row">
              <span style="color: #475569;">Arrears / Prior Balance:</span>
              <span style="font-weight: 600; color: #dc2626;">+${formatCurrency(previousBalance)}</span>
            </div>
          ` : ''}
          ${penalty > 0 ? `
            <div class="totals-row">
              <span style="color: #475569;">Late Fee / Penalty:</span>
              <span style="font-weight: 600;">+${formatCurrency(penalty)}</span>
            </div>
          ` : ''}
          ${credit > 0 ? `
            <div class="totals-row">
              <span style="color: #475569;">Credit / Rebate:</span>
              <span style="font-weight: 600; color: #16a34a;">-${formatCurrency(credit)}</span>
            </div>
          ` : ''}
          <div class="totals-row grand">
            <span>Total Payable:</span>
            <span>${formatCurrency(total)}</span>
          </div>
          ${paid > 0 ? `
            <div class="totals-row" style="color: #16a34a;">
              <span>Amount Paid:</span>
              <span>-${formatCurrency(paid)}</span>
            </div>
          ` : ''}
          ${balance !== total ? `
            <div class="totals-row" style="margin-top: 3px; font-weight: 800; color: ${balance > 0 ? '#dc2626' : '#166534'};">
              <span>Balance Due:</span>
              <span>${formatCurrency(balance)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <table class="footer-sign-table">
      <tr>
        <td style="width: 60%;">
          <div>This is a computer-generated invoice issued by <strong>${data.societyName}</strong>.</div>
          <div style="margin-top: 2px;">No physical signature is required. Generated on ${new Date().toISOString().slice(0, 10)}.</div>
        </td>
        <td style="width: 40%; text-align: right;">
          <div style="font-weight: 700; color: #0f172a;">For ${data.societyName}</div>
          <div style="margin-top: 28px; border-top: 1px solid #475569; display: inline-block; padding-top: 3px; font-weight: 600;">
            Authorized Signatory / Treasurer
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function printInvoiceDocument(data: PrintableBillData) {
  const html = generateInvoiceHtml(data);

  // Guarantee that if the browser delegates printing to the parent window,
  // all background pages, sidebars, tables, and topbars are 100% hidden.
  document.body.classList.add('print-bill-only');

  try {
    let printFrame = document.getElementById('society-print-iframe') as HTMLIFrameElement | null;
    if (printFrame) {
      printFrame.remove();
    }
    printFrame = document.createElement('iframe');
    printFrame.id = 'society-print-iframe';
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-10000px';
    printFrame.style.left = '-10000px';
    printFrame.style.width = '840px';
    printFrame.style.height = '1180px';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'visible';
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;
    const frameDoc = frameWindow?.document;
    if (frameWindow && frameDoc) {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          frameWindow.focus();
          frameWindow.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            document.body.classList.remove('print-bill-only');
            try {
              printFrame?.remove();
            } catch {
              // Ignore cleanup error
            }
          }, 1500);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.print()', err);
  }

  window.print();
  setTimeout(() => {
    document.body.classList.remove('print-bill-only');
  }, 1500);
}
