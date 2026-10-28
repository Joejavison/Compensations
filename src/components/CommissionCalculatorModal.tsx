import React, { useState } from 'react';
import { X, Calculator, DollarSign, Percent, ArrowRight, Check } from 'lucide-react';

interface CommissionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToNewDeal: (dealValue: number, commissionRate: number, commissionAmount: number) => void;
}

export const CommissionCalculatorModal: React.FC<CommissionCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyToNewDeal,
}) => {
  const [dealValue, setDealValue] = useState<string>('85000');
  const [commissionRate, setCommissionRate] = useState<string>('8');
  const [brokerSplitRate, setBrokerSplitRate] = useState<string>('100'); // 100% means agent keeps all
  const [estimatedTaxRate, setEstimatedTaxRate] = useState<string>('25'); // 25% tax reserve

  if (!isOpen) return null;

  const numericDeal = parseFloat(dealValue) || 0;
  const numericCommRate = parseFloat(commissionRate) || 0;
  const numericSplit = parseFloat(brokerSplitRate) || 100;
  const numericTax = parseFloat(estimatedTaxRate) || 0;

  const grossCommission = numericDeal * (numericCommRate / 100);
  const netCommissionAfterSplit = grossCommission * (numericSplit / 100);
  const taxWithholdingReserve = netCommissionAfterSplit * (numericTax / 100);
  const takeHomeCompensation = netCommissionAfterSplit - taxWithholdingReserve;

  const handleApply = () => {
    onApplyToNewDeal(numericDeal, numericCommRate, netCommissionAfterSplit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Commission &amp; Compensation Estimator
              </h3>
              <p className="text-xs text-neutral-500">
                Model deal value, splits, and estimated net compensation
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

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Contract / Gross Deal Volume ($)
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
              <DollarSign className="mr-1 h-4 w-4 text-neutral-400" />
              <input
                type="number"
                step="any"
                min="0"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="w-full text-sm font-semibold text-neutral-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Commission Rate (%)
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
                <Percent className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full text-xs font-medium text-neutral-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Your Split Share (%)
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
                <Percent className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={brokerSplitRate}
                  onChange={(e) => setBrokerSplitRate(e.target.value)}
                  className="w-full text-xs font-medium text-neutral-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Tax / Withholding Reserve (%)
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 py-2">
              <Percent className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={estimatedTaxRate}
                onChange={(e) => setEstimatedTaxRate(e.target.value)}
                className="w-full text-xs font-medium text-neutral-900 outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">Optional reserve estimate for 1099/self-employment liability</p>
          </div>

          {/* Results Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
            <div className="flex justify-between text-xs text-neutral-700">
              <span>Gross Commission:</span>
              <span className="font-semibold text-neutral-900">${grossCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-700">
              <span>Net After Split ({brokerSplitRate}%):</span>
              <span className="font-bold text-emerald-800">${netCommissionAfterSplit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Estimated Tax Reserve ({estimatedTaxRate}%):</span>
              <span>-${taxWithholdingReserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-emerald-200/80 pt-2 flex justify-between text-xs">
              <span className="font-bold text-neutral-800">Estimated Take-Home Compensation:</span>
              <span className="font-extrabold text-emerald-900 text-sm">
                ${takeHomeCompensation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <span>Convert to Work Record</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
