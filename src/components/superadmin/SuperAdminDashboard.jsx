import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  Legend,
} from 'recharts'
import { Card, Pill } from '../ui/Card'
import { ClearableInput } from '../ui/ClearableInput'
import { StatusBadge } from '../ui/StatusBadge'
import { fmtPKR } from '../../utils/helpers'
import { fetchAdminDashboardSummary } from '../../api/adminApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

const ADMIN_DASHBOARD_NAV_KEY = 'assanpay:admin-dashboard-nav'

const DASHBOARD_MOCK_BY_PRESET = {
  today: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 18,
    activeMerchants: 17,
    blockedMerchants: 1,
    totalSubMerchants: 32,
    totalUsers: 54,
    totalPayments: 684,
    successfulPayments: 662,
    failedPayments: 22,
    totalPaymentVolume: 1254900,
    totalSettlements: 4,
    dueSettlementAmount: 188000,
    totalRefunds: 3,
  },
  yesterday: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 18,
    activeMerchants: 17,
    blockedMerchants: 1,
    totalSubMerchants: 32,
    totalUsers: 53,
    totalPayments: 602,
    successfulPayments: 585,
    failedPayments: 17,
    totalPaymentVolume: 1123400,
    totalSettlements: 3,
    dueSettlementAmount: 142000,
    totalRefunds: 4,
  },
  last7: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 18,
    activeMerchants: 17,
    blockedMerchants: 1,
    totalSubMerchants: 32,
    totalUsers: 54,
    totalPayments: 4320,
    successfulPayments: 4180,
    failedPayments: 140,
    totalPaymentVolume: 8654096,
    totalSettlements: 18,
    dueSettlementAmount: 690000,
    totalRefunds: 21,
  },
  last30: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 18,
    activeMerchants: 16,
    blockedMerchants: 2,
    totalSubMerchants: 32,
    totalUsers: 58,
    totalPayments: 18650,
    successfulPayments: 17940,
    failedPayments: 710,
    totalPaymentVolume: 35840960,
    totalSettlements: 72,
    dueSettlementAmount: 1240000,
    totalRefunds: 96,
  },
  thisMonth: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 19,
    activeMerchants: 17,
    blockedMerchants: 2,
    totalSubMerchants: 35,
    totalUsers: 60,
    totalPayments: 15240,
    successfulPayments: 14680,
    failedPayments: 560,
    totalPaymentVolume: 29650120,
    totalSettlements: 58,
    dueSettlementAmount: 980000,
    totalRefunds: 74,
  },
  lastMonth: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 17,
    activeMerchants: 16,
    blockedMerchants: 1,
    totalSubMerchants: 30,
    totalUsers: 52,
    totalPayments: 16480,
    successfulPayments: 15820,
    failedPayments: 660,
    totalPaymentVolume: 31278000,
    totalSettlements: 61,
    dueSettlementAmount: 880000,
    totalRefunds: 82,
  },
  all: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 22,
    activeMerchants: 20,
    blockedMerchants: 2,
    totalSubMerchants: 41,
    totalUsers: 68,
    totalPayments: 55280,
    successfulPayments: 53110,
    failedPayments: 2170,
    totalPaymentVolume: 109245320,
    totalSettlements: 210,
    dueSettlementAmount: 2120000,
    totalRefunds: 240,
  },
  custom: {
    scope: 'SYSTEM',
    merchantId: null,
    totalMerchants: 18,
    activeMerchants: 17,
    blockedMerchants: 1,
    totalSubMerchants: 32,
    totalUsers: 54,
    totalPayments: 1280,
    successfulPayments: 1230,
    failedPayments: 50,
    totalPaymentVolume: 2549010,
    totalSettlements: 6,
    dueSettlementAmount: 220000,
    totalRefunds: 6,
  },
}

const METRIC_CARDS = [
  { key: 'totalMerchants', label: 'Total Merchants' },
  { key: 'activeMerchants', label: 'Active Merchants' },
  { key: 'blockedMerchants', label: 'Blocked Merchants' },
  { key: 'totalSubMerchants', label: 'Total Sub-Merchants' },
  { key: 'totalUsers', label: 'Total Users' },
  { key: 'totalPayments', label: 'Total Payments' },
  { key: 'successfulPayments', label: 'Successful Payments' },
  { key: 'failedPayments', label: 'Failed Payments' },
  { key: 'totalPaymentVolume', label: 'Total Payment Volume', format: 'currency' },
  { key: 'totalSettlements', label: 'Total Settlements' },
  { key: 'dueSettlementAmount', label: 'Due Settlement Amount', format: 'currency' },
  { key: 'unsettledSuccessfulPayments', label: 'Unsettled Successful Payments' },
  { key: 'totalRefunds', label: 'Total Refunds' },
]

const SPARKLINES = {
  totalMerchants: [12, 13, 14, 16, 17, 18, 18, 19],
  activeMerchants: [11, 12, 13, 15, 16, 17, 17, 17],
  blockedMerchants: [1, 1, 1, 1, 2, 2, 2, 2],
  totalSubMerchants: [24, 26, 28, 30, 31, 32, 33, 35],
  totalUsers: [40, 45, 48, 50, 54, 56, 58, 60],
  totalPayments: [3200, 4100, 3800, 4500, 5200, 6100, 5700, 6400],
  successfulPayments: [3000, 3900, 3600, 4300, 5000, 5900, 5500, 6200],
  failedPayments: [200, 220, 240, 200, 220, 200, 200, 200],
  totalPaymentVolume: [6200000, 7100000, 6800000, 7800000, 8400000, 9100000, 8800000, 9600000],
  totalSettlements: [10, 14, 16, 18, 20, 22, 24, 26],
  dueSettlementAmount: [480000, 520000, 560000, 600000, 680000, 720000, 760000, 820000],
  totalRefunds: [12, 14, 16, 18, 20, 22, 24, 26],
}

const OVERVIEW_STATUS_OPTIONS = [
  { key: 'total', label: 'Total', color: 'var(--color-accent)' },
  { key: 'all', label: 'All Statuses', color: 'var(--color-accent)' },
  { key: 'success', label: 'Success', color: 'var(--color-success)' },
  { key: 'initiated', label: 'Initiated', color: 'var(--color-accent-hover)' },
  { key: 'pending', label: 'Pending', color: 'var(--color-warning)' },
  { key: 'failed', label: 'Failed', color: 'var(--color-danger)' },
]

const STATUS_STACK_SERIES = [
  { key: 'successCount', label: 'Success', color: 'var(--color-success)' },
  { key: 'initiatedCount', label: 'Initiated', color: 'var(--color-accent-hover)' },
  { key: 'pendingCount', label: 'Pending', color: 'var(--color-warning)' },
  { key: 'failedCount', label: 'Failed', color: 'var(--color-danger)' },
  { key: 'otherCount', label: 'Other', color: 'var(--color-text-muted)' },
]

const setAdminDashboardNavigation = (page, filters = {}) => {
  try {
    localStorage.setItem(ADMIN_DASHBOARD_NAV_KEY, JSON.stringify({ page, filters }))
  } catch {
    // ignore storage errors
  }
  window.location.hash = page
}

function Sparkline({ data, tone = 'good' }) {
  const stroke = tone === 'bad' ? 'var(--color-danger)' : tone === 'warn' ? 'var(--color-warning)' : 'var(--color-success)'
  const fill = tone === 'bad' ? 'rgba(248,113,113,0.18)' : tone === 'warn' ? 'rgba(251,191,36,0.18)' : 'rgba(34,197,94,0.18)'
  const chartData = data.map((v, i) => ({ i, v }))

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} fill={fill} />
          <XAxis dataKey="i" hide />
          <YAxis hide />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendPill({ value }) {
  const tone = value >= 0 ? 'good' : 'bad'
  const label = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  return <Pill tone={tone}>{label}</Pill>
}

export function DashboardKpis() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
      <Card
        title="Payments (Today)"
        right={<StatusBadge status="ACTIVE" />}
      >
        <div className="text-2xl font-semibold leading-tight break-words">Rs 1,245,900</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Count: 1,284</Pill>
          <Pill tone="good">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(47,208,122,0.95)]" />
            +8.4%
          </Pill>
        </div>
      </Card>

      <Card
        title="Refunds (Today)"
        right={<StatusBadge status="REVIEW" />}
      >
        <div className="text-2xl font-semibold leading-tight break-words">Rs 34,200</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Count: 12</Pill>
          <Pill tone="warn">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,204,102,0.95)]" />
            +1.1%
          </Pill>
        </div>
      </Card>

      <Card
        title="Pending Settlements"
        right={<StatusBadge status="PENDING" />}
      >
        <div className="text-2xl font-semibold leading-tight break-words">Rs 412,800</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Merchants: 9</Pill>
          <Pill tone="warn">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,204,102,0.95)]" />
            Due
          </Pill>
        </div>
      </Card>

      <Card
        title="Blocked Merchants"
        right={<StatusBadge status="RISK" />}
      >
        <div className="text-2xl font-semibold leading-tight break-words">3</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Total: 128</Pill>
          <Pill tone="bad">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,90,122,0.95)]" />
            High Risk
          </Pill>
        </div>
      </Card>
    </div>
  )
}

export function DashboardInsights({ dateLabel, datePreset, trendDataOverride, dashboardMetrics }) {
  const [trendChartType, setTrendChartType] = useState('area')
  const [successChartType, setSuccessChartType] = useState('pie')
  const [trendCollapsed, setTrendCollapsed] = useState(false)
  const [successCollapsed, setSuccessCollapsed] = useState(false)
  const trendData = Array.isArray(trendDataOverride) && trendDataOverride.length > 0
    ? trendDataOverride
    : []
  const trendDataEmpty = trendData.length === 0
  const trendSeries = useMemo(
    () => trendData.map((row) => {
      const successRate = Number.isFinite(row.success) ? Math.max(0, Math.min(1, Number(row.success))) : 0
      const transactions = Number(row.transactions) || 0
      return {
        ...row,
        successRate: successRate * 100,
        successCount: Math.round(transactions * successRate),
        failedCount: Math.max(0, transactions - Math.round(transactions * successRate)),
      }
    }),
    [trendData]
  )
  const alerts = (() => {
    const rows = []
    const dueSettlementAmount = Number(dashboardMetrics?.dueSettlementAmount ?? 0)
    const blockedMerchants = Number(dashboardMetrics?.blockedMerchants ?? 0)
    const totalRefunds = Number(dashboardMetrics?.totalRefunds ?? 0)
    const totalPayments = Number(dashboardMetrics?.totalPayments ?? 0)
    const refundRate = totalPayments > 0 ? (totalRefunds / totalPayments) : 0

    if (Number.isFinite(dueSettlementAmount) && dueSettlementAmount > 0) {
      rows.push({
        type: 'Settlement Overdue',
        status: 'PENDING',
        detail: `Due ${fmtPKR(dueSettlementAmount)}`,
      })
    }

    if (Number.isFinite(refundRate) && refundRate >= 0.03 && totalRefunds > 0) {
      rows.push({
        type: 'High Refund Rate',
        status: 'RISK',
        detail: `${(refundRate * 100).toFixed(2)}%`,
      })
    }

    if (Number.isFinite(blockedMerchants) && blockedMerchants > 0) {
      rows.push({
        type: 'Blocked Merchant',
        status: 'BLOCKED',
        detail: `Merchants: ${blockedMerchants}`,
      })
    }

    return rows
  })()
  const alertCount = alerts.length
  const trendTotal = trendData.reduce((acc, row) => acc + row.transactions, 0)
  const avgTicket = Math.round(trendTotal / Math.max(1, trendData.length))
  const peakWeek = trendData.length
    ? trendData.reduce(
      (best, row) => (row.transactions > best.transactions ? row : best),
      trendData[0]
    )
    : { label: '-' }
  const successRate = (() => {
    const total = Number(dashboardMetrics?.totalPayments ?? 0)
    const success = Number(dashboardMetrics?.successfulPayments ?? 0)
    if (!Number.isFinite(total) || total <= 0) return 0
    if (!Number.isFinite(success) || success < 0) return 0
    const raw = (success / total) * 100
    const clamped = Math.max(0, Math.min(100, raw))
    return Math.round(clamped * 10) / 10
  })()
  const hasSuccessData = Number(dashboardMetrics?.totalPayments ?? 0) > 0
  const successPct = successRate
  const failedPct = Math.max(0, Math.round((100 - successRate) * 10) / 10)
  const successChart = [
    { name: 'Success', value: successPct, color: 'var(--color-success)' },
    { name: 'Failed', value: failedPct, color: 'var(--color-danger)' },
  ]
  const trendTotalLabel = trendDataEmpty ? '—' : trendTotal.toLocaleString()
  const avgTicketLabel = trendDataEmpty ? '—' : avgTicket.toLocaleString()
  const peakWeekLabel = trendDataEmpty ? '—' : peakWeek.label
  const successRateLabel = hasSuccessData ? `${successRate.toFixed(1)}%` : '—'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 w-full">
      <div className="xl:col-span-8">
        <Card
          title="Transaction Trend"
          className="bg-gradient-to-br from-[var(--color-bg-secondary)]/90 via-[var(--color-bg-primary)]/85 to-[var(--color-bg-primary)] border-[var(--color-border-soft)]"
          right={(
            <div className="flex items-center gap-2">
              <Pill>{dateLabel}</Pill>
              <select
                className="h-7 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-[11px] text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={trendChartType}
                onChange={(e) => setTrendChartType(e.target.value)}
              >
                <option value="area" className="bg-[var(--color-bg-primary)]">Area</option>
                <option value="bar" className="bg-[var(--color-bg-primary)]">Bar</option>
                <option value="line" className="bg-[var(--color-bg-primary)]">Line</option>
                <option value="stacked" className="bg-[var(--color-bg-primary)]">Stacked</option>
                <option value="composed" className="bg-[var(--color-bg-primary)]">Composed</option>
              </select>
              <button
                type="button"
                aria-label={trendCollapsed ? 'Expand chart' : 'Collapse chart'}
                className="h-7 w-7 grid place-items-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition shrink-0 relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setTrendCollapsed((prev) => !prev)
                }}
              >
                {trendCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          )}
        >
          {!trendCollapsed ? (
            <>
              {trendDataEmpty ? (
                <div className="h-[220px] sm:h-[280px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-secondary)]/70 grid place-items-center">
                  No chart data for selected range.
                </div>
              ) : (
                <div className="h-[220px] sm:h-[280px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {trendChartType === 'bar' ? (
                      <BarChart data={trendSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis dataKey="label" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={36} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-chart-tooltip-border)',
                            borderRadius: 12,
                            color: 'var(--color-text-primary)',
                          }}
                          labelStyle={{ color: 'var(--color-text-secondary)' }}
                          formatter={(value, name) => {
                            if (name === 'successRate') return [`${Math.round(Number(value))}%`, 'Success']
                            return [Number(value).toLocaleString(), 'Transactions']
                          }}
                        />
                        <Bar dataKey="transactions" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : trendChartType === 'line' ? (
                      <LineChart data={trendSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis dataKey="label" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={36} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-chart-tooltip-border)',
                            borderRadius: 12,
                            color: 'var(--color-text-primary)',
                          }}
                          labelStyle={{ color: 'var(--color-text-secondary)' }}
                          formatter={(value, name) => {
                            if (name === 'successRate') return [`${Math.round(Number(value))}%`, 'Success']
                            return [Number(value).toLocaleString(), 'Transactions']
                          }}
                        />
                        <Line type="monotone" dataKey="transactions" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                      </LineChart>
                    ) : trendChartType === 'stacked' ? (
                      <BarChart data={trendSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis dataKey="label" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={36} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-chart-tooltip-border)',
                            borderRadius: 12,
                            color: 'var(--color-text-primary)',
                          }}
                          labelStyle={{ color: 'var(--color-text-secondary)' }}
                          formatter={(value, name) => [Number(value).toLocaleString(), name === 'successCount' ? 'Success' : 'Failed']}
                        />
                        <Legend />
                        <Bar dataKey="successCount" stackId="a" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="failedCount" stackId="a" fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : trendChartType === 'composed' ? (
                      <ComposedChart data={trendSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis dataKey="label" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={36} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-chart-tooltip-border)',
                            borderRadius: 12,
                            color: 'var(--color-text-primary)',
                          }}
                          labelStyle={{ color: 'var(--color-text-secondary)' }}
                          formatter={(value, name) => {
                            if (name === 'successRate') return [`${Math.round(Number(value))}%`, 'Success']
                            return [Number(value).toLocaleString(), name === 'transactions' ? 'Transactions' : name]
                          }}
                        />
                        <Bar dataKey="transactions" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                        <Line type="monotone" dataKey="successRate" stroke="var(--color-success)" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    ) : (
                      <AreaChart data={trendSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trendVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.32} />
                            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis dataKey="label" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={36} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-chart-tooltip-border)',
                            borderRadius: 12,
                            color: 'var(--color-text-primary)',
                          }}
                          labelStyle={{ color: 'var(--color-text-secondary)' }}
                          formatter={(value, name) => {
                            if (name === 'successRate') return [`${Math.round(Number(value))}%`, 'Success']
                            return [Number(value).toLocaleString(), 'Transactions']
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="transactions"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                          fill="url(#trendVolume)"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <div className="text-xs text-[var(--color-text-secondary)]/70">Total transactions</div>
                  <div className="text-base font-semibold leading-tight break-words">{trendTotalLabel}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <div className="text-xs text-[var(--color-text-secondary)]/70">Success rate</div>
                  <div className="text-base font-semibold leading-tight break-words">{successRateLabel}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <div className="text-xs text-[var(--color-text-secondary)]/70">Avg per week</div>
                  <div className="text-base font-semibold leading-tight break-words">{avgTicketLabel}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <div className="text-xs text-[var(--color-text-secondary)]/70">Peak week</div>
                  <div className="text-base font-semibold leading-tight break-words">{peakWeekLabel}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--color-text-secondary)]/70">Chart collapsed.</div>
          )}
        </Card>
      </div>

      <div className="xl:col-span-4">
        <div className="space-y-3">
          <Card
            right={<StatusBadge status="PENDING" value={`${alertCount} New`} />}
          >
            <div className="overflow-x-auto theme-scrollbar">
              <table className="min-w-[320px] w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--color-text-secondary)]/80">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Detail</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--color-text-primary)]">
                  {alerts.length === 0 ? (
                    <tr className="border-t border-[var(--color-border-soft)]">
                      <td className="py-2 pr-3 text-[var(--color-text-secondary)]/70" colSpan={3}>No active alerts.</td>
                    </tr>
                  ) : (
                    alerts.map((row, idx) => (
                      <tr key={`${row.type}-${idx}`} className="border-t border-[var(--color-border-soft)]">
                        <td className="py-2 pr-3">{row.type}</td>
                        <td className="py-2 pr-3 text-[var(--color-text-secondary)]/80">{row.detail || '-'}</td>
                        <td className="py-2">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Total Success Rate"
            className="bg-gradient-to-br from-[var(--color-bg-primary)]/90 via-[var(--color-bg-secondary)]/85 to-[var(--color-bg-primary)] border-[var(--color-border-soft)]"
            right={(
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={successCollapsed ? 'Expand chart' : 'Collapse chart'}
                  className="h-7 w-7 grid place-items-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition"
                  onClick={() => setSuccessCollapsed((prev) => !prev)}
                >
                  {successCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <select
                  className="h-7 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-[11px] text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={successChartType}
                  onChange={(e) => setSuccessChartType(e.target.value)}
                >
                  <option value="pie" className="bg-[var(--color-bg-primary)]">Pie</option>
                  <option value="bar" className="bg-[var(--color-bg-primary)]">Bar</option>
                </select>
              </div>
            )}
          >
            {!successCollapsed ? (
              <div className="flex items-center gap-4">
                <div className="h-[120px] w-[120px] rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border-soft)] grid place-items-center">
                  {hasSuccessData ? (successChartType === 'bar' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={successChart} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-chart-tooltip-border)',
                            borderRadius: 12,
                            color: 'var(--color-text-primary)',
                          }}
                          labelStyle={{ color: 'var(--color-text-secondary)' }}
                          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Rate']}
                        />
                        <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                          {successChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={successChart}
                          dataKey="value"
                          innerRadius={38}
                          outerRadius={54}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {successChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )) : (
                    <div className="text-xs text-[var(--color-text-secondary)]/70 text-center px-2">
                      No data yet
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-semibold leading-tight break-words">{successRateLabel}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-secondary)]/70">Based on {dateLabel}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                      Success
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                      Failed
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[96px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-secondary)]/70 grid place-items-center">
                Chart collapsed
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export function DashboardSection() {
  const AUTO_REFRESH_MS = 30000
  const DASHBOARD_FILTER_DEBOUNCE_MS = 700
  const [datePreset, setDatePreset] = useState('all')
  const [customOpen, setCustomOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const customRangeRef = useRef(null)
  const [dashboardMerchantId, setDashboardMerchantId] = useState('')
  const [dashboardMerchantName, setDashboardMerchantName] = useState('')
  const [dashboardMerchantEmail, setDashboardMerchantEmail] = useState('')
  const [dashboardPrefillHandled, setDashboardPrefillHandled] = useState(false)
  const [chartType, setChartType] = useState('area')
  const [overviewMetric, setOverviewMetric] = useState('transactions')
  const [overviewStatus, setOverviewStatus] = useState('total')
  const [dashboardData, setDashboardData] = useState(null)
  const [chartData, setChartData] = useState([])
  const [unsettledSummary, setUnsettledSummary] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [chartFailed, setChartFailed] = useState(false)
  const [chartEmpty, setChartEmpty] = useState(false)
  const [overviewCollapsed, setOverviewCollapsed] = useState(false)
  const [autoRefreshTick, setAutoRefreshTick] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [refreshCountdown, setRefreshCountdown] = useState(Math.round(AUTO_REFRESH_MS / 1000))

  const debouncedDashboardMerchantId = useDebouncedValue(dashboardMerchantId, DASHBOARD_FILTER_DEBOUNCE_MS)
  const debouncedDashboardMerchantName = useDebouncedValue(dashboardMerchantName, DASHBOARD_FILTER_DEBOUNCE_MS)
  const debouncedDashboardMerchantEmail = useDebouncedValue(dashboardMerchantEmail, DASHBOARD_FILTER_DEBOUNCE_MS)

  const baseData = useMemo(
    () => dashboardData,
    [dashboardData]
  )

  const data = useMemo(
    () => (baseData
      ? {
          ...baseData,
          unsettledSuccessfulPayments: unsettledSummary?.totalCount ?? baseData.unsettledSuccessfulPayments ?? 0,
        }
      : null),
    [baseData, unsettledSummary]
  )

  const toNumber = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }
  const chartRows = chartFailed ? [] : chartData
  const chartRowsWithOther = useMemo(
    () => chartRows.map((row) => {
      const success = toNumber(row.successCount)
      const failed = toNumber(row.failedCount)
      const pending = toNumber(row.pendingCount)
      const initiated = toNumber(row.initiatedCount)
      const total = toNumber(row.transactions)
      const other = Math.max(0, total - (success + failed + pending + initiated))
      return { ...row, otherCount: other }
    }),
    [chartRows]
  )

  const formatDate = (date) => {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const resolveRange = () => {
    const today = new Date()
    if (datePreset === 'all') return null
    if (datePreset === 'custom') {
      if (!customFrom || !customTo) return null
      return { from: customFrom, to: customTo }
    }

    if (datePreset === 'today') {
      const t = formatDate(today)
      return { from: t, to: t }
    }
    if (datePreset === 'yesterday') {
      const d = new Date(today)
      d.setDate(d.getDate() - 1)
      const t = formatDate(d)
      return { from: t, to: t }
    }
    if (datePreset === 'last7') {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from: formatDate(from), to: formatDate(today) }
    }
    if (datePreset === 'last30') {
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      return { from: formatDate(from), to: formatDate(today) }
    }
    if (datePreset === 'thisMonth') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: formatDate(from), to: formatDate(today) }
    }
    if (datePreset === 'lastMonth') {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: formatDate(from), to: formatDate(to) }
    }
    return null
  }

  useEffect(() => {
    if (dashboardPrefillHandled) return
    try {
      const stored = localStorage.getItem('assanpay:dashboard-merchant-id')
      if (stored) {
        setDashboardMerchantId(stored)
        localStorage.removeItem('assanpay:dashboard-merchant-id')
      }
    } finally {
      setDashboardPrefillHandled(true)
    }
  }, [dashboardPrefillHandled])

  useEffect(() => {
    let active = true
    const range = resolveRange()
    const merchantIdValue = debouncedDashboardMerchantId.trim()
    const merchantNameValue = debouncedDashboardMerchantName.trim()
    const merchantEmailValue = debouncedDashboardMerchantEmail.trim()
    const dashboardParams = {
      merchantId: merchantIdValue || undefined,
      merchantName: merchantNameValue.length >= 2 ? merchantNameValue : undefined,
      merchantEmail: merchantEmailValue.length >= 3 ? merchantEmailValue : undefined,
    }
    if (range) {
      dashboardParams.fromDate = range.from
      dashboardParams.toDate = range.to
    }

    const loadDashboard = async () => {
      try {
        const res = await fetchAdminDashboardSummary(dashboardParams)
        if (active) {
          const dashboard = res?.dashboard || null
          const chartRows = Array.isArray(res?.paymentChart) ? res.paymentChart : []
          const mappedChart = chartRows.map((row) => {
            const successCount = toNumber(
              row.successCount ?? row.successfulCount ?? row.successful ?? row.success
            )
            const failedCount = toNumber(
              row.failedCount ?? row.failed ?? row.failureCount
            )
            const pendingCount = toNumber(
              row.pendingCount ?? row.pending ?? row.pendingPayments
            )
            const initiatedCount = toNumber(
              row.initiatedCount ?? row.initiated ?? row.initiatedPayments ?? row.initializedCount
            )
            const totalCount = toNumber(row.totalCount ?? row.total)
            const derivedTotal = totalCount > 0
              ? totalCount
              : successCount + failedCount + pendingCount + initiatedCount
            return {
              day: row.date,
              transactions: derivedTotal,
              amount: toNumber(row.totalAmount ?? row.amount),
              successCount,
              failedCount,
              pendingCount,
              initiatedCount,
            }
          })
          setDashboardData(dashboard)
          setChartData(mappedChart)
          setChartFailed(false)
          setChartEmpty(mappedChart.length === 0)
          setUnsettledSummary(res?.unsettledSummary || null)
          setDashboardError('')
          setLastUpdatedAt(new Date())
        }
      } catch (err) {
        if (active) {
          const message =
            err?.data?.message || err?.message || 'Failed to load dashboard API.'
          setDashboardError(message)
          setChartFailed(true)
          setChartEmpty(false)
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [datePreset, customFrom, customTo, debouncedDashboardMerchantId, debouncedDashboardMerchantName, debouncedDashboardMerchantEmail, autoRefreshTick])

  useEffect(() => {
    if (!customOpen) return
    const handleOutside = (event) => {
      if (!customRangeRef.current) return
      if (!customRangeRef.current.contains(event.target)) {
        setCustomOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setCustomOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [customOpen])

  useEffect(() => {
    const handle = setInterval(() => setAutoRefreshTick((tick) => tick + 1), AUTO_REFRESH_MS)
    return () => clearInterval(handle)
  }, [])

  useEffect(() => {
    setRefreshCountdown(Math.round(AUTO_REFRESH_MS / 1000))
  }, [autoRefreshTick])

  useEffect(() => {
    const handle = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(handle)
  }, [])

  useEffect(() => {
    if (overviewMetric === 'amount' && overviewStatus !== 'total') {
      setOverviewStatus('total')
    }
  }, [overviewMetric, overviewStatus])

  useEffect(() => {
    if (chartType === 'status' && overviewMetric === 'amount') {
      setOverviewMetric('transactions')
    }
  }, [chartType, overviewMetric])

  const getValue = (key, format) => {
    const value = data?.[key]
    if (format === 'currency') return fmtPKR(value || 0)
    return value ?? 0
  }
  const formatCompactRs = (value) => {
    const num = Number(value) || 0
    const compact = new Intl.NumberFormat('en-PK', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num)
    return `Rs${compact}`
  }
  const statusDataKeyMap = {
    success: 'successCount',
    initiated: 'initiatedCount',
    pending: 'pendingCount',
    failed: 'failedCount',
  }
  const resolvedOverviewStatus = overviewMetric === 'amount' ? 'total' : overviewStatus
  const overviewStatusMeta = OVERVIEW_STATUS_OPTIONS.find((opt) => opt.key === resolvedOverviewStatus)
  const overviewDataKey = resolvedOverviewStatus === 'total'
    ? (overviewMetric === 'amount' ? 'amount' : 'transactions')
    : (statusDataKeyMap[resolvedOverviewStatus] || 'transactions')
  const overviewLabel = resolvedOverviewStatus === 'total'
    ? (overviewMetric === 'amount' ? 'Amount' : 'Transactions')
    : (overviewStatusMeta?.label || 'Transactions')
  const overviewSeriesColor = overviewStatusMeta?.color || 'var(--color-accent)'
  const showAllStatuses = resolvedOverviewStatus === 'all'
  const getSeriesLabel = (key) => {
    if (key === 'transactions') return 'Total'
    return STATUS_STACK_SERIES.find((series) => series.key === key)?.label || key
  }
  const formatOverviewTooltip = (value, name) => ([
    overviewMetric === 'amount' ? fmtPKR(value) : Number(value).toLocaleString(),
    showAllStatuses ? getSeriesLabel(name) : overviewLabel,
  ])
  const overviewTotalValue = chartRows.reduce((acc, row) => acc + toNumber(row[overviewDataKey]), 0)
  const overviewTotalLabel = chartRows.length > 0
    ? (overviewMetric === 'amount'
      ? fmtPKR(overviewTotalValue)
      : overviewTotalValue.toLocaleString())
    : (resolvedOverviewStatus === 'total'
      ? (overviewMetric === 'amount'
        ? getValue('totalPaymentVolume', 'currency')
        : getValue('totalPayments'))
      : '—')

  const showTrendBadges = false
  const showSparklines = false

  const presetLabel = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 days',
    last30: 'Last 30 days',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    all: 'All time',
    custom: 'Custom range',
  }[datePreset] || 'All time'

  const apiError = dashboardError
  const initiatedPayments = (() => {
    const direct = Number(
      data?.initiatedPayments
      ?? data?.initiatedCount
      ?? data?.initiated
      ?? data?.initiatedPaymentCount
      ?? 0
    )
    if (Number.isFinite(direct) && direct > 0) return direct
    if (chartRows.length === 0) return 0
    return chartRows.reduce((acc, row) => acc + toNumber(row.initiatedCount), 0)
  })()
  const pendingPayments = (() => {
    const direct = Number(
      data?.pendingPayments
      ?? data?.pendingCount
      ?? data?.pending
      ?? data?.pendingPaymentCount
      ?? 0
    )
    if (Number.isFinite(direct) && direct > 0) return direct
    if (chartRows.length === 0) return 0
    return chartRows.reduce((acc, row) => acc + toNumber(row.pendingCount), 0)
  })()
  const otherPayments = (() => {
    const total = Number(getValue('totalPayments')) || 0
    const success = Number(getValue('successfulPayments')) || 0
    const failed = Number(getValue('failedPayments')) || 0
    const initiated = Number(initiatedPayments) || 0
    const pending = Number(pendingPayments) || 0
    return Math.max(0, total - (success + failed + initiated + pending))
  })()
  if (!data) {
    return (
      <div className="space-y-4 sm:space-y-5 w-full">
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] p-5 sm:p-6 text-[var(--color-text-primary)] shadow-card">
          <div className="text-lg font-semibold">Dashboard data unavailable</div>
          <div className="mt-2 text-sm text-[var(--color-text-secondary)]/80">
            {apiError || 'API not reachable. Please check the backend and try again.'}
          </div>
          <div className="mt-4 text-xs text-[var(--color-text-secondary)]/70">
            Auto refresh is enabled. This page will update as soon as the API is back.
          </div>
        </div>
      </div>
    )
  }
  const primaryKeys = ['totalPaymentVolume', 'totalPayments']
  const secondaryKeys = ['unsettledSuccessfulPayments', 'successfulPayments', 'failedPayments', 'totalRefunds']
  const merchantKeys = ['totalMerchants', 'activeMerchants', 'blockedMerchants', 'totalSubMerchants']
  const remainingMetrics = METRIC_CARDS.filter(
    (m) => !primaryKeys.includes(m.key) && !secondaryKeys.includes(m.key) && !merchantKeys.includes(m.key)
  )
  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {apiError && (
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          {apiError}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 min-w-[180px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
            value={datePreset}
            onChange={(e) => {
              const next = e.target.value
              setDatePreset(next)
              if (next === 'custom') {
                setCustomOpen(true)
                return
              }
              setCustomOpen(false)
            }}
          >
          <option value="today" className="bg-[var(--color-bg-primary)]">Today</option>
          <option value="yesterday" className="bg-[var(--color-bg-primary)]">Yesterday</option>
          <option value="last7" className="bg-[var(--color-bg-primary)]">Last 7 days</option>
          <option value="last30" className="bg-[var(--color-bg-primary)]">Last 30 days</option>
          <option value="thisMonth" className="bg-[var(--color-bg-primary)]">This month</option>
          <option value="lastMonth" className="bg-[var(--color-bg-primary)]">Last month</option>
          <option value="all" className="bg-[var(--color-bg-primary)]">All Time</option>
          <option value="custom" className="bg-[var(--color-bg-primary)]">Custom Date</option>
          </select>
          {datePreset === 'custom' && (
            <div className="relative" ref={customRangeRef}>
              <button
                type="button"
                className="h-9 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] inline-flex items-center gap-2"
                onClick={() => setCustomOpen((prev) => !prev)}
              >
                <span>{customFrom && customTo ? `${customFrom} to ${customTo}` : 'Set custom range'}</span>
                <ChevronDown size={14} className="opacity-70" />
              </button>
              {customOpen && (
                <div className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 text-[var(--color-text-primary)] shadow-card z-20">
                  <div className="text-sm font-semibold">Custom Date</div>
                  <div className="mt-3 space-y-3 text-xs text-[var(--color-text-secondary)]/85">
                    <div>
                      <div className="mb-2">Date Start</div>
                      <div className="relative">
                        <input
                          className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-10 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                        />
                        {customFrom && (
                          <button
                            type="button"
                            aria-label="Clear start date"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                            onClick={() => setCustomFrom('')}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">Date End</div>
                      <div className="relative">
                        <input
                          className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-10 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                        />
                        {customTo && (
                          <button
                            type="button"
                            aria-label="Clear end date"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                            onClick={() => setCustomTo('')}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2 text-xs">
                    <button
                      className="h-8 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                      type="button"
                      onClick={() => setCustomOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      className="h-8 px-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
                      type="button"
                      onClick={() => {
                        setCustomOpen(false)
                        setDatePreset('custom')
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        <select
          className="h-9 min-w-[140px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
        >
          <option value="area" className="bg-[var(--color-bg-primary)]">Area</option>
          <option value="bar" className="bg-[var(--color-bg-primary)]">Bar</option>
          <option value="line" className="bg-[var(--color-bg-primary)]">Line</option>
          <option value="status" className="bg-[var(--color-bg-primary)]">Status Stack</option>
        </select>
        <ClearableInput
          className="min-w-[160px]"
          inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
          placeholder="Merchant ID"
          value={dashboardMerchantId}
          onChange={(e) => setDashboardMerchantId(e.target.value)}
        />
        <ClearableInput
          className="min-w-[200px]"
          inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
          placeholder="Merchant Name"
          value={dashboardMerchantName}
          onChange={(e) => setDashboardMerchantName(e.target.value)}
        />
        <ClearableInput
          className="min-w-[220px]"
          inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
          placeholder="Merchant Email"
          value={dashboardMerchantEmail}
          onChange={(e) => setDashboardMerchantEmail(e.target.value)}
        />
        <div className="ml-auto shrink-0 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white/[0.03] px-3 py-1 text-[10px] text-[var(--color-text-secondary)]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Auto refresh
          </span>
          <span className="text-[var(--color-text-primary)]">{refreshCountdown}s</span>
          <span className="text-[var(--color-text-secondary)]/50">|</span>
          <span>Updated {lastUpdatedLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
        {primaryKeys.map((key) => {
          const meta = METRIC_CARDS.find((m) => m.key === key)
          return (
            <Card
              key={key}
              title={meta?.label}
              right={showTrendBadges ? <TrendPill value={0} /> : null}
              className="bg-gradient-to-br from-[var(--color-bg-secondary)]/60 via-[var(--color-bg-primary)]/85 to-[var(--color-bg-primary)] border-[var(--color-border-soft)]"
            >
              <div className="text-3xl sm:text-4xl font-semibold leading-tight break-words">
                {getValue(key, meta?.format)}
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]/70">{presetLabel}</div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
        {secondaryKeys.map((key) => {
          const meta = METRIC_CARDS.find((m) => m.key === key)
          return (
            <Card
              key={key}
              title={meta?.label}
              right={showTrendBadges ? <TrendPill value={0} /> : null}
              className="bg-gradient-to-br from-[var(--color-bg-secondary)]/70 via-[var(--color-bg-primary)]/90 to-[var(--color-bg-primary)] border-[var(--color-border-soft)]"
            >
              <div className="text-2xl font-semibold leading-tight break-words">
                {getValue(key, meta?.format)}
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]/70">{presetLabel}</div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 w-full items-start">
        <Card
          title="Payments Overview"
          className="bg-gradient-to-br from-[var(--color-bg-secondary)]/70 via-[var(--color-bg-primary)]/90 to-[var(--color-bg-primary)] border-[var(--color-border-soft)] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          right={(
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Pill>{presetLabel}</Pill>
              <select
                className="h-7 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-[11px] text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={overviewMetric}
                onChange={(e) => setOverviewMetric(e.target.value)}
              >
                <option value="transactions" className="bg-[var(--color-bg-primary)]">Transactions</option>
                <option value="amount" className="bg-[var(--color-bg-primary)]">Amount</option>
              </select>
              <select
                className="h-7 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-[11px] text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60"
                value={overviewStatus}
                onChange={(e) => setOverviewStatus(e.target.value)}
                disabled={overviewMetric === 'amount'}
              >
                {OVERVIEW_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key} className="bg-[var(--color-bg-primary)]">{opt.label}</option>
                ))}
              </select>
              <select
                className="h-7 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-[11px] text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="area" className="bg-[var(--color-bg-primary)]">Area</option>
                <option value="bar" className="bg-[var(--color-bg-primary)]">Bar</option>
                <option value="line" className="bg-[var(--color-bg-primary)]">Line</option>
                <option value="scatter" className="bg-[var(--color-bg-primary)]">Scatter</option>
                <option value="composed" className="bg-[var(--color-bg-primary)]">Composed</option>
                <option value="status" className="bg-[var(--color-bg-primary)]">Status Stack</option>
              </select>
              <button
                type="button"
                aria-label={overviewCollapsed ? 'Expand chart' : 'Collapse chart'}
                className="h-7 w-7 grid place-items-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition shrink-0 relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setOverviewCollapsed((prev) => !prev)
                }}
              >
                {overviewCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          )}
        >
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
            {resolvedOverviewStatus === 'total'
              ? (overviewMetric === 'amount' ? 'Total Amount' : 'Total Transactions')
              : `${overviewLabel} Transactions`}
          </div>
          <div className="text-3xl sm:text-4xl font-semibold leading-tight break-words">
            {overviewTotalLabel}
          </div>
          {overviewMetric === 'amount' && (
            <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]/70">
              Status filter applies to transactions only.
            </div>
          )}
          {!overviewCollapsed ? (
            <>
              <div className="relative mt-4 h-[220px] sm:h-[280px] lg:h-[320px] rounded-xl border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-bg-primary)]/60 to-[var(--color-bg-secondary)]/80 px-3 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'status' ? (
                    <BarChart data={chartRowsWithOther} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-chart-tooltip-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                        formatter={(value, name) => [
                          Number(value).toLocaleString(),
                          STATUS_STACK_SERIES.find((series) => series.key === name)?.label || name,
                        ]}
                      />
                      <Legend />
                      {STATUS_STACK_SERIES.map((series) => (
                        <Bar
                          key={series.key}
                          dataKey={series.key}
                          stackId="status"
                          fill={series.color}
                          radius={[6, 6, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={showAllStatuses ? chartRowsWithOther : chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        tickFormatter={(value) =>
                          overviewMetric === 'amount' ? formatCompactRs(value) : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-chart-tooltip-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                        formatter={(value, name) => formatOverviewTooltip(value, name)}
                      />
                      {showAllStatuses ? (
                        <>
                          <Legend />
                          {STATUS_STACK_SERIES.map((series) => (
                            <Bar
                              key={series.key}
                              dataKey={series.key}
                              stackId="status"
                              fill={series.color}
                              radius={[6, 6, 0, 0]}
                            />
                          ))}
                        </>
                      ) : (
                        <Bar
                          dataKey={overviewDataKey}
                          fill={overviewSeriesColor}
                          radius={[6, 6, 0, 0]}
                        />
                      )}
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={showAllStatuses ? chartRowsWithOther : chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        tickFormatter={(value) =>
                          overviewMetric === 'amount' ? formatCompactRs(value) : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-chart-tooltip-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                        formatter={(value, name) => formatOverviewTooltip(value, name)}
                      />
                      {showAllStatuses ? (
                        <>
                          <Legend />
                          {STATUS_STACK_SERIES.map((series) => (
                            <Line
                              key={series.key}
                              type="monotone"
                              dataKey={series.key}
                              stroke={series.color}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                        </>
                      ) : (
                        <Line
                          type="monotone"
                          dataKey={overviewDataKey}
                          stroke={overviewSeriesColor}
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  ) : chartType === 'scatter' ? (
                    <ScatterChart data={showAllStatuses ? chartRowsWithOther : chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        tickFormatter={(value) =>
                          overviewMetric === 'amount' ? formatCompactRs(value) : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-chart-tooltip-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                        formatter={(value, name) => formatOverviewTooltip(value, name)}
                      />
                      {showAllStatuses ? (
                        <>
                          <Legend />
                          {STATUS_STACK_SERIES.map((series) => (
                            <Scatter
                              key={series.key}
                              dataKey={series.key}
                              name={series.label}
                              fill={series.color}
                            />
                          ))}
                        </>
                      ) : (
                        <Scatter
                          dataKey={overviewDataKey}
                          fill={overviewSeriesColor}
                        />
                      )}
                    </ScatterChart>
                  ) : chartType === 'composed' ? (
                    <ComposedChart data={showAllStatuses ? chartRowsWithOther : chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        tickFormatter={(value) =>
                          overviewMetric === 'amount' ? formatCompactRs(value) : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-chart-tooltip-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                        formatter={(value, name) => formatOverviewTooltip(value, name)}
                      />
                      {showAllStatuses ? (
                        <>
                          <Legend />
                          {STATUS_STACK_SERIES.map((series) => (
                            <Bar
                              key={series.key}
                              dataKey={series.key}
                              stackId="status"
                              fill={series.color}
                              radius={[6, 6, 0, 0]}
                            />
                          ))}
                          <Line dataKey="transactions" stroke="var(--color-text-primary)" strokeWidth={2} dot={false} />
                        </>
                      ) : (
                        <>
                          <Bar dataKey={overviewDataKey} fill={overviewSeriesColor} radius={[6, 6, 0, 0]} />
                          <Line dataKey={overviewDataKey} stroke={overviewSeriesColor} strokeWidth={2} dot={false} />
                        </>
                      )}
                    </ComposedChart>
                  ) : (
                    <AreaChart data={showAllStatuses ? chartRowsWithOther : chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={overviewSeriesColor} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={overviewSeriesColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        tickFormatter={(value) =>
                          overviewMetric === 'amount' ? formatCompactRs(value) : value
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-chart-tooltip-border)',
                          borderRadius: 12,
                          color: 'var(--color-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--color-text-secondary)' }}
                        formatter={(value, name) => formatOverviewTooltip(value, name)}
                      />
                      {showAllStatuses ? (
                        <>
                          <Legend />
                          {STATUS_STACK_SERIES.map((series) => (
                            <Area
                              key={series.key}
                              type="monotone"
                              dataKey={series.key}
                              stackId="status"
                              stroke={series.color}
                              strokeWidth={2}
                              fill={series.color}
                              fillOpacity={0.18}
                            />
                          ))}
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey={overviewDataKey}
                          stroke={overviewSeriesColor}
                          strokeWidth={2}
                          fill="url(#colorVolume)"
                        />
                      )}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
                {chartEmpty && !chartFailed && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-[var(--color-text-secondary)]/70">
                    No chart data for selected range.
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 text-sm">
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[var(--color-success-soft)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-success)]">Success</div>
                  <div className="text-base font-semibold leading-tight break-words">{getValue('successfulPayments')}</div>
                </div>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[var(--color-accent-soft)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-accent)]">Initiated</div>
                  <div className="text-base font-semibold leading-tight break-words">{initiatedPayments.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[var(--color-warning-soft)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-warning)]">Pending</div>
                  <div className="text-base font-semibold leading-tight break-words">{pendingPayments.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[var(--color-danger-soft)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-danger)]">Failed</div>
                  <div className="text-base font-semibold leading-tight break-words">{getValue('failedPayments')}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Other</div>
                  <div className="text-base font-semibold leading-tight break-words">{otherPayments.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] bg-[var(--color-accent-soft)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-accent)]">Refunds</div>
                  <div className="text-base font-semibold leading-tight break-words">{getValue('totalRefunds')}</div>
                </div>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[var(--color-warning-soft)] px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-warning)]">Due</div>
                  <div className="text-base font-semibold leading-tight break-words">{getValue('dueSettlementAmount', 'currency')}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 text-xs text-[var(--color-text-secondary)]/70">Chart collapsed.</div>
          )}
        </Card>
      </div>

      <Card
        title="Merchant Health"
        right={<Pill>{presetLabel}</Pill>}
        className="bg-gradient-to-br from-[var(--color-bg-primary)]/90 via-[var(--color-bg-secondary)]/80 to-[var(--color-bg-primary)] border-[var(--color-border-soft)]"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <button
            type="button"
            className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={() => setAdminDashboardNavigation('page-merchants')}
          >
            <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]/70">Total</div>
            <div className="text-base font-semibold leading-tight break-words">{getValue('totalMerchants')}</div>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={() => setAdminDashboardNavigation('page-merchants', { status: 'active' })}
          >
            <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]/70">Active</div>
            <div className="text-base font-semibold leading-tight break-words">{getValue('activeMerchants')}</div>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={() => setAdminDashboardNavigation('page-merchants', { status: 'blocked' })}
          >
            <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]/70">Blocked</div>
            <div className="text-base font-semibold leading-tight break-words text-[var(--color-danger)]">{getValue('blockedMerchants')}</div>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            onClick={() => setAdminDashboardNavigation('page-submerchants')}
          >
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]/70 whitespace-normal">Sub-Merchants</div>
            <div className="text-base font-semibold leading-tight break-words">{getValue('totalSubMerchants')}</div>
          </button>
        </div>
        <div className="mt-3 text-xs text-[var(--color-text-secondary)]/70">Filtered by date</div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
        {remainingMetrics.map((m) => (
          <Card
            key={m.key}
            title={m.label}
            right={showTrendBadges ? <TrendPill value={0} /> : null}
            className="bg-gradient-to-br from-[var(--color-bg-primary)]/90 via-[var(--color-bg-secondary)]/85 to-[var(--color-bg-primary)] border-[var(--color-border-soft)]"
          >
            <div className="text-2xl font-semibold leading-tight break-words">
              {getValue(m.key, m.format)}
            </div>
            {showSparklines ? (
              <div className="mt-3">
                <Sparkline
                  data={SPARKLINES[m.key] || [2, 3, 2, 4, 3, 5, 4, 6]}
                  tone="good"
                />
              </div>
            ) : (
              <div className="mt-3 text-xs text-[var(--color-text-secondary)]/60">No trend data.</div>
            )}
            <div className="mt-1 text-xs text-[var(--color-text-secondary)]/70">
              {datePreset === 'all' ? 'All Time' : 'Filtered by date'}
            </div>
          </Card>
        ))}
      </div>
      <DashboardInsights
        dateLabel={presetLabel}
        datePreset={datePreset}
        trendDataOverride={chartRows.map((row) => ({
          label: row.day,
          transactions: row.transactions,
          success: row.successCount && row.transactions ? row.successCount / row.transactions : 0,
          successCount: row.successCount,
          failedCount: row.failedCount,
        }))}
        dashboardMetrics={data}
      />
      <div className="pt-2 text-center text-xs text-[var(--color-text-secondary)]/70">Ac AssanPay Admin Portal UI Template (React)</div>

    </div>
  )
}


