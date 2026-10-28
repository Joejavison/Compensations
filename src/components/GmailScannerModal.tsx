import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Mail, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import { GmailEmailRecord, WorkCommissionItem } from '../types/index.ts';
import { searchGmailMessages } from '../lib/gmailService.ts';

interface GmailScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItems: WorkCommissionItem[];
  onSelectPaymentFromEmail: (email: GmailEmailRecord, matchedWorkItem?: WorkCommissionItem, amount?: number) => void;
  onCreateWorkFromEmail: (email: GmailEmailRecord, detectedAmount?: number) => void;
  hasToken: boolean;
  onLogin: () => void;
}

const PRESET_QUERIES = [
  { label: 'All Commissions & Payouts', query: 'commission OR payout OR remittance OR "payment advice" OR "direct deposit"' },
  { label: 'Remittance Advices', query: 'remittance OR "settlement statement" OR "earnings statement"' },
  { label: 'Wire & ACH Receipts', query: '"wire transfer" OR "ACH transfer" OR "deposit confirmation"' },
  { label: 'Invoices & Settlements', query: 'subject:(commission OR invoice OR payout)' },
];

export const GmailScannerModal: React.FC<GmailScannerModalProps> = ({
  isOpen,
  onClose,
  workItems,
  onSelectPaymentFromEmail,
  onCreateWorkFromEmail,
  hasToken,
  onLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState(PRESET_QUERIES[0].query);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GmailEmailRecord[]>([]);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && hasToken && !searchedOnce) {
      handleSearch(searchQuery);
    }
  }, [isOpen, hasToken]);

  if (!isOpen) return null;

  const handleSearch = async (queryToRun: string) => {
    if (!hasToken) {
      return;
    }
    setIsSearching(true);
    setErrorMessage(null);
    setSearchedOnce(true);

    try {
      const emails = await searchGmailMessages(queryToRun, 15);
      setResults(emails);
    } catch (err: unknown) {
      console.error('Failed to search Gmail:', err);
      const msg = err instanceof Error ? err.message : 'Failed to search Gmail';
      setErrorMessage(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Find best work item match for an email based on sender/client name or subject
  const findMatchingWorkItem = (email: GmailEmailRecord): WorkCommissionItem | undefined => {
    const textToMatch = `${email.from} ${email.subject} ${email.snippet}`.toLowerCase();
    return workItems.find((item) => {
      const clientMatch = item.clientName && textToMatch.includes(item.clientName.toLowerCase());
      const emailMatch = item.clientEmail && textToMatch.includes(item.clientEmail.toLowerCase());
      const invMatch = item.invoiceRef && textToMatch.includes(item.invoiceRef.toLowerCase());
      return clientMatch || emailMatch || invMatch;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex h-[88vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">
                  Gmail Commission &amp; Remittance Scanner
                </h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Scan your mailbox to match compensation advice, remittances, and payouts to your work items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col overflow-hidden px-6 py-4">
          {!hasToken ? (
            <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Mail className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-base font-bold text-neutral-900">
                Sign in with Google to Scan Gmail
              </h4>
              <p className="mt-1 max-w-sm text-xs text-neutral-500">
                Connect your Google account to automatically locate payment remittance emails, calculate received compensation, and resolve overdue commission claims.
              </p>
              <button
                type="button"
                onClick={onLogin}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                Connect Gmail Account
              </button>
            </div>
          ) : (
            <>
              {/* Search Bar & Quick Filters */}
              <div className="space-y-2.5 pb-3">
                <div className="flex gap-2">
                  <div className="relative flex flex-1 items-center rounded-xl border border-neutral-300 bg-white px-3 py-2 shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                    <Search className="mr-2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search Gmail for commission statements, invoice numbers, or client names..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                      className="w-full text-xs text-neutral-800 outline-none placeholder:text-neutral-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearch(searchQuery)}
                    disabled={isSearching}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span>Search</span>
                  </button>
                </div>

                {/* Preset filter pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-neutral-400">Presets:</span>
                  {PRESET_QUERIES.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(item.query);
                        handleSearch(item.query);
                      }}
                      className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                        searchQuery === item.query
                          ? 'bg-emerald-100 font-semibold text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Search Results List */}
              <div className="flex-1 overflow-y-auto pr-1">
                {isSearching ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 text-neutral-400">
                    <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
                    <p className="text-xs font-medium">Scanning Gmail for commission records &amp; payments...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 p-8 text-center text-neutral-500">
                    <Mail className="h-8 w-8 text-neutral-300 mb-2" />
                    <p className="text-sm font-semibold text-neutral-700">
                      {searchedOnce ? 'No matching emails found' : 'Ready to scan Gmail'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400 max-w-sm">
                      {searchedOnce 
                        ? 'Try adjusting your search keywords or search for a specific invoice number or payer name.'
                        : 'Click "Search" above to scan your Gmail inbox for payout notices and remittance statements.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                      <span>Found {results.length} relevant emails in your inbox</span>
                      <span>Amounts detected automatically</span>
                    </div>

                    {results.map((email) => {
                      const matchedWork = findMatchingWorkItem(email);
                      const primaryAmount = email.detectedAmounts[0];

                      return (
                        <div
                          key={email.id}
                          className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-neutral-900 truncate">
                                  {email.from.replace(/<.*>/, '').trim() || email.from}
                                </span>
                                <span className="text-[11px] text-neutral-400">•</span>
                                <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {email.date}
                                </span>
                              </div>

                              <h4 className="mt-1 text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                                {email.subject}
                              </h4>

                              <p className="mt-1 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                {email.snippet}
                              </p>

                              {/* Detected Tags & Entities */}
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                {email.detectedAmounts.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-semibold text-neutral-400">Detected:</span>
                                    {email.detectedAmounts.map((amt, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                                      >
                                        ${amt.toLocaleString()}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {email.detectedRef && (
                                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                                    <Tag className="mr-1 h-3 w-3 text-neutral-400" />
                                    {email.detectedRef}
                                  </span>
                                )}

                                {matchedWork && (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                    Matches: {matchedWork.dealTitle}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons for this Email */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {matchedWork ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectPaymentFromEmail(email, matchedWork, primaryAmount);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                  Log Payout (${primaryAmount ? primaryAmount.toLocaleString() : 'Custom'})
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectPaymentFromEmail(email, undefined, primaryAmount);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  Match to Work Item
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  onCreateWorkFromEmail(email, primaryAmount);
                                  onClose();
                                }}
                                className="text-[11px] font-medium text-neutral-500 hover:text-emerald-700 flex items-center gap-0.5"
                              >
                                Create Work Record <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-6 py-3 text-xs text-neutral-500">
          <span>Encrypted client-side connection directly with Gmail API</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
