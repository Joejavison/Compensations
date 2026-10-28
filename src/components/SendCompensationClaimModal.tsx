import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { WorkCommissionItem } from '../types/index.ts';
import { sendGmailMessage } from '../lib/gmailService.ts';

interface SendCompensationClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: WorkCommissionItem | null;
  userEmail?: string | null;
  onEmailSent?: (workItemId: string, emailSubject: string) => void;
}

export const SendCompensationClaimModal: React.FC<SendCompensationClaimModalProps> = ({
  isOpen,
  onClose,
  workItem,
  userEmail,
  onEmailSent,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateType, setTemplateType] = useState<'friendly' | 'formal' | 'discrepancy'>('friendly');
  
  // Explicit confirmation dialog state per Workspace integration rules
  const [showConfirmationStep, setShowConfirmationStep] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (workItem) {
      const remaining = Math.max(0, workItem.commissionAmount - workItem.compensationReceived);
      const to = workItem.clientEmail || '';
      setRecipient(to);
      setShowConfirmationStep(false);
      setSendSuccess(false);
      setErrorMessage(null);

      applyTemplate('friendly', workItem, remaining);
    }
  }, [workItem, isOpen]);

  const applyTemplate = (type: 'friendly' | 'formal' | 'discrepancy', item: WorkCommissionItem, remaining: number) => {
    setTemplateType(type);
    const balanceStr = `$${remaining.toLocaleString()}`;
    const totalCommStr = `$${item.commissionAmount.toLocaleString()}`;

    if (type === 'friendly') {
      setSubject(`Follow-Up: Commission Payout for ${item.dealTitle} (${item.invoiceRef || 'Ref Pending'})`);
      setBody(
`Dear ${item.clientName} Accounting & Payouts Team,

I hope this email finds you well.

I am writing to check in on the commission compensation for our work on "${item.dealTitle}", which closed on ${item.contractDate}.

According to our agreed terms:
- Agreed Commission: ${totalCommStr}
- Compensation Received: $${item.compensationReceived.toLocaleString()}
- Outstanding Compensation: ${balanceStr}
- Scheduled Due Date: ${item.dueDate}

Could you please confirm if this payout has been scheduled for remittance or if you require any additional invoice details from my end?

Thank you for your partnership, and I look forward to your update.

Best regards,`
      );
    } else if (type === 'formal') {
      setSubject(`Formal Request: Remittance of Commission Due - ${item.dealTitle} [${item.invoiceRef || 'INV-DUE'}]`);
      setBody(
`ATTN: Accounts Payable / Payroll
${item.clientName}

RE: Statement of Overdue Commission Compensation

This communication serves as a formal notice regarding the unpaid compensation balance for "${item.dealTitle}".

Work Summary:
- Project / Deal: ${item.dealTitle}
- Contract Date: ${item.contractDate}
- Agreed Commission Total: ${totalCommStr}
- Outstanding Balance Due: ${balanceStr}
- Due Date: ${item.dueDate} (Status: Overdue)
- Invoice / Reference: ${item.invoiceRef || 'N/A'}

Per our contract agreement, payment is now due. Please arrange for direct deposit / wire transfer remittance of ${balanceStr} at your earliest opportunity.

If payment has already been initiated, please reply with the remittance advice or transaction confirmation number for our records.

Sincerely,`
      );
    } else {
      setSubject(`Inquiry: Commission Compensation Reconciliation for ${item.dealTitle}`);
      setBody(
`Dear ${item.clientName} Finance Team,

I am writing regarding the recent compensation payment received for "${item.dealTitle}".

According to our records and commission agreement:
- Total Commission Earned: ${totalCommStr}
- Compensation Paid to Date: $${item.compensationReceived.toLocaleString()}
- Unreconciled Variance / Balance: ${balanceStr}

We noticed a discrepancy between the agreed commission rate and the compensation deposited. Please review the attached agreement details and let us know how the current payment was calculated so we can reconcile this file.

Thank you for your prompt assistance in resolving this inquiry.

Kind regards,`
      );
    }
  };

  if (!isOpen || !workItem) return null;

  const remainingBalance = Math.max(0, workItem.commissionAmount - workItem.compensationReceived);

  // Validate and open confirmation prompt
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      setErrorMessage('Please fill in all required fields (recipient, subject, and body).');
      return;
    }
    setErrorMessage(null);
    setShowConfirmationStep(true);
  };

  // Perform actual send after user explicitly approves
  const handleConfirmedSend = async () => {
    setIsSending(true);
    setErrorMessage(null);

    try {
      await sendGmailMessage(recipient.trim(), subject.trim(), body.trim());
      setSendSuccess(true);
      setShowConfirmationStep(false);
      if (onEmailSent) {
        onEmailSent(workItem.id, subject);
      }
    } catch (err: unknown) {
      console.error('Failed to send email:', err);
      const msg = err instanceof Error ? err.message : 'Failed to send email through Gmail';
      setErrorMessage(msg);
      setShowConfirmationStep(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Send Compensation Claim / Inquiry
              </h3>
              <p className="text-xs text-neutral-500">
                Directly from your verified Gmail: <span className="font-semibold text-neutral-700">{userEmail || 'Connected Account'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {sendSuccess ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-neutral-900">
              Email Sent Successfully!
            </h4>
            <p className="mt-1 text-xs text-neutral-600 max-w-md mx-auto">
              Your inquiry has been dispatched via Gmail to <span className="font-semibold">{recipient}</span>.
              A copy is stored in your Gmail Sent mailbox.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : showConfirmationStep ? (
          /* MANDATORY USER CONFIRMATION DIALOG FOR WORKSPACE MUTATION */
          <div className="py-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Explicit Confirmation: Send Email from Your Gmail Account
                  </h4>
                  <p className="mt-1 text-xs text-amber-800">
                    Are you sure you want to send this compensation inquiry email? This action will deliver the message directly to the recipient using your connected Gmail account.
                  </p>
                </div>
              </div>

              {/* Confirmation Details Card */}
              <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-white p-3 text-xs">
                <div className="flex">
                  <span className="w-20 font-semibold text-neutral-500">Recipient:</span>
                  <span className="font-medium text-neutral-900">{recipient}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-semibold text-neutral-500">Subject:</span>
                  <span className="font-medium text-neutral-900">{subject}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-semibold text-neutral-500">Deal:</span>
                  <span className="font-medium text-neutral-900">{workItem.dealTitle}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-semibold text-neutral-500">Balance:</span>
                  <span className="font-bold text-red-600">${remainingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmationStep(false)}
                disabled={isSending}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Go Back &amp; Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmedSend}
                disabled={isSending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending via Gmail...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm &amp; Send Email Now
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Editor Step */
          <form onSubmit={handleProceedToConfirm} className="mt-4 space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Select Compensation Claim Template
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => applyTemplate('friendly', workItem, remainingBalance)}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    templateType === 'friendly'
                      ? 'border-emerald-500 bg-emerald-50/70 font-semibold text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-bold">1. Courteous Follow-Up</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 font-normal">Standard friendly check-in on upcoming payout</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplate('formal', workItem, remainingBalance)}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    templateType === 'formal'
                      ? 'border-emerald-500 bg-emerald-50/70 font-semibold text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-bold">2. Formal Demand Notice</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 font-normal">Contractual statement for overdue/delinquent claims</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyTemplate('discrepancy', workItem, remainingBalance)}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    templateType === 'discrepancy'
                      ? 'border-emerald-500 bg-emerald-50/70 font-semibold text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-bold">3. Discrepancy Inquiry</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 font-normal">Reconciliation inquiry for partial/underpaid amounts</p>
                </button>
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Recipient Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="client-finance@company.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-800 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Email Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-800 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Message Body <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={9}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 p-3 font-mono text-xs text-neutral-800 outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                You will review before final send
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  Review &amp; Confirm Send
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
