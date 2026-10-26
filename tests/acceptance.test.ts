import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Use a dedicated test SQLite file so tests are repeatable and clean
const testDbPath = path.join(process.cwd(), 'data', 'test_acceptance.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
process.env.SQLITE_DB_PATH = testDbPath;
process.env.NODE_ENV = 'test';

const { initDatabase, seedInitialDataIfEmpty } = await import('../server/db.ts');
const { verifyJwt } = await import('../server/security.ts');
const { handleApiRequest } = await import('../server/routes.ts');

initDatabase();
seedInitialDataIfEmpty();

describe('SocietyOS SaaS — Comprehensive Acceptance Criteria Suite (Section 22)', () => {
  let superAdminToken = '';
  let societyAToken = '';
  let societyAEnrollCode = '';
  let societyBToken = '';
  let memberAToken = '';
  let householdAId = '';
  let billAId = '';
  let paymentAId = '';
  let staffGuardId = '';

  async function api(pathname: string, options: { method?: string; token?: string; body?: any } = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = new URL(pathname, 'http://localhost:4000');
    const auth = options.token ? verifyJwt(options.token) : null;

    let statusCode = 200;
    let responseBody = '';

    const mockReq: any = {
      url: pathname,
      method,
      headers: options.token ? { authorization: `Bearer ${options.token}` } : {},
      socket: { remoteAddress: '127.0.0.1' },
    };

    const mockRes: any = {
      writeHead(code: number) {
        statusCode = code;
      },
      end(payload?: string) {
        if (payload) responseBody = payload;
      },
    };

    await handleApiRequest({
      req: mockReq,
      res: mockRes,
      url,
      method,
      body: options.body || {},
      auth,
    });

    const data = responseBody ? JSON.parse(responseBody) : {};
    return { status: statusCode, data };
  }

  it('AC 1 & 12: Super Admin login & Society registration with Super Admin-configured free trial', async () => {
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'superadmin@societyos.com', password: 'SuperAdmin@123' },
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.data.user.role, 'SUPER_ADMIN');
    superAdminToken = loginRes.data.token;

    const plansRes = await api('/api/public/plans');
    assert.equal(plansRes.status, 200);
    const starterPlan = plansRes.data.plans[0];
    assert.ok(starterPlan.id);

    const regRes = await api('/api/public/register-society', {
      method: 'POST',
      body: {
        adminName: 'Sukhbir Singh',
        email: 'admin@shivalikheights.com',
        phone: '+91-98140-11111',
        password: 'Password@123',
        societyName: 'Shivalik Heights RWA',
        address: 'Sector 125, Sunny Enclave',
        city: 'Mohali',
        state: 'Punjab',
        pincode: '140301',
        planId: starterPlan.id,
        startWithTrial: true,
      },
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.data.society.subscription_status, 'TRIAL');
    assert.equal(regRes.data.society.approval_status, 'APPROVED');
    societyAToken = regRes.data.token;
    societyAEnrollCode = regRes.data.society.enrollment_code;
  });

  it('AC 2 & 16: Society subscription payment via Razorpay Sandbox & rejection of forged/redirect-only claims', async () => {
    const plansRes = await api('/api/public/plans');
    const annualPlan = plansRes.data.plans[2];

    const regRes = await api('/api/public/register-society', {
      method: 'POST',
      body: {
        adminName: 'Karanvir Bajwa',
        email: 'admin@heritagegreens.com',
        phone: '+91-98140-22222',
        password: 'Password@123',
        societyName: 'Heritage Greens Colonia',
        address: 'GT Road, Jalandhar',
        city: 'Jalandhar',
        state: 'Punjab',
        pincode: '144001',
        planId: annualPlan.id,
        startWithTrial: false,
      },
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.data.society.subscription_status, 'PENDING_PAYMENT');
    societyBToken = regRes.data.token;
    const orderId = regRes.data.paymentOrder.orderId;

    // Attempt to verify with forged signature or redirect reference ONLY -> MUST FAIL
    const forgedVerify = await api('/api/public/subscription-payment/verify', {
      method: 'POST',
      body: {
        orderId,
        paymentId: 'pay_fake_12345',
        signature: 'forged_invalid_signature_000',
      },
    });
    assert.equal(forgedVerify.status, 400);

    // Simulate trusted Razorpay Sandbox settlement & verify with valid cryptographic HMAC signature
    const sandboxSim = await api('/api/public/razorpay-sandbox/simulate-settlement', {
      method: 'POST',
      body: { orderId },
    });
    assert.equal(sandboxSim.status, 200);

    const validVerify = await api('/api/public/subscription-payment/verify', {
      method: 'POST',
      body: {
        orderId: sandboxSim.data.razorpay_order_id,
        paymentId: sandboxSim.data.razorpay_payment_id,
        signature: sandboxSim.data.razorpay_signature,
      },
    });
    assert.equal(validVerify.status, 200);
    assert.equal(validVerify.data.society.subscription_status, 'ACTIVE');
    assert.equal(validVerify.data.society.payment_status, 'PAID');
  });

  it('AC 3 & 13: Strict tenant isolation & RBAC — Society Admin cannot access Super Admin or other societies', async () => {
    // Society A admin attempting to access Super Admin dashboard -> 403
    const saAttempt = await api('/api/super-admin/dashboard', { token: societyAToken });
    assert.equal(saAttempt.status, 403);

    // Super Admin attempting to access Society Admin portal directly -> 403 (Strict Separation)
    const socAttempt = await api('/api/society/dashboard', { token: superAdminToken });
    assert.equal(socAttempt.status, 403);

    // Society A custom charge category does not appear in Society B
    const addCatA = await api('/api/society/charge-categories', {
      method: 'POST',
      token: societyAToken,
      body: { name: 'Solar Rooftop Levy', defaultAmount: 450, billingFrequency: 'MONTHLY' },
    });
    assert.equal(addCatA.status, 201);

    const catsB = await api('/api/society/charge-categories', { token: societyBToken });
    assert.equal(catsB.status, 200);
    const leaked = catsB.data.categories.find((c: any) => c.name === 'Solar Rooftop Levy');
    assert.equal(leaked, undefined);
  });

  it('AC 4: Duplicate flat registration prevention within the same society (normalized) while allowing same flat in another society & family linking', async () => {
    // Register Flat "A-301" in Society A via public enrolment link
    const enroll1 = await api(`/api/public/enroll/${societyAEnrollCode}`, {
      method: 'POST',
      body: {
        fullName: 'Tejinder Singh',
        email: 'tejinder@shivalik.com',
        phone: '+91-98111-30101',
        password: 'Member@123',
        flatNumber: 'A-301',
        blockName: 'Block A',
        floorNumber: '3',
      },
    });
    assert.equal(enroll1.status, 201);
    householdAId = enroll1.data.householdId;

    // Attempt to register " a - 301 " (different case/spaces) in Society A -> MUST BE REJECTED with exact message
    const enrollDup = await api(`/api/public/enroll/${societyAEnrollCode}`, {
      method: 'POST',
      body: {
        fullName: 'Duplicate Person',
        email: 'dup@shivalik.com',
        phone: '+91-98111-30102',
        password: 'Member@123',
        flatNumber: '  a - 301 ',
        blockName: 'Block A',
        floorNumber: '3',
      },
    });
    assert.equal(enrollDup.status, 409);
    assert.equal(enrollDup.data.error, 'This flat/house number is already registered in this society.');

    // Linking a family member to existing household A-301 -> ALLOWED
    const enrollFamily = await api(`/api/public/enroll/${societyAEnrollCode}`, {
      method: 'POST',
      body: {
        fullName: 'Jasleen Kaur (Spouse)',
        email: 'jasleen@shivalik.com',
        phone: '+91-98111-30103',
        password: 'Member@123',
        flatNumber: 'A-301',
        enrolmentMode: 'FAMILY_MEMBER',
        existingHouseholdId: householdAId,
        relationshipToPrimary: 'SPOUSE',
      },
    });
    assert.equal(enrollFamily.status, 201);
    assert.equal(enrollFamily.data.householdId, householdAId);

    // Registering "A-301" in Society B -> ALLOWED (uniqueness is per society, not global)
    const enrollSocB = await api('/api/society/members', {
      method: 'POST',
      token: societyBToken,
      body: {
        fullName: 'Vikramaditya Singh',
        email: 'vikram@heritage.com',
        phone: '+91-98222-30101',
        flatNumber: 'A-301',
        blockName: 'Block A',
        floorNumber: '3',
      },
    });
    assert.equal(enrollSocB.status, 201);
  });

  it('AC 5 & 6: Bulk & individual monthly bill generation and duplicate bill prevention', async () => {
    const catsRes = await api('/api/society/charge-categories', { token: societyAToken });
    const maintCat = catsRes.data.categories.find((c: any) => c.code === 'MONTHLY_MAINTENANCE');
    const waterCat = catsRes.data.categories.find((c: any) => c.code === 'WATER_CHARGES');

    // Generate October 2026 bill for Society A
    const gen1 = await api('/api/society/bills/generate', {
      method: 'POST',
      token: societyAToken,
      body: {
        billingMonth: 10,
        billingYear: 2026,
        householdId: householdAId,
        chargeCategoryIds: [maintCat.id, waterCat.id],
      },
    });
    assert.equal(gen1.status, 201);
    assert.equal(gen1.data.createdCount, 1);
    billAId = gen1.data.createdBillIds[0];

    // Attempting to generate duplicate regular bill for the same flat, month, and category -> REJECTED (409)
    const genDup = await api('/api/society/bills/generate', {
      method: 'POST',
      token: societyAToken,
      body: {
        billingMonth: 10,
        billingYear: 2026,
        householdId: householdAId,
        chargeCategoryIds: [maintCat.id],
      },
    });
    assert.equal(genDup.status, 409);

    // Regenerating with overwriteExisting: true -> ALLOWED (updates/replaces existing unpaid bill)
    const genOverwrite = await api('/api/society/bills/generate', {
      method: 'POST',
      token: societyAToken,
      body: {
        billingMonth: 10,
        billingYear: 2026,
        householdId: householdAId,
        chargeCategoryIds: [maintCat.id, waterCat.id],
        overwriteExisting: true,
      },
    });
    assert.equal(genOverwrite.status, 201);
    assert.equal(genOverwrite.data.createdCount, 1);
    billAId = genOverwrite.data.createdBillIds[0];

    // Issuing an authorized Supplementary / Adjustment bill with audit reason -> ALLOWED
    const suppRes = await api('/api/society/bills/adjustment', {
      method: 'POST',
      token: societyAToken,
      body: {
        householdId: householdAId,
        billingMonth: 10,
        billingYear: 2026,
        chargeCategoryId: waterCat.id,
        amount: 250,
        reason: 'Additional water tanker share approved in RWA meeting',
      },
    });
    assert.equal(suppRes.status, 201);
  });

  it('AC 7 & 8: Member views bills, submits payment, and Admin confirms payment idempotently without duplicate ledger entries', async () => {
    const memLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'tejinder@shivalik.com', password: 'Member@123' },
    });
    assert.equal(memLogin.status, 200);
    memberAToken = memLogin.data.token;

    const memDash = await api('/api/member/dashboard', { token: memberAToken });
    assert.equal(memDash.status, 200);
    assert.equal(memDash.data.bills.length, 2);

    // Member submits payment of 2900 for main October bill
    const subPay = await api('/api/member/payments', {
      method: 'POST',
      token: memberAToken,
      body: {
        billIds: [billAId],
        amount: 2900,
        paymentDate: '2026-10-17',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-TEST-9988776655',
      },
    });
    assert.equal(subPay.status, 201);
    assert.equal(subPay.data.status, 'PENDING_VERIFICATION');
    paymentAId = subPay.data.paymentId;

    // Admin confirms payment (1st time)
    const confirm1 = await api(`/api/society/payments/${paymentAId}/verify`, {
      method: 'POST',
      token: societyAToken,
      body: { decision: 'CONFIRM', notes: 'Confirmed in bank statement' },
    });
    assert.equal(confirm1.status, 200);
    assert.ok(confirm1.data.receipt.receipt_number);

    // Admin repeats confirmation action (2nd time) -> MUST NOT create duplicate ledger entries!
    const confirm2 = await api(`/api/society/payments/${paymentAId}/verify`, {
      method: 'POST',
      token: societyAToken,
      body: { decision: 'CONFIRM', notes: 'Repeated click' },
    });
    assert.equal(confirm2.status, 200);
    assert.equal(confirm2.data.alreadyConfirmed, true);

    // Verify financial ledger has exactly ONE income entry for this payment
    const reports = await api('/api/society/reports', { token: societyAToken });
    const incomeEntries = reports.data.ledger.filter((e: any) => e.reference_id === paymentAId);
    assert.equal(incomeEntries.length, 1);
    assert.equal(reports.data.summary.realizedIncome, 2900);
  });

  it('AC 9 & 13: Staff duty status updates immediately in Member Portal & Cashier role permissions are enforced', async () => {
    const rolesRes = await api('/api/society/roles', { token: societyAToken });
    const cashierRole = rolesRes.data.roles.find((r: any) => r.name === 'Cashier');
    const guardRole = rolesRes.data.roles.find((r: any) => r.name === 'Security Guard');

    // Create Cashier staff user
    const createCashier = await api('/api/society/staff', {
      method: 'POST',
      token: societyAToken,
      body: {
        fullName: 'Surinder Pal (Cashier)',
        phone: '+91-98555-12121',
        email: 'cashier@shivalik.com',
        password: 'Staff@123',
        roleId: cashierRole.id,
        designation: 'Cashier',
        salaryAmount: 20000,
        isOnDuty: true,
        documentType: 'AADHAAR',
        documentNumber: '4567 8901 2345',
      },
    });
    assert.equal(createCashier.status, 201);

    // Create Security Guard on duty
    const createGuard = await api('/api/society/staff', {
      method: 'POST',
      token: societyAToken,
      body: {
        fullName: 'Major Singh (Guard)',
        phone: '+91-98555-34343',
        roleId: guardRole.id,
        designation: 'Gate Security Guard',
        salaryAmount: 16000,
        isOnDuty: true,
      },
    });
    assert.equal(createGuard.status, 201);
    staffGuardId = createGuard.data.staffId;

    // Member dashboard sees both on-duty staff
    const memDashOn = await api('/api/member/dashboard', { token: memberAToken });
    assert.equal(memDashOn.data.onDutyStaff.length, 2);

    // Mark Security Guard OFF DUTY -> Immediately removed from member portal
    const offDutyRes = await api(`/api/society/staff/${staffGuardId}/duty`, {
      method: 'PUT',
      token: societyAToken,
      body: { isOnDuty: false, shiftNotes: 'Shift ended' },
    });
    assert.equal(offDutyRes.status, 200);

    const memDashOff = await api('/api/member/dashboard', { token: memberAToken });
    assert.equal(memDashOff.data.onDutyStaff.length, 1);

    // Verify Cashier permissions: can view payments/reports, CANNOT add/manage members or change society settings
    const cashierLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'cashier@shivalik.com', password: 'Staff@123' },
    });
    assert.equal(cashierLogin.status, 200);
    const cashierToken = cashierLogin.data.token;

    const cashierTryManageMembers = await api('/api/society/members', {
      method: 'POST',
      token: cashierToken,
      body: { fullName: 'Unauthorized', email: 'unauth@shivalik.com', phone: '999', flatNumber: 'C-999' },
    });
    assert.equal(cashierTryManageMembers.status, 403);

    const cashierTrySettings = await api('/api/society/settings', {
      method: 'PUT',
      token: cashierToken,
      body: { name: 'Hacked Society Name' },
    });
    assert.equal(cashierTrySettings.status, 403);
  });

  it('AC 10 & 11: Member submits complaint with attachment & Accounting surplus/deficit is consistent', async () => {
    const compRes = await api('/api/member/complaints', {
      method: 'POST',
      token: memberAToken,
      body: {
        title: 'Streetlight flickering near Block A park',
        category: 'Electricity',
        description: 'Pole #4 light is flickering since yesterday evening.',
        priority: 'MEDIUM',
        attachmentUrls: ['/uploads/sample-complaint-photo.png'],
      },
    });
    assert.equal(compRes.status, 201);

    // Record an expense of 900 in Society A
    const expCats = await api('/api/society/expense-categories', { token: societyAToken });
    const firstExpCat = expCats.data.categories[0];

    const addExp = await api('/api/society/expenses', {
      method: 'POST',
      token: societyAToken,
      body: {
        expenseCategoryId: firstExpCat.id,
        description: 'Replaced LED driver on Pole #4',
        amount: 900,
        expenseDate: '2026-10-17',
        paymentMethod: 'BANK_TRANSFER',
        accountType: 'BANK',
        vendorName: 'BrightElectricals Works',
      },
    });
    assert.equal(addExp.status, 201);

    // Check financial reports:
    // Total billed is 2900 + 250 = 3150, but realized income is 2900, expenses = 900 -> netSurplusOrDeficit MUST be 2000 (not 2250!)
    const rep = await api('/api/society/reports', { token: societyAToken });
    assert.equal(rep.status, 200);
    assert.equal(rep.data.summary.totalBilledReceivables, 3150);
    assert.equal(rep.data.summary.outstandingReceivables, 250);
    assert.equal(rep.data.summary.realizedIncome, 2900);
    assert.equal(rep.data.summary.approvedExpenses, 900);
    assert.equal(rep.data.summary.netSurplusOrDeficit, 2000);
    assert.equal(rep.data.summary.bankBalance, 2000);
  });

  it('AC 14: Resident opening balance configuration by Admin & payable by resident with other dues', async () => {
    // 1. Admin enrols a new member with an initial opening balance of ₹3,500
    const enrolRes = await api('/api/society/members', {
      method: 'POST',
      token: societyAToken,
      body: {
        fullName: 'Manpreet Kaur',
        email: 'manpreet@shivalik.com',
        phone: '+91-98777-20202',
        password: 'Password@123',
        flatNumber: 'B-202',
        blockName: 'Block B',
        floorNumber: '2',
        areaSqft: 1500,
        ownershipType: 'OWNER',
        openingBalance: 3500,
        openingBalanceNotes: 'Prior arrears carried forward from old society ledger',
      },
    });
    assert.equal(enrolRes.status, 201);
    const { householdId, memberId } = enrolRes.data;
    assert.ok(householdId);
    assert.ok(memberId);

    // 2. Query society members: verify opening_balance and opening_balance_dues
    const membersRes = await api('/api/society/members?search=B-202', { token: societyAToken });
    assert.equal(membersRes.status, 200);
    const memberRow = membersRes.data.members.find((m: any) => m.id === memberId);
    assert.ok(memberRow);
    assert.equal(Number(memberRow.opening_balance), 3500);
    assert.equal(Number(memberRow.opening_balance_dues), 3500);

    // 3. Member logs in
    const memberLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'manpreet@shivalik.com', password: 'Password@123' },
    });
    assert.equal(memberLogin.status, 200);
    assert.equal(memberLogin.data.user.role, 'MEMBER');
    const memberToken = memberLogin.data.token;

    // 4. Member checks dashboard: Opening balance must be listed in outstanding balance & bills
    const dashRes = await api('/api/member/dashboard', { token: memberToken });
    assert.equal(dashRes.status, 200);
    assert.equal(Number(dashRes.data.openingBalance), 3500);
    assert.equal(Number(dashRes.data.openingBalanceDues), 3500);
    assert.equal(Number(dashRes.data.totalOutstanding), 3500);

    const opBalBill = dashRes.data.bills.find(
      (b: any) => b.bill_type === 'OPENING_BALANCE' || b.bill_number?.startsWith('OP-BAL-')
    );
    assert.ok(opBalBill, 'Opening balance bill must exist in member bills');
    assert.equal(Number(opBalBill.total_amount), 3500);
    assert.equal(Number(opBalBill.balance_amount), 3500);
    assert.equal(opBalBill.status, 'UNPAID');

    // 5. Admin updates opening balance on the household to ₹4,000 with updated note
    const updateOpBal = await api(`/api/society/households/${householdId}/opening-balance`, {
      method: 'POST',
      token: societyAToken,
      body: {
        openingBalance: 4000,
        notes: 'Adjusted: Added penalty fee from 2025 ledger',
      },
    });
    assert.equal(updateOpBal.status, 200);

    // Member dashboard reflects updated opening balance dues
    const dashRes2 = await api('/api/member/dashboard', { token: memberToken });
    assert.equal(Number(dashRes2.data.openingBalance), 4000);
    assert.equal(Number(dashRes2.data.openingBalanceDues), 4000);
    assert.equal(Number(dashRes2.data.totalOutstanding), 4000);

    // 6. Society generates regular monthly maintenance bill for Flat B-202 (Month 11, Year 2026)
    const catsRes = await api('/api/society/charge-categories', { token: societyAToken });
    const regularCat = catsRes.data.categories[0];
    const genRes = await api('/api/society/bills/generate', {
      method: 'POST',
      token: societyAToken,
      body: {
        billingMonth: 11,
        billingYear: 2026,
        householdId,
        chargeCategoryIds: [regularCat.id],
      },
    });
    assert.equal(genRes.status, 201);

    // Resident dashboard now includes both Opening Balance dues + regular bill dues
    const dashRes3 = await api('/api/member/dashboard', { token: memberToken });
    assert.equal(Number(dashRes3.data.openingBalanceDues), 4000);
    assert.equal(Number(dashRes3.data.otherDues), Number(regularCat.default_amount));
    assert.equal(Number(dashRes3.data.totalOutstanding), 4000 + Number(regularCat.default_amount));

    // 7. Member submits payment against Opening Balance bill
    const payRes = await api('/api/member/payments', {
      method: 'POST',
      token: memberToken,
      body: {
        billIds: [opBalBill.id],
        amount: 4000,
        paymentDate: '2026-10-21',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-OPBAL-99182377',
      },
    });
    assert.equal(payRes.status, 201);
    const payId = payRes.data.paymentId;

    // Admin confirms the payment
    const confirmRes = await api(`/api/society/payments/${payId}/verify`, {
      method: 'POST',
      token: societyAToken,
      body: { decision: 'CONFIRM', notes: 'Verified bank transfer for opening balance' },
    });
    assert.equal(confirmRes.status, 200);

    // Opening balance dues should now be 0, while regular bill remains payable
    const dashRes4 = await api('/api/member/dashboard', { token: memberToken });
    assert.equal(Number(dashRes4.data.openingBalanceDues), 0);
    assert.equal(Number(dashRes4.data.totalOutstanding), Number(regularCat.default_amount));
  });

  it('AC 15: Society Admin resets database to zero with double warning confirmation', async () => {
    // 1. Rejected if confirmation string is not 'RESET'
    const rejectRes = await api('/api/society/reset-data', {
      method: 'POST',
      token: societyAToken,
      body: { confirmation: 'WRONG' },
    });
    assert.equal(rejectRes.status, 400);

    // 2. Perform zero-reset with correct confirmation
    const resetRes = await api('/api/society/reset-data', {
      method: 'POST',
      token: societyAToken,
      body: { confirmation: 'RESET', wipeMembersAndFlats: false },
    });
    assert.equal(resetRes.status, 200);

    // 3. Verify Society Dashboard returns 0 across all financial cards
    const dashRes = await api('/api/society/dashboard', { token: societyAToken });
    assert.equal(dashRes.status, 200);
    assert.equal(Number(dashRes.data.kpis.totalBilledAmount), 0);
    assert.equal(Number(dashRes.data.kpis.totalCollectedAmount), 0);
    assert.equal(Number(dashRes.data.kpis.totalOutstandingDues), 0);
    assert.equal(Number(dashRes.data.kpis.billsIssuedThisMonth), 0);
    assert.equal(Number(dashRes.data.kpis.currentCashBalance), 0);
    assert.equal(Number(dashRes.data.kpis.currentBankBalance), 0);
    assert.equal(Number(dashRes.data.kpis.openComplaints), 0);
  });

  it('AC 17: Society subscription payment submission via UPI (Google Pay / PhonePe / Paytm / BHIM) with UTR reference', async () => {
    const plansRes = await api('/api/public/plans');
    const quarterlyPlan = plansRes.data.plans[1] || plansRes.data.plans[0];

    // Register a new society requiring paid subscription
    const regRes = await api('/api/public/register-society', {
      method: 'POST',
      body: {
        adminName: 'Harpreet Singh Sandhu',
        email: `admin.upi.${Date.now()}@greencity.com`,
        phone: '+91-98140-55555',
        password: 'Password@123',
        societyName: 'Green City Residency',
        address: 'Ferozepur Road',
        city: 'Ludhiana',
        state: 'Punjab',
        pincode: '141001',
        planId: quarterlyPlan.id,
        startWithTrial: false,
      },
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.data.society.subscription_status, 'PENDING_PAYMENT');
    const orderId = regRes.data.paymentOrder.orderId;
    assert.ok(orderId);
    assert.ok(regRes.data.paymentOrder.platformUpiId);

    // Reject submission without UTR
    const emptyUtrRes = await api('/api/public/subscription-upi/submit', {
      method: 'POST',
      body: { orderId, utr: '' },
    });
    assert.equal(emptyUtrRes.status, 400);

    // Submit valid 12-digit UTR reference
    const submitRes = await api('/api/public/subscription-upi/submit', {
      method: 'POST',
      body: {
        orderId,
        utr: '425199882201',
        proofUrl: 'https://society.kukudigitallabs.com/receipts/proof_425199882201.png',
      },
    });
    assert.equal(submitRes.status, 200);
    assert.ok(submitRes.data.status === 'PAID' || submitRes.data.status === 'PENDING_APPROVAL');
  });
});
