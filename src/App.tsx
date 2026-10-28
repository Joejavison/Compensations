/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout as fbLogout, 
  getAccessToken 
} from './lib/firebase.ts';
import { 
  getStoredWorkItems, 
  saveStoredWorkItems, 
  getStoredPayments, 
  saveStoredPayments 
} from './lib/storage.ts';
import { 
  WorkCommissionItem, 
  CompensationPayment, 
  GmailEmailRecord 
} from './types/index.ts';

// Components
import { Header } from './components/Header.tsx';
import { CommissionSummaryCards } from './components/CommissionSummaryCards.tsx';
import { WorkItemList } from './components/WorkItemList.tsx';
import { WorkItemModal } from './components/WorkItemModal.tsx';
import { RecordPaymentModal } from './components/RecordPaymentModal.tsx';
import { SendCompensationClaimModal } from './components/SendCompensationClaimModal.tsx';
import { GmailScannerModal } from './components/GmailScannerModal.tsx';
import { ReconciliationReport } from './components/ReconciliationReport.tsx';
import { CommissionCalculatorModal } from './components/CommissionCalculatorModal.tsx';
import { AnalyticsCharts } from './components/AnalyticsCharts.tsx';
import { GoogleSignInButton } from './components/GoogleSignInButton.tsx';

import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  FileSpreadsheet,
  Calculator,
  Search
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data state
  const [workItems, setWorkItems] = useState<WorkCommissionItem[]>([]);
  const [payments, setPayments] = useState<CompensationPayment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkCommissionItem | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentItem, setActivePaymentItem] = useState<WorkCommissionItem | null>(null);
  const [paymentPrefillAmount, setPaymentPrefillAmount] = useState<number | undefined>();
  const [paymentPrefillRef, setPaymentPrefillRef] = useState<string | undefined>();
  const [paymentPrefillSubject, setPaymentPrefillSubject] = useState<string | undefined>();
  const [paymentPrefillEmailId, setPaymentPrefillEmailId] = useState<string | undefined>();

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimWorkItem, setClaimWorkItem] = useState<WorkCommissionItem | null>(null);

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

  // Success notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initialize Auth listener and stored data
  useEffect(() => {
    // Load local storage
    const storedItems = getStoredWorkItems();
    setWorkItems(storedItems);

    const storedPays = getStoredPayments();
    setPayments(storedPays);

    // Init Firebase Auth
    const unsubscribe = initAuth(
      async (loggedInUser, token) => {
        setUser(loggedInUser);
        if (token) {
          setHasToken(true);
        } else {
          const currentToken = await getAccessToken();
          setHasToken(!!currentToken);
        }
      },
      () => {
        setUser(null);
        setHasToken(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setHasToken(true);
        showToast(`Connected as ${res.user.displayName || res.user.email}! Gmail enabled.`);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fbLogout();
    setUser(null);
    setHasToken(false);
    showToast('Signed out of Google account.');
  };

  // Work Items CRUD
  const handleSaveWorkItem = (data: Partial<WorkCommissionItem>) => {
    if (editingItem) {
      // Update
      const updated = workItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      setWorkItems(updated);
      saveStoredWorkItems(updated);
      showToast('Work & commission item updated.');
    } else {
      // Create new
      const newItem: WorkCommissionItem = {
        id: `work-${Date.now()}`,
        clientName: data.clientName || 'Client',
        clientEmail: data.clientEmail || '',
        dealTitle: data.dealTitle || 'New Deal',
        dealType: data.dealType || 'deal_closing',
        dealValue: data.dealValue || 0,
        commissionType: data.commissionType || 'percentage',
        commissionRate: data.commissionRate,
        commissionAmount: data.commissionAmount || 0,
        compensationReceived: 0,
        contractDate: data.contractDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || new Date().toISOString().split('T')[0],
        status: data.status || 'approved_unpaid',
        invoiceRef: data.invoiceRef,
        paymentMethod: data.paymentMethod || 'Direct Deposit / ACH',
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...workItems];
      setWorkItems(updated);
      saveStoredWorkItems(updated);
      showToast('Work deal registered for commission tracking.');
    }
    setEditingItem(null);
  };

  const handleDeleteWorkItem = (id: string) => {
    const updated = workItems.filter((item) => item.id !== id);
    setWorkItems(updated);
    saveStoredWorkItems(updated);
    showToast('Record removed.');
  };

  // Record Payment
  const handleRecordPayment = (
    paymentData: Omit<CompensationPayment, 'id'>,
    newStatus: WorkCommissionItem['status']
  ) => {
    const newPayment: CompensationPayment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    saveStoredPayments(updatedPayments);

    // Update the work item's received compensation & status
    const updatedItems = workItems.map((item) => {
      if (item.id === paymentData.workId) {
        const newReceived = (item.compensationReceived || 0) + paymentData.amount;
        return {
          ...item,
          compensationReceived: newReceived,
          status: newStatus,
          lastPaymentDate: paymentData.paymentDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setWorkItems(updatedItems);
    saveStoredWorkItems(updatedItems);
    showToast(`Payment of $${paymentData.amount.toLocaleString()} logged successfully!`);
  };

  // Email Sent callback
  const handleClaimEmailSent = (workItemId: string, emailSubject: string) => {
    const updated = workItems.map((item) => {
      if (item.id === workItemId) {
        return {
          ...item,
          notes: `${item.notes ? item.notes + '\n' : ''}[Claim Inquiry Sent on ${new Date().toLocaleDateString()}: "${emailSubject}"]`,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    setWorkItems(updated);
    saveStoredWorkItems(updated);
    showToast('Compensation claim inquiry sent and logged!');
  };

  // Handle Match from Gmail Scanner to Payment Modal
  const handleSelectPaymentFromEmail = (
    email: GmailEmailRecord,
    matchedWorkItem?: WorkCommissionItem,
    amount?: number
  ) => {
    const targetItem = matchedWorkItem || workItems[0];
    if (targetItem) {
      setActivePaymentItem(targetItem);
      setPaymentPrefillAmount(amount);
      setPaymentPrefillRef(email.detectedRef);
      setPaymentPrefillSubject(email.subject);
      setPaymentPrefillEmailId(email.id);
      setIsPaymentModalOpen(true);
    }
  };

  // Handle Create Work Item directly from Gmail Remittance
  const handleCreateWorkFromEmail = (email: GmailEmailRecord, detectedAmount?: number) => {
    const senderClean = email.from.replace(/<.*>/, '').trim();
    setEditingItem({
      id: '',
      clientName: senderClean || 'Client from Gmail',
      clientEmail: email.from.match(/<([^>]+)>/)?.[1] || '',
      dealTitle: email.subject.replace(/^(re:|fwd:)\s*/i, '').trim(),
      dealType: 'deal_closing',
      dealValue: (detectedAmount || 1000) * 10,
      commissionType: 'percentage',
      commissionRate: 10,
      commissionAmount: detectedAmount || 1000,
      compensationReceived: 0,
      contractDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: 'approved_unpaid',
      invoiceRef: email.detectedRef,
      notes: `Imported from Gmail: "${email.subject}"\nSnippet: ${email.snippet}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsWorkModalOpen(true);
  };

  // Calculator applied to new deal
  const handleApplyCalculatorToNewDeal = (
    dealValue: number,
    commissionRate: number,
    commissionAmount: number
  ) => {
    setEditingItem({
      id: '',
      clientName: '',
      clientEmail: '',
      dealTitle: 'New Contract Deal',
      dealType: 'deal_closing',
      dealValue,
      commissionType: 'percentage',
      commissionRate,
      commissionAmount,
      compensationReceived: 0,
      contractDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'approved_unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsWorkModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 font-sans text-neutral-900 antialiased selection:bg-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        user={user}
        hasToken={hasToken}
        isLoggingIn={isLoggingIn}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsWorkModalOpen(true);
        }}
        onOpenGmailScanner={() => setIsScannerModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Auth Error Banner if present */}
        {authError && (
          <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-red-500 hover:text-red-800 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero / Google Integration Prompt Banner (when not connected) */}
        {!user && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Google Workspace &amp; Gmail Integrated</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-white">
                  Paid on commission? Ensure you receive every dollar of compensation owed.
                </h2>
                <p className="text-xs text-emerald-100 leading-relaxed max-w-xl">
                  Connect your Gmail account to scan payout notifications, auto-extract remittance amounts and invoice IDs, reconcile earned commissions, and send professional compensation inquiry claims for overdue balances.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <GoogleSignInButton
                  onClick={handleGoogleLogin}
                  isLoading={isLoggingIn}
                  label="Sign in with Google to Connect Gmail"
                  className="shadow-md"
                />
              </div>
            </div>

            {/* Subtle decorative background glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>
        )}

        {/* Connected Gmail Quick Strip (when connected) */}
        {user && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-emerald-900">Gmail Connected: </span>
                <span className="text-emerald-800 font-medium">{user.email}</span>
                <span className="ml-2 text-emerald-600 hidden md:inline">
                  • Ready to scan remittances &amp; dispatch compensation claims
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                Scan Gmail for Remittances
              </button>
            </div>
          </div>
        )}

        {/* Overview Metric Cards */}
        <CommissionSummaryCards
          items={workItems}
          onFilterStatus={(status) => setFilterStatus(status)}
        />

        {/* Analytics Visualizations */}
        <AnalyticsCharts
          workItems={workItems}
          payments={payments}
        />

        {/* Core Work Item Grid & Deals Table */}
        <WorkItemList
          items={workItems}
          currentFilter={filterStatus}
          onFilterChange={(status) => setFilterStatus(status)}
          onEdit={(item) => {
            setEditingItem(item);
            setIsWorkModalOpen(true);
          }}
          onDelete={handleDeleteWorkItem}
          onRecordPayment={(item) => {
            setActivePaymentItem(item);
            setPaymentPrefillAmount(undefined);
            setPaymentPrefillRef(undefined);
            setPaymentPrefillSubject(undefined);
            setPaymentPrefillEmailId(undefined);
            setIsPaymentModalOpen(true);
          }}
          onDraftClaimEmail={(item) => {
            if (!user || !hasToken) {
              handleGoogleLogin();
              return;
            }
            setClaimWorkItem(item);
            setIsClaimModalOpen(true);
          }}
          onScanForClient={(item) => {
            if (!user || !hasToken) {
              handleGoogleLogin();
              return;
            }
            setIsScannerModalOpen(true);
          }}
        />
      </main>

      {/* Modals */}
      <WorkItemModal
        isOpen={isWorkModalOpen}
        onClose={() => {
          setIsWorkModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveWorkItem}
        editingItem={editingItem}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setActivePaymentItem(null);
        }}
        workItem={activePaymentItem}
        onRecordPayment={handleRecordPayment}
        prefillAmount={paymentPrefillAmount}
        prefillRef={paymentPrefillRef}
        prefillEmailSubject={paymentPrefillSubject}
        prefillEmailId={paymentPrefillEmailId}
      />

      <SendCompensationClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimWorkItem(null);
        }}
        workItem={claimWorkItem}
        userEmail={user?.email}
        onEmailSent={handleClaimEmailSent}
      />

      <GmailScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        workItems={workItems}
        onSelectPaymentFromEmail={handleSelectPaymentFromEmail}
        onCreateWorkFromEmail={handleCreateWorkFromEmail}
        hasToken={hasToken}
        onLogin={handleGoogleLogin}
      />

      <ReconciliationReport
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        workItems={workItems}
        payments={payments}
      />

      <CommissionCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        onApplyToNewDeal={handleApplyCalculatorToNewDeal}
      />
    </div>
  );
}
