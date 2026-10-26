import { formatCurrency } from '../i18n.ts';

export interface PrintableBillItem {
  id?: string;
  categoryName?: string;
  category_name?: string;
  description: string;
  amount: number | string;
}

export interface PrintableBillData {
  societyName: string;
  societyAddress?: string;
  societyRegNo?: string;
  societyPhone?: string;
  societyEmail?: string;
  billNumber: string;
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

export function generateInvoiceHtml(data: PrintableBillData): string {
  const subtotal = Number(data.subtotalAmount || 0);
  const previousBalance = Number(data.previousBalance || 0);
  const penalty = Number(data.penaltyAmount || 0);
  const credit = Number(data.creditAmount || 0);
  const total = Number(data.totalAmount || 0);
  const balance = Number(data.balanceAmount ?? total);

  // Filter out any 0-amount items so zero opening balance does not waste space
  const rawItems = (data.items || []).filter((it) => {
    const val = Number(it.amount);
    return !isNaN(val) && Math.abs(val) > 0;
  });

  const rows: Array<{ head: string; desc: string; amount: number }> = [];

  if (rawItems.length > 0) {
    for (const it of rawItems) {
      rows.push({
        head: it.category_name || it.categoryName || 'Maintenance Charge',
        desc: it.description || `${it.category_name || 'Charge'} (${data.billingMonth}/${data.billingYear})`,
        amount: Number(it.amount),
      });
    }
  } else {
    rows.push({
      head: 'Maintenance Charges',
      desc: `Monthly Regular Society Maintenance (${data.billingMonth}/${data.billingYear})`,
      amount: subtotal > 0 ? subtotal : total,
    });
  }

  if (previousBalance > 0) {
    rows.push({
      head: 'Arrears / Previous Dues',
      desc: 'Unpaid dues brought forward from previous billing periods',
      amount: previousBalance,
    });
  }

  if (penalty > 0) {
    rows.push({
      head: 'Late Fee / Penalty',
      desc: 'Late payment surcharge applied',
      amount: penalty,
    });
  }

  if (credit > 0) {
    rows.push({
      head: 'Credit / Rebate',
      desc: 'Advance or credit concession adjustment',
      amount: -credit,
    });
  }

  const tableRowsHtml = rows
    .map(
      (r, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 13px; color: #0f172a;">${r.head}</td>
      <td style="padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 12.5px; color: #334155;">${r.desc}</td>
      <td style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; font-size: 13px; white-space: nowrap; color: ${r.amount < 0 ? '#16a34a' : '#0f172a'};">
        ${r.amount < 0 ? '-' : ''}${formatCurrency(Math.abs(r.amount))}
      </td>
    </tr>
  `
    )
    .join('');

  const statusColor = data.status === 'PAID' ? '#166534' : data.status === 'PARTIALLY_PAID' ? '#b45309' : '#b91c1c';
  const statusBg = data.status === 'PAID' ? '#dcfce7' : data.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#fee2e2';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${data.billNumber} - ${data.societyName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
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
      padding: 20px;
      font-size: 13px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 760px;
      margin: 0 auto;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 26px 30px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #047857;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .header-table td {
      vertical-align: top;
      padding-bottom: 12px;
    }
    .society-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .society-address {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }
    .society-reg {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .invoice-tag {
      font-size: 16px;
      font-weight: 800;
      color: #047857;
      letter-spacing: -0.01em;
      text-align: right;
    }
    .invoice-period {
      font-size: 12px;
      color: #334155;
      margin-top: 3px;
      text-align: right;
    }
    .invoice-date {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 2px;
      text-align: right;
    }
    .meta-card {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .meta-card td {
      padding: 10px 14px;
      font-size: 12.5px;
      vertical-align: middle;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      table-layout: fixed;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: left;
    }
    .totals-area {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 20px;
    }
    .totals-area td {
      padding: 6px 10px;
      font-size: 13px;
    }
    .totals-box {
      float: right;
      width: 320px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 10px 14px;
    }
    .totals-line {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 3px 0;
    }
    .totals-line.grand {
      border-top: 2px solid #0f172a;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .footer-note {
      clear: both;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #64748b;
      font-size: 11px;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .invoice-card {
        border: 1px solid #94a3b8;
        padding: 20px;
        margin: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="width: 60%;">
          <div class="society-title">${data.societyName}</div>
          ${data.societyAddress ? `<div class="society-address">${data.societyAddress}</div>` : ''}
          ${data.societyRegNo ? `<div class="society-reg">Registration #: <strong>${data.societyRegNo}</strong></div>` : ''}
          ${data.societyPhone || data.societyEmail ? `<div class="society-reg">${[data.societyPhone, data.societyEmail].filter(Boolean).join(' • ')}</div>` : ''}
        </td>
        <td style="width: 40%; text-align: right;">
          <div class="invoice-tag">INVOICE #${data.billNumber}</div>
          <div class="invoice-period">Billing Period: <strong>${data.billingMonth}/${data.billingYear}</strong></div>
          <div class="invoice-date">Issue Date: <strong>${data.invoiceDate || new Date().toISOString().slice(0, 10)}</strong></div>
        </td>
      </tr>
    </table>

    <table class="meta-card">
      <tr>
        <td style="width: 65%;">
          <div><strong>Billed To:</strong> Flat <strong>${data.flatNumber}</strong>${data.blockName ? ` (${data.blockName})` : ''}</div>
          <div style="color: #475569; margin-top: 2px;">Resident: <strong>${data.memberName || 'Resident Member'}</strong>${data.memberPhone ? ` • ${data.memberPhone}` : ''}</div>
        </td>
        <td style="width: 35%; text-align: right;">
          <div><strong>Due Date:</strong> <span style="color: #dc2626; font-weight: 700;">${data.dueDate}</span></div>
          <div style="margin-top: 4px;">
            <span class="badge" style="background: ${statusBg}; color: ${statusColor};">
              ${data.status}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 28%;">Charge Head</th>
          <th style="width: 50%;">Description</th>
          <th style="width: 22%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <div style="overflow: hidden; margin-bottom: 12px;">
      <div class="totals-box">
        ${subtotal > 0 && (previousBalance > 0 || penalty > 0 || credit > 0) ? `
          <div class="totals-line">
            <span style="color: #475569;">Subtotal (Current Month):</span>
            <span style="font-weight: 600;">${formatCurrency(subtotal)}</span>
          </div>
        ` : ''}
        ${previousBalance > 0 ? `
          <div class="totals-line">
            <span style="color: #475569;">Arrears / Prior Balance:</span>
            <span style="font-weight: 600; color: #dc2626;">+${formatCurrency(previousBalance)}</span>
          </div>
        ` : ''}
        ${penalty > 0 ? `
          <div class="totals-line">
            <span style="color: #475569;">Late Fee / Surcharge:</span>
            <span style="font-weight: 600;">+${formatCurrency(penalty)}</span>
          </div>
        ` : ''}
        ${credit > 0 ? `
          <div class="totals-line">
            <span style="color: #475569;">Credit / Rebate:</span>
            <span style="font-weight: 600; color: #16a34a;">-${formatCurrency(credit)}</span>
          </div>
        ` : ''}
        <div class="totals-line grand">
          <span>Total Payable:</span>
          <span>${formatCurrency(total)}</span>
        </div>
        ${balance !== total ? `
          <div class="totals-line" style="margin-top: 4px; font-weight: 700; color: #dc2626;">
            <span>Balance Due:</span>
            <span>${formatCurrency(balance)}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="footer-note">
      <div>
        Official maintenance bill generated by <strong>${data.societyName}</strong>.
      </div>
      <div style="text-align: right;">
        Authorized Signatory / Society Management
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printInvoiceDocument(data: PrintableBillData) {
  const html = generateInvoiceHtml(data);

  let printFrame = document.getElementById('society-print-iframe') as HTMLIFrameElement | null;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'society-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
  if (!frameDoc) {
    window.print();
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  setTimeout(() => {
    try {
      printFrame?.contentWindow?.focus();
      printFrame?.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 350);
}
