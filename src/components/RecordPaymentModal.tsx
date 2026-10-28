import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, Hash, CheckCircle2 } from 'lucide-react';
import { WorkCommissionItem, CompensationPayment } from '../types/index.ts';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: WorkCommissionItem | null;
  onRecordPayment: (payment: Omit<CompensationPayment, 'id'>, newStatus: WorkCommissionItem['status']) => void;
  prefillAmount?: number;
  prefillRef?: string;
  prefillEmailSubject?: string;
  prefillEmailId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  workItem,
  onRecordPayment,
  prefillAmount,
  prefillRef,
  prefillEmailSubject,
  prefillEmailId,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Direct Deposit / ACH');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (workItem) {
      const remaining = Math.max(0, workItem.commissionAmount - workItem.compensationReceived);
      setAmount((prefillAmount ?? remaining).toString());
      setPaymentMethod(workItem.paymentMethod || 'Direct Deposit / ACH');
      setReference(prefillRef || workItem.invoiceRef || '');
      setNotes(prefillEmailSubject ? `Reconciled from Gmail: ${prefillEmailSubject}` : '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [workItem, prefillAmount, prefillRef, prefillEmailSubject, isOpen]);

  if (!isOpen || !workItem) return null;

  const currentReceived = workItem.compensationReceived || 0;
  const agreedCommission = workItem.commissionAmount;
  const remainingBefore = Math.max(0, agreedCommission - currentReceived);

  const numericAmount = parseFloat(amount) || 0;
  const projectedTotalReceived = currentReceived + numericAmount;
  const projectedRemaining = Math.max(0, agreedCommission - projectedTotalReceived);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    let newStatus = workItem.status;
    if (projectedTotalReceived >= agreedCommission) {
      newStatus = 'fully_paid';
    } else if (projectedTotalReceived > 0) {
      newStatus = 'partially_paid';
    }

    onRecordPayment(
      {
        workId: workItem.id,
        amount: numericAmount,
        paymentDate,
        paymentMethod,
        referenceOrTransactionId: reference.trim() || undefined,
        sourceEmailSubject: prefillEmailSubject,
        sourceEmailId: prefillEmailId,
        notes: notes.trim() || undefined,
      },
      newStatus
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Record Compensation Received
            </h3>
            <p className="text-xs text-neutral-500">
              Log payout remittance for: <span className="font-semibold text-neutral-700">{workItem.dealTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Balance Summary Box */}
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
          <div className="flex justify-between text-xs text-neutral-600">
            <span>Payer:</span>
            <span className="font-semibold text-neutral-900">{workItem.clientName}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-neutral-600">
            <span>Agreed Commission:</span>
            <span className="font-semibold text-neutral-900">${agreedCommission.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-neutral-600">
            <span>Already Received:</span>
            <span className="font-medium text-emerald-600">${currentReceived.toLocaleString()}</span>
          </div>
          <div className="mt-2 border-t border-neutral-200 pt-2 flex justify-between text-xs font-semibold">
            <span className="text-neutral-700">Outstanding Balance:</span>
            <span className="text-neutral-900 font-bold">${remainingBefore.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Compensation Amount Received ($) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <DollarSign className="mr-1.5 h-5 w-5 text-emerald-600" />
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-base font-bold text-neutral-900 outline-none"
              />
              {remainingBefore > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remainingBefore.toString())}
                  className="rounded bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-200"
                >
                  Pay in Full
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Payment Date
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
                <Calendar className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs text-neutral-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Payment Method
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
                <CreditCard className="mr-2 h-4 w-4 text-neutral-400" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs text-neutral-800 outline-none bg-transparent"
                >
                  <option value="Direct Deposit / ACH">Direct Deposit / ACH</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Stripe Payout">Stripe Payout</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash / Other">Cash / Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Transaction / Reference ID
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
              <Hash className="mr-2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="e.g. ACH-904211 or Check #4401"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs text-neutral-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Notes / Remittance Advice
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared into checking account, includes 10% withholding"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 p-2 text-xs text-neutral-800 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Result preview */}
          <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">
            <div className="flex justify-between font-medium">
              <span>New Total Received:</span>
              <span className="font-bold">${projectedTotalReceived.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Remaining Balance:</span>
              <span className="font-semibold">
                ${projectedRemaining.toLocaleString()}{' '}
                {projectedRemaining === 0 ? '(Fully Paid 🎉)' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              <CheckCircle2 className="h-4 w-4" />
              Confirm &amp; Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
