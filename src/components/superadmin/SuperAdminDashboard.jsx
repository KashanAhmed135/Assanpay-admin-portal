import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, Pill } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { fmtPKR } from '../../utils/helpers'

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

const MAIN_CHART = [
  { day: 'Mon', transactions: 1200 },
  { day: 'Tue', transactions: 1650 },
  { day: 'Wed', transactions: 1400 },
  { day: 'Thu', transactions: 2100 },
  { day: 'Fri', transactions: 2600 },
  { day: 'Sat', transactions: 2350 },
  { day: 'Sun', transactions: 2800 },
]

const VOLUME_TREND_BY_PRESET = {
  today: [
    { label: '9am', transactions: 320, success: 0.96 },
    { label: '12pm', transactions: 540, success: 0.95 },
    { label: '3pm', transactions: 610, success: 0.94 },
    { label: '6pm', transactions: 820, success: 0.96 },
    { label: '9pm', transactions: 690, success: 0.95 },
  ],
  yesterday: [
    { label: '9am', transactions: 280, success: 0.95 },
    { label: '12pm', transactions: 460, success: 0.94 },
    { label: '3pm', transactions: 520, success: 0.93 },
    { label: '6pm', transactions: 740, success: 0.95 },
    { label: '9pm', transactions: 610, success: 0.94 },
  ],
  last7: [
    { label: 'Mon', transactions: 2600, success: 0.94 },
    { label: 'Tue', transactions: 2920, success: 0.95 },
    { label: 'Wed', transactions: 2740, success: 0.93 },
    { label: 'Thu', transactions: 3180, success: 0.95 },
    { label: 'Fri', transactions: 3410, success: 0.96 },
    { label: 'Sat', transactions: 2990, success: 0.95 },
    { label: 'Sun', transactions: 2870, success: 0.94 },
  ],
  last30: [
    { label: 'Week 1', transactions: 4200, success: 0.94 },
    { label: 'Week 2', transactions: 5150, success: 0.95 },
    { label: 'Week 3', transactions: 4760, success: 0.93 },
    { label: 'Week 4', transactions: 6120, success: 0.96 },
  ],
  thisMonth: [
    { label: 'Week 1', transactions: 4400, success: 0.94 },
    { label: 'Week 2', transactions: 4980, success: 0.95 },
    { label: 'Week 3', transactions: 5320, success: 0.96 },
    { label: 'Week 4', transactions: 5660, success: 0.95 },
  ],
  lastMonth: [
    { label: 'Week 1', transactions: 5100, success: 0.92 },
    { label: 'Week 2', transactions: 5450, success: 0.93 },
    { label: 'Week 3', transactions: 5720, success: 0.94 },
    { label: 'Week 4', transactions: 5980, success: 0.94 },
  ],
  all: [
    { label: 'Wk 1', transactions: 3800, success: 0.93 },
    { label: 'Wk 2', transactions: 4200, success: 0.94 },
    { label: 'Wk 3', transactions: 4650, success: 0.95 },
    { label: 'Wk 4', transactions: 5100, success: 0.95 },
    { label: 'Wk 5', transactions: 5480, success: 0.96 },
    { label: 'Wk 6', transactions: 5900, success: 0.96 },
  ],
  custom: [
    { label: 'Day 1', transactions: 1200, success: 0.95 },
    { label: 'Day 2', transactions: 1680, success: 0.94 },
    { label: 'Day 3', transactions: 1420, success: 0.96 },
    { label: 'Day 4', transactions: 1900, success: 0.95 },
  ],
}

const ALERTS_BY_PRESET = {
  today: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'High Refund Rate', status: 'RISK' },
  ],
  yesterday: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'Blocked Merchant', status: 'BLOCKED' },
  ],
  last7: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'High Refund Rate', status: 'RISK' },
    { type: 'Blocked Merchant', status: 'BLOCKED' },
  ],
  last30: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'High Refund Rate', status: 'RISK' },
    { type: 'Blocked Merchant', status: 'BLOCKED' },
  ],
  thisMonth: [
    { type: 'High Refund Rate', status: 'RISK' },
    { type: 'Blocked Merchant', status: 'BLOCKED' },
  ],
  lastMonth: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'Blocked Merchant', status: 'BLOCKED' },
  ],
  all: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'High Refund Rate', status: 'RISK' },
    { type: 'Blocked Merchant', status: 'BLOCKED' },
  ],
  custom: [
    { type: 'Settlement Overdue', status: 'PENDING' },
    { type: 'High Refund Rate', status: 'RISK' },
  ],
}

function Sparkline({ data, tone = 'good' }) {
  const stroke = tone === 'bad' ? '#f87171' : tone === 'warn' ? '#fbbf24' : '#22c55e'
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
        <div className="text-2xl font-semibold">Rs 1,245,900</div>
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
        <div className="text-2xl font-semibold">Rs 34,200</div>
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
        <div className="text-2xl font-semibold">Rs 412,800</div>
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
        <div className="text-2xl font-semibold">3</div>
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

export function DashboardInsights({ dateLabel, datePreset }) {
  const trendData = VOLUME_TREND_BY_PRESET[datePreset] || VOLUME_TREND_BY_PRESET.last30
  const alerts = ALERTS_BY_PRESET[datePreset] || ALERTS_BY_PRESET.last30
  const alertCount = alerts.length
  const trendTotal = trendData.reduce((acc, row) => acc + row.transactions, 0)
  const avgTicket = Math.round(trendTotal / Math.max(1, trendData.length))
  const peakWeek = trendData.reduce(
    (best, row) => (row.transactions > best.transactions ? row : best),
    trendData[0]
  )
  const successRate = Math.round((trendData.reduce((acc, row) => acc + row.success, 0) / trendData.length) * 1000) / 10
  const successChart = [
    { name: 'Success', value: Math.round(successRate * 10), color: '#22c55e' },
    { name: 'Failed', value: Math.max(0, Math.round(1000 - successRate * 10)), color: '#f87171' },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 w-full">
      <div className="xl:col-span-8">
        <Card title="Transaction Trend" right={<Pill>{dateLabel}</Pill>}>
          <div className="h-[220px] sm:h-[280px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5aa7ff" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#5aa7ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#a9b7d4" tickLine={false} axisLine={false} />
                <YAxis stroke="#a9b7d4" tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: '#1f2435',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    color: '#eaf1ff',
                  }}
                  labelStyle={{ color: '#a9b7d4' }}
                  formatter={(value, name) => {
                    if (name === 'success') return [`${Math.round(Number(value) * 100)}%`, 'Success']
                    return [Number(value).toLocaleString(), 'Transactions']
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#5aa7ff"
                  strokeWidth={2}
                  fill="url(#trendVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-xs text-[#a9b7d4]/70">Total transactions</div>
              <div className="text-base font-semibold">{trendTotal.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-xs text-[#a9b7d4]/70">Success rate</div>
              <div className="text-base font-semibold">{successRate}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-xs text-[#a9b7d4]/70">Avg per week</div>
              <div className="text-base font-semibold">{avgTicket.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-xs text-[#a9b7d4]/70">Peak week</div>
              <div className="text-base font-semibold">{peakWeek.label}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:col-span-4">
        <div className="space-y-3">
          <Card
            right={<StatusBadge status="PENDING" value={`${alertCount} New`} />}
          >
            <div className="overflow-x-auto">
              <table className="min-w-[320px] w-full text-sm">
                <thead>
                  <tr className="text-left text-[#a9b7d4]/80">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[#eaf1ff]">
                  {alerts.map((row, idx) => (
                    <tr key={`${row.type}-${idx}`} className="border-t border-white/10">
                      <td className="py-2 pr-3">{row.type}</td>
                      <td className="py-2">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Total Success Rate">
            <div className="flex items-center gap-4">
              <div className="h-[120px] w-[120px] rounded-full bg-black/20 border border-white/10 grid place-items-center">
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
              </div>
              <div className="flex-1">
                <div className="text-3xl font-semibold">{successRate}%</div>
                <div className="mt-1 text-xs text-[#a9b7d4]/70">Based on {dateLabel}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                    Success
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-[#f87171]" />
                    Failed
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function DashboardSection() {
  const [datePreset, setDatePreset] = useState('all')
  const [customOpen, setCustomOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const data = useMemo(() => DASHBOARD_MOCK_BY_PRESET[datePreset] || DASHBOARD_MOCK_BY_PRESET.all, [datePreset])

  const getValue = (key, format) => {
    const value = data[key]
    if (format === 'currency') return fmtPKR(value || 0)
    return value ?? 0
  }

  const trends = {
    totalMerchants: 0.0,
    activeMerchants: 1.2,
    blockedMerchants: -0.4,
    totalSubMerchants: 0.8,
    totalUsers: 0.0,
    totalPayments: 6.5,
    successfulPayments: 5.8,
    failedPayments: -1.1,
    totalPaymentVolume: 7.4,
    totalSettlements: 2.2,
    dueSettlementAmount: -3.5,
    totalRefunds: 1.0,
  }

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

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 min-w-[180px] rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
          value={datePreset}
          onChange={(e) => {
            const next = e.target.value
            setDatePreset(next)
            if (next === 'custom') {
              setCustomOpen(true)
            }
          }}
        >
          <option value="today" className="bg-[#0b1220]">Today</option>
          <option value="yesterday" className="bg-[#0b1220]">Yesterday</option>
          <option value="last7" className="bg-[#0b1220]">Last 7 days</option>
          <option value="last30" className="bg-[#0b1220]">Last 30 days</option>
          <option value="thisMonth" className="bg-[#0b1220]">This month</option>
          <option value="lastMonth" className="bg-[#0b1220]">Last month</option>
          <option value="all" className="bg-[#0b1220]">All Time</option>
          <option value="custom" className="bg-[#0b1220]">Custom Date</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-4 w-full">
        <Card title="Payments Overview" right={<Pill>{presetLabel}</Pill>}>
          <div className="text-sm text-[#a9b7d4]/70 mb-3">Total Transactions</div>
          <div className="text-3xl font-semibold">{getValue('totalPayments')}</div>
          <div className="mt-4 h-[220px] sm:h-[260px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MAIN_CHART} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5aa7ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5aa7ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#a9b7d4" tickLine={false} axisLine={false} />
                <YAxis stroke="#a9b7d4" tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: '#1f2435',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    color: '#eaf1ff',
                  }}
                  labelStyle={{ color: '#a9b7d4' }}
                  formatter={(value) => [Number(value).toLocaleString(), 'Transactions']}
                />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#5aa7ff"
                  strokeWidth={2}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          {['totalMerchants', 'activeMerchants', 'blockedMerchants', 'totalSubMerchants'].map((key) => {
            const meta = METRIC_CARDS.find((m) => m.key === key)
            return (
              <Card key={key} title={meta?.label} right={<TrendPill value={trends[key] || 0} />}>
                <div className="text-2xl font-semibold">{getValue(key)}</div>
                <div className="mt-2 text-xs text-[#a9b7d4]/70">Filtered by date</div>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
        {METRIC_CARDS.filter((m) => !['totalMerchants', 'activeMerchants', 'blockedMerchants', 'totalSubMerchants'].includes(m.key)).map((m) => (
          <Card key={m.key} title={m.label} right={<TrendPill value={trends[m.key] || 0} />}>
            <div className="text-2xl font-semibold">
              {getValue(m.key, m.format)}
            </div>
            <div className="mt-3">
              <Sparkline
                data={SPARKLINES[m.key] || [2, 3, 2, 4, 3, 5, 4, 6]}
                tone={trends[m.key] < 0 ? 'bad' : 'good'}
              />
            </div>
            <div className="mt-1 text-xs text-[#a9b7d4]/70">
              {datePreset === 'all' ? 'All Time' : 'Filtered by date'}
            </div>
          </Card>
        ))}
      </div>
      <DashboardInsights dateLabel={presetLabel} datePreset={datePreset} />
      <div className="pt-2 text-center text-xs text-[#a9b7d4]/70">Ac AssanPay Admin Portal UI Template (React)</div>

      {customOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#2b2f45] p-6 text-[#eaf1ff] shadow-card">
            <div className="text-lg font-semibold">Custom Date</div>
            <div className="mt-5 space-y-4 text-sm text-[#a9b7d4]/85">
              <div>
                <div className="mb-2">Date Start</div>
                <div className="relative">
                  <input
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                  {customFrom && (
                    <button
                      type="button"
                      aria-label="Clear start date"
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
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
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                  {customTo && (
                    <button
                      type="button"
                      aria-label="Clear end date"
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                      onClick={() => setCustomTo('')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 text-sm">
              <button
                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                type="button"
                onClick={() => {
                  setCustomOpen(false)
                  setDatePreset('all')
                }}
              >
                Cancel
              </button>
              <button
                className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-white font-semibold"
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
        </div>
      )}
    </div>
  )
}
