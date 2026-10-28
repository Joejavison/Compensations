import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, DollarSign } from 'lucide-react';
import { WorkCommissionItem, CompensationPayment } from '../types/index.ts';

interface AnalyticsChartsProps {
  workItems: WorkCommissionItem[];
  payments: CompensationPayment[];
}

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ workItems, payments }) => {
  const [chartMode, setChartMode] = useState<'trends' | 'status'>('trends');

  // 1. Process Monthly Trends from workItems contractDate
  // Group by YYYY-MM
  const monthlyMap: { [key: string]: { month: string; earned: number; received: number; volume: number } } = {};

  workItems.forEach((item) => {
    const dateStr = item.contractDate || new Date().toISOString().split('T')[0];
    const monthKey = dateStr.substring(0, 7); // YYYY-MM
    
    // Format month label nicely e.g. "Aug 2026"
    const [year, monthNum] = monthKey.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthLabel = !isNaN(dateObj.getTime()) 
      ? dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      : monthKey;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        month: monthLabel,
        earned: 0,
        received: 0,
        volume: 0,
      };
    }
    monthlyMap[monthKey].earned += item.commissionAmount || 0;
    monthlyMap[monthKey].received += item.compensationReceived || 0;
    monthlyMap[monthKey].volume += item.dealValue || 0;
  });

  const monthlyTrendData = Object.keys(monthlyMap)
    .sort()
    .map((key) => monthlyMap[key]);

  // 2. Process Payment Status Breakdown
  const statusMap: { [key: string]: { name: string; value: number; amount: number; color: string } } = {
    fully_paid: { name: 'Fully Settled', value: 0, amount: 0, color: '#059669' },
    partially_paid: { name: 'Partially Paid', value: 0, amount: 0, color: '#3b82f6' },
    approved_unpaid: { name: 'Approved / Unpaid', value: 0, amount: 0, color: '#f59e0b' },
    overdue: { name: 'Overdue / Delinquent', value: 0, amount: 0, color: '#ef4444' },
    pending_approval: { name: 'Pending Approval', value: 0, amount: 0, color: '#8b5cf6' },
  };

  workItems.forEach((item) => {
    const isPastDue = new Date(item.dueDate) < new Date() && item.compensationReceived < item.commissionAmount;
    const statusKey = isPastDue && item.status !== 'fully_paid' ? 'overdue' : item.status;

    if (statusMap[statusKey]) {
      statusMap[statusKey].value += 1;
      statusMap[statusKey].amount += item.commissionAmount;
    } else {
      statusMap['approved_unpaid'].value += 1;
      statusMap['approved_unpaid'].amount += item.commissionAmount;
    }
  });

  const statusPieData = Object.values(statusMap).filter((item) => item.value > 0);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Commission Analytics &amp; Visualizations
            </h3>
            <p className="text-xs text-neutral-500">
              Interactive earnings trends, collection performance, and status distribution
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => setChartMode('trends')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              chartMode === 'trends'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            Monthly Trends
          </button>
          <button
            type="button"
            onClick={() => setChartMode('status')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              chartMode === 'status'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5 text-blue-600" />
            Status Breakdown
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="mt-6">
        {chartMode === 'trends' ? (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700">Monthly Commission Earnings vs. Compensation Received</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-600"></span> Earned Commission
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-blue-500"></span> Received Payout
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              {monthlyTrendData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  No monthly deal data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      tickFormatter={(val) => `$${val >= 1000 ? `${val / 1000}k` : val}`} 
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="earned" name="Earned Commission" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarned)" />
                    <Area type="monotone" dataKey="received" name="Compensation Received" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceived)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700">Portfolio Deal Count &amp; Commission Volume by Payment Status</span>
              <span>Total Deals: {workItems.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Donut / Pie Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, item: any) => [
                        `${value} deals (${formatCurrency(item.payload.amount)})`, 
                        item.payload.name
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend / Breakdown Details */}
              <div className="space-y-3">
                {statusPieData.map((item, idx) => {
                  const totalAmount = statusPieData.reduce((acc, curr) => acc + curr.amount, 0);
                  const pct = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{item.name}</p>
                          <p className="text-[11px] text-neutral-500">{item.value} {item.value === 1 ? 'deal' : 'deals'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-neutral-900">{formatCurrency(item.amount)}</p>
                        <p className="text-[11px] font-medium text-neutral-500">{pct}% of volume</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
