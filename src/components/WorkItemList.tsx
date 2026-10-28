import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Mail, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  FileCheck
} from 'lucide-react';
import { WorkCommissionItem, PaymentStatus } from '../types/index.ts';

interface WorkItemListProps {
  items: WorkCommissionItem[];
  onEdit: (item: WorkCommissionItem) => void;
  onDelete: (itemId: string) => void;
  onRecordPayment: (item: WorkCommissionItem) => void;
  onDraftClaimEmail: (item: WorkCommissionItem) => void;
  onScanForClient: (item: WorkCommissionItem) => void;
  currentFilter: string;
  onFilterChange: (status: string) => void;
}

export const WorkItemList: React.FC<WorkItemListProps> = ({
  items,
  onEdit,
  onDelete,
  onRecordPayment,
  onDraftClaimEmail,
  onScanForClient,
  currentFilter,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'commission' | 'dealValue' | 'contractDate'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Status Filter
    if (currentFilter !== 'all') {
      if (currentFilter === 'overdue') {
        const isPastDue = new Date(item.dueDate) < new Date() && item.compensationReceived < item.commissionAmount;
        if (item.status !== 'overdue' && !isPastDue) return false;
      } else if (currentFilter === 'unpaid') {
        if (item.status === 'fully_paid') return false;
      } else if (item.status !== currentFilter) {
        return false;
      }
    }

    // Category Filter
    if (categoryFilter !== 'all' && item.dealType !== categoryFilter) {
      return false;
    }

    // Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchClient = item.clientName.toLowerCase().includes(q);
      const matchTitle = item.dealTitle.toLowerCase().includes(q);
      const matchInv = item.invoiceRef?.toLowerCase().includes(q) || false;
      const matchNotes = item.notes?.toLowerCase().includes(q) || false;
      return matchClient || matchTitle || matchInv || matchNotes;
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'dueDate') {
      comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === 'contractDate') {
      comparison = new Date(a.contractDate).getTime() - new Date(b.contractDate).getTime();
    } else if (sortBy === 'commission') {
      comparison = a.commissionAmount - b.commissionAmount;
    } else if (sortBy === 'dealValue') {
      comparison = a.dealValue - b.dealValue;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusBadge = (item: WorkCommissionItem) => {
    const isPastDue = new Date(item.dueDate) < new Date() && item.compensationReceived < item.commissionAmount;
    const effectiveStatus = isPastDue && item.status !== 'fully_paid' ? 'overdue' : item.status;

    switch (effectiveStatus) {
      case 'fully_paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Fully Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3 w-3" /> Partially Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
            <AlertCircle className="h-3 w-3" /> Overdue
          </span>
        );
      case 'approved_unpaid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <FileCheck className="h-3 w-3" /> Approved
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
            In Dispute
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
            Pending Approval
          </span>
        );
    }
  };

  const formatDealType = (type: string) => {
    switch (type) {
      case 'deal_closing': return 'Sales Deal';
      case 'brokerage': return 'Brokerage / Real Estate';
      case 'consulting_milestone': return 'Consulting Milestone';
      case 'recruiting_placement': return 'Recruiting Placement';
      case 'affiliate_sales': return 'Affiliate / Referral';
      case 'service_retainer': return 'Service Retainer';
      default: return 'Contract Work';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtering Navigation & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'unpaid', label: 'Awaiting Compensation' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'fully_paid', label: 'Fully Settled' },
            { id: 'overdue', label: 'Overdue Claims' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                currentFilter === tab.id
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input & category filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search client, title, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 py-1.5 pl-8 pr-3 text-xs text-neutral-800 outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white py-1.5 px-2.5 text-xs text-neutral-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="deal_closing">Sales Deals</option>
            <option value="brokerage">Brokerage</option>
            <option value="consulting_milestone">Consulting</option>
            <option value="recruiting_placement">Recruiting</option>
            <option value="affiliate_sales">Affiliate</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-3">
              <DollarSign className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800">No work items found</h4>
            <p className="mt-1 text-xs text-neutral-500 max-w-sm">
              {searchTerm || currentFilter !== 'all'
                ? 'Try clearing your search query or status filter to see all recorded deals.'
                : 'Get started by recording your first completed work item, contract, or closed deal.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Client / Deal</th>
                  <th className="py-3.5 px-3">Contract Value</th>
                  <th className="py-3.5 px-3">Agreed Commission</th>
                  <th className="py-3.5 px-3">Compensation Received</th>
                  <th className="py-3.5 px-3">Outstanding Balance</th>
                  <th className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('dueDate');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-neutral-900"
                    >
                      Due Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {sortedItems.map((item) => {
                  const balance = Math.max(0, item.commissionAmount - item.compensationReceived);
                  const percentPaid = item.commissionAmount > 0 
                    ? Math.min(100, Math.round((item.compensationReceived / item.commissionAmount) * 100))
                    : 100;
                  const isPastDue = new Date(item.dueDate) < new Date() && balance > 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        isPastDue ? 'bg-red-50/15' : ''
                      }`}
                    >
                      {/* Deal & Client */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-xs text-neutral-900 leading-snug">
                          {item.dealTitle}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
                          <span className="font-medium text-neutral-700">{item.clientName}</span>
                          <span>•</span>
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                            {formatDealType(item.dealType)}
                          </span>
                        </div>
                        {item.invoiceRef && (
                          <div className="mt-1 text-[10px] text-neutral-400 font-mono">
                            Ref: {item.invoiceRef}
                          </div>
                        )}
                      </td>

                      {/* Deal Value */}
                      <td className="py-3 px-3 font-medium text-neutral-600">
                        ${item.dealValue.toLocaleString()}
                      </td>

                      {/* Agreed Commission */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900">
                          ${item.commissionAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {item.commissionType === 'percentage' ? `${item.commissionRate}% commission` : 'Flat fee'}
                        </div>
                      </td>

                      {/* Compensation Received */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-emerald-700">
                          ${item.compensationReceived.toLocaleString()}
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                            <div 
                              className={`h-full ${percentPaid === 100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-500">{percentPaid}%</span>
                        </div>
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3 px-3">
                        {balance > 0 ? (
                          <span className={`font-bold ${isPastDue ? 'text-red-600' : 'text-neutral-900'}`}>
                            ${balance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600">Paid in Full</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-neutral-600">
                        <span className={isPastDue ? 'font-bold text-red-600' : ''}>
                          {item.dueDate}
                        </span>
                        {isPastDue && (
                          <span className="block text-[10px] font-semibold text-red-500">Overdue</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(item)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {balance > 0 && (
                            <button
                              type="button"
                              onClick={() => onRecordPayment(item)}
                              title="Record received compensation"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Pay
                            </button>
                          )}

                          {balance > 0 && (
                            <button
                              type="button"
                              onClick={() => onDraftClaimEmail(item)}
                              title="Send claim inquiry email via Gmail"
                              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5 text-blue-600" />
                              Claim
                            </button>
                          )}

                          {/* More dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg z-20 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onScanForClient(item);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                                >
                                  <Search className="h-3.5 w-3.5 text-emerald-600" />
                                  Scan Gmail for Payer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onEdit(item);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-neutral-500" />
                                  Edit Deal Details
                                </button>
                                <div className="my-1 border-t border-neutral-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (window.confirm(`Delete "${item.dealTitle}" from commission tracking?`)) {
                                      onDelete(item.id);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete Record
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
