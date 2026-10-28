import { WorkCommissionItem, CompensationPayment } from '../types/index.ts';

const STORAGE_KEY_ITEMS = 'commissionpay_work_items_v1';
const STORAGE_KEY_PAYMENTS = 'commissionpay_payments_v1';

const INITIAL_WORK_ITEMS: WorkCommissionItem[] = [
  {
    id: 'work-101',
    clientName: 'Apex Cloud Solutions Inc.',
    clientEmail: 'billing@apexcloudsolutions.com',
    dealTitle: 'Enterprise Multi-Year Software License Renewal',
    dealType: 'deal_closing',
    dealValue: 75000,
    commissionType: 'percentage',
    commissionRate: 8,
    commissionAmount: 6000,
    compensationReceived: 6000,
    contractDate: '2026-08-15',
    dueDate: '2026-09-15',
    status: 'fully_paid',
    invoiceRef: 'INV-2026-881',
    paymentMethod: 'Direct Deposit / ACH',
    notes: 'Full compensation paid on time per contractor commission agreement schedule.',
    lastPaymentDate: '2026-09-14',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-09-14T15:30:00.000Z',
  },
  {
    id: 'work-102',
    clientName: 'Meridian Commercial Realty',
    clientEmail: 'accounting@meridianrealty.net',
    dealTitle: 'Metropolitan Commercial Lease & Tenant Placement',
    dealType: 'brokerage',
    dealValue: 120000,
    commissionType: 'percentage',
    commissionRate: 5,
    commissionAmount: 6000,
    compensationReceived: 3000,
    contractDate: '2026-08-28',
    dueDate: '2026-09-20',
    status: 'partially_paid',
    invoiceRef: 'COMM-9042',
    paymentMethod: 'Wire Transfer',
    notes: '50% initial compensation received. Balance of $3,000 due within 30 days of tenant occupancy.',
    lastPaymentDate: '2026-09-05',
    createdAt: '2026-08-28T14:20:00.000Z',
    updatedAt: '2026-09-05T11:00:00.000Z',
  },
  {
    id: 'work-103',
    clientName: 'Vanguard Dynamics Corp',
    clientEmail: 'finance@vanguarddynamics.io',
    dealTitle: 'Product Architecture & Implementation Milestone',
    dealType: 'consulting_milestone',
    dealValue: 28000,
    commissionType: 'fixed_flat',
    commissionAmount: 3500,
    compensationReceived: 0,
    contractDate: '2026-08-10',
    dueDate: '2026-09-10',
    status: 'overdue',
    invoiceRef: 'INV-VD-441',
    paymentMethod: 'Bank Wire',
    notes: 'Milestone signoff achieved. Payment is 18 days overdue. Commission claim inquiry needed.',
    createdAt: '2026-08-10T09:15:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z',
  },
  {
    id: 'work-104',
    clientName: 'Strata Growth Partners',
    clientEmail: 'payouts@stratagrowth.co',
    dealTitle: 'Executive Placement - VP of Engineering',
    dealType: 'recruiting_placement',
    dealValue: 40000,
    commissionType: 'percentage',
    commissionRate: 15,
    commissionAmount: 6000,
    compensationReceived: 0,
    contractDate: '2026-09-12',
    dueDate: '2026-10-12',
    status: 'approved_unpaid',
    invoiceRef: 'REC-STR-09',
    paymentMethod: 'Direct Deposit',
    notes: 'Candidate completed 30-day tenure guarantee on Sept 25. Ready for scheduled compensation run.',
    createdAt: '2026-09-12T16:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
  }
];

const INITIAL_PAYMENTS: CompensationPayment[] = [
  {
    id: 'pay-201',
    workId: 'work-101',
    amount: 6000,
    paymentDate: '2026-09-14',
    paymentMethod: 'Direct Deposit / ACH',
    referenceOrTransactionId: 'ACH-88912301',
    sourceEmailSubject: 'Remittance Advice: Commission Payout Apex Cloud (INV-2026-881)',
    notes: 'Direct deposit cleared.',
  },
  {
    id: 'pay-202',
    workId: 'work-102',
    amount: 3000,
    paymentDate: '2026-09-05',
    paymentMethod: 'Wire Transfer',
    referenceOrTransactionId: 'WIRE-9921',
    sourceEmailSubject: 'Payment Confirmation: Meridian Realty Partial Commission COMM-9042',
    notes: 'First tranche of brokerage commission.',
  }
];

export function getStoredWorkItems(): WorkCommissionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      saveStoredWorkItems(INITIAL_WORK_ITEMS);
      return INITIAL_WORK_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_WORK_ITEMS;
  }
}

export function saveStoredWorkItems(items: WorkCommissionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save work items:', e);
  }
}

export function getStoredPayments(): CompensationPayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYMENTS);
    if (!raw) {
      saveStoredPayments(INITIAL_PAYMENTS);
      return INITIAL_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PAYMENTS;
  }
}

export function saveStoredPayments(payments: CompensationPayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  } catch (e) {
    console.error('Failed to save payments:', e);
  }
}
