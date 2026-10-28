import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { WorkCommissionItem, CompensationPayment } from '../types/index.ts';

interface ReconciliationReportProps {
  isOpen: boolean;
  onClose: () => void;
  workItems: WorkCommissionItem[];
  payments: CompensationPayment[];
}

export const ReconciliationReport: React.FC<ReconciliationReportProps> = ({
  isOpen,
  onClose,
  workItems,
  payments,
}) => {
  if (!isOpen) return null;

  const totalContractVolume = workItems.reduce((acc, item) => acc + item.dealValue, 0);
  const totalAgreedCommission = workItems.reduce((acc, item) => acc + item.commissionAmount, 0);
  const totalReceived = workItems.reduce((acc, item) => acc + item.compensationReceived, 0);
  const outstandingShortfall = Math.max(0, totalAgreedCommission - totalReceived);
  const collectionPercentage = totalAgreedCommission > 0 
    ? Math.round((totalReceived / totalAgreedCommission) * 100) 
    : 100;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Client / Payer',
      'Deal / Project Title',
      'Category',
      'Contract Value ($)',
      'Commission Rate',
      'Agreed Commission ($)',
      'Compensation Received ($)',
      'Balance Shortfall ($)',
      'Due Date',
      'Status',
      'Invoice Ref'
    ];

    const rows = workItems.map((item) => {
      const shortfall = Math.max(0, item.commissionAmount - item.compensationReceived);
      const rateStr = item.commissionType === 'percentage' ? `${item.commissionRate}%` : 'Flat';
      return [
        `"${item.clientName.replace(/"/g, '""')}"`,
        `"${item.dealTitle.replace(/"/g, '""')}"`,
        item.dealType,
        item.dealValue,
        rateStr,
        item.commissionAmount,
        item.compensationReceived,
        shortfall,
        item.dueDate,
        item.status,
        `"${(item.invoiceRef || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Commission_Compensation_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl print:max-h-none print:shadow-none print:w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Commission &amp; Compensation Audit Statement
              </h3>
              <p className="text-xs text-neutral-500">
                Comprehensive reconciliation of contracts, earned commissions, and settled remittances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Statement
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Statement Printable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 print:p-8">
          {/* Printable Brand & Date Header */}
          <div className="border-b border-neutral-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  Commission Reconciliation Statement
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  Audit Verified
                </span>
              </div>
            </div>
          </div>

          {/* Financial High-Level Summary Metric Grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Work Contract Volume
              </span>
              <p className="mt-1 text-lg font-bold text-neutral-900">
                ${totalContractVolume.toLocaleString()}
              </p>
              <span className="text-[10px] text-neutral-400">{workItems.length} registered deals</span>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                Earned Commission
              </span>
              <p className="mt-1 text-lg font-bold text-blue-900">
                ${totalAgreedCommission.toLocaleString()}
              </p>
              <span className="text-[10px] text-blue-600">Contractually agreed</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Compensation Settled
              </span>
              <p className="mt-1 text-lg font-bold text-emerald-900">
                ${totalReceived.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700">{collectionPercentage}% collection efficiency</span>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-800">
                Compensation Shortfall
              </span>
              <p className="mt-1 text-lg font-bold text-red-900">
                ${outstandingShortfall.toLocaleString()}
              </p>
              <span className="text-[10px] text-red-600">Outstanding / in dispute</span>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Work Items &amp; Settlement Ledger
            </h4>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Payer / Client</th>
                    <th className="py-2.5 px-3">Deal Title</th>
                    <th className="py-2.5 px-3 text-right">Deal Value</th>
                    <th className="py-2.5 px-3 text-right">Commission</th>
                    <th className="py-2.5 px-3 text-right">Received</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {workItems.map((item) => {
                    const balance = Math.max(0, item.commissionAmount - item.compensationReceived);
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80">
                        <td className="py-2.5 px-3 font-medium text-neutral-900">
                          {item.clientName}
                          {item.invoiceRef && (
                            <span className="block text-[10px] text-neutral-400">Ref: {item.invoiceRef}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 max-w-xs truncate">
                          {item.dealTitle}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-600">
                          ${item.dealValue.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-neutral-900">
                          ${item.commissionAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                          ${item.compensationReceived.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                          {balance > 0 ? (
                            <span className="text-red-600">${balance.toLocaleString()}</span>
                          ) : (
                            <span className="text-emerald-700">$0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.status === 'fully_paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : item.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-neutral-50/80 font-bold text-xs border-t border-neutral-300">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-neutral-900">
                      Total Portfolio Reconciliation
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-900">
                      ${totalContractVolume.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-900">
                      ${totalAgreedCommission.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700">
                      ${totalReceived.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-red-600">
                      ${outstandingShortfall.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remittance History Box */}
          {payments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Settled Payment Log ({payments.length} payouts logged)
              </h4>
              <div className="space-y-2">
                {payments.map((p) => {
                  const item = workItems.find((w) => w.id === p.workId);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-neutral-900">${p.amount.toLocaleString()}</span>
                        <span className="text-neutral-500"> via {p.paymentMethod} on {p.paymentDate}</span>
                        {item && <span className="text-neutral-400"> for {item.dealTitle}</span>}
                      </div>
                      {p.referenceOrTransactionId && (
                        <span className="rounded bg-white px-2 py-0.5 text-[10px] font-mono text-neutral-600 border border-neutral-200">
                          {p.referenceOrTransactionId}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-neutral-100 bg-neutral-50 px-6 py-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
};
