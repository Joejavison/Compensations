import React, { useState, useEffect } from 'react';
import { X, DollarSign, Percent, Calendar, User, Mail, FileText, Check } from 'lucide-react';
import { WorkCommissionItem, DealType, CommissionType, PaymentStatus } from '../types/index.ts';

interface WorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<WorkCommissionItem>) => void;
  editingItem: WorkCommissionItem | null;
}

export const WorkItemModal: React.FC<WorkItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [dealType, setDealType] = useState<DealType>('deal_closing');
  const [dealValue, setDealValue] = useState<string>('50000');
  const [commissionType, setCommissionType] = useState<CommissionType>('percentage');
  const [commissionRate, setCommissionRate] = useState<string>('10');
  const [fixedCommission, setFixedCommission] = useState<string>('5000');
  const [contractDate, setContractDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<PaymentStatus>('approved_unpaid');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Direct Deposit / ACH');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingItem) {
      setClientName(editingItem.clientName);
      setClientEmail(editingItem.clientEmail || '');
      setDealTitle(editingItem.dealTitle);
      setDealType(editingItem.dealType);
      setDealValue(editingItem.dealValue.toString());
      setCommissionType(editingItem.commissionType);
      setCommissionRate(editingItem.commissionRate?.toString() || '10');
      setFixedCommission(editingItem.commissionAmount.toString());
      setContractDate(editingItem.contractDate);
      setDueDate(editingItem.dueDate);
      setStatus(editingItem.status);
      setInvoiceRef(editingItem.invoiceRef || '');
      setPaymentMethod(editingItem.paymentMethod || 'Direct Deposit / ACH');
      setNotes(editingItem.notes || '');
    } else {
      setClientName('');
      setClientEmail('');
      setDealTitle('');
      setDealType('deal_closing');
      setDealValue('');
      setCommissionType('percentage');
      setCommissionRate('10');
      setFixedCommission('');
      setContractDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStatus('approved_unpaid');
      setInvoiceRef('');
      setPaymentMethod('Direct Deposit / ACH');
      setNotes('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Calculate projected commission
  const numericDealValue = parseFloat(dealValue) || 0;
  const numericRate = parseFloat(commissionRate) || 0;
  const calculatedCommission = commissionType === 'percentage'
    ? Math.round((numericDealValue * (numericRate / 100)) * 100) / 100
    : parseFloat(fixedCommission) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !dealTitle.trim()) {
      return;
    }

    const itemData: Partial<WorkCommissionItem> = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      dealTitle: dealTitle.trim(),
      dealType,
      dealValue: numericDealValue,
      commissionType,
      commissionRate: commissionType === 'percentage' ? numericRate : undefined,
      commissionAmount: calculatedCommission,
      contractDate,
      dueDate,
      status,
      invoiceRef: invoiceRef.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    onSave(itemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {editingItem ? 'Edit Work / Commission Deal' : 'Log New Work Done & Commission'}
            </h3>
            <p className="text-xs text-neutral-500">
              Record contract details to track and reconcile your compensation payout
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Client Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Payer / Client Company <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <User className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Capital Partners"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent text-neutral-800 placeholder-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Client / Accounting Email
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <Mail className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  placeholder="accounting@client.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent text-neutral-800 placeholder-neutral-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">Used for drafting compensation inquiry emails via Gmail</p>
            </div>
          </div>

          {/* Deal Title & Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700">
                Deal / Project Title <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <FileText className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Enterprise Expansion Agreement"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent text-neutral-800 placeholder-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Work / Deal Category
              </label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value as DealType)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-emerald-500"
              >
                <option value="deal_closing">Sales / Deal Closing</option>
                <option value="brokerage">Brokerage / Real Estate</option>
                <option value="consulting_milestone">Consulting Milestone</option>
                <option value="recruiting_placement">Recruiting Placement</option>
                <option value="affiliate_sales">Affiliate / Referral</option>
                <option value="service_retainer">Retainer / Commission</option>
                <option value="other">Other Work</option>
              </select>
            </div>
          </div>

          {/* Financials: Deal Value & Commission */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Total Deal / Contract Value ($)
                </label>
                <div className="mt-1 flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <DollarSign className="mr-1 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="50000"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    className="w-full text-sm font-medium outline-none bg-transparent text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Commission Model
                </label>
                <div className="mt-1 flex rounded-lg border border-neutral-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setCommissionType('percentage')}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                      commissionType === 'percentage'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    % Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommissionType('fixed_flat')}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                      commissionType === 'fixed_flat'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Flat Fee ($)
                  </button>
                </div>
              </div>

              <div>
                {commissionType === 'percentage' ? (
                  <>
                    <label className="block text-xs font-semibold text-neutral-700">
                      Commission Rate (%)
                    </label>
                    <div className="mt-1 flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-emerald-500">
                      <Percent className="mr-1.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="10"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="w-full text-sm font-medium outline-none bg-transparent text-neutral-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-semibold text-neutral-700">
                      Agreed Commission ($)
                    </label>
                    <div className="mt-1 flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-emerald-500">
                      <DollarSign className="mr-1.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="5000"
                        value={fixedCommission}
                        onChange={(e) => setFixedCommission(e.target.value)}
                        className="w-full text-sm font-medium outline-none bg-transparent text-neutral-900"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Calculated Agreed Compensation Banner */}
            <div className="mt-3 flex items-center justify-between border-t border-emerald-200/60 pt-3 text-xs">
              <span className="font-medium text-emerald-900">
                Calculated Compensation Owed:
              </span>
              <span className="text-base font-bold text-emerald-800">
                ${calculatedCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Dates & Reference */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Contract / Deal Date
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
                <Calendar className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent text-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Payout Due Date
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
                <Calendar className="mr-2 h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent text-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Invoice / Contract #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-104"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Status & Method */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-emerald-500"
              >
                <option value="approved_unpaid">Approved (Awaiting Compensation)</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="fully_paid">Fully Paid</option>
                <option value="overdue">Overdue / Delinquent</option>
                <option value="disputed">Disputed / In Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Preferred Payout Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-emerald-500"
              >
                <option value="Direct Deposit / ACH">Direct Deposit / ACH</option>
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="Check">Check</option>
                <option value="Stripe Payout">Stripe Payout</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Contract Terms &amp; Commission Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 50% upon contract signing, 50% upon client go-live. Payout scheduled for net-30."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 p-2.5 text-xs text-neutral-800 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800"
            >
              <Check className="h-4 w-4" />
              {editingItem ? 'Save Changes' : 'Record Work & Commission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
