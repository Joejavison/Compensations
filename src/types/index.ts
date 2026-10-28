export type DealType = 
  | 'deal_closing' 
  | 'affiliate_sales' 
  | 'consulting_milestone' 
  | 'brokerage' 
  | 'recruiting_placement' 
  | 'service_retainer' 
  | 'other';

export type CommissionType = 'percentage' | 'fixed_flat' | 'tiered';

export type PaymentStatus = 
  | 'pending_approval' 
  | 'approved_unpaid' 
  | 'partially_paid' 
  | 'fully_paid' 
  | 'overdue' 
  | 'disputed';

export interface WorkCommissionItem {
  id: string;
  clientName: string;
  clientEmail: string;
  dealTitle: string;
  dealType: DealType;
  dealValue: number; // total deal/contract value ($)
  commissionType: CommissionType;
  commissionRate?: number; // percentage (e.g., 8.5)
  commissionAmount: number; // calculated agreed commission ($)
  compensationReceived: number; // actual compensation received ($)
  contractDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: PaymentStatus;
  invoiceRef?: string;
  paymentMethod?: string;
  notes?: string;
  linkedEmailIds?: string[];
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompensationPayment {
  id: string;
  workId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceOrTransactionId?: string;
  sourceEmailSubject?: string;
  sourceEmailId?: string;
  notes?: string;
}

export interface GmailEmailRecord {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  detectedAmounts: number[];
  detectedRef?: string;
  hasAttachment?: boolean;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  workId?: string;
}
