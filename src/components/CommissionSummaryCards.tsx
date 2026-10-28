import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Briefcase,
  ArrowUpRight 
} from 'lucide-react';
import { WorkCommissionItem } from '../types/index.ts';

interface SummaryCardsProps {
  items: WorkCommissionItem[];
  onFilterStatus?: (status: string) => void;
}

export const CommissionSummaryCards: React.FC<SummaryCardsProps> = ({ items, onFilterStatus }) => {
  const totalDealValue = items.reduce((sum, item) => sum + (item.dealValue || 0), 0);
  const totalAgreedCommission = items.reduce((sum, item) => sum + (item.commissionAmount || 0), 0);
  const totalCompensationReceived = items.reduce((sum, item) => sum + (item.compensationReceived || 0), 0);
  const totalOutstanding = Math.max(0, totalAgreedCommission - totalCompensationReceived);

  // Overdue count and amount
  const overdueItems = items.filter(
    (item) => item.status === 'overdue' || (new Date(item.dueDate) < new Date() && item.compensationReceived < item.commissionAmount)
  );
  const overdueAmount = overdueItems.reduce((sum, item) => sum + (item.commissionAmount - item.compensationReceived), 0);

  const collectionRate = totalAgreedCommission > 0 
    ? Math.round((totalCompensationReceived / totalAgreedCommission) * 100) 
    : 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Commission Earned */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Commission Earned
          </span>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-neutral-900">
            {formatCurrency(totalAgreedCommission)}
          </div>
          <p className="mt-1 flex items-center text-xs text-neutral-500">
            <Briefcase className="mr-1 h-3.5 w-3.5 text-neutral-400" />
            Across {items.length} deals ({formatCurrency(totalDealValue)} volume)
          </p>
        </div>
      </div>

      {/* 2. Compensation Received */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('fully_paid')}
        className="relative cursor-pointer overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs transition-all hover:bg-emerald-50/70 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Compensation Received
          </span>
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-emerald-900">
            {formatCurrency(totalCompensationReceived)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-emerald-700">
            <span>{collectionRate}% collection rate</span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-emerald-200">
              <div 
                className="h-full bg-emerald-600 transition-all duration-500" 
                style={{ width: `${Math.min(100, collectionRate)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pending / Outstanding */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('pending_approval')}
        className="relative cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Outstanding Balance
          </span>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-neutral-900">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="mt-1 flex items-center text-xs text-neutral-500">
            Awaiting payout / in schedule
          </p>
        </div>
      </div>

      {/* 4. Overdue Claims */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('overdue')}
        className={`relative cursor-pointer overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:shadow-md ${
          overdueAmount > 0 
            ? 'border-red-200 bg-red-50/50 hover:bg-red-50/80 text-red-900' 
            : 'border-neutral-200 bg-white text-neutral-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            overdueAmount > 0 ? 'text-red-700' : 'text-neutral-500'
          }`}>
            Overdue / Unpaid Claims
          </span>
          <div className={`rounded-lg p-2 ${
            overdueAmount > 0 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold tracking-tight ${overdueAmount > 0 ? 'text-red-700' : 'text-neutral-900'}`}>
            {formatCurrency(overdueAmount)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={overdueAmount > 0 ? 'font-medium text-red-600' : 'text-neutral-500'}>
              {overdueItems.length} {overdueItems.length === 1 ? 'deal' : 'deals'} overdue
            </span>
            {overdueAmount > 0 && (
              <span className="inline-flex items-center font-semibold text-red-700 underline underline-offset-2">
                Draft claim <ArrowUpRight className="ml-0.5 h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
