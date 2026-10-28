import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  DollarSign, 
  Mail, 
  Plus, 
  BarChart3, 
  Calculator, 
  LogOut, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';

interface HeaderProps {
  user: User | null;
  hasToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onOpenGmailScanner: () => void;
  onOpenReport: () => void;
  onOpenCalculator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasToken,
  isLoggingIn,
  onLogin,
  onLogout,
  onOpenAddModal,
  onOpenGmailScanner,
  onOpenReport,
  onOpenCalculator,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
            <DollarSign className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-neutral-900">CommissionPay</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Compensation Hub
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Track work done, calculate commissions &amp; reconcile received compensation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Tools */}
          <button
            type="button"
            onClick={onOpenCalculator}
            title="Commission Calculator"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
          >
            <Calculator className="h-4 w-4 text-neutral-500" />
            <span className="hidden md:inline">Calculator</span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            title="Reconciliation Statement"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-neutral-500" />
            <span className="hidden md:inline">Audit Report</span>
          </button>

          {/* Add Work Item Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="font-semibold">Log Work / Deal</span>
          </button>

          {/* Gmail Status / Connect */}
          {user ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenGmailScanner}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                  title="Scan Gmail for Commission & Payout Advice"
                >
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span className="hidden sm:inline">Scan Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 p-1 pr-2.5 hover:bg-neutral-100 transition-colors"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[90px] truncate text-xs font-medium text-neutral-700">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </button>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {user.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Gmail Integration Active
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenGmailScanner();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <Mail className="h-4 w-4 text-neutral-500" />
                      Scan Gmail for Remittances
                    </button>
                    {!hasToken && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogin();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        <RefreshCw className="h-4 w-4 text-amber-500" />
                        Refresh Gmail Permissions
                      </button>
                    )}
                  </div>
                  <div className="border-t border-neutral-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <GoogleSignInButton
              onClick={onLogin}
              isLoading={isLoggingIn}
              label="Sign in with Google"
              className="py-1.5 px-3 text-xs"
            />
          )}
        </div>
      </div>
    </header>
  );
};
